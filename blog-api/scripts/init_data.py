"""Create default about page and site_config if not exist. Run after migrations."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import engine
from app.models import Page, SiteConfig
from app.core.database import Base

# Ensure tables exist (e.g. after Alembic upgrade)
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)


def main():
    session = Session()
    try:
        about = session.query(Page).filter(Page.slug == "about").first()
        if not about:
            session.add(
                Page(slug="about", title="About", content="# About\n\n写一点自我介绍。")
            )
            session.commit()
            print("Created default About page.")
        else:
            print("About page already exists.")

        for key, value in [("title", "zblog"), ("description", "My blog")]:
            row = session.query(SiteConfig).filter(SiteConfig.key == key).first()
            if not row:
                session.add(SiteConfig(key=key, value=value))
                session.commit()
                print(f"Created site_config: {key}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
