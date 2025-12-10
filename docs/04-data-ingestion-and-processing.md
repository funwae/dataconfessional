# 04 – Data Ingestion and Processing

## 4.1 Supported Inputs (MVP)

- File uploads:
  - CSV
  - XLSX (single or multi-sheet)
- URLs:
  - HTML pages (competitor sites, docs)
- Raw text:
  - Large text blobs pasted by user

---

## 4.2 Ingestion Pipeline

### 4.2.1 File Ingestion

1. User uploads file.
2. Backend steps:
   - Validate file type and size.
   - Store raw file in object storage.
   - Parse:
     - For CSV: read with schema inference.
     - For XLSX: iterate sheets, parse each as a table.
   - Infer column types:
     - Numeric, string, boolean, date/time, categorical.
   - Compute summary stats per column:
     - Count, distinct, null %, min, max, mean, std, etc.

3. Save:
   - `DataSource` record
   - `Table` record(s)
   - `ColumnProfile` records

### 4.2.2 URL Ingestion

1. User submits URL.
2. Backend:
   - Fetch HTML (with basic error handling).
   - Extract:
     - Title, meta description
     - Main body text (using simple heuristic or library)
   - Chunk text into ~1–2k token segments.
3. Save:
   - `DataSource` of type URL
   - `DocumentChunk` records with:
     - Text
     - Order index
     - Basic embeddings (if using vector search)

---

## 4.3 Data Profiling

Purpose: support **chart suggestions** and **LLM prompts**.

### 4.3.1 Tabular Profiling

- Detect:
  - Time-series columns (monotonic dates)
  - Candidate metrics (numeric columns with "revenue", "amount", "count", etc.)
  - Category columns (string columns with small cardinality)

Store:
- `TableProfile` summarizing:
  - #rows
  - #columns
  - coverage dates (if applicable)

### 4.3.2 Text Profiling

- Basic NLP:
  - Keyword extraction by TF-IDF or simple heuristics
  - Language detection (optional)
- Aggregate by source:
  - Titles, important phrases

---

## 4.4 Error Handling

- If parsing fails:
  - Mark `DataSource.status = 'error'`
  - Store error message
  - Surface user-friendly error in UI.

- If URL fetch fails:
  - Retry limited times
  - Ask user to validate URL.

---

## 4.5 Performance Considerations

- Process files asynchronously with jobs if needed:
  - Show "Processing…" state in UI.
- Limit file size in MVP (e.g., 10–20MB).
- Truncate extremely large tables to summary stats + sampled rows for prompting.

