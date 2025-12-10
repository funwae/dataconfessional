# 09 – Data Model

## 9.1 Entities (MVP)

### User

- `id`
- `email`
- `name`
- `createdAt`

### Project

- `id`
- `ownerId`
- `name`
- `goalType` (enum)
- `audienceType` (enum)
- `createdAt`
- `updatedAt`

### DataSource

- `id`
- `projectId`
- `type` (csv, xlsx, url, text)
- `name`
- `status` (pending, processed, error)
- `rawPath` (object storage)
- `meta` (JSON)
- `createdAt`
- `updatedAt`

### Table

- `id`
- `dataSourceId`
- `name`
- `rowCount`
- `columnCount`

### ColumnProfile

- `id`
- `tableId`
- `name`
- `dataType`
- `nullPercentage`
- `distinctCount`
- `min`
- `max`
- `mean`
- `stdDev`

### DocumentChunk

- `id`
- `dataSourceId`
- `orderIndex`
- `text`
- `embedding` (vector if using pgvector)

### Chart

- `id`
- `projectId`
- `tableId`
- `config` (JSON)
- `isPinned` (boolean)
- `generatedBy` (system/user)

### Report

- `id`
- `projectId`
- `templateType`
- `title`
- `createdAt`
- `updatedAt`

### ReportSection

- `id`
- `reportId`
- `key` (e.g., "executive_summary")
- `title`
- `orderIndex`
- `content` (text/markdown)

### QAInteraction

- `id`
- `projectId`
- `question`
- `answer`
- `supportingData` (JSON)
- `createdAt`

### Export

- `id`
- `projectId`
- `type`
- `path` (object storage)
- `options` (JSON)
- `createdAt`

