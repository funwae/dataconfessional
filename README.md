# Data Confessional

**Where your data goes to tell the truth.**

Data Confessional is a quiet workspace where you bring in messy CSVs, Excel exports, and stray links, and walk out with dashboards and reports that actually tell the truth.

It lets you:

- Upload raw data (CSV/XLSX), paste URLs and text
- Auto-generate **dashboards** and **structured reports**
- Interview your data with natural-language questions
- Export **executive summaries, decks, and briefings** in one click

The focus is *not* to be another generic "LLM over a CSV", but a **calm, honest workspace** for turning data into stories:

- Projects (confessions) encapsulate data, dashboards, and narratives
- Report templates encode *how* to talk about data for specific audiences
- AI is constrained to project scope and explains what it used

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database

The app uses SQLite by default (no setup required for desktop builds). For web mode:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates SQLite file automatically)
npm run db:push

# Seed with default user (optional)
npm run db:seed
```

The database file will be created automatically at `prisma/data-confessional.db` (web) or in `%APPDATA%\DataConfessional\` (desktop).

See `DATABASE_SETUP.md` for detailed instructions.

### 3. Run Development Server

**Web Mode:**
```bash
npm run dev
```
Then open http://localhost:3000 - **no login required!**

**Desktop Mode (Tauri):**
```bash
# First time: Install Ollama from https://ollama.com/download
# Then run:
npm run tauri:dev
```

The desktop app uses a local Ollama engine - see `docs/engine/` for setup details.

### 4. Run E2E Tests
```bash
npm run test:e2e
```

---

## No Authentication Required!

The app uses a default user automatically - just start using it! No login needed.

---

## Core Concepts

- **Project (Confession)**
  A named container: "Q1 EU SaaS Pipeline", "US EV Charging – Market Scan".
  Holds data sources, dashboards, reports, and chat history. Each project is a quiet room where a specific question gets honest answers.

- **Data Source**
  What you brought in: uploaded files, URLs, or pasted text. Normalized to:
  - Tabular tables (rows/columns)
  - Text documents (chunks from PDFs/HTML/etc.)

- **Dashboard**
  What the data is starting to say: auto-suggested charts with honest commentary.

- **Report (Briefing)**
  A template-driven narrative (executive summary, market research report, etc.) that turns what the data said into something you can say out loud.

- **Interview Panel (Q&A)**
  Ask what the data has been hiding. Always scoped to the current project's data, responds with:
  - Confession (direct answer)
  - Evidence (supporting figures/charts)
  - Caveats (gaps and uncertainties)

See `/docs` for detailed specs.

---

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and services
- `/prisma` - Database schema
- `/docs` - Project documentation
- `/e2e` - End-to-end tests

---

## Scripts

- `npm run dev` - Start development server (web mode)
- `npm run build` - Build for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Create default user
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run tests with Playwright UI
- `npm run tauri:dev` - Run desktop app in development
- `npm run tauri:build` - Build desktop app

---

## Environment Variables

For web mode, create a `.env` file (optional - SQLite works without it):
```env
DATABASE_URL="file:./prisma/data-confessional.db"
```

**Note:** Desktop builds use local Ollama engine - no API keys needed! See `docs/engine/` for engine setup.
