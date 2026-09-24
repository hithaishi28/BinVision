# BinVision inference integration

The frontend depends only on the shared `WasteAnalysisResponse` contract in `src/lib/detection.ts`. Keep this shape stable while changing model frameworks or inference internals.

## API contract

`POST /api/analyze` with `multipart/form-data`, field name `image` (`File`). Return JSON:

```json
{
  "image_id": "analysis-identifier",
  "detections": [
    {
      "class_name": "plastic bottle",
      "category": "recyclable",
      "confidence": 0.94,
      "bbox": [120, 80, 340, 420]
    }
  ],
  "summary": {
    "total": 1,
    "recyclable": 1,
    "organic": 0,
    "hazardous": 0,
    "average_confidence": 0.94
  }
}
```

`bbox` is `[x1, y1, x2, y2]` in original image pixel coordinates. Category must be `recyclable`, `organic`, or `hazardous`; confidence is 0..1. Empty detections are valid; return zero counts and `average_confidence: 0`. Do not expose model-specific fields in this response.

## Integration locations

- Shared types and frontend service selector: `src/lib/detection.ts`
- Mock provider and API selector: `analyzeWasteImage(image: File)` in `src/lib/detection.ts`
- FastAPI analysis route: `POST /api/analyze` in `backend/app.py`; it shares the running service with the chatbot's `POST /api/chat` route.
- Model adapter: `backend/model_adapter.py` loads the trained detector and converts predictions to the frontend contract.
- YOLO implementation and weights: `backend/yolo/detector.py` and `backend/yolo/models/best.pt`.
- Reviewed category mapping: `backend/category_mapper.py` checks exact item labels in `backend/yolo/config/category_mapping.json` first (so `Battery` maps to `hazardous`), then falls back to model IDs in `backend/yolo/config/classes.json`.
- Current model limitation: the supplied `best.pt` reports only broad labels (`Recyclable`, `Organic`, `Hazardous`). When a battery is predicted as the generic `Recyclable` label, no frontend or mapper can tell that box is a battery. Teammates must add item-level classes such as `Battery` to the trained model and its class names for battery-specific recognition; the mapper will apply the configured hazardous category once that label is returned.

## Switch mock to API

Install backend dependencies from `backend/requirements.txt`, set `VITE_ANALYSIS_MODE=api` and `VITE_ANALYZE_ENDPOINT=http://127.0.0.1:8001/api/analyze` in `.env.local`, then restart Vite. Start the FastAPI app from the `backend` directory with `uvicorn app:app --host 127.0.0.1 --port 8001`. Keep `CHAT_CORS_ORIGINS` set to the frontend origin. The frontend's default mode remains `mock` until the model is ready; mock results are explicitly labeled demo data.

`backend/yolo/main.py` is the teammate's older standalone `/predict` example. Do not start it for the BinVision frontend: the integrated `/api/analyze` route uses the standardized contract and coexists with `/api/chat` in `backend/app.py`.

Session history and analytics are local browser demo data in `src/lib/analysis-store.ts`; they are not shared or production analytics.
