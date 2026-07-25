# Arynox.LLM — System Audit & Remediation Log

This document records historical bug audits, root cause analyses, and completed fixes for the ARYNOX platform.

## Resolved Bug Clusters
1. **Login Animation Gate**: Email login handler decoupling from animation frame counter in `App.jsx`.
2. **ChromaDB Dimension Handling**: Vector collection creation aligned with embedding model dimensions.
3. **Throttled ChromaDB Fan-Out**: Serial/throttled collection querying replacing concurrency overload.
4. **Environment API URLs**: Hardcoded localhost references replaced with central `API_BASE_URL` config.
5. **Zero-Vector Embedding Guard**: Embedding API failures raise errors rather than polluting vector stores with zero-vectors.

## DB Models & Architecture
- **Department**: Unique dept code, name, and programs (B.Tech, M.Tech, MCA).
- **Subject**: Code, name, department link, semester, and assigned faculty.
- **User**: Enhanced role attributes for student roll numbers and faculty employee IDs.
