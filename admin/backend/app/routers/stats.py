from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models import User, Post, Comment, Tag

router = APIRouter(prefix="/stats", tags=["stats"])


class StatsOut(BaseModel):
    total_views: int  # 站点总浏览量（所有文章 view_count 之和）
    post_count: int   # 文章总数
    published_post_count: int  # 已发布文章数
    comment_count: int
    tag_count: int


@router.get("", response_model=StatsOut)
def get_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total_views = db.query(func.coalesce(func.sum(Post.view_count), 0)).scalar() or 0
    post_count = db.query(Post).count()
    published_post_count = db.query(Post).filter(Post.status == "published").count()
    comment_count = db.query(Comment).count()
    tag_count = db.query(Tag).count()
    return StatsOut(
        total_views=int(total_views),
        post_count=post_count,
        published_post_count=published_post_count,
        comment_count=comment_count,
        tag_count=tag_count,
    )
