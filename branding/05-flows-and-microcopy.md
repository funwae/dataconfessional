# Data Confessional – Flows and Microcopy

## 1. New Project Flow

**Step 1 – Start**

- Button on project list: **Begin a new confession**

**Modal title:**

> Start a new confession

**Fields and labels:**

- "Project name"

  - Placeholder: "Q1 sales review – North America"

- "What question are you exploring?"

  - Placeholder: "Are we growing in the right regions and segments?"

- "Who is this for?"

  - Options:

    - "Just me"

    - "My team"

    - "Executives / clients"

**Submit button:**

- Text: **Create project**

**Success toast:**

> New confession started. Let's add some data.

---

## 2. Add Data Flow

**Section title:**

> Add data to this confession

**Upload block copy:**

- Header: "Files"

- Helper text:

  > Upload CSV or Excel files. We'll profile the columns and use them for charts and reports.

- Empty state:

  > No files yet. Drop one in to get started.

**URL block copy:**

- Header: "Links"

- Helper text:

  > Paste links to pages, articles, or docs you want the booth to read.

- Input placeholder:

  > https://…

**Text block copy:**

- Header: "Text"

- Helper text:

  > Paste any notes, transcripts, or descriptions that add context.

- Textarea placeholder:

  > Paste raw text here…

**Processing notifications:**

- "Listening to this file…"

- "This file is now part of the confession."

- "We couldn't read that one. Check the format and try again."

---

## 3. Generate Dashboard Flow

**Button:**

- Text: **Generate first dashboard**

**Confirm modal (optional):**

> We'll scan your tables and suggest charts that tell the clearest story for this project.

> You can always adjust or remove them later.

Buttons:

- Primary: **Generate dashboard**

- Secondary: **Cancel**

**Post-generation helper text:**

> These are the first charts the booth suggests.

> Pin the ones that feel most important, or ask for more detail in Q&A.

---

## 4. Generate Report Flow

**Button on Reports tab (no report yet):**

- Text: **Create first report**

**Template selection text:**

> What kind of report do you need?

Options:

- "Executive summary – short and direct"

- "Sales overview – pipeline, segments, regions"

- "Market snapshot – trends, competitors, gaps"

- "General analysis – flexible structure"

**Audience selector:**

Label: "Who will read this?"

- Options:

  - "For myself"

  - "For my manager"

  - "For executives / clients"

**Generate button:**

- Text: **Draft report**

**On success:**

> First draft ready.

> Review the sections, edit as needed, and ask follow-up questions if something doesn't feel right.

---

## 5. Q&A Flow

**Input placeholder:**

> Ask what the data has been hiding…

**Example suggestions (clickable):**

- "Summarize this project in 3 bullet points."

- "What's changed the most since last period?"

- "Where are we underperforming?"

- "What's the single chart that matters most?"

**Loading state:**

> Interviewing your data…

**No matching data scenario:**

> The booth couldn't find enough data to answer that clearly.

> Try adding more sources, or ask a narrower question.

---

## 6. Export Flow

**New export modal title:**

> Create a briefing

**Type selection labels:**

- "One-page executive summary (PDF)"

- "Slide deck (PPTX)"

- "Full report (PDF or DOCX)"

- "Markdown for docs/wikis"

**Options text:**

- Checkbox: "Include key charts"

- Checkbox: "Include appendix tables"

**Generate button:**

- Text: **Create briefing**

**Success message:**

> Your briefing is ready.

> Download it now or come back to it anytime from the Exports tab.

---

## 7. Errors and Edge Cases

**File too large:**

> This file is bigger than we can safely handle right now.

> Try trimming it down or splitting it into a few smaller files.

**Unsupported format:**

> That format doesn't look familiar.

> Try exporting it as CSV or Excel and uploading again.

**No charts possible:**

> The data doesn't have enough numeric or time-based columns to build charts yet.

> Add more structured data, or focus on text-based reports.

**LLM / AI error:**

> The booth had trouble drafting that answer.

> Try again in a moment, or rephrase your question.

---

## 8. Tooltips and Helper Text

**Dashboard help tooltip:**

> These charts are suggestions, not commandments.

> Pin what matters, delete what doesn't, and use Q&A to dig deeper.

**Report editor help tooltip:**

> You're always in control.

> Treat this like a draft from a trusted analyst: edit, reorder, and add your own voice.

**Q&A help tooltip:**

> The booth answers using only the data in this project.

> If something seems off, check which sources are included and what's missing.

