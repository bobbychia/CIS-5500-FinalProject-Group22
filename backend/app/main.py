from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import api_router

app = FastAPI(
    title="CIS 5500 Housing Search API",
    description="Backend for neighborhood/property search (FastAPI + PostgreSQL on AWS RDS).",
    version="0.1.0",
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
