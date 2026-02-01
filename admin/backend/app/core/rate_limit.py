"""
按 IP 的登录尝试限流，用于防止暴力破解。
使用内存存储，多进程/多实例部署时各实例独立计数；生产可改用 Redis。
"""
import time
from collections import defaultdict
from typing import List

# ip -> 最近失败时间戳列表（仅保留窗口内的）
_login_attempts: dict[str, List[float]] = defaultdict(list)


def _get_client_ip(request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _get_settings():
    from app.core.config import settings
    return settings


def _clean_old(attempts: List[float], now: float, window_sec: float) -> None:
    cutoff = now - window_sec
    while attempts and attempts[0] < cutoff:
        attempts.pop(0)


def check_login_rate_limit(request) -> None:
    """
    若当前 IP 在窗口内失败次数已达上限，则抛出 HTTP 429。
    应在验证密码之前调用。
    """
    from fastapi import HTTPException

    s = _get_settings()
    window_sec = float(s.LOGIN_RATE_LIMIT_WINDOW_SECONDS)
    max_attempts = s.LOGIN_RATE_LIMIT_MAX
    ip = _get_client_ip(request)
    now = time.time()
    attempts = _login_attempts[ip]
    _clean_old(attempts, now, window_sec)
    if len(attempts) >= max_attempts:
        raise HTTPException(
            status_code=429,
            detail=f"登录尝试过于频繁，请 {int(window_sec / 60)} 分钟后再试",
        )


def record_login_failure(request) -> None:
    """登录失败时调用，记录一次尝试。"""
    s = _get_settings()
    window_sec = float(s.LOGIN_RATE_LIMIT_WINDOW_SECONDS)
    ip = _get_client_ip(request)
    now = time.time()
    attempts = _login_attempts[ip]
    _clean_old(attempts, now, window_sec)
    attempts.append(now)


def clear_login_attempts(request) -> None:
    """登录成功时可选调用，清空该 IP 的失败记录。"""
    ip = _get_client_ip(request)
    _login_attempts.pop(ip, None)
