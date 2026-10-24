"""Pretend to be the ESP32 board. Run the backend first, then: python fake_device.py

Type 1-6 and Enter for a tap, h for a palm hold, l or r to switch hands,
auto for random taps, stop to end auto, q to quit.
"""
import asyncio
import json
import random
import time

import websockets

from config import settings

URL = f"ws://localhost:8000/ws/device?token={settings.device_token}"
AUTO_INTERVAL_S = 0.8
PALM_PAD = 6


def message(kind: str, pad: int, hand: str) -> str:
    return json.dumps({"type": kind, "pad": pad, "hand": hand, "ms": int(time.monotonic() * 1000)})


async def auto_taps(ws, hand: str) -> None:
    while True:
        await ws.send(message("tap", random.randint(1, PALM_PAD), hand))
        await asyncio.sleep(AUTO_INTERVAL_S)


async def main() -> None:
    hand, auto = "right", None
    async with websockets.connect(URL) as ws:
        print(__doc__)
        while True:
            cmd = (await asyncio.to_thread(input, f"[{hand}] > ")).strip().lower()
            if cmd == "q":
                break
            if cmd in ("l", "r"):
                hand = "left" if cmd == "l" else "right"
            elif cmd == "h":
                await ws.send(message("hold", PALM_PAD, hand))
            elif cmd == "auto" and auto is None:
                auto = asyncio.create_task(auto_taps(ws, hand))
            elif cmd == "stop" and auto:
                auto.cancel()
                auto = None
            elif cmd.isdigit() and 1 <= int(cmd) <= PALM_PAD:
                await ws.send(message("tap", int(cmd), hand))
            else:
                print("Type 1-6, h, l, r, auto, stop or q.")


if __name__ == "__main__":
    asyncio.run(main())
