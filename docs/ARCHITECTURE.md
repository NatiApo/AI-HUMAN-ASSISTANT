# Architecture
- frontend/  React + Vite (port 5173), proxies /api to backend
- backend/   Express (port 4000), JWT auth, MySQL via mysql2 (parameterized queries)
- backend/src/providers/llm.js  AI provider layer (swap provider via LLM_PROVIDER)
- database/schema.sql  all 11 tables from the master prompt

## Services
Paid: AI model API (Anthropic/OpenAI), realistic avatar services (e.g. HeyGen, D-ID, Simli), premium TTS (ElevenLabs).
Free: MySQL, Node, browser SpeechRecognition + speechSynthesis (quality varies; Amharic/Afaan Oromo support is limited and must be tested).

## Roadmap
Phase 4 realtime voice, 5 avatar provider, 6 language tests, 8 Live Build (approved-directory command runner with audit log), 9 uploads/documents.
