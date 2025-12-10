# Data Confessional - Desktop App Implementation Guide

## Quick Start Implementation Steps

### Step 1: Choose Framework

**Recommendation: Tauri** (lighter, faster, more secure)

**Why:**
- 10x smaller bundle size
- Native performance
- Better Windows integration
- Lower memory footprint

---

## Step 2: Initial Setup

### 2.1 Install Tauri

```bash
cd /home/hayden/Desktop/data-nexus
npm install -D @tauri-apps/cli @tauri-apps/api
npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/plugin-notification
```

### 2.2 Initialize Tauri

```bash
npx tauri init
```

**Configuration prompts:**
- App name: `Data Confessional`
- Window title: `Data Confessional`
- Dist dir: `.next` (Next.js output)
- Dev path: `http://localhost:3000`
- Build command: `npm run build`

### 2.3 Update Tauri Config

**`src-tauri/tauri.conf.json`:**
```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:3000",
    "distDir": "../.next"
  },
  "package": {
    "productName": "Data Confessional",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "dialog": {
        "all": true,
        "open": true,
        "save": true
      },
      "fs": {
        "all": true,
        "readFile": true,
        "writeFile": true,
        "createDir": true
      },
      "notification": {
        "all": true
      }
    },
    "windows": [
      {
        "title": "Data Confessional",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

---

## Step 3: Database Migration to SQLite

### 3.1 Update Prisma Schema

**`prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./data-confessional.db"
}

// Keep all models the same, but:
// - Change Json fields to String (store as JSON string)
// - Remove Text native types → use String
// - Remove enum arrays → use comma-separated strings
```

### 3.2 Handle SQLite Limitations

**Changes needed:**
1. **Json fields:** Store as `String` with `@default("{}")`
2. **Text fields:** Use `String` type
3. **Enums:** Keep as-is (SQLite supports via Prisma)
4. **Arrays:** Store as comma-separated strings

**Example migration:**
```prisma
model Chart {
  // Before: config Json
  // After:
  config String @default("{}") // Store JSON as string
}

// In code, parse: JSON.parse(chart.config)
```

### 3.3 Database Location

**Create:** `lib/database-path.ts`
```typescript
import { appDataDir } from '@tauri-apps/api/path';

export async function getDatabasePath(): Promise<string> {
  const appData = await appDataDir();
  return `${appData}data-confessional.db`;
}
```

**Update:** `.env` or runtime config
```typescript
// Set DATABASE_URL dynamically
const dbPath = await getDatabasePath();
process.env.DATABASE_URL = `file:${dbPath}`;
```

---

## Step 4: API Key Management

### 4.1 First Launch Detection

**Create:** `lib/first-launch.ts`
```typescript
import { exists } from '@tauri-apps/api/fs';
import { appDataDir } from '@tauri-apps/api/path';

export async function isFirstLaunch(): Promise<boolean> {
  const appData = await appDataDir();
  const settingsPath = `${appData}settings.json`;
  return !(await exists(settingsPath));
}
```

### 4.2 API Key Storage (Windows Credential Manager)

**Create:** `src-tauri/src/api_key.rs`
```rust
use winapi::um::wincred::*;
use std::ptr;

pub fn store_api_key(key: &str) -> Result<(), String> {
    let target = "DataConfessional_APIKey\0";
    let credential = CREDENTIALW {
        Flags: 0,
        Type: CRED_TYPE_GENERIC,
        TargetName: target.as_ptr() as *mut u16,
        Comment: ptr::null_mut(),
        LastWritten: FILETIME { dwLowDateTime: 0, dwHighDateTime: 0 },
        CredentialBlobSize: (key.len() * 2) as u32,
        CredentialBlob: key.as_ptr() as *mut u8,
        Persist: CRED_PERSIST_LOCAL_MACHINE,
        AttributeCount: 0,
        Attributes: ptr::null_mut(),
        TargetAlias: ptr::null_mut(),
        UserName: ptr::null_mut(),
    };

    unsafe {
        if CredWriteW(&credential as *const _, 0) != 0 {
            Ok(())
        } else {
            Err("Failed to store API key".to_string())
        }
    }
}

pub fn get_api_key() -> Result<String, String> {
    let target = "DataConfessional_APIKey\0";
    let mut credential: *mut CREDENTIALW = ptr::null_mut();

    unsafe {
        if CredReadW(target.as_ptr() as *const _, CRED_TYPE_GENERIC, 0, &mut credential) != 0 {
            let blob = std::slice::from_raw_parts(
                (*credential).CredentialBlob,
                (*credential).CredentialBlobSize as usize
            );
            let key = String::from_utf8_lossy(blob).to_string();
            CredFree(credential);
            Ok(key)
        } else {
            Err("API key not found".to_string())
        }
    }
}
```

### 4.3 Frontend API Key UI

**Create:** `components/FirstLaunch.tsx`
```typescript
'use client';

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export default function FirstLaunch({ onComplete }: { onComplete: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  const testApiKey = async () => {
    setTesting(true);
    setError('');

    try {
      // Test API call to Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      if (response.ok) {
        // Store API key
        await invoke('store_api_key', { key: apiKey });
        onComplete();
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to connect. Check your internet connection.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f6f1e8]">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome to Data Confessional
          </h1>
          <p className="text-sm text-slate-600">
            Where your data goes to tell the truth
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your Claude API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500"
          />
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        <div className="mb-4">
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Don't have a key? Get one here →
          </a>
        </div>

        <button
          onClick={testApiKey}
          disabled={!apiKey.trim() || testing}
          className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
```

---

## Step 5: Native File Dialogs

### 5.1 Replace File Uploads

**Update:** `components/DataSourcesTab.tsx`

**Before:**
```typescript
<input type="file" onChange={handleFileUpload} />
```

**After:**
```typescript
import { open } from '@tauri-apps/api/dialog';

const handleFileUpload = async () => {
  const selected = await open({
    multiple: false,
    filters: [{
      name: 'Data Files',
      extensions: ['csv', 'xlsx', 'xls']
    }]
  });

  if (selected) {
    // Process file
  }
};
```

### 5.2 Export with Save Dialog

**Update:** `components/ReportsTab.tsx`

```typescript
import { save } from '@tauri-apps/api/dialog';
import { writeTextFile } from '@tauri-apps/api/fs';

const handleExport = async (content: string, format: string) => {
  const filePath = await save({
    filters: [{
      name: format,
      extensions: [format === 'PDF' ? 'pdf' : format === 'PPTX' ? 'pptx' : 'md']
    }],
    defaultPath: `${projectName}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
  });

  if (filePath) {
    await writeTextFile(filePath, content);
    // Show notification
  }
};
```

---

## Step 6: Simplified Desktop UI

### 6.1 Main Layout

**Create:** `app/desktop-layout.tsx`
```typescript
'use client';

import { useState } from 'react';
import Sidebar from '@/components/desktop/Sidebar';
import MainView from '@/components/desktop/MainView';
import QAPanel from '@/components/desktop/QAPanel';

export default function DesktopLayout() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [qaPanelOpen, setQaPanelOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#f6f1e8]">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {selectedProject || 'Data Confessional'}
            </h1>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-slate-900 text-white rounded text-sm">
                Export PDF
              </button>
              <button className="px-3 py-1 text-slate-700 rounded text-sm">
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>

        {/* Main View */}
        <div className="flex-1 flex overflow-hidden">
          <MainView projectId={selectedProject} />
          {qaPanelOpen && (
            <QAPanel
              projectId={selectedProject}
              onClose={() => setQaPanelOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

### 6.2 Remove Landing Page

**Update:** `app/page.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import FirstLaunch from '@/components/FirstLaunch';
import DesktopLayout from './desktop-layout';

export default function Home() {
  const [firstLaunch, setFirstLaunch] = useState<boolean | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    const isFirst = await invoke('is_first_launch');
    const hasKey = await invoke('has_api_key');
    setFirstLaunch(isFirst as boolean);
    setApiKeySet(hasKey as boolean);
  };

  if (firstLaunch === null) {
    return <div>Loading...</div>;
  }

  if (firstLaunch || !apiKeySet) {
    return <FirstLaunch onComplete={() => setApiKeySet(true)} />;
  }

  return <DesktopLayout />;
}
```

---

## Step 7: Build & Package

### 7.1 Build Scripts

**Update:** `package.json`
```json
{
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "desktop:dev": "npm run dev & tauri dev",
    "desktop:build": "npm run build && tauri build"
  }
}
```

### 7.2 Build for Windows

```bash
npm run desktop:build
```

**Output:**
- `src-tauri/target/release/data-confessional.exe` (standalone)
- `src-tauri/target/release/bundle/msi/data-confessional_1.0.0_x64_en-US.msi` (installer)

---

## Step 8: Distribution

### 8.1 Installer Options

**MSI Installer (Recommended):**
- Built by Tauri automatically
- Windows standard
- Easy uninstall
- Auto-update support

**Portable EXE:**
- No installation needed
- Single file
- Can run from USB

### 8.2 Auto-Updates

**Tauri Plugin:**
```bash
npm install @tauri-apps/plugin-updater
```

**Configuration:**
- Host update server
- Version checking
- Automatic downloads
- User approval before install

---

## Step 9: Key Simplifications Summary

### What Gets Simpler:

1. **No Server Setup**
   - SQLite database (file-based)
   - No Docker required
   - Works offline

2. **API Key Once**
   - Enter on first launch
   - Stored securely
   - Never asked again (unless changed)

3. **Native File Operations**
   - Windows file dialogs
   - Drag & drop support
   - Direct file access

4. **One-Click Export**
   - "Export PDF" button
   - Saves to Downloads
   - Opens automatically

5. **Simplified UI**
   - No landing page
   - Sidebar project list
   - Single main view
   - Collapsible panels

---

## Step 10: Migration Checklist

### Database
- [ ] Update Prisma schema for SQLite
- [ ] Change Json → String (with JSON.parse)
- [ ] Update DATABASE_URL to use app data dir
- [ ] Test all queries work with SQLite
- [ ] Create migration script

### API Key
- [ ] Create Rust backend for Windows Credential Manager
- [ ] Create FirstLaunch component
- [ ] Add API key validation
- [ ] Add "Change API Key" in settings
- [ ] Update LLM client to use stored key

### File Operations
- [ ] Replace file inputs with Tauri dialogs
- [ ] Update file storage paths
- [ ] Add drag-and-drop
- [ ] Update export to use save dialog
- [ ] Add file association support

### UI
- [ ] Create desktop layout
- [ ] Add sidebar project list
- [ ] Remove landing page
- [ ] Simplify navigation
- [ ] Add keyboard shortcuts
- [ ] Add system tray (optional)

### Build
- [ ] Configure Tauri
- [ ] Test dev mode
- [ ] Build for Windows
- [ ] Create installer
- [ ] Test on clean Windows machine

---

## Estimated Timeline

**Fast Track (2-3 weeks):**
- Week 1: Tauri setup, SQLite migration, API key
- Week 2: File dialogs, UI simplification
- Week 3: Build, test, package

**Thorough (4-6 weeks):**
- Week 1: Setup & planning
- Week 2: Database & API key
- Week 3: File operations & native features
- Week 4: UI simplification
- Week 5: Testing & polish
- Week 6: Distribution & docs

---

## Success Metrics

**User Experience:**
- ✅ First launch: < 2 minutes to get started
- ✅ File upload: < 3 clicks
- ✅ Export: 1 click
- ✅ No technical setup required
- ✅ Works completely offline (except LLM)

**Technical:**
- ✅ Bundle size: < 20MB (Tauri) or < 120MB (Electron)
- ✅ Memory usage: < 100MB idle
- ✅ Startup time: < 3 seconds
- ✅ No external dependencies (except .NET runtime if needed)

---

This implementation guide provides the concrete steps to convert Data Confessional into a Windows desktop app that's truly easy to use.

