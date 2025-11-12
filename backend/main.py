from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import chat, plans
from app.auth import router as auth_router
from app.core.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

    await engine.dispose()

app = FastAPI(title="Educelo API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js фронтенд
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Разрешить все методы (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Разрешить все заголовки
)

app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
#app.include_router(plans.router, prefix="/api/v1", tags=["plans"])
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])

@app.post("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def foo():
    return {"message": "http://localhost:8000/docs"}