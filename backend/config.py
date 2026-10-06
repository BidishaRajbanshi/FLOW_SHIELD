import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "frontend", "static")

PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")
APP_NAME = "FLOW-SHIELD"
VERSION = "1.0.0"
DEFAULT_RAINFALL = 85.0  # mm/hr
