from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List


class CommentCreate(BaseModel):
    author_name: str
    author_email: str
    content: str
    post_id: int

    class Config:
        json_schema_extra = {
            "example": {
                "author_name": "访客",
                "author_email": "guest@example.com",
                "content": "评论内容",
                "post_id": 1,
            }
        }


class CommentList(BaseModel):
    id: int
    post_id: Optional[int] = None
    page_slug: Optional[str] = None
    parent_id: Optional[int] = None
    author_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class CommentListResponse(BaseModel):
    items: List[CommentList]
    total: int
    page: int
    size: int
