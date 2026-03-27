import { Request, Response, NextFunction } from 'express';
import { queryCollection } from '../services/vectorstore.service';
import { generateQueryEmbedding, getChatModel, getFallbackChatModel, SOCRATIC_SYSTEM_PROMPT, extractTopic } from '../services/llm.service';
import { searchBestYouTubeVideo } from '../services/youtube.service';
import QueryLog from '../models/QueryLog';
import ChatSession from '../models/ChatSession';
import SystemSetting from '../models/SystemSetting';
import DocumentMeta from '../models/DocumentMeta';
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

/** Detects if the student is asking for a video/tutorial recommendation */
const isVideoRequest = (query: string): boolean => {
    return /\b(video|videos|youtube|tutorial|tutorials|lecture|watch|show me|find me a|recommend.*video|video.*on|video.*about|video.*for|link.*video|visual.*explain)\b/i.test(query);
};

export const askChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { query, department, studentId, sessionId, className, sourceIds } = req.body;
        if (!query) {
             res.status(400).json({ error: 'Query is required.' });
             return;
        }

        const activeSessionId = sessionId || Math.random().toString(36).substring(2, 15);

        // ─── YouTube Video Intent Detection ───────────────────────────────────────
        // Kick off YouTube search in parallel (non-blocking) if query is a video request
        const videoSearchPromise = isVideoRequest(query)
            ? searchBestYouTubeVideo(query)
            : Promise.resolve(null);
        let session = await ChatSession.findOne({ sessionId: activeSessionId });
        
        if (!session) {
            session = new ChatSession({
                sessionId: activeSessionId,
                studentId: studentId || 'anonymous_student',
                title: query.substring(0, 40) + '...',
                department: department || 'General',
                className: className || 'Global',
                messages: []
            });
        }

        // ─── Build a context-aware search query ───────────────────────────────────────────
        // For follow-up messages (short replies, pronouns, "i forgot", etc.), the bare query
        // produces a poor embedding and finds nothing in ChromaDB. By prepending the last
        // 3 conversation turns we keep the semantic context alive across the whole session.
        const isFollowUp = session.messages.length > 0;
        const recentHistory = session.messages
            .slice(-6) // last 3 exchanges (user + assistant pairs)
            .map((m: any) => m.content)
            .join(' ');
        const contextualSearchQuery = isFollowUp && recentHistory
            ? `${recentHistory} ${query}`
            : query;

        const chromaCollectionName = 'college_documents';
        
        // -----------------------------------------------------
        // 1. ACADEMIC RELEVANCE CHECK
        // -----------------------------------------------------
        let chatModel;
        try {
            chatModel = getChatModel();
        } catch (e) {
            chatModel = getFallbackChatModel();
        }

        let isAcademic = true;
        // Skip academic check for follow-ups in active sessions — the student is already
        // in an ongoing academic conversation, short replies like "i forgot" are always in-scope.
        if (!isFollowUp) {
            try {
                const relResponse = await chatModel.invoke([
                    new SystemMessage("You are a query classifier. If the user's input is related to ANY academic topic, concept (e.g. physics, graph theory), or study question, reply 'YES'. If it is a joke, spam, or totally unrelated to learning, reply 'NO'. Reply ONLY with YES or NO."),
                    new HumanMessage(query)
                ]);
                if (relResponse.content.toString().trim().toUpperCase().includes("NO")) {
                    isAcademic = false;
                }
            } catch (error) {
                console.warn("Relevancy check failed, proceeding by default.", error);
            }
        }

        if (!isAcademic) {
            const log = new QueryLog({
                 sessionId: activeSessionId,
                 studentId,
                 query,
                 response: "This query is out of academic scope.",
                 department: department || 'General',
                 status: 'OUT_OF_SCOPE'
            });
            await log.save();
            res.status(200).json({ answer: "Please keep your questions related to the course materials.", sources: [], sessionId: activeSessionId });
            return;
        }

        // Fetch Faculty Settings (Is Exam Mode active?)
        const settings = await SystemSetting.findOne({ department: department || 'General' });
        const isExamMode = settings?.isExamMode || false;
        const aiStrictness = settings?.aiStrictness || 'SOCRATIC';
        const confidenceThreshold = settings?.confidenceThreshold || 0.45;

        // -----------------------------------------------------
        // 2. VECTOR DATABASE RETRIEVAL (Isolated by Department)
        // -----------------------------------------------------
        // Mapping sourceIds to titles for vector filtering
        let sourceFilter: any = null;
        if (sourceIds && Array.isArray(sourceIds) && sourceIds.length > 0) {
            const docs = await DocumentMeta.find({ _id: { $in: sourceIds } });
            const titles = docs.map(d => d.title);
            if (titles.length > 0) {
                // Combine department isolation with specific source selection
                sourceFilter = {
                    "$and": [
                        { "department": { "$eq": department || 'General' } },
                        { "source": { "$in": titles } }
                    ]
                };
            }
        }

        if (!sourceFilter) {
            sourceFilter = department ? { department: { "$eq": department } } : null;
        }

        // Use context-enriched query for embedding so follow-up messages still find
        // the right course documents (e.g. "i forgot the formula" alone would find nothing).
        const queryVec = await generateQueryEmbedding(contextualSearchQuery);
        const searchResults = await queryCollection(
            chromaCollectionName, 
            [queryVec], 
            10, // Increased results for better filtering context
            sourceFilter
        );
        
        // -----------------------------------------------------
        // 3. CONFIDENCE-BASED FILTERING
        // -----------------------------------------------------
        const distances = searchResults?.distances?.[0] || [];
        // Smaller distance means higher confidence (Cosine similarity in Chroma).
        const bestDistance = distances.length > 0 ? Math.min(...distances) : 100;
        const isConfident = bestDistance < confidenceThreshold;
        
        let contextBlock = "";
        let hasContext = false;
        
        if (searchResults?.documents?.[0]?.length > 0 && isConfident) {
            const docs = searchResults.documents[0];
            const mets = searchResults.metadatas[0] || [];
            
            // Only include chunks that actually have content
            const validDocs = docs.filter((d: string | null) => d && d.trim().length > 20);
            if (validDocs.length > 0) {
                hasContext = true;
                contextBlock = validDocs.map((doc: string, index: number) => {
                    const meta = mets[index] as any;
                    const pageInfo = meta?.page ? `, Page: ${meta.page}` : '';
                    const source = meta?.source ? `[Source: ${meta.source}${pageInfo}]` : '';
                    return `Chunk ${index + 1} ${source}:\n${doc}`;
                }).join('\n\n');
            }
        }

        // -----------------------------------------------------
        // 4. SOCRATIC RAG WITH DYNAMIC SCOPE (Exam Mode)
        // -----------------------------------------------------
        let systemPromptText: string = SOCRATIC_SYSTEM_PROMPT;

        // ─── Await YouTube result ─────────────────────────────────────────────────
        const youtubeVideo = await videoSearchPromise;

        if (hasContext) {
            // We have verified course material context — inject it.
            // CRITICAL: Inject the specific query so the LLM must verify the context matches the topic.
            systemPromptText += `\n\n--- CONTEXT BLOCKS START ---\n${contextBlock}\n--- CONTEXT BLOCKS END ---`;

            // Give the LLM conversation-aware context for its topic verification check.
            // For follow-ups, the bare query ("2n", "i forgot") is not enough to verify relevance.
            const verificationContext = isFollowUp
                ? `This is a follow-up in an ongoing conversation. The student's recent messages were: "${recentHistory.slice(-300)}". Their latest message is: "${query}".`
                : `The student asked: "${query}".`;
            systemPromptText += `\n\n[MANDATORY PRE-RESPONSE CHECK] ${verificationContext} Before writing your response, verify: do the context blocks above address the topic being discussed? If the context is completely unrelated to this conversation, apply RULE 3 and refuse. Otherwise, continue the conversation naturally.`;

            // Exam mode / strictness modifiers ONLY apply when context is available.
            if (isExamMode || aiStrictness === 'HINTS_ONLY') {
                systemPromptText += `\n\n[EXAM MODE ACTIVE] Additional constraint on top of all existing rules:\n- You may NOT provide any explanations or direct answers — only Socratic guiding questions.\n- Your guiding questions must stay within the topic area covered by the context blocks.\n- Do NOT state any specific facts, formulas, or numerical values from pre-trained knowledge — only use what is in the context.\n- If you cannot form a meaningful question from the context, refuse with the standard refusal phrase.\n- Reply to concept overview requests with: "I'm in Exam Mode. I can only provide hints based on content found in your uploaded course materials."`;
            }
        } else {
            // No confident course material match — HARD REFUSAL regardless of exam mode.
            // Do NOT add exam mode instructions here; they would let the LLM use pre-trained knowledge.
            const refusalReason = !isConfident && searchResults?.documents?.[0]?.length > 0
                ? "the available material is not specific enough to answer your question confidently"
                : "no matching content was found in the uploaded course materials";

            systemPromptText += `\n\n[HARD REFUSAL — DO NOT OVERRIDE] Because ${refusalReason}, you MUST refuse to answer. Do NOT use your pre-trained knowledge under any circumstances, even for hints or Socratic questions. Reply only: "I couldn't find information about this in your uploaded course materials, so I've forwarded your query to the faculty for review." — nothing else.`;
        }

        // If a YouTube video was found, tell the LLM to respond naturally without meta-text
        if (youtubeVideo) {
            systemPromptText += `\n\n[VIDEO FOUND] A relevant YouTube video has been automatically retrieved and will be displayed as a card directly in the UI — you do NOT need to mention it, describe it, or add any note about it. Simply give your normal Socratic response to the student's question. Do NOT write things like "[Video Resource]", "(Note: the video card...)", or any placeholder text about a video.`;
        }

        const systemMessage = new SystemMessage(systemPromptText);
        
        const pastMessages = session.messages.map(m => 
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        );

        const currentMessage = new HumanMessage(`Student Query: ${query}`);
        
        // Final Prompt Array Injecting Context + Memory
        const fullPrompt = [systemMessage, ...pastMessages, currentMessage];

        let rawAnswer = '';
        try {
           const response = await chatModel.invoke(fullPrompt);
           rawAnswer = response.content.toString();
        } catch (llmError: any) {
           console.warn("Groq LLM Error (Possible Rate Limit), failing over to NVIDIA NIM...");
           try {
               const fallbackChat = getFallbackChatModel();
               const response = await fallbackChat.invoke(fullPrompt);
               rawAnswer = response.content.toString();
           } catch (fallbackError) {
               console.error("Critical AI Failure on both endpoints:", fallbackError);
               rawAnswer = "We couldn't connect to the AI engine right now. Let the professor know.";
           }
        }

        // -----------------------------------------------------
        // 5. STORAGE LOGIC & TEACHER FORWARDING
        // -----------------------------------------------------
        
        // Save to Chat Session Memory
        session.messages.push({ role: 'user', content: query } as any);
        session.messages.push({ role: 'assistant', content: rawAnswer } as any);
        await session.save();

        let statusToLog = 'ANSWERED';
        let forwarded = false;
        
        const answerLower = rawAnswer.toLowerCase();
        if (answerLower.includes("couldn't find information") || answerLower.includes("don't know")) {
            statusToLog = 'UNANSWERED_FORWARDED';
            forwarded = true;
            // Do NOT append a note here — the LLM already outputs the full standard refusal phrase.
            // Adding text here causes the refusal to appear twice in the UI.
        }

        const extractedTopic = await extractTopic(query);

        const log = new QueryLog({
             sessionId: activeSessionId,
             studentId,
             query,
             response: rawAnswer,
             topic: extractedTopic,
             department: department || 'General',
             status: statusToLog,
             forwardedToTeacher: forwarded
        });
        await log.save();

        res.status(200).json({
             answer: rawAnswer,
             sources: searchResults.metadatas?.[0] || [],
             sessionId: activeSessionId,
             ...(youtubeVideo && { youtubeVideo })
        });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: 'Failed to process chat query.' });
    }
};
