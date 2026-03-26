import { Request, Response, NextFunction } from 'express';
import { queryCollection } from '../services/vectorstore.service';
import { generateQueryEmbedding, getChatModel, getFallbackChatModel, SOCRATIC_SYSTEM_PROMPT } from '../services/llm.service';
import QueryLog from '../models/QueryLog';
import ChatSession from '../models/ChatSession';
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export const askChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { query, department, studentId, sessionId, className } = req.body;
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

        // -----------------------------------------------------
        // 2. VECTOR DATABASE RETRIEVAL
        // -----------------------------------------------------
        const queryVec = await generateQueryEmbedding(query);
        const searchResults = await queryCollection(chromaCollectionName, [queryVec], 5);
        
        let contextBlock = "";
        let hasContext = false;
        
        if (searchResults?.documents?.[0]?.length > 0) {
            const docs = searchResults.documents[0];
            const mets = searchResults.metadatas[0] || [];
            
            // Only include chunks that actually have content
            const validDocs = docs.filter((d: string | null) => d && d.trim().length > 20);
            if (validDocs.length > 0) {
                hasContext = true;
                contextBlock = validDocs.map((doc: string, index: number) => {
                    const meta = mets[index] as any;
                    const source = meta?.source ? `[Source: ${meta.source}]` : '';
                    return `Chunk ${index + 1} ${source}:\n${doc}`;
                }).join('\n\n');
            }
        }

        // -----------------------------------------------------
        // 3. SOCRATIC RAG WITH CONVERSATIONAL MEMORY
        // -----------------------------------------------------
        let systemPromptText: string;

        if (hasContext) {
            systemPromptText = `${SOCRATIC_SYSTEM_PROMPT}\n\nRelevant Context from Uploaded Materials:\n${contextBlock}`;
        } else {
            // No matching content found — tell AI to do a general academic explanation
            systemPromptText = `You are an expert AI academic tutor. The student asked a question, but no matching content was found in the uploaded course materials.\n
Your job is to:\n1. Clearly explain the topic based on your broad academic knowledge.\n2. Keep the explanation simple, friendly, and well-structured for a college student.\n3. At the END of your response, add this exact line: "\n\n📌 *Note: This answer is based on general knowledge. Your professor's materials may cover this differently. Faculty response will be available soon.*"`;
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
        // 4. STORAGE LOGIC & TEACHER FORWARDING
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

        const log = new QueryLog({
             sessionId: activeSessionId,
             studentId,
             query,
             response: rawAnswer,
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
