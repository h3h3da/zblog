from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
import re
from app.core.database import get_db
from app.core.security import sanitize_comment_text, sanitize_author_name, check_comment_rate_limit
from app.models import Post, Comment, Page
from app.schemas.comment import CommentCreate, CommentList, CommentListResponse

router = APIRouter(prefix="/api/comments", tags=["comments"])


class CommentCreateIn(BaseModel):
    author_name: str
    author_email: str
    content: str
    post_id: int | None = None
    page_slug: str | None = None
    parent_id: int | None = None

    @field_validator("author_name")
    @classmethod
    def name_length(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("昵称不能为空")
        if len(v) > 64:
            raise ValueError("昵称过长")
        return v.strip()

    @field_validator("author_email")
    @classmethod
    def email_format(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("邮箱不能为空")
        v = v.strip()[:255]
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v):
            raise ValueError("邮箱格式无效")
        return v

    @field_validator("content")
    @classmethod
    def content_length(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("评论内容不能为空")
        if len(v) > 2000:
            raise ValueError("评论内容过长")
        return v.strip()


@router.get("", response_model=CommentListResponse)
def list_comments(
    post_id: int | None = Query(None, ge=1),
    page_slug: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    if post_id is not None:
        q = db.query(Comment).filter(Comment.post_id == post_id, Comment.status == "approved")
    elif page_slug:
        q = db.query(Comment).filter(Comment.page_slug == page_slug, Comment.status == "approved")
    else:
        raise HTTPException(status_code=400, detail="请提供 post_id 或 page_slug")
    total = q.count()
    items = q.order_by(Comment.created_at.asc()).offset((page - 1) * size).limit(size).all()
    return CommentListResponse(
        items=[
            CommentList(
                id=c.id,
                post_id=c.post_id,
                page_slug=c.page_slug,
                parent_id=c.parent_id,
                author_name=c.author_name,
                content=c.content,
                created_at=c.created_at,
            )
            for c in items
        ],
        total=total,
        page=page,
        size=size,
    )


@router.post("", response_model=CommentList, status_code=201)
def create_comment(
    body: CommentCreateIn,
    request: Request,
    db: Session = Depends(get_db),
):
    if not check_comment_rate_limit(request.client.host if request.client else "0.0.0.0"):
        raise HTTPException(status_code=429, detail="评论提交过于频繁，请稍后再试")
    has_post = body.post_id is not None
    has_page = bool(body.page_slug and body.page_slug.strip())
    if has_post == has_page:
        raise HTTPException(status_code=400, detail="请提供 post_id 或 page_slug 之一，不能同时或都不提供")
    if body.post_id is not None:
        post = db.query(Post).filter(Post.id == body.post_id, Post.status == "published").first()
        if not post:
            raise HTTPException(status_code=400, detail="文章不存在或未发布")
        page_slug_val = None
        post_id_val = body.post_id
    else:
        slug = body.page_slug.strip()[:64]
        page = db.query(Page).filter(Page.slug == slug).first()
        if not page:
            raise HTTPException(status_code=400, detail="页面不存在")
        page_slug_val = slug
        post_id_val = None
    author_name = sanitize_author_name(body.author_name)
    content = sanitize_comment_text(body.content)
    if not author_name or not content:
        raise HTTPException(status_code=400, detail="昵称或内容无效")
    comment = Comment(
        post_id=post_id_val,
        page_slug=page_slug_val,
        parent_id=body.parent_id,
        author_name=author_name,
        author_email=body.author_email.strip()[:255],
        content=content,
        status="pending",
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:512],
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentList(
        id=comment.id,
        post_id=comment.post_id,
        page_slug=comment.page_slug,
        parent_id=comment.parent_id,
        author_name=comment.author_name,
        content=comment.content,
        created_at=comment.created_at,
    )
