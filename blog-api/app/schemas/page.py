from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class PageDetail(BaseModel):
    id: int
    slug: str
    title: str
    content: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
