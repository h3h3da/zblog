from pydantic import BaseModel
from typing import Optional, Dict


class SiteInfo(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    # 可扩展更多键
