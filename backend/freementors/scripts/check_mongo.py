"""
MongoDB connection sanity check for Free Mentors.

Usage:
    cd freementors
    MONGO_URI="mongodb://localhost:27017" python scripts/check_mongo.py

Verifies:
    1. Pymongo can reach the MongoDB server.
    2. Server version is reported.
    3. Django + Djongo can open a connection through the ORM.
    4. The 'freementors' database is reachable and lists collections.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")

print("=" * 60)
print("Free Mentors - MongoDB Connection Check")
print("=" * 60)
print(f"MONGO_URI: {MONGO_URI}")
print()

print("[1/4] Importing pymongo...")
try:
    from pymongo import MongoClient
    from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
    print("      OK  pymongo imported")
except ImportError as e:
    print(f"      FAIL  {e}")
    print("      Run: pip install 'pymongo==3.12.3'")
    sys.exit(1)

print("[2/4] Connecting to MongoDB server (5s timeout)...")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    info = client.server_info()
    print(f"      OK  Connected. MongoDB version: {info.get('version')}")
except (ServerSelectionTimeoutError, ConnectionFailure) as e:
    print(f"      FAIL  Could not reach MongoDB: {e}")
    print("      Make sure MongoDB is running and the URI is correct.")
    sys.exit(2)

print("[3/4] Listing databases...")
try:
    dbs = client.list_database_names()
    print(f"      OK  Databases found: {dbs}")
    if "freementors" in dbs:
        coll = client["freementors"].list_collection_names()
        print(f"      'freementors' collections: {coll}")
    else:
        print("      'freementors' DB does not exist yet (will be created on first migrate).")
except Exception as e:
    print(f"      WARN  {e}")

print("[4/4] Loading Django + Djongo...")
try:
    import django
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "freementors_project.settings")
    os.environ["MONGO_URI"] = MONGO_URI
    django.setup()
    from django.conf import settings
    from django.db import connection
    print(f"      Django version: {django.get_version()}")
    print(f"      Engine:         {settings.DATABASES['default']['ENGINE']}")
    print(f"      DB name:        {settings.DATABASES['default']['NAME']}")
    if settings.DATABASES["default"]["ENGINE"] != "djongo":
        print("      WARN  Engine is NOT djongo. Re-export MONGO_URI before running.")
    else:
        connection.ensure_connection()
        print("      OK  Django can open a Djongo connection.")
except Exception as e:
    print(f"      FAIL  {e}")
    sys.exit(3)

print()
print("=" * 60)
print("All checks passed. Next steps:")
print("  python manage.py migrate --run-syncdb")
print("  python manage.py seed_db")
print("  python manage.py runserver 0.0.0.0:8000")
print("=" * 60)
