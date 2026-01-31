from pydantic import BaseModel
from typing import Optional


class TagBase(BaseModel):
    name: str
    slug: str


class TagList(BaseModel):
    id: int
    name: str
    slug: str
    post_count: Optional[int] = 0

    class Config:
        from_attributes = True
