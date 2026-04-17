import asyncio
import random
from datetime import datetime, timedelta
from prisma_client import Prisma
import os

async def main():
    db = Prisma()
    await db.connect()

    print('Cleaning database...')
    await db.sensorreading.delete_many()
    await db.alert.delete_many()
    await db.machine.delete_many()
    await db.failurefingerprint.delete_many()

    print('Seeding Failure Fingerprints...')
    fps = [
      {
        "id": "FP-001",
        "issue": "Early Bearing Wear",
        "pattern": "temperature and vibration increasing simultaneously over time, gradual slope over 30+ minutes",
        "severity": "medium",
        "eta_days_range": "7-14",
        "recommended_action": "Schedule bearing inspection within 48 hours. Apply lubrication and check alignment. Order replacement bearing as precaution."
      },
      {
        "id": "FP-002",
        "issue": "Thermal Overload - Cooling Failure",
        "pattern": "temperature rising sharply while vibration remains relatively stable, steep temperature slope",
        "severity": "high",
        "eta_days_range": "1-3",
        "recommended_action": "Immediately inspect cooling system and fans. Check for blockages. Reduce machine load by 30% until cooling is restored."
      },
      {
        "id": "FP-003",
        "issue": "Rotor Imbalance",
        "pattern": "vibration increasing significantly faster than temperature, asymmetric oscillation pattern",
        "severity": "medium",
        "eta_days_range": "5-10",
        "recommended_action": "Perform dynamic balancing of rotor at next scheduled downtime. Inspect mounting bolts and shaft alignment."
      },
      {
        "id": "FP-004",
        "issue": "Lubrication Degradation",
        "pattern": "both temperature and vibration slowly creeping upward over several hours, temperature leads vibration",
        "severity": "low",
        "eta_days_range": "14-21",
        "recommended_action": "Flush and replace lubricant. Sample existing lubricant for contamination analysis. Check oil seals."
      },
      {
        "id": "FP-005",
        "issue": "Resonance / Structural Looseness",
        "pattern": "vibration spikes periodically, temperature mildly elevated, erratic vibration signature",
        "severity": "medium",
        "eta_days_range": "3-7",
        "recommended_action": "Inspect all mounting hardware and structural supports. Perform resonance frequency analysis. Tighten or add isolation mounts."
      }
    ]

    for fp in fps:
        await db.failurefingerprint.create(data={
            'id': fp['id'],
            'issueName': fp['issue'],
            'severity': fp['severity'].upper(),
            'patternData': fp['pattern'],
            'etaDays': int(fp['eta_days_range'].split('-')[0]),
            'actionPrescription': fp['recommended_action']
        })

    print('Seeding Machines...')
    machine = await db.machine.create(data={
        'id': 'MCH-03',
        'name': 'Bottling Unit C',
        'line': 'Production Line 1',
        'location': 'Bay B-1',
        'baseHealth': 100,
        'status': 'NORMAL'
    })

    print('Generating and Seeding Sensor Readings...')
    readings = []
    base_time = datetime(2024, 1, 1, 8, 0, 0)
    for i in range(100):
        ts = base_time + timedelta(seconds=i * 5)
        temperature = round(random.uniform(58.0, 63.0), 2)
        vibration   = round(random.uniform(0.18, 0.28), 4)
        readings.append({
            'machineId': machine.id,
            'time': ts.replace(microsecond=0).isoformat() + 'Z',
            'temperature': float(temperature),
            'vibration': float(vibration)
        })

    for i in range(100):
        ts = base_time + timedelta(seconds=(100 + i) * 5)
        drift_factor  = i / 100
        temperature   = round(63.0 + drift_factor * 22 + random.uniform(-0.5, 0.5), 2)
        vibration     = round(0.28 + drift_factor * 0.55 + random.uniform(-0.01, 0.01), 4)
        readings.append({
            'machineId': machine.id,
            'time': ts.replace(microsecond=0).isoformat() + 'Z',
            'temperature': float(temperature),
            'vibration': float(vibration)
        })

    chunk_size = 50
    for i in range(0, len(readings), chunk_size):
        await db.sensorreading.create_many(data=readings[i:i+chunk_size])

    print('Database seeded successfully.')
    await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
