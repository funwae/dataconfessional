# 05 – Dashboards and Reporting

## 5.1 Dashboard Philosophy

Dashboards are:

- Auto-suggested from data profiles.
- Editable by the user.
- Focused on **clarity over complexity**.

---

## 5.2 Chart Types (MVP)

- Line chart (time-series)
- Bar chart (category comparisons)
- Stacked bar (segments over time)
- Pie/donut (share)
- Funnel (for pipeline data)
- Table (for detailed views)

---

## 5.3 Chart Suggestion Logic (MVP)

Given a table:

1. Identify time column(s).
2. Identify metric columns (numeric).
3. Identify categorical columns (string with low cardinality).

Then propose:

- If time + metric:
  - Line chart of metric over time.
- If metric + category:
  - Bar chart of metric by category.
- If pipeline stage column:
  - Funnel chart of counts per stage.

Store chart configs in DB:

- `xField`, `yField`, `seriesField`, chart type, filters.

---

## 5.4 Report Templates

### 5.4.1 Market Snapshot

Sections:

1. Executive Summary
2. Market Overview
3. Key Segments
4. Competitive Landscape
5. Risks and Opportunities
6. Recommended Next Steps

### 5.4.2 Sales Overview

Sections:

1. Executive Summary
2. Pipeline Health
3. Conversion by Stage
4. Segment & Region Performance
5. Risks and Opportunities

### 5.4.3 Marketing Performance

Sections:

1. Overview
2. Channel Performance
3. Campaign Highlights
4. Funnel Analysis
5. Improvement Ideas

### 5.4.4 General Analysis

Flexible but includes:

- Summary
- Key Insights
- Supporting Evidence
- Open Questions

Each template is a JSON-like definition used for prompting.

---

## 5.5 Report Editing

- Rich text editor (or Markdown editor) for sections.
- AI actions:
  - "Rewrite more formally"
  - "Shorten to bullet points"
  - "Adapt for C-level audience"

---

## 5.6 Exports

### 5.6.1 PDF / DOCX

- Render report sections in order.
- Include charts (exported as images) if selected.
- Basic branded header/footer.

### 5.6.2 PPTX

- Slide for title & overview.
- 1 slide per major section.
- Chart slides where applicable.
- Notes section may contain additional narrative.

### 5.6.3 Markdown

- H1/H2/H3 headings + bullet lists.
- Code fences not needed; keep plain.

