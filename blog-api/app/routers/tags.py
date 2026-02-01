from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.core.database import get_db
from app.models import Post, Tag
from app.models.post import post_tags
from app.schemas.tag import TagList
from app.schemas.post import PostListResponse, PostList, TagBrief

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagList])
def list_tags(db: Session = Depends(get_db)):
    rows = (
        db.query(Tag.id, Tag.name, Tag.slug, func.count(Post.id).label("post_count"))
        .outerjoin(post_tags, Tag.id == post_tags.c.tag_id)
        .outerjoin(Post, and_(Post.id == post_tags.c.post_id, Post.status == "published"))
        .group_by(Tag.id, Tag.name, Tag.slug)
        .all()
    )
    return [TagList(id=r.id, name=r.name, slug=r.slug, post_count=r.post_count or 0) for r in rows]


@router.get("/{slug}/posts", response_model=PostListResponse)
def list_posts_by_tag(
    slug: str,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    from app.routers.posts import _post_to_list

    tag = db.query(Tag).filter(Tag.slug == slug).first()
    if not tag:
        return PostListResponse(items=[], total=0, page=page, size=size)
    q = db.query(Post).join(post_tags).filter(post_tags.c.tag_id == tag.id, Post.status == "published")
    total = q.count()
    items = q.order_by(Post.published_at.desc()).offset((page - 1) * size).limit(size).all()
    return PostListResponse(
        items=[_post_to_list(p) for p in items],
        total=total,
        page=page,
        size=size,
    )
