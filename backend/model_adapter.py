"""Convert the teammate YOLO detector output to BinVision's stable data shape."""

from io import BytesIO
from typing import TypedDict

from category_mapper import map_category


class NormalizedDetection(TypedDict):
    class_name: str
    category: str
    confidence: float
    bbox: tuple[float, float, float, float]


_detector = None


def _get_detector():
    global _detector
    if _detector is None:
        try:
            from yolo.detector import WasteDetector
        except ImportError as error:
            raise RuntimeError(
                "YOLO dependencies are not installed. Install backend/requirements.txt first."
            ) from error
        _detector = WasteDetector()
    return _detector


def infer(image_bytes: bytes) -> list[NormalizedDetection]:
    """Run the trained model and normalize its result for `/api/analyze`."""
    try:
        from PIL import Image, UnidentifiedImageError
    except ImportError as error:
        raise RuntimeError(
            "Image dependencies are not installed. Install backend/requirements.txt first."
        ) from error

    try:
        with Image.open(BytesIO(image_bytes)) as source:
            image = source.convert("RGB")
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("The uploaded file is not a readable image.") from error

    raw_detections = _get_detector().detect(image)
    normalized: list[NormalizedDetection] = []
    for detection in raw_detections:
        bbox = tuple(float(coordinate) for coordinate in detection["bbox"])
        if len(bbox) != 4:
            raise RuntimeError("YOLO returned a bounding box with an invalid shape.")
        normalized.append(
            {
                "class_name": str(detection["class_name"]),
                "category": map_category(
                    int(detection["class_id"]), str(detection["class_name"])
                ),
                "confidence": max(0.0, min(1.0, float(detection["confidence"]))),
                "bbox": bbox,  # type: ignore[typeddict-item]
            }
        )
    return normalized
