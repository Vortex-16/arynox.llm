import { ChromaClient, Collection } from 'chromadb';

// Connect to ChromaDB. Expected to run locally via Docker on port 8000 by default.
const chromaClient = new ChromaClient({
    path: process.env.CHROMA_URL || "http://localhost:8000",
});

export const getOrCreateCollection = async (collectionName: string): Promise<Collection> => {
    try {
        const collection = await chromaClient.getOrCreateCollection({
            name: collectionName,
        });
        return collection;
    } catch (error) {
        console.error("Error connecting to Chroma collection:", error);
        throw error;
    }
}

export const addDocumentsToChroma = async (collectionName: string, ids: string[], embeddings: number[][], documents: string[], metadatas: any[]) => {
    const collection = await getOrCreateCollection(collectionName);
    
    await collection.add({
        ids,
        embeddings,
        documents,
        metadatas
    });
}

export const queryCollection = async (collectionName: string, queryEmbeddings: number[][], nResults: number = 3) => {
    const collection = await getOrCreateCollection(collectionName);
    const results = await collection.query({
        queryEmbeddings,
        nResults,
    });
    return results;
}
