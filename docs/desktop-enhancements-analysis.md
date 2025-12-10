# Desktop App Enhancement Analysis

## Current State Summary

**What we have:**
- ✅ Project creation with goal types (Market Snapshot, Sales Overview, Marketing Performance, General Analysis)
- ✅ Basic template system via `goalType` → `templateType` mapping
- ✅ File upload (CSV/XLSX), URL, and text input
- ✅ Dashboard generation with chart suggestions
- ✅ Report generation with sections
- ✅ Export functionality (PDF, Markdown, etc.)
- ✅ Q&A panel for asking questions
- ✅ Desktop layout with sidebar, main view, Q&A panel
- ✅ Native file dialogs (Tauri)
- ✅ SQLite database (local storage)

**What we're missing:**
- ❌ Streamlined single-flow wizard
- ❌ Recent source presets
- ❌ Custom template saving
- ❌ OS-level integration (hotkeys, watched folders)
- ❌ Tone toggle (Data Gossip mode)
- ❌ Key Admissions pinboard
- ❌ Specialized export formats (Meeting Brief, Speaker Notes)
- ❌ Explicit project folder structure

---

## New & Valuable Enhancements

### 1. Quick Confession Wizard ⭐ HIGH VALUE

**What it is:** Single-screen flow that combines file upload + question + auto-generates dashboard + mini report in one go.

**Why it's better:**
- Current flow: Create project → Add data → Generate dashboard → Generate report (4 steps)
- New flow: Drag file → Type question → Click "Hear the confession" → Done (1 step)
- **10x faster** for common use case

**Implementation:**
- New component: `components/QuickConfessionWizard.tsx`
- New API route: `POST /api/quick-confession`
- Auto-generates: 2-4 charts + one "Confession" paragraph + "What you can say" bullets
- Can be accessed from sidebar: "Quick Confession" button

**Priority:** HIGH - This is the killer feature that makes it "irresistibly useful"

---

### 2. Recent Source Presets ⭐ MEDIUM VALUE

**What it is:** "Re-use last data source" or "Start from last confession template" shortcuts.

**Why it's valuable:**
- For users who do the same report weekly/monthly
- Reduces repetitive setup

**Implementation:**
- Store last used data source path in local storage
- Store last used template config
- Show as quick-start options on home/empty state

**Priority:** MEDIUM - Nice to have, but not critical

---

### 3. Custom Template Saving ⭐ HIGH VALUE

**What it is:** Save a configured dashboard + report layout as a reusable template.

**Why it's better:**
- Current: Templates are hardcoded (4 goal types)
- New: Users can create "My QBR Template", "Weekly Sales Review", etc.
- Turns app into a **personal reporting appliance**

**Implementation:**
- New model: `SavedTemplate` in Prisma schema
- Store: chart configs, report sections, AI prompts, tone settings
- UI: "Save as Template" button on project detail
- UI: "Start with Template" option in project creation

**Priority:** HIGH - Major differentiator

---

### 4. OS-Level Integration ⭐ HIGH VALUE (Desktop-Native)

**What it is:**
- Global hotkey (Win + Shift + C) to send file to app
- Watched folder that auto-imports files

**Why it's valuable:**
- Makes it feel like a **desktop tool**, not a website in a window
- Reduces friction: drag file → hotkey → done
- Watched folder = zero-click automation for recurring reports

**Implementation:**
- Tauri global shortcut API
- Tauri file watcher API
- Small overlay window for quick actions
- Settings page for configuring watched folders

**Priority:** HIGH - This is what makes it feel desktop-native

---

### 5. Data Gossip Mode ⭐ MEDIUM VALUE (Fun Factor)

**What it is:** Toggle between "Serious" and "Data Gossip" tone in Q&A and reports.

**Why it's valuable:**
- Same insight, different phrasing
- "Brainstorm voice" for yourself, then switch to serious for export
- Makes the app more fun and memorable

**Implementation:**
- Add `tone` parameter to LLM prompts
- Toggle button in Q&A panel and report editor
- Two prompt styles: formal vs casual/conversational

**Priority:** MEDIUM - Nice UX polish, not critical

---

### 6. Key Admissions Pinboard ⭐ MEDIUM VALUE

**What it is:** Pin important insights as "Key Admissions" that can be added to reports.

**Why it's valuable:**
- Turns app into a **memory wall for important facts**
- Not just generative, but also a knowledge base
- Click to auto-add to report or mark as "talking point"

**Implementation:**
- New model: `KeyAdmission` in Prisma schema
- "Pin as admission" button on chart insights and Q&A answers
- New sidebar panel or section showing pinned admissions
- Can be added to reports with one click

**Priority:** MEDIUM - Useful but adds complexity

---

### 7. Better Export Formats ⭐ MEDIUM VALUE

**What it is:**
- "Meeting Brief" - 1-page PDF with 3-5 bullets, 1-2 charts, "What to say" section
- "Speaker Notes" - Text file with talking points per slide/section

**Why it's better:**
- Current exports are generic (PDF, Markdown)
- New formats are purpose-built for actual use cases
- Speaker Notes = "speaking coach in the booth"

**Implementation:**
- New export types: `MEETING_BRIEF`, `SPEAKER_NOTES`
- Specialized formatting functions
- One-click "Create Meeting Brief" button

**Priority:** MEDIUM - Improves exports but not game-changing

---

### 8. Explicit Project Folders ⭐ LOW VALUE (But Good for Backup)

**What it is:** Each project as a folder with `confession.json`, `sources/`, `exports/`

**Why it's valuable:**
- Users can back up/sync via Dropbox without us building sync
- More transparent storage
- Easier to share projects

**Implementation:**
- Store project metadata in JSON file
- Copy files to project folder instead of just storing paths
- Update file storage utilities

**Priority:** LOW - Nice to have, but SQLite works fine for now

---

## Recommended Implementation Order

### Phase 1: Quick Wins (1-2 weeks)
1. **Quick Confession Wizard** - Biggest impact, relatively simple
2. **Data Gossip Mode** - Easy to add, fun factor

### Phase 2: Power Features (2-3 weeks)
3. **Custom Template Saving** - Major differentiator
4. **OS-Level Integration** - Makes it feel desktop-native

### Phase 3: Polish (1-2 weeks)
5. **Key Admissions Pinboard** - Useful but not critical
6. **Better Export Formats** - Improves existing feature
7. **Recent Source Presets** - Nice convenience feature

### Phase 4: Infrastructure (Optional)
8. **Explicit Project Folders** - Can be done later if needed

---

## Top 3 Must-Haves

If you had to pick just 3 to implement next:

1. **Quick Confession Wizard** - Makes it 10x faster to get value
2. **OS-Level Integration** - Makes it feel like a real desktop app
3. **Custom Template Saving** - Turns it into a personal appliance

These three would make the Tauri version feel *distinctly* desktop-native and way more "oh yeah I'm going to actually use this at work today."

---

## Technical Notes

**What's already in place:**
- Tauri setup ✅
- File dialogs ✅
- Local storage (SQLite) ✅
- Template system (basic) ✅
- LLM integration ✅

**What needs to be added:**
- Global shortcuts (Tauri API)
- File watchers (Tauri API)
- Template persistence (new Prisma model)
- Quick confession flow (new component + API route)
- Tone toggle (LLM prompt parameter)

All of these are feasible with current stack.

