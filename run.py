"""
FLOW-SHIELD Single-Command Launcher
Runs FastAPI backend and serves the interactive digital twin command center.
"""

import uvicorn
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    print("\n" + "="*60)
    print("  FLOW-SHIELD: Counterfactual Flood Digital Twin")
    print("  'Predict the flood. Simulate the response. Protect the future.'")
    print(f"  Serving live digital twin at: http://{host}:{port}")
    print("="*60 + "\n")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
