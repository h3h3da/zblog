from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.config import settings
from app.models import User, Comment, Post

router = APIRouter(prefix="/comments", tags=["comments"])


class CommentOut(BaseModel):
    id: int
    post_id: Optional[int] = None
    page_slug: Optional[str] = None
    post_slug: Optional[str] = None
    post_title: Optional[str] = None
    post_url: Optional[str] = None
    parent_id: Optional[int]
    author_name: str
    author_email: str
    content: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CommentStatusUpdate(BaseModel):
    status: str  # approved | rejected


@router.get("", response_model=List[CommentOut])
def list_comments(
    post_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Comment).order_by(Comment.created_at.desc())
    if post_id is not None:
        q = q.filter(Comment.post_id == post_id)
    if status:
        q = q.filter(Comment.status == status)
    items = q.offset((page - 1) * size).limit(size).all()
    base_url = (settings.BLOG_PUBLIC_URL or "").rstrip("/")
    result = []
    for c in items:
        if c.post_id is not None:
            post = db.query(Post).filter(Post.id == c.post_id).first()
            post_slug = post.slug if post else None
            post_title = post.title if post else None
            post_url = f"{base_url}/post/{post_slug}" if base_url and post_slug else None
        else:
            post_slug = c.page_slug
            post_title = f"页面: {c.page_slug}" if c.page_slug else None
            post_url = f"{base_url}/{c.page_slug}" if base_url and c.page_slug else None
        result.append(
            CommentOut(
                id=c.id,
                post_id=c.post_id,
                page_slug=c.page_slug,
                post_slug=post_slug,
                post_title=post_title,
                post_url=post_url,
                parent_id=c.parent_id,
                author_name=c.author_name,
                author_email=c.author_email,
                content=c.content,
                status=c.status,
                created_at=c.created_at,
            )
        )
    return result


@router.put("/{comment_id}/status")
def update_comment_status(
    comment_id: int,
    body: CommentStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be approved or rejected")
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.status = body.status
    db.commit()
    return {"ok": True}


@router.delete("/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
    return None
