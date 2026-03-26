# 📄 PRD: AI-Powered RAG Tutor for College Courses

## 1. Project Identity
- **Team Name:** TEKKUZEN
- **Project Title:** AI-Powered RAG Tutor for College Courses
- **Theme:** EDUCATION
- **Core Philosophy:** Preserving academic integrity via Socratic guidance rather than direct answers.

---

## 2. Problem Statement
- Students often use general AI tools that provide incorrect answers or solve homework directly, which hinders actual learning.
- There is a lack of "course-aware" tools restricted only to approved lecture materials.
- Faculty face repetitive questions and a high workload for doubt resolution.

---

## 3. The Solution: "Blueprint of Brilliance"
A three-tier system designed to automate academic support while maintaining strict pedagogical standards:

1. **Faculty Document Onboarding:** A dashboard for uploading PDF/TXT materials, which are parsed, chunked, and stored as embeddings.
2. **Student RAG Interaction:** A chat interface where an LLM (via Groq API) acts as a Socratic tutor.
3. **Analytics & Feedback Loop:** An anonymized logging service to provide faculty with insights into student confusion.

---

## 4. Technical Requirements ("The Arsenal")

| Component          | Technology                                             |
| ----------------- | ------------------------------------------------------ |
| **Frontend**       | React (Dashboard UI & Chat UI)                         |
| **Backend**        | Node.js + Express                                      |
| **LLM / Embeddings** | Groq API                                             |
| **Vector Database** | ChromaDB                                              |
| **Parsing**        | LangChain & OpenCV (for OCR/Image Extraction)         |
| **Database**       | MongoDB (for query logs and analytics)                |
| **Deployment**     | Docker                                                 |

---

## 5. Functional Requirements

### 5.1 Data Ingestion (Hours 1–6)
- **PDF Parsing:** Extract text and images from uploaded materials using OpenCV to handle noisy OCR from scanned documents.
- **Embedding Generation:** Convert text chunks into vectors using the Groq API.
- **Storage:** Store embeddings and metadata (page numbers, source titles) in ChromaDB.

### 5.2 Socratic RAG Engine (Hours 7–15)
- **System Prompt:** "You are a Socratic tutor. Use ONLY the provided context. Do not give direct answers, ask guiding questions. Include citations."
- **Semantic Search:** Retrieve the Top-K relevant context blocks from ChromaDB based on student queries.
- **Integrity Checks:** Implement a confidence-based refusal system to prevent answering out-of-scope questions.

### 5.3 UI & Analytics (Hours 16–25)
- **Student Interface:** A real-time chat UI displaying source-cited responses.
- **Faculty Dashboard:** Visualizations for common student queries and topic modeling.
- **Security:** Department-wise content isolation and student privacy in logs.

---

## 6. Strategic Solutions for Challenges
- **Noisy OCR:** Preprocess pages using OpenCV before extraction.
- **Hallucinations:** Use strict RAG-based context filtering and require source citations for every answer.
- **Slow Responses:** Cache frequent queries and utilize the high-speed Groq API.
- **Bypassing Rules:** Implement an "Exam Mode" lock that strictly limits the AI to hints only.

---

## 7. Target Impact
- **24/7 Support:** Faster doubt resolution without teacher overload.
- **Integrity:** Improved learning quality by guiding students instead of giving answers.
- **Inclusivity:** Multilingual support for Indian students and affordable tools for rural colleges.

---

## 🛠️ Next Steps for the Team
To hit your 30-hour deadline, immediate responsibilities can be split as follows:

- **Backend Lead:** Set up the Node.js/Express environment and MongoDB connection.
- **AI Engineer:** Initialize ChromaDB and test the Groq API embedding call.
- **Data Specialist:** Finalize the OpenCV parsing script for PDF ingestion.
- **Frontend Lead:** Build the React Chat UI skeleton.

## TimeLine
Timeline,Milestone,Key Deliverable
Hours 1-6,The Data Pipe,Successful PDF upload -> Parsing -> ChromaDB storage.
Hours 7-12,The Brain,Socratic Prompting logic active via Groq API; Retrieval working.
Hours 13-20,The Full Loop,React UI connected to Backend; Citations appearing in chat.
Hours 21-26,Insights & Auth,MongoDB analytics dashboard for faculty; Department isolation.
Hours 27-30,Polish & Pitch,"Bug fixing, Dockerizing, and preparing the demo video."

