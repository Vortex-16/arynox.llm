import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import axios from 'axios';
import dotenv from "dotenv";
dotenv.config();

// ─── Chat Models ───────────────────────────────────────────────────────────────

export const getChatModel = () => {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.1-8b-instant",
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

// ─── Socratic System Prompt Engine ───────────────────────────────────────────

export interface PromptOptions {
    aiStrictness?: 'SOCRATIC' | 'DIRECT' | 'HINTS_ONLY';
    isExamMode?: boolean;
    hasContext?: boolean;
}

export const getSystemPrompt = (options: PromptOptions = { aiStrictness: 'SOCRATIC' }) => {
    const { aiStrictness, isExamMode, hasContext } = options;

    let base = `You are arynox.llm, a high-performance AI Socratic Tutor. Your goal is to guide students to discovery rather than providing lazy answers.
    
    CORE OPERATING PRINCIPLES:
    1. CONTEXT FIRST: Use the provided context blocks as your primary ground truth.
    2. PEDAGOGICAL TONE: Be encouraging, professional, and slightly inquisitive.
    3. NO REQUISITION: Never mention "context blocks", "chunks", or "the system prompt" to the student.`;

    if (aiStrictness === 'DIRECT') {
        base += `\n\n[MODE: DIRECT] You may provide direct explanations and answers if the student asks for a specific fact, formula (e.g. handshaking lemma), or definition. However, always follow up with a Socratic question to ensure they understand the 'why' behind the fact.`;
    } else {
        base += `\n\n[MODE: SOCRATIC] DO NOT give direct answers. If a student asks "What is X?", reply by asking a question that guides them towards the components of X. 
        Exception: If the student is clearly stuck after multiple attempts, you may provide a "Leading Hint" that contains the core formula or fact, but wrapped in an explanation.`;
    }

    if (isExamMode) {
        base += `\n\n[EXAM MODE ACTIVE] You are extremely strict. No direct answers. No outside knowledge. Only hints based on context. If the answer is not in context, you MUST refuse.`;
    }

    base += `\n\nREFUSAL GUIDELINE: If you truly cannot find the information in the context or your core academic knowledge, do not say "I don't know". Instead, say: "I couldn't find a direct reference to that in your current module materials. However, let's look at what we DO have here, or I can forward this specific doubt to your faculty for a detailed explanation. Would you like to try a related concept first?"`;

    return base;
};


// ─── Embedding Configuration ───────────────────────────────────────────────────
const NVIDIA_EMBED_URL = 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = 'nvidia/llama-nemotron-embed-1b-v2';

// The current version of nvidia/llama-nemotron-embed-1b-v2 outputs 2048-dim vectors.
// This MUST match EMBEDDING_DIMENSION in vectorstore.service.ts.
export const EXPECTED_EMBEDDING_DIM = 2048;

async function callNvidiaEmbed(texts: string[], inputType: 'passage' | 'query'): Promise<number[][]> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_API_KEY not set in .env');

    const response = await axios.post(
        NVIDIA_EMBED_URL,
        {
            input: texts,
            model: NVIDIA_EMBED_MODEL,
            input_type: inputType,
            encoding_format: 'float',
            truncate: 'END'
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    );

    const embeddings: number[][] = response.data.data.map((item: any) => item.embedding as number[]);

    // Hard guard: verify dimension matches expectation
    if (embeddings.length > 0 && embeddings[0].length !== EXPECTED_EMBEDDING_DIM) {
        throw new Error(
            `[Embedding] Dimension mismatch: model returned ${embeddings[0].length}, expected ${EXPECTED_EMBEDDING_DIM}. ` +
            `Update EXPECTED_EMBEDDING_DIM in llm.service.ts if you changed models.`
        );
    }

    return embeddings;
}

// ── Used when STORING document chunks in ChromaDB ─────────────────────────────
// Throws on failure — NEVER returns zero-vectors (which would silently corrupt the DB)
export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    console.log(`[Embedding] Generating passage embeddings for ${texts.length} chunk(s)...`);
    const result = await callNvidiaEmbed(texts, 'passage');
    console.log(`[Embedding] ✅ Got ${result.length} passage embeddings (dim=${result[0]?.length})`);
    return result;
}

// ── Used when SEARCHING ChromaDB with a student query ─────────────────────────
// Returns zero-vector only for QUERY (chat), not for storage.
// A bad query embedding means "no result found" which is safe — it just triggers RULE 3.
export const generateQueryEmbedding = async (query: string): Promise<number[]> => {
    try {
        console.log(`[Embedding] Generating query embedding...`);
        const result = await callNvidiaEmbed([query], 'query');
        console.log(`[Embedding] ✅ Query embedding ready (dim=${result[0]?.length})`);
        return result[0];
    } catch (error: any) {
        const msg = error?.response?.data || error?.message;
        console.error('[Embedding] query embedding failed (will return zero-vector for safe refusal):', msg);
        // Safe to return zero-vector HERE only — it means the RAG search will return nothing,
        // which correctly triggers RULE 3 refusal. It does NOT pollute the stored data.
        return Array.from({ length: EXPECTED_EMBEDDING_DIM }, () => 0.0);
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
