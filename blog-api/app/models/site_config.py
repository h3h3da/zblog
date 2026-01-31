from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from app.core.database import Base


class SiteConfig(Base):
    __tablename__ = "site_config"

    key = Column(String(64), primary_key=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
