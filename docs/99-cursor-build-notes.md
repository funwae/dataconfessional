# 99 – Cursor Build Notes

## 99.1 Build Order for AI Assistants

1. Scaffold Next.js app + TS + Tailwind + Prisma + Postgres.
2. Implement core DB models from `/docs/09-data-model.md`.
3. Build basic:
   - Auth (or stub)
   - Project list page
   - Project detail shell with tabs
4. Implement file uploads and ingestion for CSV/XLSX.
5. Implement data profiling and basic chart suggestion.
6. Implement dashboard UI with generated charts.
7. Implement report generation using a single LLM provider.
8. Implement AI Q&A panel scoped to project data.
9. Implement export endpoints and simple PPTX/PDF generation (can start with only Markdown/PDF).
10. Polish UX and add preset questions and report templates.

## 99.2 Notes to Future AI Builders

- Do not over-engineer.
- Prefer clear, boring code.
- Keep prompts and AI logic in isolated modules.
- Add TODOs where you intentionally cut corners for MVP.

