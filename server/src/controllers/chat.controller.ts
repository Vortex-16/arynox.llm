import { Request, Response, NextFunction } from 'express';
import { queryCollection } from '../services/vectorstore.service';
import { generateQueryEmbedding, getChatModel, getFallbackChatModel, SOCRATIC_SYSTEM_PROMPT, extractTopic } from '../services/llm.service';
import QueryLog from '../models/QueryLog';
import ChatSession from '../models/ChatSession';
import SystemSetting from '../models/SystemSetting';
import DocumentMeta from '../models/DocumentMeta';
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export const askChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { query, department, studentId, sessionId, className, sourceIds } = req.body;
        if (!query) {
             res.status(400).json({ error: 'Query is required.' });
             return;
        }

        const activeSessionId = sessionId || Math.random().toString(36).substring(2, 15);
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

        const queryVec = await generateQueryEmbedding(query);
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

        // Adjust for AI Strictness / Exam Mode
        if (isExamMode || aiStrictness === 'HINTS_ONLY') {
            systemPromptText += `
\n[EXAM MODE ACTIVE] 
- You are strictly prohibited from providing any conceptual explanations or answers.
- You can ONLY respond with hints, Socratic questions, or pointing the student towards a specific source location.
- If the student asks for a concept overview, say: "I'm in Exam Mode. I can only provide hints to help you reach the conclusion yourself."
`;
        }

        if (hasContext) {
            systemPromptText += `\n\nRelevant Context from Uploaded Materials:\n${contextBlock}`;
        } else {
            // STRICT REFUSAL: No matching content or low confidence
            const refusalReason = !isConfident && searchResults?.documents?.[0]?.length > 0
                ? "the available material is not specific enough to answer your question confidently"
                : "no matching matching content was found in the uploaded course materials";
            
            systemPromptText += `\n\n[IMPORTANT] Refusal Mode Triggered: Because ${refusalReason}, you MUST politely refuse to answer. Suggest that the student reviews their notes or contacts the professor.`;
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
            rawAnswer += "\n\n*(Note: I couldn't verify this in the uploaded materials, so I've forwarded this question to your professor for review.)*";
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
             sessionId: activeSessionId
        });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: 'Failed to process chat query.' });
    }
};
