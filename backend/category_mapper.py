"""Map reviewed item labels first, then model class IDs, to API categories."""

import json
from pathlib import Path
from typing import Literal

Category = Literal["recyclable", "organic", "hazardous"]
CLASSES_PATH = Path(__file__).resolve().parent / "yolo" / "config" / "classes.json"
ITEM_MAPPING_PATH = Path(__file__).resolve().parent / "yolo" / "config" / "category_mapping.json"


def _normalize_label(label: str) -> str:
    return "".join(character for character in label.casefold() if character.isalnum())


def _load_class_categories() -> dict[int, Category]:
    try:
        configured = json.loads(CLASSES_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Unable to load the reviewed YOLO class map: {CLASSES_PATH}") from error

    normalized: dict[int, Category] = {}
    for class_id, category in configured.items():
        category_name = str(category).strip().lower()
        if category_name not in {"recyclable", "organic", "hazardous"}:
            raise RuntimeError(f"Unsupported category {category!r} for class ID {class_id!r}")
        normalized[int(class_id)] = category_name  # type: ignore[assignment]
    if not normalized:
        raise RuntimeError("The YOLO class map is empty.")
    return normalized


def _load_item_categories() -> dict[str, Category]:
    """Load explicit item labels such as Battery -> hazardous from teammate config."""
    try:
        configured = json.loads(ITEM_MAPPING_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Unable to load the reviewed item map: {ITEM_MAPPING_PATH}") from error

    normalized: dict[str, Category] = {}
    for category, labels in configured.items():
        category_name = str(category).strip().lower()
        if category_name not in {"recyclable", "organic", "hazardous"} or not isinstance(labels, list):
            raise RuntimeError(f"Invalid item category mapping for {category!r}")
        for label in labels:
            normalized[_normalize_label(str(label))] = category_name  # type: ignore[assignment]
    return normalized


CLASS_CATEGORY_MAP = _load_class_categories()
ITEM_CATEGORY_MAP = _load_item_categories()


def map_category(class_id: int, class_name: str | None = None) -> Category:
    """Prefer an exact reviewed item label, falling back to the configured model class ID."""
    if class_name:
        item_category = ITEM_CATEGORY_MAP.get(_normalize_label(class_name))
        if item_category:
            return item_category
    try:
        return CLASS_CATEGORY_MAP[int(class_id)]
    except (KeyError, ValueError) as error:
        raise ValueError(f"No reviewed waste category configured for class ID {class_id!r}") from error
