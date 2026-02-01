# 云端一键部署（博客 + 数据库）

云端只部署：**MySQL + 博客前端 + blog-api**。管理后台（admin-frontend + admin-backend）在**本地**运行，通过 SSH 隧道连接云端 MySQL 进行管理。

## 一、云端服务器部署（博客 + 数据库）

### 1. 环境要求

- 云服务器（任意支持 Docker 的 Linux）
- Docker 与 Docker Compose 已安装

### 2. 一键部署步骤

在项目根目录执行：

```bash
# 1. 复制云端配置
cp .env.cloud.example .env

# 2. 编辑 .env，填写真实值（见下方配置说明）
vim .env

# 3. 一键启动（仅 MySQL + blog-api + blog-frontend）
docker-compose -f docker-compose.cloud.yml up -d
```

启动后：

- **博客前端**：默认映射到宿主机 `80` 端口，访问 `http://服务器IP` 或配置域名后访问
- **博客 API**：默认映射到宿主机 `8000` 端口
- **MySQL**：仅绑定 `127.0.0.1:3306`，不对外暴露；本地通过 SSH 隧道连接

数据库迁移、创建管理员、初始化 About 与站点配置由 blog-api 的 entrypoint 自动完成，无需再手动执行。

### 3. 云端 .env 配置说明

| 变量 | 说明 |
|------|------|
| `MYSQL_*` | 数据库密码等，与本地管理后台连接时需一致 |
| `BLOG_FRONTEND_URL` | 博客前端公网地址（如 `https://blog.example.com`），用于说明/链接 |
| `BLOG_API_URL` | 博客 API 公网地址，**前端打包时**会写入，如 `https://blog.example.com/api` 或同域则 `""` |
| `CORS_ORIGINS` | 允许跨域的来源，**生产务必**填博客域名，不要用 `*` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 管理员账号，blog-api 启动时在云端库中创建，供**本地**管理后台登录 |

**前后端同域（推荐）**：若用 Nginx 把前端和 `/api` 都代理到同一域名，则：

- `BLOG_API_URL=`（空）或 `https://你的域名`
- `CORS_ORIGINS=https://你的域名`

**前后端不同域**：例如 API 在 `https://api.example.com`：

- `BLOG_API_URL=https://api.example.com`
- `CORS_ORIGINS=https://blog.example.com`

### 4. 生产环境建议：Nginx + HTTPS

生产建议在宿主机用 Nginx 做反向代理并配置 HTTPS，例如：

- `https://你的域名/` → 博客前端（容器 80）
- `https://你的域名/api` → blog-api（容器 8000）

此时 `BLOG_API_URL` 可设为空或同域，`CORS_ORIGINS` 设为 `https://你的域名`。

---

## 二、本地运行管理后台（连接云端 MySQL）

管理后台不部署到云端，只在本地运行；通过 **SSH 隧道** 连到云端 MySQL。

### 1. 建立 SSH 隧道

在本地执行（将 `user`、`云服务器IP` 换成实际值）：

```bash
ssh -L 3306:localhost:3306 user@云服务器IP
```

保持该终端不关闭，此时本机 `localhost:3306` 即转发到云端 MySQL。

### 2. 配置本地管理后台

在项目根目录或 `admin/backend` 下创建 `.env`（可参考根目录 `.env.example`），填写：

```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=zblog
MYSQL_PASSWORD=你的云端MySQL密码（与云端 .env 中 MYSQL_PASSWORD 一致）
MYSQL_DATABASE=zblog
JWT_SECRET=请使用强随机字符串（仅本地使用）
BLOG_PUBLIC_URL=https://你的博客域名
```

### 3. 启动管理后台

**后端：**

```bash
cd admin/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**前端：**

```bash
cd admin/frontend
npm install
npm run dev
```

浏览器访问 **http://localhost:5174**，使用云端 .env 中配置的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 登录。登录后管理的是云端博客的数据（文章、标签、评论、About、站点设置等）。

---

## 三、对比：本地一键部署 vs 云端一键部署

| 项目 | 本地一键部署 | 云端一键部署 |
|------|----------------|--------------|
| 使用文件 | `docker-compose.yml` | `docker-compose.cloud.yml` |
| 启动命令 | `docker-compose up -d` | `docker-compose -f docker-compose.cloud.yml up -d` |
| 部署内容 | MySQL + 博客前端 + blog-api + 管理后台前端 + admin-backend | 仅 MySQL + 博客前端 + blog-api |
| 管理后台 | 同机运行（如 http://localhost:5174） | 在本地运行，通过 SSH 隧道连云端 MySQL |

更多开发与部署细节见 [DEVELOPMENT.md](DEVELOPMENT.md)。
