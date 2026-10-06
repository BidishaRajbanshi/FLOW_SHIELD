"""
FLOW-SHIELD In-Memory & SQLite Store for Scenarios and Citizen Reports
"""

import sqlite3
import json
import os
from typing import List, Optional
from backend.models.schemas import CitizenReport, ScenarioRequest

DB_PATH = os.path.join(os.path.dirname(__file__), "flow_shield.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citizen_reports (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        location_name TEXT NOT NULL,
        water_depth_cm REAL NOT NULL,
        timestamp_min INTEGER NOT NULL,
        photo_type TEXT NOT NULL,
        reported_by TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0
    )
    """)
    conn.commit()
    conn.close()

class ReportStore:
    def __init__(self):
        init_db()
        # Seed default realistic community reports
        self._seed_default_reports()

    def _seed_default_reports(self):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM citizen_reports")
        count = cursor.fetchone()[0]
        if count == 0:
            seed_data = [
                ("REP-101", "R09", "South Valley Slum Underpass", 35.0, 18, "road_submerged", "Resident Warden Kumar", 1),
                ("REP-102", "R06", "Financial Towers Basement Ramp", 22.5, 22, "canal_overflow", "Security Lead Rao", 1),
                ("REP-103", "R13", "Ring Highway Km 14 Culvert", 18.0, 28, "water_clogging", "Traffic Patrol 4", 1)
            ]
            cursor.executemany("""
                INSERT INTO citizen_reports (id, region_id, location_name, water_depth_cm, timestamp_min, photo_type, reported_by, verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, seed_data)
            conn.commit()
        conn.close()

    def get_all_reports(self) -> List[CitizenReport]:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, region_id, location_name, water_depth_cm, timestamp_min, photo_type, reported_by, verified FROM citizen_reports ORDER BY timestamp_min ASC")
        rows = cursor.fetchall()
        conn.close()
        return [
            CitizenReport(
                id=r[0],
                region_id=r[1],
                location_name=r[2],
                water_depth_cm=r[3],
                timestamp_min=r[4],
                photo_type=r[5],
                reported_by=r[6],
                verified=bool(r[7])
            ) for r in rows
        ]

    def add_report(self, report: CitizenReport):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO citizen_reports (id, region_id, location_name, water_depth_cm, timestamp_min, photo_type, reported_by, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (report.id, report.region_id, report.location_name, report.water_depth_cm, report.timestamp_min, report.photo_type, report.reported_by, int(report.verified)))
        conn.commit()
        conn.close()
