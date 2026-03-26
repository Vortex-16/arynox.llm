# 🚀 ARYNOX | AI-Powered Socratic RAG Tutor

**ARYNOX** is a cutting-edge education platform designed to provide students with 24/7 academic support through a **Socratic AI Tutoring** system. Instead of simply giving answers, ARYNOX guides students through their course materials using hints and inquiry-based learning, ensuring academic integrity and deeper understanding.

---

## ✨ Features

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

### 📚 Adaptive Learning (Backend Engine Completed)
- **Socratic Engine:** Uses RAG (Retrieval Augmented Generation) configured with Groq LLaMA 3.1 to answer strictly from uploaded course materials.
- **NVIDIA Fallback Matrix:** Achieves 99.9% AI uptime by automatically failing over to the `nvidia/nemotron-3-super-120b-a12b` enterprise model if rate limits hit.
- **NotebookLM Relevancy:** Pre-flight classifier blocks non-academic jailbreak attempts.
- **Teacher Forwarding Loop:** Out-of-scope academic questions are intercepted and logged for manual faculty review on the dashboard.
- **Faculty Dashboard Pipeline:** API active for PDF/TXT uploads, automatic chunking, NVIDIA vector embeddings, and ChromaDB localized storage.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, GSAP, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB (User data & Logs), ChromaDB (Embeddings) |
| **AI/LLM** | Groq API / NVIDIA NIM |
| **Auth** | Google OAuth 2.0, JWT (JSON Web Tokens) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Local or Atlas)
- **Google Cloud Console Account** (for OAuth Client IDs)

### 2. Installation
Clone the repository and install dependencies for both client and server:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Environment Setup
Create a `.env` file in both `client/` and `server/` directories.

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

**`client/.env`**
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
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
│   │   ├── login/          # Animated Auth Components
│   │   ├── student/        # Student Dashboard & Chat
│   │   ├── teacher/        # Faculty Dashboard
│   │   └── assets/         # Fonts (Aquire) & Branding
├── server/                 # Express backend (TypeScript)
│   ├── src/
│   │   ├── controllers/    # Auth & RAG Logic
│   │   ├── models/         # Mongoose Schemas (User, Logs)
│   │   ├── routes/         # API Endpoints
│   │   └── services/       # LLM & ChromaDB integration
└── PRD.md                  # Project Requirements Document
```

---

## 🤝 Contribution
Developed by **Team TEKKUZEN** for FrostHacks.
