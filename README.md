# 🚀 ARYNOX | AI-Powered Socratic RAG Tutor

**ARYNOX** is a cutting-edge education platform designed to provide students with 24/7 academic support through a **Socratic AI Tutoring** system. Instead of simply giving answers, ARYNOX guides students through their course materials using hints and inquiry-based learning, ensuring academic integrity and deeper understanding.

---

## ✨ Features

### 📖 High-Fidelity OCR & Ingestion (New!)
- **NVIDIA Nemotron-OCR Engine:** Custom pipeline to extract text from scanned, image-heavy, and complex textbooks with 99.9% accuracy.
- **Hybrid Extraction Strategy:** Automatically detects if a PDF is digital (using `pdf2json`) or scanned (falling back to Nemotron-OCR) to optimize speed and cost.
- **Adaptive Image Processing:** Utilizes `sharp` for PNG-to-JPEG compression to maintain high-resolution text clarity while staying within NVIDIA's 180KB API limits.
- **Asymmetric Embedding:** Powered by `nvidia/llama-nemotron-embed-1b-v2` with specialized `input_type` (passage/query) for superior semantic search.

### 🔐 Smart Authentication
- **Google OAuth Integration:** Secure and seamless sign-in using Google accounts.
- **Automated Role Detection:** 
  - **Teachers:** Emails without numbers (e.g., `professor.hicks@aot.edu.in`) are automatically granted Faculty status.
  - **Students:** Emails containing numeric values (e.g., `student123@stcet.ac.in`) are assigned the Student role.
- **Role-Based Redirection:** Automatic routing to Teacher or Student dashboards based on user intent and email.

### 🎨 Premium User Experience
- **Cinematic Auth UI:** Highly animated login and signup pages powered by **GSAP**.
- **Dynamic Image Slider:** 3D-feeling tech visuals that rotate automatically.
- **Custom Aesthetic:** Premium typography (using the *Aquire* font) and smooth glassmorphism effects.

### 📚 Adaptive Learning & RAG
- **Socratic Engine:** Uses RAG (Retrieval Augmented Generation) configured with Groq LLaMA 3.1 to guide students through uploaded course materials using inquiry-based learning.
- **Absolute Context Lock (`STRICT CONTEXT-ONLY` mode):** The AI operates under a strict rule-set — it has no access to pre-trained knowledge. All responses must be grounded in the retrieved context blocks from uploaded documents.
- **Topic-Level Verification:** Before every response, the AI verifies that the retrieved context covers the general topic being discussed — refusing cleanly if the context is completely unrelated.
- **No Context Leaking:** The AI never reproduces raw context block text in its replies. Students always see natural conversation, not document dumps.
- **ChromaDB REST Integration:** Bypasses unreliable library wrappers for direct, high-performance REST interaction with 2048-dimension vector support.
- **Teacher Forwarding Loop:** Unanswerable queries are flagged as `UNANSWERED_FORWARDED` and surfaced in the faculty dashboard for manual review.

### 🧠 Conversation Intelligence
- **Context-Aware Vector Search:** For follow-up messages (e.g., `"i forgot"`, `"2n"`, `"go on"`), the system enriches the embedding query with the last 3 conversation turns — ensuring short replies still find the right course documents in ChromaDB instead of triggering a false refusal.
- **Continuous Session Memory:** Full conversation history is stored per-session in MongoDB and injected into every LLM call, enabling coherent multi-turn Socratic dialogue.
- **Smart Follow-Up Detection:** Academic relevance classification is skipped for active sessions — mid-conversation replies are always treated as in-scope, saving a full LLM round-trip per message.
- **Conversation-Aware Topic Check:** The mandatory pre-response check passes recent conversation history to the LLM, allowing it to correctly evaluate short follow-up replies in context rather than as standalone queries.

### ⚙️ Faculty AI Controls
- **Exam Mode:** Restricts the AI to Socratic guiding questions only — no explanations, no confirmations, no direct answers. Questions must stay within the topic area covered by the uploaded context.
- **Normal Mode:** AI guides students progressively, confirming correct answers and providing increasing clarification across follow-up turns.
- **AI Scope Confidence Slider:** Controls the minimum retrieval confidence required before the AI attempts an answer.
  - Range: `0.1` (High Sensitivity — only answers on very precise matches) → `0.9` (Strict — answers even on loose contextual matches)
  - Default: `0.45` (balanced)
  - Maps directly to the ChromaDB cosine distance threshold. Lower values = tighter match required = fewer false-positive context retrievals.

### 🎬 YouTube Video Recommendations
- **Automatic Video Search:** When a student asks for a video or tutorial (e.g., *"show me a video on Dijkstra's algorithm"*), the system automatically searches YouTube.
- **Ranked by Quality:** Candidate videos are ranked using a composite score: `views × 0.6 + likes × 0.4` to surface the most popular and well-received content.
- **Rich Video Card:** Results are displayed as an embedded card in the chat — showing the thumbnail, title, channel, view/like counts, and a direct Watch on YouTube link.
- **Non-blocking:** The YouTube search runs in parallel with the LLM call, adding zero latency to the chat response.

---

## 🔍 AI Behaviour Reference

| Scenario | Exam Mode ON | Exam Mode OFF |
| :--- | :--- | :--- |
| Topic found in course materials | Socratic questions only — no confirmations, no hints beyond the context | Guiding questions → progressively confirms correct answers |
| Topic NOT in materials | Hard refusal → forwarded to faculty | Same hard refusal |
| Short follow-up (`"i forgot"`, `"2n"`) | Continues conversation using enriched context search | Continues conversation using enriched context search |
| Video request (`"show me a tutorial on..."`) | Finds & embeds best YouTube video | Finds & embeds best YouTube video |
| Off-topic / spam (new session only) | Rejected at academic relevance check | Rejected at academic relevance check |
| Raw context blocks shown to student | Never — RULE 6 prevents leaking | Never — RULE 6 prevents leaking |

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, GSAP, Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express, TypeScript, Sharp (Image processing) |
| **Database** | MongoDB (User data), ChromaDB (Vector store via REST API) |
| **AI/LLM** | NVIDIA NIM (Nemotron-OCR, Nemotron-3 Chat, Llama-Embed), Groq API |
| **Auth** | Google OAuth 2.0, JWT (JSON Web Tokens) |
| **Video** | YouTube Data API v3 |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Local or Atlas)
- **ChromaDB** (Running locally on port 8000)
- **NVIDIA NIM API Key** (for OCR & Embeddings)

### 2. Installation
Clone the repository and install dependencies:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Environment Setup
Create a `.env` file in the `server/` directory:

**`server/.env`**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GROQ_API_KEY=your_groq_api_key
NVIDIA_API_KEY=nvapi-your_nvidia_nim_key
CHROMA_URL=http://localhost:8000
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

### 4. Running the Project
Open two terminals:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

---

## 📁 Project Structure

```text
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── student/        # Socratic Notebook & Analytics
│   │   ├── teacher/        # Faculty Document Management
│   │   └── components/     # Reusable UI primitives
├── server/                 # Express backend (TypeScript)
│   ├── src/
│   │   ├── services/       # OCR, VectorStore, LLM, YouTube logic
│   │   │   ├── llm.service.ts        # Groq/NVIDIA LLM + embeddings + system prompt
│   │   │   ├── youtube.service.ts    # YouTube Data API v3 search & ranking
│   │   │   └── vectorstore.service.ts
│   │   ├── controllers/    # RAG & Document orchestration
│   │   └── routes/         # Backend API Map
└── PRD.md                  # Project Requirements Document
```

---

## 🤝 Contribution
Developed by **Team TEKKUZEN** for FrostHacks.
