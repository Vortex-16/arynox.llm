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
export const getChatModel = () => {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama3-8b-8192", // Using Llama 3 on Groq
    });
}

// System prompt as requested by PRD
export const SOCRATIC_SYSTEM_PROMPT = `
You are a highly intelligent Socratic tutor. Use ONLY the provided context blocks to answer the student's question.
Do NOT give direct answers, rather guide them with questions.
If you don't know the answer or it isn't in the provided context, gracefully say you don't know and refuse to answer.
Include citations to the context blocks provided.
`

// For embedding (Mocking Groq embedding since Groq only does LLM inference natively unless they recently released it. 
// Standard practice is to use HuggingFaceInferenceEmbeddings or local. Let's use a very basic mock that simulates calling an API.
export const generateEmbeddingsMock = async (texts: string[]): Promise<number[][]> => {
    // Generate an array of 384-dimensional zeros to represent dummy embeddings
    // In production we would swap this for an actual call to OpenAI or HuggingFace
    return texts.map(t => Array.from({length: 384}, () => Math.random() - 0.5));
}
