#!/usr/bin/env python3
import os
import time
import sqlite3
import psutil
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Generator
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# CONFIG
DB_PATH = os.getenv("CLAUDIOSOS_DB", "/var/lib/claudiosos/memory.db")
PID_FILE = os.getenv("CLAUDIOSOS_PID", "/run/claudiosd.pid")
BOOT_TIME = time.time()

if not Path(DB_PATH).parent.exists():
    DB_PATH = "./memory.db"

app = FastAPI(title="ClaudIOS API Bridge", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@contextmanager
def get_db_conn():
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def iso(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()

def ensure_schema():
    with get_db_conn() as conn:
        conn.executescript("""
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER DEFAULT (unixepoch()), role TEXT, content TEXT, session_id TEXT, token_count INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS facts (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER DEFAULT (unixepoch()), category TEXT DEFAULT 'general', fact TEXT, confidence REAL DEFAULT 1.0, source TEXT, active INTEGER DEFAULT 1);
            CREATE TABLE IF NOT EXISTS directives (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER DEFAULT (unixepoch()), directive TEXT, priority INTEGER DEFAULT 5, active INTEGER DEFAULT 1);
            CREATE TABLE IF NOT EXISTS system_state (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER DEFAULT (unixepoch()));
        """)

ensure_schema()

class FactCreate(BaseModel):
    category: str = "general"
    fact: str
    confidence: float = 1.0
    source: Optional[str] = None

class DirectiveCreate(BaseModel):
    directive: str
    priority: int = 5

class ConversationCreate(BaseModel):
    role: str
    content: str
    session_id: str
    token_count: int = 0

def get_system_state() -> dict:
    try:
        pid = int(Path(PID_FILE).read_text().strip()) if Path(PID_FILE).exists() else None
        status = "online" if pid and psutil.pid_exists(pid) else "offline"
    except: status = "offline"
    
    return {
        "status": status,
        "cpu_usage": psutil.cpu_percent(),
        "memory_usage": psutil.virtual_memory().percent,
        "uptime": int(time.time() - BOOT_TIME)
    }

@app.get("/state")
def full_state():
    with get_db_conn() as conn:
        facts = [dict(r) for r in conn.execute("SELECT * FROM facts WHERE active=1").fetchall()]
        directives = [dict(r) for r in conn.execute("SELECT * FROM directives WHERE active=1").fetchall()]
    return {"system": get_system_state(), "facts": facts, "directives": directives}

@app.post("/facts", status_code=201)
def create_fact(body: FactCreate):
    with get_db_conn() as conn:
        cur = conn.execute("INSERT INTO facts(category, fact, confidence, source) VALUES(?,?,?,?)", 
                           (body.category, body.fact, body.confidence, body.source))
        conn.commit()
        return {"id": cur.lastrowid, **body.dict()}

@app.delete("/facts/{fact_id}")
def delete_fact(fact_id: int):
    with get_db_conn() as conn:
        conn.execute("UPDATE facts SET active=0 WHERE id=?", (fact_id,))
        conn.commit()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)















