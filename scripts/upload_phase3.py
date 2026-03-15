"""
Upload Phase 3 memes from Sciebo to Firebase Storage.
Skips files already uploaded. Then regenerates memes.json.
"""

import sys
import json
import mimetypes
import time
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, storage
except ImportError:
    print("Missing dependency. Run: pip install firebase-admin")
    sys.exit(1)

SCRIPT_DIR    = Path(__file__).parent
PROJECT_ROOT  = SCRIPT_DIR.parent
SERVICE_ACCT  = next(SCRIPT_DIR.glob("*firebase-adminsdk-*.json"), None)
SOURCE_DIR    = Path(r"C:\Users\manyw\Sciebo\Buttcoin\ClaudeButtcoin\Memes\Memes Phase 3 Uranus")
STORAGE_BUCKET = "buttcoin-fbe0f.firebasestorage.app"
CATEGORY      = "phase3"
ALLOWED_EXT   = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

if not SERVICE_ACCT:
    print("ERROR: No firebase-adminsdk key found in scripts/")
    sys.exit(1)

cred = credentials.Certificate(str(SERVICE_ACCT))
firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})
bucket = storage.bucket()

files = [f for f in SOURCE_DIR.iterdir() if f.suffix.lower() in ALLOWED_EXT]
print(f"Found {len(files)} images in Phase 3 folder")

uploaded = 0
skipped  = 0
errors   = 0

for i, file_path in enumerate(files, 1):
    dest = f"memes/approved/{CATEGORY}/{file_path.name}"
    blob = bucket.blob(dest)

    if blob.exists():
        skipped += 1
        if skipped % 100 == 0:
            print(f"  Skipped {skipped} already-uploaded files...")
        continue

    try:
        mime = mimetypes.guess_type(str(file_path))[0] or "image/jpeg"
        blob.upload_from_filename(str(file_path), content_type=mime)
        blob.make_public()
        uploaded += 1
        if uploaded % 50 == 0:
            print(f"  [{uploaded}] uploaded so far...")
    except Exception as e:
        print(f"  ERROR: {file_path.name} -> {e}")
        errors += 1

print(f"\nUpload done. Uploaded: {uploaded} | Skipped: {skipped} | Errors: {errors}")
print("\nRegenerating memes.json...")

# Regenerate memes.json from all Storage blobs
all_memes = []
category_map = {
    "iconic": "iconic",
    "phase1": "phase1",
    "phase2": "phase2",
    "phase3": "phase3",
    "phase4": "phase4",
}

blobs = bucket.list_blobs(prefix="memes/approved/")
for blob in blobs:
    parts = blob.name.split("/")
    if len(parts) < 4:
        continue
    cat_slug = parts[2]
    filename = parts[3]
    if not filename:
        continue
    blob.make_public()
    all_memes.append({
        "url":      blob.public_url,
        "filename": filename,
        "category": cat_slug,
        "approved": True,
    })

out_path = PROJECT_ROOT / "memes.json"
out_path.write_text(json.dumps(all_memes, indent=2), encoding="utf-8")
print(f"memes.json written with {len(all_memes)} entries.")
