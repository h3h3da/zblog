from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import SiteConfig
from app.schemas.site import SiteInfo

router = APIRouter(prefix="/api/site", tags=["site"])


@router.get("", response_model=SiteInfo)
def get_site(db: Session = Depends(get_db)):
    rows = db.query(SiteConfig).all()
    data = {r.key: r.value for r in rows}
    return SiteInfo(
        title=data.get("title"),
        description=data.get("description"),
        nav_home=data.get("nav_home"),
        nav_tags=data.get("nav_tags"),
        nav_about=data.get("nav_about"),
        footer=data.get("footer"),
    )
