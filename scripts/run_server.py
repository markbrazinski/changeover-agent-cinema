#!/usr/bin/env python3
"""
Server Runner Script.
Launches the FastAPI server on http://localhost:8008.
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("changeover.server.app:app", host="0.0.0.0", port=8008, reload=True)
