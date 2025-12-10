# 10 – Security and Permissions

## 10.1 Threat Model (MVP)

- Data is potentially sensitive (sales data, internal docs).
- Single-tenant MVP or simple user model, but still:
  - Projects should be private to their owners.
  - No cross-user data leakage.

---

## 10.2 Access Control

- Basic model:
  - User can only read/write their own projects.
- (Optional future) Shared projects with roles:
  - Owner
  - Editor
  - Viewer

---

## 10.3 Data Handling

- Store raw files in private object storage buckets.
- Only store minimal derived stats in DB.
- Do not log:
  - File contents
  - Full text chunks
  - API keys or credentials

---

## 10.4 LLM Safety

- When sending data to LLM:
  - Strip direct identifiers if feasible.
  - Avoid sending entire raw tables; use summaries & samples.
- Ensure:
  - LLM API calls go over HTTPS.
  - Keys are in environment variables.

---

## 10.5 Compliance (Future)

- Support data deletion upon request (project deletion).
- Plan for:
  - Data retention policies
  - Possible PII redaction

