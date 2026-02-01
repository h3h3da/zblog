from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_password, hash_password, create_access_token, get_current_user
from app.core.rate_limit import check_login_rate_limit, record_login_failure, clear_login_attempts
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginIn(BaseModel):
    username: str
    password: str


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginOut)
def login(request: Request, body: LoginIn, db: Session = Depends(get_db)):
    check_login_rate_limit(request)
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        record_login_failure(request)
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    clear_login_attempts(request)
    token = create_access_token(user.username)
    return LoginOut(access_token=token)


class MeOut(BaseModel):
    username: str


@router.get("/me", response_model=MeOut)
def me(user: User = Depends(get_current_user)):
    return MeOut(username=user.username)


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password")
def change_password(body: ChangePasswordIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not verify_password(body.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="原密码错误")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True}
