"""
Generate memes.json from Firebase Storage
Lists all approved memes and writes a static JSON manifest.
The gallery loads this file directly, no Firestore needed.

Usage:
  python scripts/generate_meme_manifest.py
"""

import json
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, storage

SCRIPT_DIR     = Path(__file__).parent
PROJECT_ROOT   = SCRIPT_DIR.parent
SERVICE_ACCOUNT = next(SCRIPT_DIR.glob("*firebase-adminsdk-*.json"), None)
STORAGE_BUCKET = "buttcoin-fbe0f.firebasestorage.app"
OUTPUT_FILE    = PROJECT_ROOT / "memes.json"

CATEGORY_MAP = {
    "iconic":     "iconic",
    "phase1":     "Phase 1 — Classics",
    "phase2":     "Phase 2 — Having Fun",
    "phase3":     "Phase 3 — Uranus",
    "phase4":     "Phase 4 — Feeling Buttish",
    "community":  "Community",
}

cred = credentials.Certificate(str(SERVICE_ACCOUNT))
firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})
bucket = storage.bucket()

memes = []
blobs = bucket.list_blobs(prefix="memes/approved/")

for blob in blobs:
    if blob.name.endswith("/"):
        continue
    parts = blob.name.split("/")
    if len(parts) < 4 or not parts[-1]:
        continue
    category = parts[2]
    filename = parts[-1]
    # Construct public URL directly — no make_public() call needed
    encoded = blob.name.replace("/", "%2F")
    url = f"https://storage.googleapis.com/{STORAGE_BUCKET}/{blob.name}"
    memes.append({
        "url":      url,
        "filename": filename,
        "category": category,
        "approved": True,
    })

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(memes, f, ensure_ascii=False, indent=2)

print(f"Done. Written {len(memes)} memes to {OUTPUT_FILE}")
