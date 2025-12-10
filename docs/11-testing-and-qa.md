# 11 – Testing and QA

## 11.1 Test Levels

- Unit tests:
  - Data parsing
  - Profiling logic
  - Chart suggestion engine
- Integration tests:
  - End-to-end project creation → data upload → dashboard generation
  - Report generation API
- UI tests:
  - Critical flows in Cypress/Playwright

---

## 11.2 Scenarios to Cover

1. Upload valid CSV, see processed summary.
2. Upload invalid file → user-friendly error.
3. Generate dashboard with:
   - Time-series data
   - Categorical breakdowns
4. Generate report and verify:
   - Sections exist
   - LLM outputs inserted to DB
5. Q&A:
   - Question referencing metric column.
   - Response includes direct answer + supporting data references.

---

## 11.3 Manual QA Checklist (MVP)

- Works in latest Chrome/Firefox.
- Reasonable behavior on smaller laptop screens.
- No visible server errors in console.
- API keys not exposed in frontend bundle.

