from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models import User, SiteConfig

router = APIRouter(prefix="/site", tags=["site"])


class SiteConfigOut(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    nav_home: Optional[str] = None
    nav_tags: Optional[str] = None
    nav_about: Optional[str] = None
    footer: Optional[str] = None


class SiteConfigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    nav_home: Optional[str] = None
    nav_tags: Optional[str] = None
    nav_about: Optional[str] = None
    footer: Optional[str] = None


KEYS = ["title", "description", "nav_home", "nav_tags", "nav_about", "footer"]


@router.get("", response_model=SiteConfigOut)
def get_site_config(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.query(SiteConfig).filter(SiteConfig.key.in_(KEYS)).all()
    data = {r.key: r.value for r in rows}
    return SiteConfigOut(
        title=data.get("title"),
        description=data.get("description"),
        nav_home=data.get("nav_home"),
        nav_tags=data.get("nav_tags"),
        nav_about=data.get("nav_about"),
        footer=data.get("footer"),
    )


@router.put("", response_model=SiteConfigOut)
def update_site_config(
    body: SiteConfigUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    payload = body.model_dump(exclude_unset=True)
    for key, value in payload.items():
        if key not in KEYS:
            continue
        row = db.query(SiteConfig).filter(SiteConfig.key == key).first()
        if row:
            row.value = value if value is not None else ""
        else:
            db.add(SiteConfig(key=key, value=value or ""))
    db.commit()
    rows = db.query(SiteConfig).filter(SiteConfig.key.in_(KEYS)).all()
    data = {r.key: r.value for r in rows}
    return SiteConfigOut(
        title=data.get("title"),
        description=data.get("description"),
        nav_home=data.get("nav_home"),
        nav_tags=data.get("nav_tags"),
        nav_about=data.get("nav_about"),
        footer=data.get("footer"),
    )
