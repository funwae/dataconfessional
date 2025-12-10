# 08 – API Design

## 8.1 Auth

- MVP: simple email/password or magic-link.
- Endpoints (examples):
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `POST /api/auth/register`

---

## 8.2 Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id` (soft delete)

---

## 8.3 Data Sources

- `POST /api/projects/:id/data-sources/upload`
- `POST /api/projects/:id/data-sources/url`
- `GET /api/projects/:id/data-sources`
- `GET /api/data-sources/:id`
- `DELETE /api/data-sources/:id`

---

## 8.4 Dashboard

- `POST /api/projects/:id/dashboard/generate`
- `GET /api/projects/:id/dashboard`
- `PATCH /api/projects/:id/dashboard` (update layout, pin/unpin charts)

---

## 8.5 Reports

- `POST /api/projects/:id/reports/generate` (initial)
- `GET /api/projects/:id/reports`
- `PATCH /api/reports/:id` (edit sections)
- `POST /api/reports/:id/sections/:sectionId/regenerate`

---

## 8.6 AI Q&A

- `POST /api/projects/:id/qa`
  - Body:
    - `question: string`
    - `sourceIds?: string[]`

- Response:
  - `answer: string`
  - `supportingData: {...}`
  - `caveats: string[]`

---

## 8.7 Exports

- `POST /api/projects/:id/exports`
  - Body:
    - `type: 'summary' | 'deck' | 'full' | 'markdown'`
    - options for including charts/appendix
- `GET /api/projects/:id/exports`
- `GET /api/exports/:id/download`

