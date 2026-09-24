# BinVision AI chatbot integration

## What was provided

The supplied Python file is a terminal chatbot, not a web backend. It uses the Groq Python client and `GROQ_API_KEY`, has no web framework, HTTP route, request/response schema, CORS configuration, or streaming. Its `get_ai_response(question)` takes only one question, so it cannot receive conversation history or BinVision analysis context. The terminal loop calls `ask_ai`, which is not defined. Its system prompt and selected model (`qwen/qwen3.8-27b`) are for FarmAssist agriculture.

The code pasted directly in the request specifies `openai/gpt-oss-120b`. The HTTP adapter defaults to that explicitly requested model; override it server-side with `GROQ_MODEL` if the team chooses another supported model. The Groq client and chat-completion pattern are retained, with a small HTTP adapter added because no usable API endpoint exists in the supplied source. Streaming is not implemented.

## API used by the frontend

`POST /api/chat`, JSON request:

```json
{
  "message": "Why is this item hazardous?",
  "history": [
    { "role": "user", "content": "What did the model detect?" },
    { "role": "assistant", "content": "It detected a battery." }
  ],
  "context": {
    "image_id": "analysis-id",
    "detections": [
      { "class_name": "battery", "category": "hazardous", "confidence": 0.88, "bbox": [1, 2, 3, 4] }
    ],
    "summary": {
      "total": 1,
      "recyclable": 0,
      "organic": 0,
      "hazardous": 1,
      "average_confidence": 0.88
    },
    "selected_detection_index": 0
  }
}
```

`context` is optional and follows the shared `WasteAnalysisResponse` contract, with an optional selected detection index. `history` is optional and limited to the latest 20 turns. Success response:

```json
{ "answer": "Batteries should be taken to a local battery collection point…" }
```

Errors use an HTTP error status and a generic, non-secret `detail`. There is no streaming.

## Locations and setup

- Frontend chat service: `src/lib/chat-service.ts`
- Floating BinVision AI UI and contextual prompts: `src/components/binvision/assistant-widget.tsx`
- Session conversation/context state: `src/lib/chat-store.ts`
- Results-page assistant entry point: `src/routes/results.tsx`
- Groq HTTP adapter: `backend/app.py`
- Backend dependencies: `backend/requirements.txt`

Run the backend from the `backend` directory:

```bash
py -3.12 -m venv .venv-chatbot
.venv-chatbot\Scripts\python.exe -m pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and set `GROQ_API_KEY` there (or use the backend host's secret manager). Never place this secret in a `VITE_*` variable or frontend source. Start the service from `backend` with:

```bash
.venv-chatbot\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8001
```

Copy the root `.env.example` to `.env.local` for the frontend. `VITE_CHAT_API_URL` defaults to `/api/chat`; set it to `http://127.0.0.1:8001/api/chat` for the separate Python service. Configure `CHAT_CORS_ORIGINS` server-side to the exact frontend origin(s) when using separate ports/deployment. For this working local setup, allow `http://127.0.0.1:8082` and `http://localhost:8082` in `CHAT_CORS_ORIGINS`; frontend development uses port 8082 and chatbot API uses port 8001.

Run the frontend in a second PowerShell window from the project root:

```powershell
pnpm run dev -- --host 127.0.0.1 --port 8082 --strictPort
```

Open http://127.0.0.1:8082/. Keep both terminal windows open while using the app.

## Detection context and limitations

The floating assistant uses the latest session analysis when available. Detection and Results pages pass their current analysis, and selecting a detection sets that item as the active context. Conversation state persists in memory while navigating within the tab; reloading clears the conversation. Results remain governed by the existing YOLO/mock analysis service. The chatbot does not inspect images or invent detections; it receives only the shared analysis response produced by that service.

## Credential note

A live-looking Groq key was pasted in the request. It was not copied to files or used. Treat it as exposed: revoke/rotate it in Groq, then store the replacement only in `backend/.env` or a server-side secret manager. `.env` files are ignored by Git; `.env.example` contains placeholders only.






