from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List


class TagBrief(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


class PostList(BaseModel):
    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: str
    view_count: int
    created_at: datetime
    published_at: Optional[datetime] = None
    tags: List[TagBrief] = []

    class Config:
        from_attributes = True


class PostDetail(PostList):
    content: str


class PostListResponse(BaseModel):
    items: List[PostList]
    total: int
    page: int
    size: int
