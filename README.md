# Data Confessional

**Where your data goes to tell the truth.**

A quiet workspace for turning messy CSVs, Excel exports, and URLs into honest dashboards and reports. Built with Next.js and Tauri for desktop.

## Features

- 📊 **Auto-generated dashboards** with suggested charts
- 📝 **Template-driven reports** (executive summaries, market snapshots, sales overviews)
- 💬 **AI Q&A panel** - ask questions about your data with explainable answers
- 📥 **One-click exports** (Markdown, PDF, Meeting Briefs, Speaker Notes)
- 🖥️ **Desktop app** with local Ollama engine (no API keys needed)
- 🔄 **Quick Confession Wizard** - single-screen flow from data to insights

## Quick Start

### Prerequisites

- Node.js 18+
- For desktop: [Ollama](https://ollama.com/download) and [Rust](https://rustup.rs/)

### Installation

```bash
# Clone the repository
git clone https://github.com/funwae/dataconfessional.git
cd dataconfessional

# Install dependencies
npm install

# Set up database
npm run db:generate
npm run db:push
```

### Run

**Web Mode:**
```bash
npm run dev
```
Open http://localhost:3000

**Desktop Mode:**
```bash
# First time: Install Ollama and a model pack via the setup wizard
npm run tauri:dev
```

The desktop app uses a local Ollama engine - no cloud API keys required. See `docs/engine/` for engine setup details.

## Project Structure

```
/app              Next.js pages and API routes
/components       React components
/lib              Utilities and services
/prisma           Database schema (SQLite)
/docs             Full project documentation
/src-tauri        Tauri desktop app (Rust)
```

## Core Concepts

- **Project** - A container for data, dashboards, reports, and Q&A history
- **Data Source** - Uploaded files (CSV/XLSX), URLs, or pasted text
- **Dashboard** - Auto-suggested charts with insights
- **Report** - Template-driven narratives for specific audiences
- **Q&A Panel** - Ask questions scoped to project data

## Scripts

- `npm run dev` - Start web development server
- `npm run build` - Build for production
- `npm run tauri:dev` - Run desktop app in development
- `npm run tauri:build` - Build desktop app
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run test:e2e` - Run end-to-end tests

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite (Prisma ORM)
- **Desktop**: Tauri (Rust + Web)
- **AI Engine**: Local Ollama (desktop) or configurable cloud providers (web)

## Documentation

- `/docs` - Complete project specifications
- `/docs/engine` - Local Ollama engine integration guide
- `CLEANUP.md` - Setup guide for fresh clones
- `REPOSITORY_STATUS.md` - Current repository status

## License

Private repository
