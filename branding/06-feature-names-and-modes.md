# Data Confessional – Feature Names and Modes

## 1. Primary Feature Names

- **Project** → "Confession" (user-facing optional term)

- **New project** → "Begin a new confession"

- **Dashboard** → "What the data is saying"

- **Report** → "Briefing" or "Report"

- **Q&A** → "Interview your data"

- **Export** → "Briefings you can take into the room"

Where clarity is more important (inside buttons, menus), prefer conventional names:

- "Projects" instead of "Confessions" as the main nav label.

- "Dashboard" / "Reports" / "Exports" in tab names.

- Use confessional metaphors in headings and descriptions, not in core controls if it could confuse.

---

## 2. Modes / Views

You can optionally define modes for tone or depth:

### 2.1 Analysis Modes

- **Calm mode**

  > Default. Straight, neutral language, minimal flair.

- **Confessional mode**

  > Uses more metaphor and narrative: "Here's what the data finally admitted…"

- **Briefing mode**

  > Stripped-down bullet points for quick reading.

(These are internal concepts; if implemented as user-facing toggles, name them clearly in tooltips.)

---

## 3. Example Feature Names in UI

- "Start a new confession" (button)

- "Interview panel" (label for AI Q&A side pane)

- "Latest confessions" (optional label for recent projects)

- "Key admissions" (section title for top insights)

- "Briefings" (label for exports list)

---

## 4. Internal Naming (for devs/AI)

For clarity in code and specs, use straightforward terms:

- `Project`

- `DataSource`

- `Dashboard`

- `Report`

- `QAInteraction`

- `Export`

Avoid encoding the metaphor in database/table names; keep those practical.

Use the confessional language in UI copy, docs, and marketing.

---

## 5. Future Feature Name Ideas (Parking Lot)

These are optional; don't implement just because they exist.

- **"Chambers"** – saved configurations of data and views for different audiences.

- **"Transcripts"** – detailed logs of Q&A and key decisions.

- **"Cases"** – grouped confessions related to a larger initiative.

Only adopt if they help clarity; default to plain, descriptive labels.

