# zblog

个人博客系统：前后端分离，Python FastAPI 后端，MySQL，Docker Compose 同机部署；管理后台直连 MySQL（SSH 隧道），Markdown 编辑与文章预览，仅本地运行。

- **开发文档**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)  
- **云端部署**: [docs/DEPLOY_CLOUD.md](docs/DEPLOY_CLOUD.md)（仅博客 + 数据库，管理后台本地）

## 快速开始

### 本地一键部署（博客 + 管理后台同机）

1. 复制配置并填写真实值：
   ```bash
   cp .env.example .env
   # 编辑 .env：MYSQL_PASSWORD、CORS_ORIGINS 等
   ```

2. 启动所有服务（MySQL + 博客前端 + blog-api + 管理后台前端 + admin-backend）：
   ```bash
   docker-compose up -d
   ```

3. 博客前端: `http://localhost:5173`，API: `http://localhost:8000`，管理后台: `http://localhost:5174`。数据库迁移与管理员创建由 blog-api 启动时自动执行。

### 云端一键部署（仅博客 + 数据库，管理后台在本地）

云端只部署 **MySQL + 博客前端 + blog-api**；管理后台在本地运行，通过 SSH 隧道连接云端 MySQL。

1. 复制云端配置并填写真实值：
   ```bash
   cp .env.cloud.example .env
   # 编辑 .env：MYSQL_PASSWORD、CORS_ORIGINS、BLOG_API_URL、ADMIN_USERNAME/ADMIN_PASSWORD 等
   ```

2. 一键启动云端服务：
   ```bash
   docker-compose -f docker-compose.cloud.yml up -d
   ```

3. 本地运行管理后台：建立 SSH 隧道 `ssh -L 3306:localhost:3306 user@云服务器IP`，在本地配置 `MYSQL_HOST=localhost` 后启动 admin-backend 与 admin-frontend。详见 **[docs/DEPLOY_CLOUD.md](docs/DEPLOY_CLOUD.md)**。

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
- `docs/DEVELOPMENT.md` — 开发与部署说明。`docs/DEPLOY_CLOUD.md` — 云端一键部署说明。
