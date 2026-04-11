import { Request, Response, NextFunction } from 'express';
import { queryCollection, listCollections } from '../services/vectorstore.service';
import { generateQueryEmbedding, getChatModel, getFallbackChatModel, getSystemPrompt, extractTopic } from '../services/llm.service';
import { buildCollectionName } from '../services/document.service';
import { searchBestYouTubeVideo } from '../services/youtube.service';
import QueryLog from '../models/QueryLog';
import ChatSession from '../models/ChatSession';
import SystemSetting from '../models/SystemSetting';
import DocumentMeta from '../models/DocumentMeta';
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { notifyAllTeachers } from './notifications.controller';

/** Detects if the student is asking for a video/tutorial recommendation */
const isVideoRequest = (query: string): boolean => {
    return /\b(video|videos|youtube|tutorial|tutorials|lecture|watch|show me|find me a|recommend.*video|video.*on|video.*about|video.*for|video.*of|link.*video|visual.*explain|visual.*aid|animation)\b/i.test(query);
};

// ── Concurrency-limited query fan-out ─────────────────────────────────────────
// Queries ChromaDB collections in batches of MAX_CONCURRENT to avoid flooding
// the ChromaDB server with connections, which was causing crashes after 4-5 queries.
const MAX_CONCURRENT_CHROMA_QUERIES = 3;

type SearchResult = {
    documents: string[][];
    metadatas: any[][];
    distances: number[][];
};

const queryCollectionsSafely = async (
    collections: string[],
    queryVec: number[],
    nResults: number,
    sourceFilter: any
): Promise<{ doc: string; meta: any; dist: number }[]> => {
    const allResults: { doc: string; meta: any; dist: number }[] = [];

    // Process in batches to avoid overloading ChromaDB
    for (let i = 0; i < collections.length; i += MAX_CONCURRENT_CHROMA_QUERIES) {
        const batch = collections.slice(i, i + MAX_CONCURRENT_CHROMA_QUERIES);

        const batchResults = await Promise.allSettled(
            batch.map(async (col) => {
                const result: SearchResult = await queryCollection(col, [queryVec], nResults, sourceFilter);
                return { col, result };
            })
        );

        for (const settled of batchResults) {
            if (settled.status === 'rejected') {
                const colIdx = batch[batchResults.indexOf(settled)];
                console.warn(`[Chat] Skipping collection "${colIdx}" (error: ${settled.reason?.message || 'unknown'})`);
                continue;
            }
            const { col, result } = settled.value;
            (result?.documents?.[0] || []).forEach((d, idx) => {
                allResults.push({
                    doc: d,
                    meta: result.metadatas?.[0]?.[idx] || {},
                    dist: result.distances?.[0]?.[idx] ?? 1,
                });
            });
        }

        // Small cooldown between batches to let ChromaDB recover
        if (i + MAX_CONCURRENT_CHROMA_QUERIES < collections.length) {
            await new Promise(r => setTimeout(r, 150));
        }
    }

    return allResults;
};

export const askChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Fetch full verified profile from DB
        const fullUser = await (require('../models/User').default).findById(user.userId);
        if (!fullUser) {
            res.status(404).json({ error: 'User profile not found' });
            return;
        }

        const { query, sessionId, subject, chapter, section, sourceIds } = req.body;
        
        // Verified identity props — ignore client-sent overrides for security
        const department = fullUser.department || 'General';
        const className = fullUser.className || 'Global';
        const semester = fullUser.semester || '';
        const studentId = fullUser._id.toString();

        if (!query) {
             res.status(400).json({ error: 'Query is required.' });
             return;
        }

        const activeSessionId = sessionId || Math.random().toString(36).substring(2, 15);

        // ─── Semantic Topic Extraction ─────────────────────────────────────────
        const extractedTopic = await extractTopic(query);

        // ─── YouTube Video Intent Detection ───────────────────────────────────
        const videoSearchPromise = isVideoRequest(query)
            ? searchBestYouTubeVideo(extractedTopic !== 'General' ? extractedTopic : query)
            : Promise.resolve(null);

        let session = await ChatSession.findOne({ sessionId: activeSessionId });
        
        if (!session) {
            session = new ChatSession({
                sessionId: activeSessionId,
                studentId,
                title: query.substring(0, 40) + '...',
                department,
                className,
                messages: []
            });
        }

        // ─── Context-aware search query (for follow-ups) ──────────────────────
        const isFollowUp = session.messages.length > 0;
        const recentHistory = session.messages
            .slice(-6)
            .map((m: any) => m.content)
            .join(' ');
        const contextualSearchQuery = isFollowUp && recentHistory
            ? `${recentHistory} ${query}`
            : query;

        // ─── 1. ACADEMIC RELEVANCE CHECK ──────────────────────────────────────
        let chatModel;
        try {
            chatModel = getChatModel();
        } catch (e) {
            chatModel = getFallbackChatModel();
        }

        let isAcademic = true;
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

        // Fetch Faculty Settings
        const settings = await SystemSetting.findOne({ department: department || 'General' });
        const isExamMode = settings?.isExamMode || false;
        const aiStrictness = settings?.aiStrictness || 'SOCRATIC';
        const confidenceThreshold = settings?.confidenceThreshold || 0.45;

        // ─── 2. COLLECTION RESOLUTION + VECTOR RETRIEVAL ──────────────────────
        const queryVec = await generateQueryEmbedding(contextualSearchQuery);

        let collectionsToSearch: string[] = [];
        let sourceFilter: any = null;

        if (sourceIds && Array.isArray(sourceIds) && sourceIds.length > 0) {
            const docs = await DocumentMeta.find({ _id: { $in: sourceIds } });
            const titlesByCollection = new Map<string, string[]>();
            docs.forEach(d => {
                const col = d.chromaCollectionRef || 'college_documents';
                if (!titlesByCollection.has(col)) titlesByCollection.set(col, []);
                titlesByCollection.get(col)!.push(d.title);
            });
            collectionsToSearch = Array.from(titlesByCollection.keys());
            if (collectionsToSearch.length === 1) {
                const titles = titlesByCollection.get(collectionsToSearch[0])!;
                sourceFilter = {
                    "$and": [
                        { "department": { "$eq": department || 'General' } },
                        { "source": { "$in": titles } }
                    ]
                };
            }
        } else if (subject && department) {
            collectionsToSearch = [buildCollectionName(department, subject)];
            const andClauses: any[] = [{ department: { "$eq": department } }];
            if (chapter) andClauses.push({ chapter: { "$eq": chapter } });
            if (section) andClauses.push({ section: { "$eq": section } });
            sourceFilter = andClauses.length > 1 ? { "$and": andClauses } : andClauses[0];
        } else if (department) {
            const deptSlug = department.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
            collectionsToSearch = await listCollections(`${deptSlug}__`);
            if (!collectionsToSearch.includes('college_documents')) {
                collectionsToSearch.push('college_documents');
            }
            sourceFilter = { department: { "$eq": department } };
        } else {
            collectionsToSearch = ['college_documents'];
        }

        // ── Throttled fan-out (replaces the unsafe Promise.all) ───────────────
        const rawMerged = await queryCollectionsSafely(collectionsToSearch, queryVec, 8, sourceFilter);

        // Sort by distance (best match first) and cap to top-10
        const merged = rawMerged
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 10);

        const searchResults = {
            documents: [merged.map(m => m.doc)],
            metadatas: [merged.map(m => m.meta)],
            distances: [merged.map(m => m.dist)],
        };

        // ─── 3. CONFIDENCE-BASED FILTERING ────────────────────────────────────
        const distances = searchResults?.distances?.[0] || [];
        const bestDistance = distances.length > 0 ? Math.min(...distances) : 100;
        const isConfident = bestDistance < confidenceThreshold;
        
        let contextBlock = "";
        let hasContext = false;
        
        if (searchResults?.documents?.[0]?.length > 0 && isConfident) {
            const docs = searchResults.documents[0];
            const mets = searchResults.metadatas[0] || [];
            
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

        // ─── 4. SOCRATIC RAG PROMPT ASSEMBLY ──────────────────────────────────
        const youtubeVideo = await videoSearchPromise;
        const promptOptions = {
            aiStrictness: aiStrictness as any,
            isExamMode,
            hasContext
        };
        
        let systemPromptText: string = getSystemPrompt(promptOptions);

        if (hasContext) {
            systemPromptText += `\n\n--- CONTEXT BLOCKS START ---\n${contextBlock}\n--- CONTEXT BLOCKS END ---`;
            const verificationContext = isFollowUp
                ? `This is a follow-up in an ongoing conversation. The student's recent messages were: "${recentHistory.slice(-300)}". Their latest message is: "${query}".`
                : `The student asked: "${query}".`;
            systemPromptText += `\n\n[MANDATORY PRE-RESPONSE CHECK] ${verificationContext} Before writing your response, verify: do the context blocks above address the topic being discussed? If the context is completely unrelated to this conversation, ignore it and use your academic core. Otherwise, continue the conversation naturally.`;
        } else if (!youtubeVideo) {
            const refusalReason = !isConfident && searchResults?.documents?.[0]?.length > 0
                ? "the available material is not specific enough to answer your question confidently"
                : "no matching content was found in the uploaded course materials";
            systemPromptText += `\n\n[INSTRUCTION] Because ${refusalReason}, you should follow the REFUSAL GUIDELINE in the system prompt. Do not invent facts beyond academic common sense.`;
        }

        if (youtubeVideo) {
            systemPromptText += `\n\n[UTILITY ALERT] A relevant YouTube video HAS been found and will be displayed as a card in the UI. 
            You MUST acknowledge that you've found a video for them (e.g. "Sure! I've pulled up a great video on ${extractedTopic} for you..."). 
            DO NOT be overly Socratic about the act of searching. Be helpful, then proceed with your Socratic guiding question related to the topic.`;
        }

        const systemMessage = new SystemMessage(systemPromptText);
        const pastMessages = session.messages.map((m: any) => 
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        );
        const currentMessage = new HumanMessage(`Student Query: ${query}`);
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

        // ─── 5. STORAGE + TEACHER FORWARDING ──────────────────────────────────
        session.messages.push({ role: 'user', content: query } as any);
        session.messages.push({ role: 'assistant', content: rawAnswer } as any);
        await session.save();

        let statusToLog = 'ANSWERED';
        let forwarded = false;
        
        const answerLower = rawAnswer.toLowerCase();
        if (
            answerLower.includes("couldn't find information") || 
            answerLower.includes("couldn't find a direct reference") ||
            answerLower.includes("don't know")
        ) {
            statusToLog = 'UNANSWERED_FORWARDED';
            forwarded = true;
        }

        const log = new QueryLog({
             sessionId: activeSessionId,
             studentId,
             query,
             response: rawAnswer,
             topic: extractedTopic,
             subject: subject || (searchResults.metadatas?.[0]?.[0] as any)?.subject || 'General',
             module: (searchResults.metadatas?.[0]?.[0] as any)?.module || 'Introductory',
             department: department || 'General',
             status: statusToLog,
             forwardedToTeacher: forwarded
        });
        await log.save();

        // ─── STUCK STUDENT REAL-TIME ALERT ────────────────────────────────────
        if (studentId && extractedTopic) {
            const count = await QueryLog.countDocuments({ studentId, topic: extractedTopic });
            if (count === 3) {
                notifyAllTeachers({ 
                    type: 'STUCK_STUDENT', 
                    studentId, 
                    topic: extractedTopic,
                    query: query.substring(0, 60) + (query.length > 60 ? '...' : '') 
                });
            }
        }

        res.status(200).json({
             answer: rawAnswer,
             sources: searchResults.metadatas?.[0] || [],
             sessionId: activeSessionId,
             ...(youtubeVideo && { youtubeVideo })
        });
    } catch (error) {
        console.error("Chat Error:", error);
        next(error);
    }
};
