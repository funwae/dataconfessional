# 02 – Personas and Use Cases

## 2.1 Persona A – Data-Adjacent Business User

- Examples:
  - Marketing manager
  - Product manager
  - Sales lead
- Skills:
  - Comfortable with spreadsheets and slide decks
  - Not a data engineer or BI expert
- Needs:
  - Fast, understandable reporting
  - High-level insights and charts they can paste into their decks

**Key Jobs to be Done**

1. Turn exports from CRM or marketing tools into a **presentation-ready summary**.
2. Scan a new market or segment using a few URLs + internal data.
3. Answer ad-hoc questions like:
   - "What segment grew fastest last quarter?"
   - "Are we losing deals more on price or on feature gaps?"

---

## 2.2 Persona B – Analyst / Consultant

- Examples:
  - Freelance data consultant
  - Internal business analyst
- Skills:
  - Comfort with SQL, Excel, some BI
- Needs:
  - Speed up first draft of analysis and reporting
  - Standardize structure across multiple deliverables

**Key Jobs**

1. Reuse the same template across multiple client projects.
2. Use AI to handle first-pass narratives and charts.
3. Ensure **consistent framing** and language.

---

## 2.3 Persona C – Ops / Enablement

- Examples:
  - Sales ops
  - RevOps
  - Customer success enablement
- Needs:
  - A way to define **standard reports** for the org
  - Less dependency on specific analysts

**Key Jobs**

1. Create "canonical" report templates (e.g., QBR pack, monthly marketing report).
2. Ensure teams produce **consistent-looking** docs.
3. Offload simple work to business users with a tool instead of a specialist.

---

## 2.4 MVP Use Cases

### Use Case 1 – Market Snapshot for Meeting

- Input:
  - 2 CSVs (sales by region, product metrics)
  - 3 competitor URLs
- Output:
  - Dashboard with 4–6 charts
  - 2-page executive summary PDF
  - Talking points for a meeting

### Use Case 2 – Sales Pipeline Overview

- Input:
  - CRM export CSV
- Output:
  - Funnel chart
  - Conversion metrics by stage, region, segment
  - Slide deck with topline numbers and commentary

### Use Case 3 – Marketing Performance Snapshot

- Input:
  - Channel performance CSV
  - Landing page URLs
- Output:
  - Channel-by-channel comparison
  - Narrative: what's working, what's not
  - Suggested next questions / experiments

---

## 2.5 Non-MVP Use Cases (Future)

- Direct Salesforce/HubSpot/GA integrations.
- Scheduled recurring reports.
- White-labeling for agencies.

