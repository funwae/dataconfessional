# 07 – Architecture and Tech Stack

## 7.1 Overview

MVP can be built as:

- **Next.js** full-stack app
  - React frontend
  - Next API routes as backend
- Postgres as primary DB
- S3-compatible object storage for files
- Optional vector DB (pgvector extension on Postgres)

---

## 7.2 Components

1. **Frontend (Next.js + React + Tailwind)**
   - Pages:
     - `/projects`
     - `/projects/[id]/data`
     - `/projects/[id]/dashboard`
     - `/projects/[id]/reports`
   - Components:
     - ProjectList
     - DataSourceManager
     - DashboardGrid
     - ReportEditor
     - AIChatPanel

2. **Backend API**
   - REST or RPC-like endpoints via Next API routes.
   - Responsible for:
     - Auth
     - Projects CRUD
     - Data source ingestion
     - Chart suggestion
     - Report generation
     - Q&A

3. **Background Jobs (optional)**
   - For large files / heavy processing.

4. **LLM Service Layer**
   - Wrap external LLM providers
   - Provide typed functions for various tasks.

---

## 7.3 Tech Choices

- Language: TypeScript end-to-end.
- Framework: Next.js
- Styling: Tailwind CSS
- Charts: Recharts or similar.
- DB: Postgres + Prisma ORM
- Object Storage: S3 or compatible.
- LLM: Configurable (e.g., OpenAI / Anthropic / Z.AI).

---

## 7.4 Deployment

- Recommended: Vercel + managed Postgres (e.g., Supabase or Neon).
- Object storage via AWS S3 or compatible.

---

## 7.5 High-Level Diagram (Conceptual)

- Browser (React app)
  - ↔ Next.js API routes
    - ↔ Postgres (projects, data models)
    - ↔ Object storage (files, exports)
    - ↔ LLM provider
    - ↔ Vector DB / embeddings (optional)

