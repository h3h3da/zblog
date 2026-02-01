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

import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import User

engine = create_engine(settings.database_url, pool_pre_ping=True)
Session = sessionmaker(bind=engine)


def hash_password(password: str) -> str:
    # bcrypt limit 72 bytes; passlib internal test can fail, so hash with bcrypt directly
    raw = password.encode("utf-8")[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def main():
    username = os.environ.get("ADMIN_USERNAME", "").strip() or None
    password = os.environ.get("ADMIN_PASSWORD", "").strip() or None
    if not username or not password:
        username = input("Admin username [admin]: ").strip() or "admin"
        password = input("Admin password: ").strip()
    if not password:
        print("Password required")
        sys.exit(1)
    session = Session()
    try:
        existing = session.query(User).filter(User.username == username).first()
        if existing:
            if not os.environ.get("ADMIN_PASSWORD"):
                print(f"User {username} already exists. Update password? (y/n)")
                if input().strip().lower() != "y":
                    return
            existing.password_hash = hash_password(password)
            session.commit()
            print("Password updated.")
            return
        user = User(username=username, password_hash=hash_password(password))
        session.add(user)
        session.commit()
        print(f"Admin user '{username}' created.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
