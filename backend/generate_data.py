"""
generate_data.py
================
Run this ONCE to create sensor_stream.csv

Usage:
    python generate_data.py
"""

import csv
import random
from datetime import datetime, timedelta


def generate_sensor_data():
    rows = []
    base_time = datetime(2024, 1, 1, 8, 0, 0)

    print("Generating sensor data...")

    # ---- Phase 1: Normal Baseline (rows 1-100) ----
    # Numbers bounce slightly around stable values
    for i in range(100):
        ts = base_time + timedelta(seconds=i * 5)
        temperature = round(random.uniform(58.0, 63.0), 2)   # stable ~60°C
        vibration   = round(random.uniform(0.18, 0.28), 4)   # stable ~0.23 mm/s
        rows.append([ts.strftime("%Y-%m-%d %H:%M:%S"), temperature, vibration])

    # ---- Phase 2: Drift Zone (rows 101-200) ----
    # Numbers slowly slope upward — NEVER crossing the alarm threshold (100°C / 1.0 mm/s)
    for i in range(100):
        ts = base_time + timedelta(seconds=(100 + i) * 5)

        # Gradual upward slope + small noise
        drift_factor  = i / 100          # goes from 0.0 → 1.0
        temperature   = round(63.0 + drift_factor * 22 + random.uniform(-0.5, 0.5), 2)  # 63 → ~85°C
        vibration     = round(0.28 + drift_factor * 0.55 + random.uniform(-0.01, 0.01), 4)  # 0.28 → ~0.83 mm/s

        rows.append([ts.strftime("%Y-%m-%d %H:%M:%S"), temperature, vibration])

    # Write to CSV
    with open("sensor_stream.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "temperature", "vibration"])
        writer.writerows(rows)

    print(f"✅  sensor_stream.csv created — {len(rows)} rows")
    print(f"    Rows   1-100 → Normal Baseline (temp ≈ 58-63°C, vibration ≈ 0.18-0.28 mm/s)")
    print(f"    Rows 101-200 → Drift Zone     (temp → 85°C, vibration → 0.83 mm/s)")
    print(f"    Alarm threshold: 100°C / 1.0 mm/s — the data NEVER crosses it.")


if __name__ == "__main__":
    generate_sensor_data()
