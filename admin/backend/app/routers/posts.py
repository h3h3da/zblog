from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models import User, Post, Tag
from app.models.post import post_tags  # Table for many-to-many

router = APIRouter(prefix="/posts", tags=["posts"])


class PostCreate(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: str = "draft"
    tag_ids: List[int] = []


class PostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[str] = None
    tag_ids: Optional[List[int]] = None


class PostOut(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    excerpt: Optional[str]
    cover_image: Optional[str]
    status: str
    author_id: int
    view_count: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    tag_ids: List[int] = []

    class Config:
        from_attributes = True


@router.get("", response_model=List[PostOut])
def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Post).order_by(Post.updated_at.desc())
    if status:
        q = q.filter(Post.status == status)
    items = q.offset((page - 1) * size).limit(size).all()
    return [
        PostOut(
            id=p.id,
            title=p.title,
            slug=p.slug,
            content=p.content,
            excerpt=p.excerpt,
            cover_image=p.cover_image,
            status=p.status,
            author_id=p.author_id,
            view_count=p.view_count,
            created_at=p.created_at,
            updated_at=p.updated_at,
            published_at=p.published_at,
            tag_ids=[t.id for t in p.tags],
        )
        for p in items
    ]


@router.get("/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostOut(
        id=post.id,
        title=post.title,
        slug=post.slug,
        content=post.content,
        excerpt=post.excerpt,
        cover_image=post.cover_image,
        status=post.status,
        author_id=post.author_id,
        view_count=post.view_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        published_at=post.published_at,
        tag_ids=[t.id for t in post.tags],
    )


@router.post("", response_model=PostOut, status_code=201)
def create_post(
    body: PostCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.query(Post).filter(Post.slug == body.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    post = Post(
        title=body.title,
        slug=body.slug,
        content=body.content,
        excerpt=body.excerpt,
        cover_image=body.cover_image,
        status=body.status,
        author_id=user.id,
        published_at=datetime.utcnow() if body.status == "published" else None,
    )
    db.add(post)
    db.flush()
    for tag_id in body.tag_ids:
        db.execute(post_tags.insert().values(post_id=post.id, tag_id=tag_id))
    db.commit()
    db.refresh(post)
    return PostOut(
        id=post.id,
        title=post.title,
        slug=post.slug,
        content=post.content,
        excerpt=post.excerpt,
        cover_image=post.cover_image,
        status=post.status,
        author_id=post.author_id,
        view_count=post.view_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        published_at=post.published_at,
        tag_ids=body.tag_ids,
    )


@router.put("/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    body: PostUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if body.title is not None:
        post.title = body.title
    if body.slug is not None:
        if db.query(Post).filter(Post.slug == body.slug, Post.id != post_id).first():
            raise HTTPException(status_code=400, detail="Slug already exists")
        post.slug = body.slug
    if body.content is not None:
        post.content = body.content
    if body.excerpt is not None:
        post.excerpt = body.excerpt
    if body.cover_image is not None:
        post.cover_image = body.cover_image
    if body.status is not None:
        post.status = body.status
        if body.status == "published" and not post.published_at:
            post.published_at = datetime.utcnow()
    if body.tag_ids is not None:
        db.execute(post_tags.delete().where(post_tags.c.post_id == post_id))
        for tag_id in body.tag_ids:
            db.execute(post_tags.insert().values(post_id=post_id, tag_id=tag_id))
    db.commit()
    db.refresh(post)
    return PostOut(
        id=post.id,
        title=post.title,
        slug=post.slug,
        content=post.content,
        excerpt=post.excerpt,
        cover_image=post.cover_image,
        status=post.status,
        author_id=post.author_id,
        view_count=post.view_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        published_at=post.published_at,
        tag_ids=body.tag_ids if body.tag_ids is not None else [t.id for t in post.tags],
    )


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return None


@router.post("/preview")
def preview_post(body: BaseModel):
    """Optional: return rendered HTML for preview. Frontend can also render Markdown locally."""
    return {"ok": True, "message": "Use frontend Markdown renderer for preview"}
