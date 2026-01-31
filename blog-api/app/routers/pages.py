from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Page
from app.schemas.page import PageDetail

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("/about", response_model=PageDetail)
def get_about(db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.slug == "about").first()
    if not page:
        raise HTTPException(status_code=404, detail="About page not found")
    return PageDetail(
        id=page.id,
        slug=page.slug,
        title=page.title,
        content=page.content,
        updated_at=page.updated_at,
    )


@router.get("/{slug}", response_model=PageDetail)
def get_page(slug: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.slug == slug).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return PageDetail(
        id=page.id,
        slug=page.slug,
        title=page.title,
        content=page.content,
        updated_at=page.updated_at,
    )
