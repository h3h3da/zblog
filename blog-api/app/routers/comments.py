from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
import re
from app.core.database import get_db
from app.core.security import sanitize_comment_text, sanitize_author_name, check_comment_rate_limit
from app.models import Post, Comment
from app.schemas.comment import CommentCreate, CommentList, CommentListResponse

router = APIRouter(prefix="/api/comments", tags=["comments"])


class CommentCreateIn(BaseModel):
    author_name: str
    author_email: str
    content: str
    post_id: int

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
    post_id: int = Query(..., ge=1),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    q = db.query(Comment).filter(Comment.post_id == post_id, Comment.status == "approved")
    total = q.count()
    items = q.order_by(Comment.created_at.asc()).offset((page - 1) * size).limit(size).all()
    return CommentListResponse(
        items=[
            CommentList(
                id=c.id,
                post_id=c.post_id,
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
    post = db.query(Post).filter(Post.id == body.post_id, Post.status == "published").first()
    if not post:
        raise HTTPException(status_code=400, detail="文章不存在或未发布")
    author_name = sanitize_author_name(body.author_name)
    content = sanitize_comment_text(body.content)
    if not author_name or not content:
        raise HTTPException(status_code=400, detail="昵称或内容无效")
    comment = Comment(
        post_id=body.post_id,
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
        parent_id=comment.parent_id,
        author_name=comment.author_name,
        content=comment.content,
        created_at=comment.created_at,
    )
