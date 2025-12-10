# 06 – AI Agent and Prompting

## 6.1 Goals

- Provide **accurate, scoped answers** based on project data.
- Generate **dashboards** and **reports** aligned to templates.
- Explain which data was used for transparency.

---

## 6.2 Patterns

### 6.2.1 Context Preparation

For any AI call:

1. Determine project.
2. Gather:
   - Data profiles
   - Summary stats
   - Relevant chart definitions
   - Relevant document chunks (for URLs/text)

3. Construct a **structured system prompt** that includes:
   - Role: "You are a data analyst."
   - Data description
   - User's goal & audience
   - Constraints (don't hallucinate; mention data gaps)

### 6.2.2 Scoped Q&A

Inputs:

- User question
- Optional filter: sources/tables

Steps:

1. Select relevant data:
   - For tabular: pick 1–3 most relevant tables and summary stats.
   - For text: retrieve top-k document chunks via embeddings.

2. Build prompt:
   - Overview of project
   - Short description of available data
   - Question
   - Data snippets / summaries
   - Instructions:
     - Answer clearly.
     - Quote exact figures where possible.
     - List data gaps or uncertainties.

3. Response structure:

```text
DIRECT ANSWER:

...

SUPPORTING DATA:

- ...

CAVEATS:

- ...
```

---

## 6.3 Report Generation Prompts

For report generation:

* Use template definition:
  * Sections, descriptions, target tone.
* Provide:
  * Data summaries
  * Key chart descriptions
  * Audience (manager vs executive)

Ask the model to:

* Fill out each section.
* Use headings and bullets.
* Avoid speculating beyond available data.

---

## 6.4 Chart Suggestion Prompts (Optional MVP)

LLM can help refine chart titles & descriptions:

* Input:
  * Chart config (fields, sample values)
* Ask:
  * "Propose a human-friendly title and 1 sentence insight."

---

## 6.5 Provider Abstraction

Implement an `LLMClient`:

* Methods:
  * `generateReportSections(...)`
  * `answerQuestion(...)`
  * `summarizeTable(...)`
  * `describeChart(...)`

Use environment variable `LLM_PROVIDER` to switch between providers.

---

## 6.6 Guardrails

* Never claim certainty where data is incomplete.
* Always surface caveats when data coverage is partial.
* Avoid deep financial or medical recommendations; keep to descriptive analysis.

