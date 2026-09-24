"""
Vercel entry point.

Vercel runs every Python file in /api as a serverless function. This one simply
exposes the FastAPI app from backend/app/main.py; vercel.json rewrites all
/api/* requests here.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402,F401
