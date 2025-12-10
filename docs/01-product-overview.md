# 01 – Product Overview

## 1.1 Elevator Pitch

**Data Nexus** is a **data-to-insight workspace** for business users.

It turns mixed, messy inputs (spreadsheets, URLs, PDFs, pasted text) into:

- Auto-generated **dashboards**
- Structured **reports** (market research, sales summaries, marketing performance)
- A **"chat with your data"** panel
- Exports (PPTX, PDF, Markdown) that executives will actually read

The differentiation: **opinionated templates**, not a blank chat window.

---

## 1.2 Problem

- Business stakeholders have data but:
  - Hate living in Excel
  - Don't grok BI tools
  - Don't have time to prompt-engineer LLMs

- Analysts and consultants:
  - Spend 70–80% of their time wrangling data and formatting decks.
  - Struggle to keep deliverables consistent.

---

## 1.3 Solution

Data Nexus provides:

1. **Projects**
   - Containers for a specific question or initiative.
   - Encapsulate data sources, dashboards, reports, and Q&A history.

2. **Template-driven reports**
   - Market Snapshot, Sales Overview, Marketing Performance, and General Analysis.
   - Tuned to audience: individual, manager, executive.

3. **Guided dashboards**
   - The system profiles data and suggests relevant charts automatically.

4. **AI Q&A with explainability**
   - Answers scoped to the project.
   - Always returns:
     - Direct answer
     - Supporting metrics/charts
     - Caveats

5. **Exports**
   - Turn the working space into:
     - Decks
     - Executive summaries
     - Detailed reports
     - Markdown for knowledge bases

---

## 1.4 Non-Goals (for MVP)

- Replacing full BI stacks (Looker, Tableau).
- Real-time streaming dashboards.
- Heavy-duty data cleaning pipelines.
- Complex user/role hierarchies (beyond basic workspace roles).

These can come later.

---

## 1.5 Success Criteria for MVP

- A single user can:
  - Create a project
  - Upload at least 1–3 CSV/XLSX files
  - Paste at least 1 URL
  - Generate a first-pass dashboard + report in under 2 minutes
  - Ask questions and get **reasonably accurate** answers referencing data
  - Export a PPTX or PDF that looks coherent and themed

- Subjective:
  - "This saves me real time vs my normal workflow."
  - "I can send this deck to my boss without embarrassment."

