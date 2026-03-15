"""
Bulk upload memes to Firebase Storage + Firestore
Usage:
  1. Download service account key from Firebase Console:
     Project Settings → Service accounts → Generate new private key
     Save as: scripts/serviceAccountKey.json
  2. Install dependencies:
     pip install firebase-admin
  3. Run:
     python scripts/upload_memes.py

Uploads all images from assets/memes/ to Firebase Storage (memes/approved/)
and creates Firestore documents for each with approved=True.
"""

import os
import sys
import json
import mimetypes
from pathlib import Path

# ── Check dependencies ────────────────────────────────────────
try:
    import firebase_admin
    from firebase_admin import credentials, storage, firestore
except ImportError:
    print("Missing dependency. Run: pip install firebase-admin")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────
SCRIPT_DIR      = Path(__file__).parent
PROJECT_ROOT    = SCRIPT_DIR.parent
SERVICE_ACCOUNT = SCRIPT_DIR / "serviceAccountKey.json"
MEMES_DIR       = PROJECT_ROOT / "assets" / "memes"
STORAGE_BUCKET  = "butttcoin-fbe0f.firebasestorage.app"

# Map folder names to category slugs
CATEGORY_MAP = {
    "Iconic":                    "iconic",
    "Memes Phase 1 Classics":    "phase1",
    "Memes Phase 2 Having fun":  "phase2",
    "Memes Phase 3 Uranus":      "phase3",
    "Memes Phase 4 Feeling buttish": "phase4",
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".jfif"}

# ── Init Firebase ─────────────────────────────────────────────
if not SERVICE_ACCOUNT.exists():
    print(f"ERROR: Service account key not found at {SERVICE_ACCOUNT}")
    print("Download it from: Firebase Console → Project Settings → Service accounts → Generate new private key")
    sys.exit(1)

cred = credentials.Certificate(str(SERVICE_ACCOUNT))
firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})

bucket = storage.bucket()
db     = firestore.client()

# ── Upload ────────────────────────────────────────────────────
uploaded = 0
skipped  = 0
errors   = 0

for folder_name, category_slug in CATEGORY_MAP.items():
    folder_path = MEMES_DIR / folder_name
    if not folder_path.exists():
        print(f"Skipping missing folder: {folder_path}")
        continue

    files = [f for f in folder_path.iterdir() if f.suffix.lower() in ALLOWED_EXTENSIONS]
    print(f"\n[{folder_name}] → {len(files)} files (category: {category_slug})")

    for file_path in files:
        dest_path = f"memes/approved/{category_slug}/{file_path.name}"

        # Skip if already uploaded
        blob = bucket.blob(dest_path)
        if blob.exists():
            print(f"  SKIP (exists): {file_path.name}")
            skipped += 1
            continue

        try:
            mime_type = mimetypes.guess_type(str(file_path))[0] or "image/jpeg"
            blob.upload_from_filename(str(file_path), content_type=mime_type)
            blob.make_public()
            url = blob.public_url

            # Add Firestore document
            db.collection("memes").add({
                "url":          url,
                "filename":     file_path.name,
                "category":     category_slug,
                "approved":     True,
                "uploadedBy":   "admin-bulk-import",
                "uploaderEmail": "bulk-import",
                "uploadedAt":   firestore.SERVER_TIMESTAMP,
                "fileSize":     file_path.stat().st_size,
                "fileType":     mime_type,
            })

            print(f"  OK: {file_path.name}")
            uploaded += 1

        except Exception as e:
            print(f"  ERROR: {file_path.name} — {e}")
            errors += 1

print(f"\n{'='*50}")
print(f"Done. Uploaded: {uploaded} | Skipped: {skipped} | Errors: {errors}")
