import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
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

// System prompt updated to explain concepts simply based on the context data
export const SOCRATIC_SYSTEM_PROMPT = `
You are an expert AI tutor for college students. Your primary directive is to act as a Socratic guide, preserving academic integrity while helping students learn.

Strict Guidelines:
1. Base your explanations ONLY on the provided context blocks from uploaded course materials.
2. DO NOT provide direct answers to homework or complex problems. Instead, break down the problem and ask guiding questions to lead the student to the solution.
3. If the answer is NOT in the provided context blocks, you MUST NOT use your pre-trained knowledge to answer. Instead, politely reply: "I couldn't find information about this in your uploaded course materials, so I've forwarded your query to the faculty for review."
4. Use simple, easy-to-understand terms. Avoid overly complex jargon.
5. Always include citations in the format [Source: Title] when you reference specific parts of the context.
6. If the student asks something unrelated to the course or academic topics, refuse to answer and remind them to stay on topic.
`

import axios from 'axios';

const NVIDIA_EMBED_URL = 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = 'nvidia/llama-nemotron-embed-1b-v2';

async function callNvidiaEmbed(texts: string[], inputType: 'passage' | 'query'): Promise<number[][]> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_API_KEY not set in .env');

    const response = await axios.post(
        NVIDIA_EMBED_URL,
        {
            input: texts,
            model: NVIDIA_EMBED_MODEL,
            input_type: inputType,   // <-- required by asymmetric model
            encoding_format: 'float',
            truncate: 'END'
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    // Response shape: { data: [{ embedding: number[] }, ...] }
    return response.data.data.map((item: any) => item.embedding as number[]);
}

// Used when STORING document chunks in ChromaDB
export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    try {
        console.log(`[Embedding] Generating passage embeddings for ${texts.length} chunk(s)...`);
        const result = await callNvidiaEmbed(texts, 'passage');
        console.log(`[Embedding] ✅ Got ${result.length} passage embeddings (dim=${result[0]?.length})`);
        return result;
    } catch (error: any) {
        const msg = error?.response?.data || error?.message;
        console.error('[Embedding] passage error:', msg);
        return texts.map(() => Array.from({ length: 2048 }, () => 0.0));
    }
}

// Used when SEARCHING ChromaDB with a student query
export const generateQueryEmbedding = async (query: string): Promise<number[]> => {
    try {
        console.log(`[Embedding] Generating query embedding...`);
        const result = await callNvidiaEmbed([query], 'query');
        console.log(`[Embedding] ✅ Query embedding ready (dim=${result[0]?.length})`);
        return result[0];
    } catch (error: any) {
        const msg = error?.response?.data || error?.message;
        console.error('[Embedding] query error:', msg);
        return Array.from({ length: 2048 }, () => 0.0);
    }
}

/**
 * Extracts a short, 1-3 word topic from a student query for reporting purposes.
 */
export const extractTopic = async (query: string): Promise<string> => {
    try {
        const chatModel = getChatModel();
        const response = await chatModel.invoke([
            new SystemMessage("You are a topic extractor. Analyze the student query and return a 1-3 word category/topic (e.g. 'Thermodynamics', 'Linear Algebra', 'Cell Biology'). Reply ONLY with the topic. If it's a general question, return 'General'."),
            new HumanMessage(query)
        ]);
        return response.content.toString().trim().replace(/[".]/g, '');
    } catch (error) {
        console.warn("[LLM] Topic extraction failed:", error);
        return 'General';
    }
}
