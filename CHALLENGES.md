# Technical Challenges & Triumphs: ARYNOX Deployment

Building and containerizing a full-stack, AI-powered platform like Arynox presented numerous hurdles. Here's how we solved them:

### 🐳 1. "Unified" Multi-Stage Containerization
**Problem**: We needed to run a React frontend (Vite), a TypeScript backend (Node.js/Express), and a Python-based Vector Database (ChromaDB) all within a single container for a "one-click" deployment on Render.
**Solution**: We built a complex multi-stage `Dockerfile` with three distinct builders. The final stage uses a `start.sh` entrypoint that launches ChromaDB as a background service and monitors it before starting the Express server.

### 🧩 2. Native Module Compilation (`bcrypt`, `g++`)
**Problem**: The `bcrypt` library (used for secure passwords) failed to load inside the Linux container because it's a native module requiring compilation.
**Solution**: We upgraded the Docker builder stage to include `python3`, `make`, and `g++`, ensuring that all native platform dependencies are correctly compiled for the `bookworm-slim` environment.

### 🗄️ 3. Self-Healing Database Index Stale
**Problem**: We hit a "Duplicate Key Error" (E11000) on the `googleId: null` index. This was a "stale" index in the MongoDB Atlas cluster that didn't allow multiple email/password users.
**Solution**: We implemented a **self-healing script** in `index.ts`. At startup, the server automatically identifies and drops the conflicting index, allowing Mongoose to rebuild it with the correct `sparse: true` flag.

### 🎨 4. Video "Blob" Transparency (Theming)
**Problem**: The `.mov` feature videos (blobs) had black backgrounds that didn't match our vibrant Red/Teal UI.
**Solution**: We used `mix-blend-mode: screen` and applied CSS filters (`brightness-150 contrast-125`) to "crush" the blacks and make the glowing blobs 100% transparent and vibrant against any background.

### 🔗 5. Hardcoded Port & URL Decoupling
**Problem**: Several fetch calls were hardcoded to `http://localhost:5000`, which breaks when running in a production container on a remote host (or behind a proxy).
**Solution**: We audited the codebase (including specialized login/signup pages) and replaced all absolute URLs with **relative API paths**, ensuring seamless frontend-to-backend communication regardless of the environment.

### 🕵️ 6. Intelligent Search Routing (Fuzzy Years)
**Problem**: Teachers often upload documents with inconsistent names (e.g., "3rd Year" vs "Third Year"), causing them to become invisible to students.
**Solution**: We implemented a **regex-based fuzzy filter** in the `getDocuments` controller that automatically maps synonymous year formats and ensures case-insensitivity.
