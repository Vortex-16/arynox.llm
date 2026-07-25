# 🚀 ARYNOX | AI-Powered Socratic RAG Tutor

**ARYNOX** is a cutting-edge, course-aware education platform designed to provide college students with 24/7 academic support through a **Socratic AI Tutoring** system. Instead of simply giving answers, ARYNOX guides students through their course materials using hints, source page citations, and inquiry-based learning while preserving strict academic integrity.

---

## 📚 Project Documentation

Additional architectural documents and historical logs are organized in the [`docs/`](./docs) directory:
- [📄 Project Requirements Document (PRD)](./docs/PRD.md)
- [🐛 System Audit & Remediation Log](./docs/BUG.md)
- [🧩 Technical Challenges & Solutions](./docs/CHALLENGES.md)
- [🟢 Problem & Solution Architecture](./docs/PROBLEM_SOLVED.md)

---

## ✨ Core Features & Platform Capabilities

### 📖 High-Fidelity OCR & Ingestion
- **Multi-Format Parsing:** Support for textbook PDFs, TXT, and DOCX materials with OCR text extraction.
- **Asymmetric Vector Embedding:** Powered by NVIDIA Nemotron / Groq embeddings (`input_type` passage vs. query) for high semantic search accuracy.
- **Boot-Time File Persistence:** Uploaded files in `./uploads` and ChromaDB collections are protected from auto-deletion on server restarts.

### 🔐 Multi-Tier Role-Based Security
- **Role Detection & Auth:** Google OAuth 2.0 and JWT (JSON Web Tokens) with auto-role classification.
- **Secured Exam Mode Endpoints:** Restricted `/api/settings` mutation routes requiring verified `teacher` or `admin` authentication headers (`401 Unauthorized` for unauthenticated requests).

### 🎨 Landing Page & User Guide
- **Cinematic Auth UI:** GSAP-animated login and signup pages with Gabarito typography and glassmorphism styling.
- **Interactive Campus User Guide:** Integrated `<UserGuide />` component detailing tailored workflows for **University Admins**, **College Faculty**, and **Students**.

### 🧠 NotebookLM-Grade Socratic RAG Engine
- **Continuous Multi-Turn RAG Memory:** Chat sessions maintain full retrieval capability across follow-up queries without context loss.
- **Exact Source Citations:** Every answer references the source document and page numbers (`[Source: Lecture.pdf, Page 4]`).
- **Exam Mode Hint Enforcement:** When Exam Mode is enabled, the AI strictly provides hints and guiding questions—refusing to solve homework directly.
- **YouTube Video Integration:** Parallel search for high-ranking educational YouTube videos embedded as cards within chat responses.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, GSAP, Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express, TypeScript, Sharp, PDFKit, Server-Sent Events (SSE) |
| **Database** | MongoDB (User data & query logs), ChromaDB / Chroma Cloud (Vector Store) |
| **AI / LLM** | Groq API (LLaMA 3.1 Socratic Tutor), NVIDIA NIM (Embeddings & OCR) |
| **Authentication** | Google OAuth 2.0, JWT Tokens |

---

## 🚀 Getting Started

### 1. Installation
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arynox
JWT_SECRET=your_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GROQ_API_KEY=your_groq_api_key
NVIDIA_API_KEY=nvapi-your_nvidia_key
CHROMA_URL=http://localhost:8000
CHROMA_API_KEY=your_chroma_api_key
```

### 3. Running the Server & Client
```bash
# Terminal 1: Start Backend Server
cd server
npm run dev

# Terminal 2: Start Frontend Application
cd client
npm run dev
```

---

## 🧪 Testing & Maintenance Scripts

### 1. Run Comprehensive Live System Test Suite (Generates `Report.md`)
Run our end-to-end full-stack integration test suite to verify authentication, document upload, vector search, Exam Mode security, and continuous RAG chat:
```bash
cd server
npx ts-node src/scripts/test_live_system.ts
```
> **Output**: Automatically generates a detailed `Report.md` in the project root with pass/fail status and execution metrics.

### 2. Document & Vector Store Reset Script
To wipe legacy MongoDB document metadata and ChromaDB vector collections for a completely clean slate:
```bash
cd server
npx ts-node src/scripts/cleanup_docs.ts
```

---

## 📁 Project Structure

```text
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # UserGuide, WaterRipple, Features, CustomCursor
│   │   ├── student/        # Socratic Chat Notebook & Dashboard
│   │   ├── teacher/        # Faculty Document Management & AI Controls
│   │   └── admin/          # University Hierarchy & Settings Dashboard
├── server/                 # Express Backend (TypeScript)
│   ├── src/
│   │   ├── controllers/    # Auth, Chat, Document, Settings, Admin controllers
│   │   ├── services/       # VectorStore, LLM, Document Processing logic
│   │   └── scripts/        # test_live_system.ts, cleanup_docs.ts
├── docs/                   # Organized Documentation (PRD, BUG, CHALLENGES)
└── README.md               # Main Project Entry Document
```

---

## 🤝 Team
Developed by **Team TEKKUZEN** for FrostHacks.
