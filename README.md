# AI HUMAN Assistant - Starter Project

This is Phase 1-3 of MASTER-PROMPT.txt: working backend, MySQL schema, login, chat with memory, and a React frontend with voice (browser speech) and an avatar placeholder.

NOT done yet (needs more phases): realistic avatar provider, advanced voice/interruption, Live Build workspace, document upload, reminders.

## Requirements (Windows)
- Node.js 20+  (https://nodejs.org)
- MySQL 8+ running locally
- An API key for your AI provider (Anthropic by default)

## Setup
1. Open PowerShell in this folder and run:  .\setup-windows.ps1
2. Edit backend\.env  (DB password, JWT_SECRET, ANTHROPIC_API_KEY)
3. Create the database:  mysql -u root -p < database\schema.sql
4. Terminal 1:  cd backend ; npm start
5. Terminal 2:  cd frontend ; npm run dev
6. Open http://localhost:5173

Use Chrome or Edge for microphone speech recognition.
