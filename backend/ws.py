import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from config import settings

router = APIRouter()
game_clients: set[WebSocket] = set()


async def broadcast(message: str) -> None:
    for client in list(game_clients):
        try:
            await client.send_text(message)
        except Exception as error:
            # a closed browser tab must not stop taps reaching the others
            print(f"[ws] dropping game client: {error!r}")
            game_clients.discard(client)


@router.websocket("/ws/device")
async def device_socket(ws: WebSocket, token: str = ""):
    if token != settings.device_token:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await ws.accept()
    print("[ws] device connected")
    try:
        while True:
            text = await ws.receive_text()
            try:
                json.loads(text)
            except json.JSONDecodeError:
                print(f"[ws] bad message from device: {text!r}")
                continue
            await broadcast(text)
    except WebSocketDisconnect:
        print("[ws] device disconnected")


@router.websocket("/ws/game")
async def game_socket(ws: WebSocket):
    await ws.accept()
    game_clients.add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        game_clients.discard(ws)
