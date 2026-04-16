import asyncio
import httpx
import websockets
import json

async def test_ws():
    # 1. Start feed
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://127.0.0.1:8000/api/start-feed?machine_id=MCH-03")
        print(f"Start Feed: {resp.status_code} {resp.text}")
    
    # 2. Connect WS
    async with websockets.connect("ws://127.0.0.1:8000/ws/feed/MCH-03") as ws:
        for i in range(5):
            msg = await ws.recv()
            print(f"WS Received: {msg}")

if __name__ == "__main__":
    asyncio.run(test_ws())
