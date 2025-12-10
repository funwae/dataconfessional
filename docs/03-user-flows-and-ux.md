# 03 – User Flows and UX

## 3.1 High-Level Screens

1. Login / Workspace selection (MVP can be simple or stubbed)
2. Project list
3. Project detail:
   - Data Sources tab
   - Dashboard tab
   - Reports tab
   - AI Q&A side panel
4. Export wizard

---

## 3.2 Flow: Create a New Project

1. User clicks **"New Project"**.
2. Modal/wizard:
   - Project name
   - Goal:
     - Market Snapshot
     - Sales Overview
     - Marketing Performance
     - General Analysis
   - Audience:
     - Self
     - Manager / Director
     - Executive / External
3. On submit:
   - Project created
   - Redirect to **Data Sources** tab with upload prompts

---

## 3.3 Flow: Add Data Sources

**Data Sources tab UI**

- Big drop zone:
  - "Upload CSV or Excel"
  - "Paste URL"
  - "Paste text"
- List of existing sources:
  - Name
  - Type (CSV, XLSX, URL, Text)
  - Status (Processed / Error)
  - "View summary" link

**On upload**

1. File sent to backend.
2. Backend:
   - Detects tabular sheets
   - Determines column types, simple stats
3. UI shows:
   - Preview (first N rows)
   - Auto-detected info:
     - Row count
     - Date coverage
     - Key metrics (min/max/avg for numeric columns)

---

## 3.4 Flow: Generate Dashboard & Report

On **Dashboard tab**:

1. If no charts yet:
   - Show **"Generate Initial Dashboard & Report"** CTA.
2. On click:
   - Backend generates:
     - Suggested chart configs
     - Dashboard layout
     - Report outline and initial content
3. UI:
   - Render charts in a grid layout
   - Each chart card:
     - Title
     - Short text insight
     - "Edit" / "Pin" / "Remove" actions

On **Reports tab**:

- Left: outline tree
- Right: selected section content
- User can:
  - Edit headings
  - Regenerate a section with "Regenerate using different angle"
  - Change tone (technical vs executive).

---

## 3.5 Flow: Ask AI Questions

AI Q&A panel is visible on Dashboard and Reports tabs.

- Input box: "Ask a question about this project…"
- Options:
  - Dropdown to constrain to:
    - "All data"
    - Specific sources
- Output:
  - Text answer
  - References:
    - "Used: Q1_sales.csv (columns: region, revenue), deals_2025.csv"
  - Optional: links to relevant charts

Preset buttons:

- "Summarize this dashboard"
- "Find anomalies"
- "What are the key risks?"

---

## 3.6 Flow: Export

From Reports tab or a global **Export** button:

1. User clicks **"Export"**.
2. Modal:
   - Type:
     - Executive Summary (PDF, 1–3 pages)
     - Slide Deck (PPTX, 10–12 slides)
     - Full Report (PDF or DOCX)
     - Markdown
   - Options:
     - Include charts? (checkbox)
     - Include appendix tables? (checkbox)
3. On submit:
   - Backend generates export
   - Stores export record
4. UI:
   - Shows list of past exports with:
     - Name, timestamp, type, download link

