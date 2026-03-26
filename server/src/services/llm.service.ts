import { ChatGroq } from "@langchain/groq";
import { Embeddings } from "@langchain/core/embeddings";
// Minimal interface for Groq embedding since official integration is primarily Chat model
import dotenv from "dotenv";
dotenv.config();

// We will use nomic-embed-text for local embeddings or another fast open-source embedding model that langChain/community supports.
// But the PRD states: "Convert text chunks into vectors using the Groq API."
// Technically Groq DOES NOT currently provide an embeddings API (they do fast LLM inference).
// This is a common hackathon confusion! We will use transformers.js locally or a lightweight embedding library.
// For the sake of the hackathon, we can use an open free embedding API or simulated embeddings if Groq doesn't provide them,
// but the easiest is using `HuggingFaceTransformersEmbeddings` from langchain/community or a dummy local pipeline.
// Or we can mock the embeddings array generation for the sake of starting out, while focusing Chat on Groq.

// For chat model:
import { ChatOpenAI } from "@langchain/openai";

export const getChatModel = () => {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.1-8b-instant", // Using currently active Llama 3.1 on Groq
    });
}

// Fallback LLM when Groq hits 429 Rate Limits
export const getFallbackChatModel = () => {
    return new ChatOpenAI({
        apiKey: process.env.NVIDIA_API_KEY || 'no-key-provided',
        model: "nvidia/nemotron-3-super-120b-a12b",
        configuration: {
            baseURL: "https://integrate.api.nvidia.com/v1"
        }
    });
}

// System prompt as requested by PRD
export const SOCRATIC_SYSTEM_PROMPT = `
You are a STRICT Socratic tutor for college students. Your primary directive is to NEVER give direct answers or write solutions that students can easily copy-paste.
Your ONLY goal is to guide the student to the answer themselves by asking clever, incremental questions based entirely on the provided context blocks.
If the student asks you to solve something, break it down and ask them what the first step should be.
If the answer is NOT in the provided context block, forcefully reply: "I don't know, this isn't in my provided course materials."
Include citations [Source: Title] to the context blocks provided so the student knows where to look.
`

import { OpenAIEmbeddings } from "@langchain/openai";

// ... previous code ...

// Generate real embeddings using NVIDIA's free NIM API Endpoint via OpenAI SDK interface
export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    try {
        const embeddingsAPI = new OpenAIEmbeddings({
            apiKey: process.env.NVIDIA_API_KEY || 'no-key-provided',
            modelName: 'nvidia/llama-nemotron-embed-1b-v2',
            configuration: {
                baseURL: 'https://integrate.api.nvidia.com/v1',
            }
        });
        
        // The API actually returns an array of embeddings
        const embeddings = await embeddingsAPI.embedDocuments(texts);
        return embeddings;
    } catch (error) {
        console.error("NVIDIA Embedding Error (Fallback to zeros for development):", error);
        // Fallback so the server doesn't crash if the API key isn't set yet during local testing
        return texts.map(t => Array.from({length: 1024}, () => 0.0));
    }
}
