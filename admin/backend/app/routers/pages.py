from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models import Page

if TYPE_CHECKING:
    from app.models import User

router = APIRouter(prefix="/pages", tags=["pages"])


class PageOut(BaseModel):
    id: int
    slug: str
    title: str
    content: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


class PageCreate(BaseModel):
    slug: str
    title: str
    content: Optional[str] = None


class PageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


@router.get("", response_model=list[PageOut])
def list_pages(db: Session = Depends(get_db), user: "User" = Depends(get_current_user)):
    return db.query(Page).all()


@router.get("/{slug}", response_model=PageOut)
def get_page(
    slug: str,
    db: Session = Depends(get_db),
    user: "User" = Depends(get_current_user),
):
    page = db.query(Page).filter(Page.slug == slug).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.put("/{slug}", response_model=PageOut)
def update_page(
    slug: str,
    body: PageUpdate,
    db: Session = Depends(get_db),
    user: "User" = Depends(get_current_user),
):
    page = db.query(Page).filter(Page.slug == slug).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    if body.title is not None:
        page.title = body.title
    if body.content is not None:
        page.content = body.content
    db.commit()
    db.refresh(page)
    return page
