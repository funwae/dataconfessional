# Data Confessional - Windows Desktop App Plan

## Overview

Convert the Data Confessional web app into a standalone Windows desktop application with:
- Simple API key entry on first launch
- Easy-to-use GUI optimized for desktop
- Local data storage (no server required)
- One-click export and sharing
- Offline-first operation

---

## 1. Technology Stack Decision

### Recommended: **Tauri** (Lightweight, Secure, Modern)

**Why Tauri over Electron:**
- **Smaller bundle size:** ~10-15MB vs Electron's ~100MB+
- **Better performance:** Native WebView, not Chromium
- **More secure:** Rust backend, smaller attack surface
- **Lower memory usage:** ~50MB vs Electron's ~200MB+
- **Native Windows integration:** Better file dialogs, system tray, etc.

**Alternative: Electron** (if Tauri proves challenging)
- More mature ecosystem
- Easier Next.js integration
- Larger bundle size (~100MB+)
- Higher memory usage

---

## 2. Architecture Changes

### 2.1 Database Migration

**Current:** PostgreSQL (requires Docker/server)
**Desktop:** SQLite (file-based, no server needed)

**Changes Required:**
- Update Prisma schema to support SQLite
- Migrate all database operations
- Handle file-based database location (`%APPDATA%/DataConfessional/db.sqlite`)
- Auto-initialize database on first launch

**Benefits:**
- No Docker/server setup
- Works offline
- Automatic backups possible
- Portable (can move database file)

### 2.2 API Key Management

**First Launch Flow:**
1. Show welcome screen
2. "Enter your Claude API Key" input field
3. Validate key (test API call)
4. Store securely in Windows Credential Manager or encrypted local storage
5. Never show key again (only "Change API Key" option in settings)

**Storage Options:**
- **Windows Credential Manager** (most secure)
- **Encrypted local file** (fallback)
- **System keychain** (if available)

### 2.3 File System Access

**Changes:**
- Direct file system access (no uploads folder needed)
- Native Windows file dialogs for:
  - Opening CSV/Excel files
  - Saving exports
  - Choosing export location
- Store project data in: `%APPDATA%/DataConfessional/projects/`

---

## 3. UI/UX Simplification for Desktop

### 3.1 First Launch Experience

**Welcome Screen:**
```
┌─────────────────────────────────────────┐
│  [Logo] Data Confessional              │
│                                         │
│  Welcome! Let's get started.            │
│                                         │
│  Enter your Claude API Key:            │
│  ┌─────────────────────────────────┐  │
│  │ sk-ant-...                       │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Test Connection] [Continue]          │
│                                         │
│  Don't have a key? Get one at:          │
│  https://console.anthropic.com         │
└─────────────────────────────────────────┘
```

### 3.2 Main Application Window

**Simplified Layout:**
- **Left Sidebar:** Project list (collapsible)
- **Main Area:** Current project view
- **Right Panel:** Q&A (collapsible)
- **Top Bar:** Project name, Export button, Settings

**Key Simplifications:**
- Remove landing page (go straight to projects)
- Single-window interface (no tabs in browser sense)
- Native Windows controls
- Keyboard shortcuts for power users
- Drag-and-drop file uploads

### 3.3 Export & Share Flow

**Export Button (Top Right):**
- Click → Dropdown menu:
  - "Export as PDF"
  - "Export as PowerPoint"
  - "Export as Markdown"
  - "Share via Email" (opens default email client)
  - "Copy to Clipboard"

**One-Click Export:**
- Most common format (PDF) as primary button
- Saves to Downloads folder by default
- Shows "Export successful" notification
- Option to "Open folder" or "Open file"

---

## 4. Implementation Plan

### Phase 1: Setup & Migration (Week 1)

#### 1.1 Tauri Setup
```bash
# Install Tauri CLI
npm install -D @tauri-apps/cli
npm install @tauri-apps/api

# Initialize Tauri
npx tauri init
```

**Configuration:**
- `tauri.conf.json`: Windows-specific settings
- Window size: 1200x800 (default)
- Min size: 800x600
- Title: "Data Confessional"
- Icon: Use logo.png

#### 1.2 Database Migration to SQLite

**Steps:**
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./data-confessional.db"
   }
   ```

2. Handle SQLite limitations:
   - Remove `Json` types → use `String` with JSON serialization
   - Remove `Text` native types → use `String`
   - Remove enum arrays → use comma-separated strings

3. Create migration script:
   - Auto-create database on first launch
   - Run migrations automatically
   - Store in `%APPDATA%/DataConfessional/`

#### 1.3 API Key Management

**Create:** `src-tauri/src/api_key.rs`
```rust
// Store API key in Windows Credential Manager
// Or encrypted file as fallback
```

**Frontend:** `lib/api-key-storage.ts`
```typescript
// Secure API key storage/retrieval
// Test connection on first entry
```

### Phase 2: Desktop-Specific Features (Week 2)

#### 2.1 Native File Dialogs

**Tauri Commands:**
- `open_file_dialog()` - For CSV/Excel uploads
- `save_file_dialog()` - For exports
- `select_folder()` - For bulk operations

**Replace:**
- Current file input → Native Windows file picker
- Current export download → Save dialog

#### 2.2 System Integration

**Features:**
- System tray icon (minimize to tray)
- Windows notifications (export complete, etc.)
- File associations (open .dcproject files)
- Auto-start option (settings)

#### 2.3 Offline-First Architecture

**Changes:**
- All data stored locally
- No network calls except LLM API
- Graceful degradation if API key invalid
- Cache LLM responses (optional)

### Phase 3: UI Simplification (Week 3)

#### 3.1 Simplified Navigation

**Remove:**
- Landing page
- Project list page (move to sidebar)
- Complex routing

**Add:**
- Sidebar project list
- Single main view area
- Collapsible panels

#### 3.2 Desktop-Optimized Components

**Changes:**
- Larger click targets
- Better keyboard navigation
- Native Windows styling
- Context menus (right-click)
- Drag-and-drop zones

#### 3.3 Export Flow Simplification

**One-Click Export:**
- Primary button: "Export PDF"
- Dropdown: Other formats
- Auto-open after export
- Recent exports list

### Phase 4: Polish & Distribution (Week 4)

#### 4.1 Packaging

**Windows Installer:**
- `.msi` installer (Windows Installer)
- `.exe` installer (NSIS or Inno Setup)
- Auto-update mechanism
- Code signing (optional but recommended)

#### 4.2 Testing

**Test Scenarios:**
- First launch (API key entry)
- File uploads (CSV, Excel, text)
- Dashboard generation
- Report export
- Offline operation
- API key change

#### 4.3 Documentation

**User Guide:**
- Getting started (API key setup)
- Basic workflow
- Export options
- Troubleshooting

---

## 5. File Structure

```
data-confessional-desktop/
├── src/                    # Next.js frontend (existing)
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs         # Tauri entry point
│   │   ├── api_key.rs      # API key management
│   │   ├── database.rs     # SQLite operations
│   │   └── file_dialogs.rs # Native file dialogs
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
├── public/
│   └── logo.png
├── prisma/
│   └── schema.prisma       # Updated for SQLite
├── package.json            # Updated scripts
└── README.md
```

---

## 6. Key Technical Decisions

### 6.1 Database Location

**Windows:** `%APPDATA%\DataConfessional\data-confessional.db`
- User-specific
- Backed up with Windows
- Accessible for troubleshooting

### 6.2 Project Data Storage

**Structure:**
```
%APPDATA%\DataConfessional\
├── data-confessional.db    # SQLite database
├── projects\               # Project-specific files
│   └── {project-id}\
│       ├── uploads\        # Original files
│       └── exports\        # Generated exports
└── settings.json           # App settings
```

### 6.3 API Key Storage

**Primary:** Windows Credential Manager
- Target: `DataConfessional_APIKey`
- Secure, encrypted by Windows
- Accessible only to app

**Fallback:** Encrypted file
- `%APPDATA%\DataConfessional\.api_key.enc`
- Encrypted with Windows DPAPI
- Only readable by current user

### 6.4 Export Defaults

**Default Location:** `%USERPROFILE%\Downloads\DataConfessional\`
**Naming:** `{ProjectName}_{Date}_{Type}.{ext}`
**Example:** `Q1_Sales_2024-12-08_ExecutiveSummary.pdf`

---

## 7. User Experience Flow

### 7.1 First Launch

1. **Welcome Screen**
   - Logo + tagline
   - API key input
   - "Get API Key" link
   - "Test Connection" button
   - "Continue" button (disabled until key validated)

2. **API Key Validation**
   - Test API call to Claude
   - Show success/error
   - Store if valid

3. **Main App Opens**
   - Empty project list
   - "Create your first confession" prompt

### 7.2 Daily Use

1. **Open App** → See project list
2. **Click Project** → View dashboard/reports
3. **Add Data** → Drag & drop files or click "Add Files"
4. **Generate** → Click "Generate Dashboard"
5. **Export** → Click "Export PDF" → File saves → Notification shows

### 7.3 Export Flow

**Simple:**
1. Click "Export" button (top right)
2. Choose format (PDF/PPTX/Markdown)
3. File saves to Downloads
4. Notification: "Export saved to Downloads"
5. Option to "Open file" or "Open folder"

**Advanced:**
- Right-click project → "Export as..."
- Choose custom location
- Multiple formats at once

---

## 8. Dependencies to Add

### Frontend (package.json)
```json
{
  "@tauri-apps/api": "^1.5.0",
  "@tauri-apps/plugin-dialog": "^1.0.0",
  "@tauri-apps/plugin-fs": "^1.0.0",
  "@tauri-apps/plugin-notification": "^1.0.0"
}
```

### Backend (Cargo.toml)
```toml
[dependencies]
tauri = { version = "1.5", features = ["dialog-all", "fs-all", "notification-all"] }
rusqlite = "0.30"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
winapi = { version = "0.3", features = ["wincred"] } # For Credential Manager
```

---

## 9. Migration Checklist

### Database
- [ ] Update Prisma schema for SQLite
- [ ] Remove PostgreSQL-specific features
- [ ] Create migration script
- [ ] Test data migration

### API Key
- [ ] Create Windows Credential Manager integration
- [ ] Create encrypted file fallback
- [ ] Add API key validation
- [ ] Add "Change API Key" in settings

### File Operations
- [ ] Replace file inputs with native dialogs
- [ ] Update file storage paths
- [ ] Add drag-and-drop support
- [ ] Update export file handling

### UI Simplification
- [ ] Remove landing page
- [ ] Add sidebar project list
- [ ] Simplify navigation
- [ ] Add desktop-optimized components
- [ ] Add keyboard shortcuts

### Packaging
- [ ] Configure Tauri build
- [ ] Create installer
- [ ] Add auto-update
- [ ] Code signing (optional)

---

## 10. Estimated Effort

**Total:** 4-6 weeks

- **Week 1:** Tauri setup, SQLite migration, API key management
- **Week 2:** Native dialogs, system integration, offline-first
- **Week 3:** UI simplification, desktop optimization
- **Week 4:** Packaging, testing, documentation
- **Week 5-6:** Polish, bug fixes, user testing

---

## 11. Alternative: Electron (If Tauri Proves Difficult)

### Electron Approach

**Pros:**
- Easier Next.js integration
- More examples/documentation
- Larger ecosystem

**Cons:**
- Larger bundle size (~100MB+)
- Higher memory usage
- Slower startup

**Implementation:**
- Use `electron-next` or `nextron`
- Similar architecture changes
- Electron-specific APIs for file dialogs

---

## 12. Success Criteria

**Must Have:**
- ✅ API key entry on first launch
- ✅ Works completely offline (except LLM calls)
- ✅ One-click export to PDF
- ✅ Native Windows file dialogs
- ✅ Simple, intuitive GUI
- ✅ No server/Docker required

**Nice to Have:**
- System tray support
- Auto-updates
- File associations
- Keyboard shortcuts
- Dark mode

---

## 13. Next Steps

1. **Decision:** Tauri vs Electron
2. **Proof of Concept:**
   - Set up Tauri/Electron
   - Migrate one feature (file upload)
   - Test SQLite migration
3. **Full Migration:** Follow phases above
4. **User Testing:** Get feedback on desktop UX
5. **Distribution:** Create installer, publish

---

## 14. Risk Mitigation

**Risk:** SQLite limitations
- **Mitigation:** Test all features, handle edge cases

**Risk:** Tauri learning curve
- **Mitigation:** Start with simple features, use Electron as fallback

**Risk:** API key security
- **Mitigation:** Use Windows Credential Manager, encrypt fallback

**Risk:** File path issues on Windows
- **Mitigation:** Use Tauri/Electron path APIs, test on multiple Windows versions

---

This plan provides a clear roadmap for converting Data Confessional into a Windows desktop app that's easy to use and requires minimal setup.

