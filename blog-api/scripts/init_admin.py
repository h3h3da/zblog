"""Create first admin user. Run after migrations.
Usage: python -m scripts.init_admin
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_PORT", "3306")
os.environ.setdefault("MYSQL_USER", "zblog")
os.environ.setdefault("MYSQL_PASSWORD", "")
os.environ.setdefault("MYSQL_DATABASE", "zblog")

from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import User

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
engine = create_engine(settings.database_url, pool_pre_ping=True)
Session = sessionmaker(bind=engine)


def main():
    username = input("Admin username [admin]: ").strip() or "admin"
    password = input("Admin password: ").strip()
    if not password:
        print("Password required")
        sys.exit(1)
    session = Session()
    try:
        existing = session.query(User).filter(User.username == username).first()
        if existing:
            print(f"User {username} already exists. Update password? (y/n)")
            if input().strip().lower() != "y":
                return
            existing.password_hash = pwd_ctx.hash(password)
            session.commit()
            print("Password updated.")
            return
        user = User(username=username, password_hash=pwd_ctx.hash(password))
        session.add(user)
        session.commit()
        print(f"Admin user '{username}' created.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
