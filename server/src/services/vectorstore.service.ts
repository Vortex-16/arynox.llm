import axios from 'axios';

const CHROMA_BASE = process.env.CHROMA_URL || 'https://api.trychroma.com';
const TENANT = process.env.CHROMA_TENANT || '53429d4f-f9b4-404a-99f3-e6636070158c';
const DATABASE = process.env.CHROMA_DATABASE || 'ARYNOX';
const CHROMA_API_KEY = process.env.CHROMA_API_KEY || 'ck-9JTZgGZ1G2TEx2wLSQtiEUTyhqsCL3qLz2pcgm358NYn';

const API_BASE = `${CHROMA_BASE}/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`;

// Headers for Chroma Cloud Support
const CHROMA_HEADERS = {
    'X-Chroma-Token': CHROMA_API_KEY,
    'Content-Type': 'application/json'
};

// Model: nvidia/llama-nemotron-embed-1b-v2 -> returns 2048-dim vectors.
const EMBEDDING_DIMENSION = 2048;

// Cache collection IDs so we don't re-fetch on every call
const collectionIdCache: Record<string, string> = {};

// ── Retry helper: 3 attempts with exponential backoff ──────────────────────────
const withRetry = async <T>(fn: () => Promise<T>, attempts = 3, delayMs = 500): Promise<T> => {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (e: any) {
            const isLast = i === attempts - 1;
            if (isLast) throw e;
            console.warn(`[ChromaDB] Attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
            await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        }
    }
    throw new Error('unreachable');
};

// ── Health check: verify an existing collection has the correct dimension ───────
const verifyCollectionDimension = async (colId: string): Promise<boolean> => {
    try {
        const res = await axios.get(`${API_BASE}/${colId}`, { headers: CHROMA_HEADERS });
        const dim = res.data?.metadata?.dimension;
        if (dim && dim !== EMBEDDING_DIMENSION) {
            console.warn(`[ChromaDB] ⚠️ Collection dimension ${dim} ≠ expected ${EMBEDDING_DIMENSION}`);
            return false;
        }
        return true;
    } catch {
        return true; // Cannot verify — assume OK
    }
};

const getCollectionId = async (collectionName: string): Promise<string> => {
    if (collectionIdCache[collectionName]) return collectionIdCache[collectionName];

    // Try to GET existing collection by name
    try {
        const res = await withRetry(() => axios.get(`${API_BASE}/${collectionName}`, { headers: CHROMA_HEADERS }));
        const colId = res.data.id;

        // Health check: recreate if dimension is wrong
        const healthy = await verifyCollectionDimension(colId);
        if (!healthy) {
            console.warn(`[ChromaDB] Recreating "${collectionName}" due to dimension mismatch…`);
            try {
                await axios.delete(`${API_BASE}/${colId}`, { headers: CHROMA_HEADERS });
            } catch (_) { /* may already be gone */ }
            // Fall through to create new
        } else {
            collectionIdCache[collectionName] = colId;
            return colId;
        }
    } catch (e: any) {
        if (e.response?.status !== 404) throw e;
    }

    // Create new collection with correct dimension
    const createRes = await withRetry(() => axios.post(API_BASE, {
        name: collectionName,
        metadata: {
            'hnsw:space': 'cosine',
            'dimension': EMBEDDING_DIMENSION
        }
    }, { headers: CHROMA_HEADERS }));
    collectionIdCache[collectionName] = createRes.data.id;
    console.log(`[ChromaDB] ✅ Created collection "${collectionName}" (dim=${EMBEDDING_DIMENSION}) id: ${createRes.data.id}`);
    return createRes.data.id;
};

export const addDocumentsToChroma = async (
    collectionName: string,
    ids: string[],
    embeddings: number[][],
    documents: string[],
    metadatas: any[]
) => {
    // Guard: reject if embedding dimension is wrong before touching Chroma
    if (embeddings.length > 0 && embeddings[0].length !== EMBEDDING_DIMENSION) {
        throw new Error(
            `[ChromaDB] Embedding dimension mismatch: got ${embeddings[0].length}, expected ${EMBEDDING_DIMENSION}. ` +
            `This batch was NOT stored. Check your embedding model configuration.`
        );
    }

    const colId = await getCollectionId(collectionName);
    await withRetry(() => axios.post(`${API_BASE}/${colId}/add`, {
        ids,
        embeddings,
        documents,
        metadatas
    }, { headers: CHROMA_HEADERS }));
    console.log(`[ChromaDB] ✅ Stored ${ids.length} chunks in "${collectionName}"`);
};

export const queryCollection = async (
    collectionName: string,
    queryEmbeddings: number[][],
    nResults: number = 8,
    where: any = null
) => {
    const colId = await getCollectionId(collectionName);
    const body: any = {
        query_embeddings: queryEmbeddings,
        n_results: nResults,
        include: ['documents', 'metadatas', 'distances']
    };
    if (where) {
        body.where = where;
    }
    const res = await withRetry(() => axios.post(`${API_BASE}/${colId}/query`, body, { headers: CHROMA_HEADERS }));
    return res.data;
};

export const deleteDocumentFromChroma = async (collectionName: string, sourceTitle: string) => {
    try {
        const colId = await getCollectionId(collectionName);
        await withRetry(() => axios.post(`${API_BASE}/${colId}/delete`, {
            where: { 'source': sourceTitle }
        }, { headers: CHROMA_HEADERS }));
        console.log(`[ChromaDB] ✅ Purged vectors for: "${sourceTitle}"`);
    } catch (error: any) {
        console.error(`[ChromaDB] Failed to delete for "${sourceTitle}":`, error?.response?.data || error.message);
    }
};

// Kept for backward compatibility
export const getOrCreateCollection = async (_name: string) => null;

/**
 * Returns the names of all ChromaDB collections, optionally filtered by a
 * department prefix (e.g. "cse__" to get only CSE subject collections).
 */
export const listCollections = async (deptPrefix?: string): Promise<string[]> => {
    try {
        const res = await withRetry(() => axios.get(API_BASE, { headers: CHROMA_HEADERS }));
        const names: string[] = (res.data as any[]).map((c: any) => c.name as string);
        if (!deptPrefix) return names;
        return names.filter(n => n.startsWith(deptPrefix));
    } catch (e: any) {
        console.error('[ChromaDB] listCollections failed:', e?.response?.data || e.message);
        return ['college_documents']; // safe fallback
    }
};
