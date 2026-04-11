Arynox.LLM — Full System Architecture Review & Remediation Plan
Executive Summary
After a complete audit of the frontend (client/) and backend (server/) codebase, I have identified 5 critical bug clusters and 3 architectural design gaps that must be fixed in a specific order. The system is built on solid bones — Express + MongoDB + ChromaDB + LangChain — but has several wiring issues that cause the observed failures: login breaking, RAG returning nothing, and the ChromaDB crashing.

Bugs & Issues Found
🔴 Critical Bugs
#	Location	Bug	Impact
1	login_page/src/App.jsx:L185	Email login only fires when sprayRepeatCounter > 1 (animation gate). If the animation hasn't cycled twice, the submit call never runs.	Normal sign-in broken
2	vectorstore.service.ts:L26	ChromaDB collection is created with "dimension": 2048 but this is not a valid ChromaDB v2 API parameter — it must be set in HNSW metadata as "hnsw:space" only with a matching embedding model guaranteed to produce that exact dimension. If the NVIDIA embed model returns 4096 dim vectors (it does — llama-nemotron-embed-1b-v2 = 4096), there's a dimension mismatch crash.	RAG DB crashes after 4-5 queries
3	chat.controller.ts:L200	Promise.all() fan-out queries ALL department collections concurrently. On 4-5 queries ChromaDB gets flooded with parallel connections → ECONNREFUSED / timeout → empty results, appears to "not find anything".	"No content found" errors
4	onboarding/Onboarding.tsx:L36	Hardcoded http://localhost:5000/api/auth/onboarding instead of using the centralized API_BASE_URL from config.ts. Breaks in any non-local environment.	Onboarding fails in staging/prod
5	llm.service.ts:L96	When embedding call fails, it returns Array(2048).fill(0.0) zero-vectors as fallback. These get stored in Chroma with wrong dimension AND are semantically meaningless — every subsequent query matches them with low confidence, causing RULE 3 refusals.	Silent bad embeddings polluting RAG
🟡 Architectural Gaps
#	Issue	Description
A	No College/Department Data Model	The system has no College, Department, Course, or Batch models. Departments are just free-text strings. Admin can't add/manage BTech, MTech branches. There's no proper academic hierarchy.
B	Flat Onboarding — No Admin-Seeded Data	Students pick department from a hardcoded 4-item dropdown (CSE/IT/ECE/MECH). Admin has no way to add new departments, programs, or semesters. No relationship between admin config and what students see.
C	Admin Dashboard Has No Real Functions	The admin dashboard UI exists but has no backend connections to actually create departments, assign teachers to subjects/classes, or manage the academic calendar.
System Architecture — Target State
┌──────────────────────────────────────────────────────────────────┐
│                        ARYNOX.LLM PLATFORM                       │
├───────────────┬──────────────────┬──────────────────────────────┤
│  COLLEGE ADMIN │    FACULTY        │       STUDENT                │
│               │                  │                              │
│ + Add Dept    │ + Upload PDFs    │ + Browse Modules             │
│ + Add Programs│ + Tag Subject    │ + Chat with RAG Tutor        │
│ + Manage Users│ + View Analytics │ + See Teacher Replies        │
│ + University  │ + Respond Doubts │ + Track Progress             │
│   Overview    │                  │                              │
└───────┬───────┴────────┬─────────┴─────────────┬────────────────┘
        │                │                         │
        ▼                ▼                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express + TS)                       │
│                                                                  │
│  Auth Routes        User/Faculty Routes    Admin Routes          │
│  /api/auth/*        /api/users/*           /api/admin/*          │
│                                                                  │
│  Document Routes    Chat Routes            Analytics Routes      │
│  /api/documents/*   /api/chat/*            /api/analytics/*      │
│                                                                  │
│              ┌─────────────┐  ┌──────────────┐                  │
│              │  MongoDB    │  │  ChromaDB    │                  │
│              │             │  │  (Vector DB) │                  │
│              │ User        │  │              │                  │
│              │ Department  │  │  Per-subject │                  │
│              │ DocumentMeta│  │  collections │                  │
│              │ QueryLog    │  │              │                  │
│              │ ChatSession │  │  Fixed dims  │                  │
│              └─────────────┘  └──────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
User Review Required
IMPORTANT

Embedding Dimension: The Root Cause of ChromaDB Crashes The NVIDIA model nvidia/llama-nemotron-embed-1b-v2 outputs 4096-dimensional vectors (confirmed by NVIDIA docs), but the ChromaDB collection is being created with dimension: 2048. This is a hard mismatch. All existing ChromaDB data must be deleted and re-indexed after the fix. I will handle this in the plan.

WARNING

Admin Registration: Currently, there is no way to register as admin. The role can only be set manually in MongoDB. Should I add a protected admin-creation endpoint (/api/auth/admin-register with a secret key), or will you manage admin accounts manually?

CAUTION

Existing ChromaDB Data: The fix to dimension mismatch requires wiping my_local_chroma_data/ and re-uploading all documents. Any previously uploaded PDFs must be re-uploaded through the Teacher Dashboard after the fix.

Proposed Changes — Step by Step
Phase 1 — Critical Bug Fixes (Immediate Stability)
[MODIFY] server/src/services/vectorstore.service.ts
Fix 1: Correct ChromaDB collection dimension from 2048 → 4096

Change "dimension": 2048 to "dimension": 4096 in collection creation metadata
Add collectionIdCache invalidation on collection recreation error to prevent stale cache
[MODIFY] server/src/services/llm.service.ts
Fix 2: Remove zero-vector fallback that pollutes RAG

When embedding API fails, throw an error instead of returning zero-vectors
The calling code in document.service.ts will catch it and halt the upload gracefully
The calling code in chat.controller.ts will catch it and return a clear error message
[MODIFY] server/src/controllers/chat.controller.ts
Fix 3: Throttle ChromaDB fan-out queries (serial, not all-parallel)

Replace Promise.all() fan-out with a sequential loop over collections with a small delay OR limit concurrent queries to max 3 at a time using a concurrency limiter
This directly fixes the "4-5 questions → DB crashes" behaviour
Increase nResults from 5 to 8, improve confidence threshold logic
[MODIFY] client/src/login/login_page/src/App.jsx
Fix 4: Remove animation gate blocking email login

The onSubmitClick handler currently requires sprayRepeatCounter > 1 (animation must cycle twice) before the API call fires. This is an accidental UI lock.
Change condition: validate form fields properly (non-empty email/password) instead of relying on animation counter
Keep the animation, but decouple it from the submit logic
Add proper error display (not just alert())
[MODIFY] client/src/onboarding/Onboarding.tsx
Fix 5: Replace hardcoded localhost URL with config

Replace http://localhost:5000/api/auth/onboarding with ${API_BASE_URL}/api/auth/onboarding
Import API_BASE_URL from ../config
Phase 2 — Database Architecture (Academic Hierarchy)
[NEW] server/src/models/Department.ts
New model to replace free-text department strings:

Department {
  name: string (e.g. "Computer Science")
  code: string (e.g. "CSE") — unique key
  programs: [{ name: string, type: "BTech"|"MTech"|"PhD", totalSemesters: number }]
  isActive: boolean
}
[NEW] server/src/models/Subject.ts
New model for subject-level registry:

Subject {
  name: string (e.g. "Data Structures")
  code: string (e.g. "CS301")
  departmentCode: string
  program: string (e.g. "BTech")
  semester: number (e.g. 3)
  assignedTeacherId?: string
}
[MODIFY] server/src/models/User.ts
Replace free-text department string → store department as the Department code (already compatible)
Add program?: string field for students (e.g. "BTech")
Add rollNumber?: string for students (optional, for institutional use)
Add employeeId?: string for faculty
No breaking changes to existing fields
Phase 3 — Admin Routes & Controller
[NEW] server/src/controllers/admin.controller.ts
Complete admin controller covering:

getDepartments() — list all departments
createDepartment() — create a new dept + programs
updateDepartment() — update programs/semesters
deleteDepartment() — soft delete
assignTeacherToSubject() — link a teacher to a subject ID
getUniversityStats() — merged from current analytics (already exists)
promoteStudentSemester() — bump a student's semester by 1 (or set explicitly)
bulkUpdateStudentSemester() — bump all students in a dept+program+year
[NEW] server/src/routes/admin.routes.ts
All routes behind authenticate + requireRole('admin'):

GET /api/admin/departments
POST /api/admin/departments
PUT /api/admin/departments/:code
DELETE /api/admin/departments/:code
GET /api/admin/subjects
POST /api/admin/subjects
PUT /api/admin/subjects/:id
PUT /api/admin/students/:id/promote — semester promotion
GET /api/admin/stats (moved from analytics)
[MODIFY] server/src/index.ts
Register /api/admin route group
Phase 4 — Frontend Fixes (Onboarding + Admin Dashboard)
[MODIFY] client/src/onboarding/Onboarding.tsx
Fetch departments dynamically from /api/admin/departments instead of the hardcoded 4-option dropdown
Faculty onboarding: fetch available subjects for their department and let them multi-select
Student onboarding: show programs (BTech/MTech) dynamically based on selected department
[MODIFY] client/src/admin/admin_dashboard.tsx
Connect the (already visually built) admin dashboard to the new backend:

University Overview Tab: wire to /api/admin/stats
Department Management Tab: CRUD for departments and programs
Subject Registry Tab: CRUD for subjects, assign teachers per subject
Student Management Tab: view students by dept/program/semester, promote semesters
Faculty Registry Tab: already partially wired, complete it
Phase 5 — RAG Pipeline Hardening
[MODIFY] server/src/services/document.service.ts
Add pre-check before storing: verify embedding dimension matches expected (4096)
Add chunk deduplication check: prevent re-uploading same document title to same collection
Improve page detection regex (it currently uses a fragile first-30-chars match)
[MODIFY] server/src/controllers/document.controller.ts
Validate that subject and department are non-empty before upload (required for proper collection routing)
Return a 400 error if they're missing instead of silently falling back to college_documents
[MODIFY] server/src/services/vectorstore.service.ts
Add collection health check: verifyCollectionDimension() — returns true if existing collection dimension matches current embedding model
Auto-recreate collection if dimension mismatch detected (with warning log)
Add retry logic (3 attempts, 500ms backoff) for ChromaDB API calls
Verification Plan
Automated / Manual Tests
Login flow: Register a new user with email/password → verify redirect to onboarding → complete onboarding → verify redirect to correct dashboard (student/teacher)
Google login: Verify Google OAuth still works end-to-end
Document upload: Upload a PDF as teacher → check console logs confirm correct ChromaDB collection name → check MongoDB DocumentMeta record
RAG chat: Ask 10 consecutive questions on an uploaded document → verify no crashes, responses are grounded in document citations
Admin flow: Log in as admin → create a department → create a subject → assign teacher → verify student onboarding shows new department
Build Checks
cd server && npm run build — zero TypeScript errors
cd client && npm run build — zero build errors
Execution Order (Critical Path)
Phase 1 (Bug Fixes) → Phase 2 (DB Models) → Phase 3 (Admin Backend)
     → Phase 4 (Frontend Fixes) → Phase 5 (RAG Hardening)
Total estimated changes: ~15 files modified, 4 files created

