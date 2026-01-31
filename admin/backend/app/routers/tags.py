from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models import User, Tag

router = APIRouter(prefix="/tags", tags=["tags"])


class TagCreate(BaseModel):
    name: str
    slug: str


class TagUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class TagOut(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[TagOut])
def list_tags(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Tag).order_by(Tag.name).all()


@router.get("/{tag_id}", response_model=TagOut)
def get_tag(tag_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("", response_model=TagOut, status_code=201)
def create_tag(
    body: TagCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.query(Tag).filter(Tag.slug == body.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    tag = Tag(name=body.name, slug=body.slug)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagOut)
def update_tag(
    tag_id: int,
    body: TagUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if body.name is not None:
        tag.name = body.name
    if body.slug is not None:
        if db.query(Tag).filter(Tag.slug == body.slug, Tag.id != tag_id).first():
            raise HTTPException(status_code=400, detail="Slug already exists")
        tag.slug = body.slug
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
    return None
