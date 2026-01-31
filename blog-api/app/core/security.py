"""XSS sanitization and rate limiting for comments."""
import bleach
from collections import defaultdict
from time import time
from threading import Lock

# 只允许纯文本，禁止 HTML 标签
ALLOWED_TAGS = []
ALLOWED_ATTRIBUTES = {}

# 评论限流：每 IP 每分钟最多 5 条
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 5
_comment_rates: dict[str, list[float]] = defaultdict(list)
_rate_lock = Lock()


def sanitize_comment_text(text: str, max_length: int = 2000) -> str:
    """Strip HTML and limit length for comment content/author_name."""
    if not text or not isinstance(text, str):
        return ""
    cleaned = bleach.clean(text.strip(), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
    return cleaned[:max_length]


def sanitize_author_name(name: str, max_length: int = 64) -> str:
    return sanitize_comment_text(name, max_length=max_length)


def check_comment_rate_limit(ip: str) -> bool:
    """Return True if allowed, False if rate limited."""
    now = time()
    with _rate_lock:
        times = _comment_rates[ip]
        times = [t for t in times if now - t < RATE_LIMIT_WINDOW]
        if len(times) >= RATE_LIMIT_MAX:
            return False
        times.append(now)
        _comment_rates[ip] = times
    return True
