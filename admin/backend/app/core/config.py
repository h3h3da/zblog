from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "zblog"
    MYSQL_PASSWORD: str = ""
    MYSQL_DATABASE: str = "zblog"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 120
    BLOG_PUBLIC_URL: str = "http://localhost:5173"  # 博客前台地址，用于评论管理中的文章链接
    LOGIN_RATE_LIMIT_MAX: int = 5  # 同一 IP 在时间窗口内允许的最大失败次数
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 300  # 时间窗口（秒），默认 5 分钟

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        )

    class Config:
        env_file = ".env"


settings = Settings()
