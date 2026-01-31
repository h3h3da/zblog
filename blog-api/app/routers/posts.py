from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.core.database import get_db
from app.models import Post, Tag
from app.models.post import post_tags  # noqa: F401 - used in relationship
from app.schemas.post import PostList, PostDetail, PostListResponse, TagBrief
from datetime import datetime

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=PostListResponse)
def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    tag: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Post).filter(Post.status == "published")
    if tag:
        q = q.join(post_tags).join(Tag).filter(Tag.slug == tag)
    total = q.count()
    items = q.order_by(Post.published_at.desc().nulls_last()).offset((page - 1) * size).limit(size).all()
    return PostListResponse(
        items=[_post_to_list(p) for p in items],
        total=total,
        page=page,
        size=size,
    )


def _post_to_list(p: Post) -> PostList:
    return PostList(
        id=p.id,
        title=p.title,
        slug=p.slug,
        excerpt=p.excerpt,
        cover_image=p.cover_image,
        status=p.status,
        view_count=p.view_count,
        created_at=p.created_at,
        published_at=p.published_at,
        tags=[TagBrief(id=t.id, name=t.name, slug=t.slug) for t in p.tags],
    )


@router.get("/{slug}", response_model=PostDetail)
def get_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.slug == slug, Post.status == "published").first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.view_count = (post.view_count or 0) + 1
    db.commit()
    return PostDetail(
        **_post_to_list(post).model_dump(),
        content=post.content,
    )
