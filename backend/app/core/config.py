"""Carrega a configuração local e define limites da importação por processo."""

import os

from dotenv import load_dotenv

load_dotenv()

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip() and origin.strip() != "*"
]
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_ROWS = 50_000
MAX_HISTORY_DAYS = 3653
DATASET_TTL = 30 * 60
DATASET_SLOTS = 10
