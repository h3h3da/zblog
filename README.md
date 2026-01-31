# zblog

个人博客系统：前后端分离，Python FastAPI 后端，MySQL，Docker Compose 同机部署；管理后台直连 MySQL（SSH 隧道），Markdown 编辑与文章预览，仅本地运行。

- **开发文档**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

## 快速开始

### 云服务器部署（博客）

1. 复制配置并填写真实值：
   ```bash
   cp .env.example .env
   # 编辑 .env：MYSQL_PASSWORD、CORS_ORIGINS 等
   ```

2. 启动服务：
   ```bash
   docker-compose up -d
   ```

3. 执行数据库迁移并创建管理员与默认数据：
   ```bash
   docker-compose exec blog-api alembic upgrade head
   docker-compose exec blog-api python -m scripts.init_admin   # 按提示输入用户名密码
   docker-compose exec blog-api python -m scripts.init_data    # 创建 About 页与站点配置
   ```

4. 博客前端: `http://服务器IP:5173`，API: `http://服务器IP:8000`。生产环境建议使用 Nginx 做 HTTPS 与反向代理。

### 本地开发

**博客（blog-api + blog-frontend）**

- 启动 MySQL（例如本地 Docker）：
  ```bash
  docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=zblog -e MYSQL_USER=zblog -e MYSQL_PASSWORD=zblog mysql:8
  ```
- 在项目根目录创建 `.env`，设置 `MYSQL_HOST=localhost`、`MYSQL_PASSWORD=zblog` 等。
- blog-api：
  ```bash
  cd blog-api && pip install -r requirements.txt && alembic upgrade head && python -m scripts.init_admin && python -m scripts.init_data && uvicorn app.main:app --reload --port 8000
  ```
- blog-frontend：
  ```bash
  cd blog-frontend && npm install && npm run dev
  ```
- 访问博客: http://localhost:5173，API: http://localhost:8000。

**管理后台（仅本地，直连 MySQL）**

- 连接云上 MySQL：在本地执行 SSH 隧道：
  ```bash
  ssh -L 3306:localhost:3306 user@云服务器
  ```
- 在 `admin/backend` 下创建 `.env`（可复制 `.env.example`），设置 `MYSQL_HOST=localhost`、`MYSQL_PORT=3306`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE`、`JWT_SECRET`。
- 启动 admin 后端与前端：
  ```bash
  cd admin/backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8001
  cd admin/frontend && npm install && npm run dev
  ```
- 访问管理后台: http://localhost:5174，登录后即可管理文章、标签、评论、About。博客页面不包含任何后台入口。

## 目录结构

- `blog-api/` — 博客公开 API（FastAPI），仅公开接口，无管理接口。
- `blog-frontend/` — 博客前端（React + Vite + TypeScript），日/夜模式、Markdown 渲染。
- `admin/backend/` — 管理后台后端（FastAPI），直连 MySQL，JWT 鉴权。
- `admin/frontend/` — 管理后台前端（React + Vite），Markdown 编辑与预览、评论审核。
- `docs/DEVELOPMENT.md` — 开发与部署说明。

部署步骤、环境要求以 **docs/DEVELOPMENT.md** 为准。
