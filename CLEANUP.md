# Repository Cleanup Guide

This repository is ready for a clean Windows clone. All build artifacts, dependencies, and user-specific files are properly ignored via `.gitignore`.

## What's Ignored

The following are automatically ignored and won't be committed:

- **Dependencies**: `node_modules/`
- **Build artifacts**: `.next/`, `dist/`, `build/`, `target/`
- **User data**: `uploads/`, `exports/`
- **Database files**: `*.db`, `*.db-journal`
- **Environment files**: `.env*`
- **Test results**: `test-results/`, `coverage/`
- **IDE files**: `.vscode/`, `.idea/`
- **OS files**: `.DS_Store`, `Thumbs.db`, `desktop.ini`
- **Engine config**: `engine-config.json`, `logs/`, `engine/`
- **Tauri build**: `src-tauri/target/`, `src-tauri/Cargo.lock`

## Fresh Clone Setup

After cloning on Windows:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Prisma**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Install Rust** (for Tauri desktop builds):
   - Download from https://rustup.rs/
   - Or use: `winget install Rustlang.Rustup`

4. **Install Tauri CLI** (if building desktop app):
   ```bash
   npm install -g @tauri-apps/cli
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```

6. **For desktop app**:
   ```bash
   npm run tauri:dev
   ```

## Notes

- The database will be created automatically on first run (SQLite)
- Engine configuration will be created in `%APPDATA%\DataConfessional\engine\`
- Uploads and exports are stored in the app data directory for desktop builds
- No API keys or secrets are stored in the repository

