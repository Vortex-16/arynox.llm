import { Request, Response, NextFunction } from 'express';
import { queryCollection } from '../services/vectorstore.service';
import { generateEmbeddings, getChatModel, getFallbackChatModel, SOCRATIC_SYSTEM_PROMPT } from '../services/llm.service';
import QueryLog from '../models/QueryLog';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const askChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { query, department, studentId } = req.body;
        if (!query) {
             res.status(400).json({ error: 'Query is required.' });
             return;
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
                new SystemMessage("You are a strict query classifier. If the user's input is a random joke, casual greeting, or totally out of scope of school/education, reply with 'NO'. If it is an academic or factual question, reply 'YES'. Only reply YES or NO."),
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
                 studentId,
                 query,
                 response: "This query is out of academic scope.",
                 department: department || 'General',
                 status: 'OUT_OF_SCOPE'
            });
            await log.save();
            res.status(200).json({ answer: "Please keep your questions related to the course materials.", sources: [] });
            return;
        }

        // -----------------------------------------------------
        // 2. VECTOR DATABASE RETRIEVAL
        // -----------------------------------------------------
        const queryEmbeddings = await generateEmbeddings([query]);
        const searchResults = await queryCollection(chromaCollectionName, queryEmbeddings, 3);
        
        let contextBlock = "No relevant context found in uploaded materials.";
        
        if (searchResults && searchResults.documents && searchResults.documents.length > 0) {
            const docs = searchResults.documents[0] || [];
            const mets = searchResults.metadatas[0] || [];
            
            contextBlock = docs.map((doc, index) => {
                 const meta = mets[index] as any;
                 const source = meta?.source ? `[Source: ${meta.source}]` : '';
                 return `Chunk ${index + 1} ${source}: ${doc}`;
            }).join('\n\n');
        }

        // -----------------------------------------------------
        // 3. SOCRATIC RAG WITH FAILOVER
        // -----------------------------------------------------
        const systemMessage = new SystemMessage(`${SOCRATIC_SYSTEM_PROMPT}\n\nContext Blocks:\n${contextBlock}`);
        const humanMessage = new HumanMessage(`Student Query: ${query}`);

        let rawAnswer = '';
        try {
           const response = await chatModel.invoke([systemMessage, humanMessage]);
           rawAnswer = response.content.toString();
        } catch (llmError: any) {
           console.warn("Groq LLM Error (Possible Rate Limit), failing over to NVIDIA NVIDIA NIM...");
           try {
               const fallbackChat = getFallbackChatModel();
               const response = await fallbackChat.invoke([systemMessage, humanMessage]);
               rawAnswer = response.content.toString();
           } catch (fallbackError) {
               console.error("Critical AI Failure on both endpoints:", fallbackError);
               rawAnswer = "We couldn't connect to the AI engine right now. Let the professor know.";
           }
        }

        // -----------------------------------------------------
        // 4. TEACHER FORWARDING LOGIC
        // -----------------------------------------------------
        let statusToLog = 'ANSWERED';
        let forwarded = false;
        
        // If the Socratic prompt results in the AI saying it doesn't know based on the context:
        const answerLower = rawAnswer.toLowerCase();
        if (answerLower.includes("don't know") || answerLower.includes("cannot answer") || answerLower.includes("isn't in the provided context")) {
            statusToLog = 'UNANSWERED_FORWARDED';
            forwarded = true;
            rawAnswer += "\n\n(Note: I couldn't find this in the uploaded materials, so I've forwarded this question to your professor for review.)";
        }

        const log = new QueryLog({
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
             sources: searchResults.metadatas?.[0] || []
        });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: 'Failed to process chat query.' });
    }
};
