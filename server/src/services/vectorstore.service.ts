import axios from 'axios';

const CHROMA_BASE = process.env.CHROMA_URL || 'http://localhost:8000';
const TENANT = 'default_tenant';
const DATABASE = 'default_database';
const API_BASE = `${CHROMA_BASE}/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`;

// Cache collection IDs so we don't re-fetch on every call
const collectionIdCache: Record<string, string> = {};

const getCollectionId = async (collectionName: string): Promise<string> => {
    if (collectionIdCache[collectionName]) return collectionIdCache[collectionName];

    // Try to GET existing collection by name
    try {
        const res = await axios.get(`${API_BASE}/${collectionName}`);
        collectionIdCache[collectionName] = res.data.id;
        return res.data.id;
    } catch (e: any) {
        if (e.response?.status !== 404) throw e;
    }

    // Create new — explicitly set dimension=2048 to match Nvidia embed model output
    const createRes = await axios.post(API_BASE, {
        name: collectionName,
        metadata: { "hnsw:space": "cosine", "dimension": 2048 }
    });
    collectionIdCache[collectionName] = createRes.data.id;
    console.log(`[ChromaDB] ✅ Created collection "${collectionName}" id: ${createRes.data.id}`);
    return createRes.data.id;
};

export const addDocumentsToChroma = async (
    collectionName: string,
    ids: string[],
    embeddings: number[][],
    documents: string[],
    metadatas: any[]
) => {
    const colId = await getCollectionId(collectionName);
    await axios.post(`${API_BASE}/${colId}/add`, {
        ids,
        embeddings,
        documents,
        metadatas
    });
    console.log(`[ChromaDB] ✅ Stored ${ids.length} chunks in "${collectionName}"`);
};

export const queryCollection = async (
    collectionName: string,
    queryEmbeddings: number[][],
    nResults: number = 5,
    where: any = null // Standard Chroma metadata filter object
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
    const res = await axios.post(`${API_BASE}/${colId}/query`, body);
    return res.data;
};

export const deleteDocumentFromChroma = async (collectionName: string, sourceTitle: string) => {
    try {
        const colId = await getCollectionId(collectionName);
        await axios.post(`${API_BASE}/${colId}/delete`, {
            where: { "source": sourceTitle }
        });
        console.log(`[ChromaDB] ✅ Purged vectors for: "${sourceTitle}"`);
    } catch (error: any) {
        console.error(`[ChromaDB] Failed to delete for "${sourceTitle}":`, error?.response?.data || error.message);
    }
};

// Kept for backward compatibility — no longer needed
export const getOrCreateCollection = async (_name: string) => null;
