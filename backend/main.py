import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import api
import db
import ws
from config import settings
from scheduler import run_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    db.seed_demo()
    scheduler = asyncio.create_task(run_scheduler())
    yield
    scheduler.cancel()


app = FastAPI(title="Rehabit", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_methods=["*"], allow_headers=["*"])
app.include_router(api.router)
app.include_router(ws.router)
