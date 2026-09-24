"""Compatibility import for BinVision's single integrated FastAPI application.

Run `uvicorn app:app` from the backend directory. This module remains available
for teammate scripts that previously launched `yolo.main:app`.
"""

import sys
from pathlib import Path

BACKEND_DIR = str(Path(__file__).resolve().parents[1])
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import app  # noqa: E402

__all__ = ["app"]
