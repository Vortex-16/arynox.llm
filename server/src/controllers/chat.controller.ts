import { Request, Response, NextFunction } from 'express';
import { queryCollection } from '../services/vectorstore.service';
import { generateEmbeddingsMock, getChatModel, SOCRATIC_SYSTEM_PROMPT } from '../services/llm.service';
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

        // 1. Generate Query Embeddings
        const queryEmbeddings = await generateEmbeddingsMock([query]);

        // 2. Perform Top-K Retrieval from ChromaDB
        const searchResults = await queryCollection(chromaCollectionName, queryEmbeddings, 3);
        
        let contextBlock = "No relevant context found in uploaded materials.";
        
        if (searchResults && searchResults.documents && searchResults.documents.length > 0) {
            // Flatten documents/metadatas from the first result set
            const docs = searchResults.documents[0] || [];
            const mets = searchResults.metadatas[0] || [];
            
            contextBlock = docs.map((doc, index) => {
                 const meta = mets[index] as any;
                 const source = meta?.source ? `[Source: ${meta.source}]` : '';
                 return `Chunk ${index + 1} ${source}: ${doc}`;
            }).join('\n\n');
        }

        // 3. Prepare the Prompt for Groq API
        const systemMessage = new SystemMessage(`${SOCRATIC_SYSTEM_PROMPT}\n\nContext Blocks:\n${contextBlock}`);
        const humanMessage = new HumanMessage(`Student Query: ${query}`);

        // 4. Query the LLM
        let rawAnswer = '';
        try {
           const chat = getChatModel();
           const response = await chat.invoke([systemMessage, humanMessage]);
           rawAnswer = response.content.toString();
        } catch (llmError) {
           console.error("Groq LLM Error:", llmError);
           // Handle missing API Key during dev
           rawAnswer = "We couldn't connect to the AI engine right now. Make sure the GROQ_API_KEY is properly set in the backend environment.";
        }

        // 5. Save the analytics log
        const log = new QueryLog({
             studentId,
             query,
             response: rawAnswer,
             department: department || 'General'
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
