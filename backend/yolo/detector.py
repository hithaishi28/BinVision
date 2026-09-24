from pathlib import Path
import os

# Keep Ultralytics runtime settings inside this project. This also avoids
# writing into a locked-down user profile when the backend runs on Windows.
_ultralytics_config = Path(__file__).resolve().parent / ".ultralytics"
_ultralytics_config.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("YOLO_CONFIG_DIR", str(_ultralytics_config))

from ultralytics import YOLO

DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "models" / "best.pt"

class WasteDetector:
    def __init__(self, model_path=DEFAULT_MODEL_PATH):
        self.model = YOLO(str(model_path))

    def detect(self, image, conf=0.15):
        results = self.model(image, conf=conf)[0]
        detections = []
        for box in results.boxes:
            detections.append({
                "class_id": int(box.cls[0]),
                "class_name": self.model.names[int(box.cls[0])],
                "confidence": float(box.conf[0]),
                "bbox": box.xyxy[0].tolist()
            })
        return detections
