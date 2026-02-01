from pydantic import BaseModel
from typing import Optional


class SiteInfo(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    nav_home: Optional[str] = None
    nav_tags: Optional[str] = None
    nav_about: Optional[str] = None
    footer: Optional[str] = None
