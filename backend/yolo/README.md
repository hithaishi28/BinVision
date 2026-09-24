# YOLO backend handover

The active BinVision API is `backend/app.py`. Run it from the `backend` directory; it serves both `/api/chat` and `/api/analyze` on the same FastAPI server.

`detector.py` loads `models/best.pt` relative to this folder. `model_adapter.py` owns the boundary to the UI contract. The explicit class-ID mapping is read from `config/classes.json`. The older standalone `main.py` exposes a different `/predict` contract and is retained only for reference; do not start it for the BinVision frontend.

Install dependencies from `backend/requirements.txt`. The frontend should stay in mock mode until these dependencies are installed and the analyze endpoint has been verified. Then set `VITE_ANALYSIS_MODE=api` and `VITE_ANALYZE_ENDPOINT=http://127.0.0.1:8001/api/analyze` in the project-root `.env.local`, and restart Vite.
