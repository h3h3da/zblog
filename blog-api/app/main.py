from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import posts, tags, comments, pages, site

# 建表由 Alembic 迁移完成，此处仅用于开发时可选 create_all
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="zblog API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts.router)
app.include_router(tags.router)
app.include_router(comments.router)
app.include_router(pages.router)
app.include_router(site.router)


@app.get("/health")
def health():
    return {"status": "ok"}
