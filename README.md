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
- **Socratic Engine:** Uses RAG (Retrieval Augmented Generation) configured with Groq LLaMA 3.1 to answer strictly from uploaded course materials.
- **Intelligent Fallback:** If course material doesn't contain the answer, ARYNOX provides a general academic explanation with a "Faculty response pending" disclaimer.
- **ChromaDB REST Integration:** Bypasses unreliable library wrappers for direct, high-performance REST interaction with 2048-dimension vector support.
- **Teacher Forwarding Loop:** Out-of-scope academic questions are intercepted and logged for manual faculty review on the dashboard.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, GSAP, Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express, TypeScript, Sharp (Image processing) |
| **Database** | MongoDB (User data), ChromaDB (Vector store via REST API) |
| **AI/LLM** | NVIDIA NIM (Nemotron-OCR, Nemotron-3 Chat, Llama-Embed), Groq API |
| **Auth** | Google OAuth 2.0, JWT (JSON Web Tokens) |

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
│   │   ├── services/       # OCR, VectorStore, LLM logic
│   │   ├── controllers/    # RAG & Document orchestration
│   │   └── routes/         # Backend API Map
└── PRD.md                  # Project Requirements Document
```

---

## 🤝 Contribution
Developed by **Team TEKKUZEN** for FrostHacks.
