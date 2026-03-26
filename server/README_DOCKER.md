# Running ChromaDB with Docker

For local development of the Vector Database, the easiest approach is to spin up ChromaDB via Docker.

Make sure you have [Docker installed](https://docs.docker.com/get-docker/) on your system.

### Command to start ChromaDB locally:

```bash
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

This will run ChromaDB and expose it on `localhost:8000`, which the backend `vectorstore.service.ts` is configured to connect to.
