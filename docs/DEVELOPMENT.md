# zblog 开发文档

## 1. 项目概述

zblog 是一个前后端分离的个人博客系统，后端采用 **Python FastAPI**，支持文章发布（Markdown 编辑）、评论、标签、个人介绍页，并配有**仅在本机运行**的后台管理系统。博客前端、博客 API、MySQL **部署在同一台云服务器**；管理后台在**本地电脑**启动，**通过 SSH 隧道连接云上 MySQL** 进行维护（云上 MySQL 不暴露公网端口，见第 8.2 节），**不依赖博客 API**，博客 API 也不提供任何 `/api/admin/*` 管理接口。博客前端支持**日间 / 夜间模式**切换。博客页面不包含任何后台入口。

### 1.1 核心需求

| 需求项 | 说明 |
|--------|------|
| 后端技术 | Python FastAPI（仅博客公开 API） |
| 前后端分离 | 博客前端、博客 API 通过 HTTP 通信；管理后台独立，直连 MySQL |
| 数据库 | MySQL |
| 部署方式 | Docker Compose 一键部署；博客前端 + 博客 API + MySQL 同机部署于云服务器 |
| 后台部署 | 管理后台在**本地电脑**启动，**通过 SSH 隧道连接云上 MySQL**（云上 MySQL 不暴露公网端口，见 8.2 节），不部署在云服务器、不对公网开放 |
| 后台与博客 API | **博客 API 不提供管理接口**；管理后台不需要调用博客 API，只需能连接 MySQL 即可 |
| 配置管理 | 敏感信息集中在一个配置文件，便于管理与替换 |
| 评论系统 | 访客**无需注册**，填写昵称、邮箱、评论内容即可提交；评论需在后台**审核通过**后才在博客展示 |
| 标签系统 | 文章支持多标签（Tag），可按标签筛选 |
| About 页 | 个人介绍页，内容可配置/可编辑 |
| 文章编辑 | 后台使用 **Markdown** 进行文章编辑与展示 |
| 文章预览 | 管理后台支持**文章预览**，编辑时可实时或按需查看 Markdown 渲染效果，与博客前端展示一致 |
| 入口隔离 | 博客页面不包含后台管理系统的任何入口或链接 |
| 博客主题 | 博客前端支持**日间 / 夜间模式**切换，并可持久化用户选择（如 localStorage） |
| 安全 | 防范 XSS、SSRF、SQL 注入等常见攻击，见第 9 节 |

---

## 2. 系统架构

### 2.1 整体架构图

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                        云服务器（同一台机器）                                  │
  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐      │
  │  │  博客前端    │───►│  博客 API   │───►│  MySQL                      │      │
  │  │  (SPA)      │    │  FastAPI    │    │  (Docker / 同机)             │      │
  │  └─────────────┘    │  仅公开 API  │    └──────────────▲──────────────┘      │
  │         ▲            └─────────────┘                   │                      │
  │         │ 公网访问                                      │ SSH 隧道（仅管理员）  │
  └─────────┼─────────────────────────────────────────────┼────────────────────┘
            │                                               │
    访客浏览器                                               │
                                                            │
  ┌─────────────────────────────────────────────────────────┴────────────────────┐
  │                    本地电脑（管理员维护）                                       │
  │  ┌─────────────────────────────────────┐                                     │
  │  │  管理后台（前端 + 本地后端）          │ ──直连──► localhost:3306 ──隧道──► 云 MySQL │
  │  │  localhost 启动，Markdown 文章编辑   │   （不经过博客 API，无 /api/admin）  │
  │  └─────────────────────────────────────┘                                     │
  └──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

| 模块 | 说明 | 对外暴露 | 部署位置 |
|------|------|----------|----------|
| **blog-frontend** | 博客展示前端（文章列表、详情、标签、About、评论） | 是 | **云服务器**（与 API、MySQL 同机） |
| **blog-api** | 博客 REST API，Python FastAPI，**仅公开接口**（文章、评论、标签、About），**无管理接口** | 是 | **云服务器**（同机） |
| **mysql** | 数据库；云上仅本机/内网访问，不暴露公网端口，管理员通过 **SSH 隧道** 从本地连接 | 否 | **云服务器**（容器或同机内网） |
| **admin** | 管理后台（前端 + 直连 MySQL 的后端），文章/评论/标签/About 的增删改查均在本地完成 | 否 | **仅本地电脑**（localhost） |

- **云服务器**：博客前端、博客 API、MySQL 通过 Docker Compose 部署在同一台机器；博客 API **不提供** `/api/admin/*`，只提供博客展示所需的公开 API。
- **本地电脑**：管理后台在本地运行，**通过 SSH 隧道连接云上 MySQL** 进行 CRUD。云上 MySQL 不暴露公网端口；管理员在本地执行 `ssh -L 3306:localhost:3306 user@云服务器` 建立隧道后，admin 连接 `localhost:3306` 即通过隧道访问云上 MySQL。
- 博客前端不包含任何指向后台的链接或入口。

---

## 3. 技术栈

### 3.1 博客前端 (blog-frontend)

- **运行时**: 建议 Node.js 18+（与 Dockerfile 及本地开发一致）。
- **框架**: React + Vite 或 Next.js（如需 SEO 可选 SSR）
- **语言**: TypeScript
- **样式**: Tailwind CSS 或 CSS Modules
- **状态/请求**: React Query + fetch/axios
- **路由**: React Router 或 Next.js Router
- **Markdown 渲染**: 文章详情页使用 Markdown 渲染库（如 react-markdown）展示，服务端存 Markdown 原文。
- **主题切换**: 支持**日间 / 夜间模式**切换（如 CSS 变量 + `prefers-color-scheme` 或主题 class）；用户选择可持久化到 localStorage，下次访问自动应用。

### 3.2 博客 API (blog-api) — **Python FastAPI**

- **运行时**: Python 3.10+
- **框架**: **FastAPI**
- **职责**: **仅提供博客公开 API**（文章列表/详情、标签、About、评论列表与提交），**不提供任何管理接口**（无 `/api/admin/*`）。
- **ORM**: SQLAlchemy 2.x + 参数化查询（严禁拼接 SQL，防 SQL 注入）
- **校验**: Pydantic 请求体/参数校验、统一异常与错误码
- **安全**: 见第 9 节（XSS/SSRF/SQL 注入防护、评论审核流程）

### 3.3 管理后台 (admin)

- **形态**: 本地应用，包含前端 UI + 连接 MySQL 的后端（如 Python FastAPI 或 Node 小服务），**不调用博客 API**，所有管理操作通过直连 MySQL 完成。blog-api 与 admin 同仓，可共享 SQLAlchemy 模型或迁移，减少重复与不一致。
- **运行时**: 建议 Node.js 18+（前端）；后端与 blog-api 一致为 Python 3.10+。
- **前端**: React + Vite + TypeScript 或 Vue3 + Vite + TypeScript；UI 库如 Ant Design / Element Plus / shadcn/ui。
- **文章编辑**: **Markdown 编辑器**（如 MDXEditor、Vditor、bytemd 等），编辑与预览可同屏；保存时由本地后端写入 MySQL（posts 表）。
- **文章预览**: 编辑文章时支持**实时或按需预览**，与博客前端渲染效果一致（如使用同一套 Markdown 渲染库与样式），便于编辑时查看最终展示效果；可实现为编辑器内置预览面板或独立预览页。
- **数据连接**: 本地后端配置 MySQL 连接（见第 8.2 节）：通过 **SSH 隧道** 访问云上 MySQL（先建立隧道，再连接 `localhost:3306`）。配置放在 **`admin/backend/.env`**（或 `admin/.env` 由 backend 读取），避免多环境混淆。登录校验、文章/评论/标签/About 的 CRUD 均直接读写 MySQL。

### 3.4 数据库与缓存

- **MySQL**: 8.x，字符集 utf8mb4；所有访问经 ORM 参数化查询，禁止手写拼接 SQL。
- **Redis**: 可选，用于评论限流、缓存等。

### 3.5 部署与运维

- **云服务器**: Docker Compose 部署 blog-frontend、blog-api、MySQL（同机）；配置统一由 `.env` 注入。
- **反向代理**: Nginx 用于公网域名、HTTPS、静态资源与 API 反向代理。
- **本地**: 管理后台在本地运行，直连 MySQL（通过 SSH 隧道访问云上 MySQL），不部署到公网、不依赖博客 API。

---

## 4. 目录结构建议

```
zblog/
├── docker-compose.yml          # 云服务器一键部署（博客前端、blog-api、MySQL）
├── .env.example                # 配置模板（不含敏感信息）
├── .env                        # 实际配置（不提交 Git）
├── docs/
│   └── DEVELOPMENT.md         # 本文档
├── blog-frontend/             # 博客前端（部署在云服务器）
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── blog-api/                  # 博客 API（Python FastAPI，仅公开接口，部署在云服务器）
│   ├── Dockerfile
│   ├── pyproject.toml 或 requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/            # 仅公开路由：posts, tags, comments, pages, site
│   │   └── core/
│   └── alembic/               # 可选：数据库迁移
├── admin/                     # 管理后台（仅本地运行，直连 MySQL，无 /api/admin）
│   ├── backend/               # 本地后端，连接 MySQL，提供登录与 CRUD 接口
│   │   ├── pyproject.toml 或 requirements.txt
│   │   └── app/
│   └── frontend/              # 管理后台前端，Markdown 编辑，请求本地 backend
│       ├── package.json
│       └── src/
└── config/                    # 集中配置（可选）
    └── config.schema.json     # 配置项说明
```

- 云服务器敏感配置（数据库密码等）放在根目录 `.env`，Docker Compose 通过 `env_file: .env` 注入 blog-api 与 MySQL。
- 本地管理后台：MySQL 连接配置放在 **`admin/backend/.env`**（`MYSQL_HOST=localhost`, `MYSQL_PORT=3306`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`）；先建立 SSH 隧道后 backend 读取该配置直连 MySQL，**不依赖博客 API**。

---

## 5. 数据库设计

### 5.1 表清单

| 表名 | 说明 |
|------|------|
| `users` | 后台用户（仅用于后台登录，与博客访客隔离） |
| `posts` | 文章 |
| `tags` | 标签 |
| `post_tags` | 文章-标签多对多 |
| `comments` | 评论 |
| `pages` | 单页（如 About） |
| `site_config` | 站点配置键值（可选） |

### 5.2 表结构（概要）

**users**（后台管理员，仅用于后台登录）

- `id`, `username`, `password_hash`, `created_at`, `updated_at`

**posts**（文章内容为 Markdown 存储；当前为单管理员博客，author_id 指向唯一管理员，若未来多作者可扩展）

- `id`, `title`, `slug`, `content`(Markdown 原文), `excerpt`, `cover_image`, `status`(draft/published), `author_id`(FK → users.id), `view_count`, `created_at`, `updated_at`, `published_at`
- 关键字段类型建议：`title` VARCHAR(255), `slug` VARCHAR(255) UNIQUE, `content` TEXT, `excerpt` VARCHAR(500)；详见迁移脚本。

**tags**

- `id`, `name`, `slug`, `created_at`

**post_tags**

- `post_id`, `tag_id`, 主键 (post_id, tag_id)

**comments**（访客无需注册，提交后需后台审核才展示）

- `id`, `post_id`, `parent_id`(可选，用于回复), `author_name`, `author_email`, `content`, `status`(pending/approved/rejected), `ip`, `user_agent`, `created_at`, `updated_at`
- 建议字段长度与 API 校验一致：如 `author_name` VARCHAR(64)、`content` TEXT 或限制最大长度（如 2000）；公开接口只返回 `status=approved` 的评论；提交评论时 `status` 默认为 `pending`，管理员在后台审核通过后改为 `approved`。

**pages**（如 About，内容可为 Markdown）

- `id`, `slug`(如 about), `title`, `content`(Markdown 原文), `updated_at`

**site_config**

- `key`, `value`, `updated_at`（用于站点标题、描述、About 开关等）

### 5.3 索引与规范

- 文章：`slug` 唯一索引，`status`+`published_at` 用于列表查询。
- 评论：`post_id`、`status`、`created_at` 索引。
- 标签：`slug` 唯一。
- 所有表使用 `utf8mb4`，必要字段做长度与非空约束。

---

## 6. API 设计概要

### 6.1 博客 API（blog-api，云服务器，仅公开接口）

博客 API **不提供任何管理接口**，仅以下公开接口供博客前端与 RSS 等使用。**分页与错误码约定**见第 11 节。

- `GET /api/posts` — 文章列表（分页、按标签筛选、仅 status=published）。建议查询参数：`page`（从 1 开始）、`size`（每页条数，如 10）、`tag`（标签 slug，可选）。
- `GET /api/posts/:slug` — 文章详情（按 slug，返回 Markdown 或由前端渲染）
- `GET /api/tags` — 标签列表（含文章数）
- `GET /api/tags/:slug/posts` — 某标签下的文章（建议同样支持 `page`、`size`）
- `GET /api/pages/about` — About 页内容
- `GET /api/comments?post_id=xxx` — 某文章评论列表（**仅返回 status=approved**）；建议支持 `page`、`size`。
- `POST /api/comments` — 提交评论（**无需登录**，请求体：`author_name`, `author_email`, `content`, `post_id`；入库时 `status=pending`；需校验与限流，防 XSS/注入，见第 9 节）
- `GET /api/site` — 站点基础信息（标题、描述等，可选）

### 6.2 管理后台（admin，仅本地，直连 MySQL）

管理后台**不调用博客 API**。本地运行的 admin 后端直连 MySQL，可自行定义本地 API 形态（如 `POST /login`、`GET/POST/PUT/DELETE /posts`、`/tags`、`/comments`、`/pages` 等），仅供本地 admin 前端调用；鉴权（如 session 或 JWT）由 admin 后端自行实现，与 blog-api 无关。文章 content 为 Markdown 原文；评论审核即更新 `comments.status` 为 approved/rejected。**文章预览**：可在编辑页提供实时或按需预览（前端使用与博客一致的 Markdown 渲染库渲染当前内容）；若需服务端参与，可提供本地接口如 `POST /preview` 接收 Markdown 返回渲染结果，或仅由前端本地渲染预览。

---

## 7. 配置管理

### 7.1 统一配置文件

- **云服务器**：使用项目根目录 `.env` 作为敏感配置来源，由 Docker Compose 的 `env_file` 注入到 blog-api、MySQL 等容器。
- **示例项（云服务器）**：
  - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
  - `REDIS_URL`（可选）
  - `BLOG_FRONTEND_URL`、`BLOG_API_URL`（博客前端请求 API 的地址，用于 CORS 等）
  - `CORS_ORIGINS`（允许的博客前端域名，仅博客前端即可，无需包含管理后台）
- **本地管理后台**：在 **`admin/backend/.env`** 中配置 MySQL 连接（`MYSQL_HOST=localhost`, `MYSQL_PORT=3306`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`）。先执行 `ssh -L 3306:localhost:3306 user@云服务器` 建立隧道，admin 连接 localhost:3306 即访问云上 MySQL。admin 的登录与鉴权由 admin 后端自行实现（如 JWT 或 session），与 blog-api 无关。

### 7.2 .env.example 与安全

- 仓库中只提交 **`.env.example`**（根目录），列出所有 key 与占位值，不含真实密码与密钥；部署时复制为 `.env` 并填写真实值。示例内容见下方；admin 的配置可单独提供 `admin/backend/.env.example` 或合并说明。
- `.env` 加入 `.gitignore`；云服务器与 admin 各自使用自己的 `.env`。
- MySQL 不对外网暴露端口；管理员仅通过 SSH 隧道从本地连接。

**根目录 .env.example 示例（占位，勿填真实值）**：

```bash
# 云服务器 Docker Compose 使用
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=zblog
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=zblog
BLOG_FRONTEND_URL=https://your-blog-domain.com
BLOG_API_URL=https://your-blog-domain.com
CORS_ORIGINS=https://your-blog-domain.com
# REDIS_URL=redis://redis:6379
```

---

## 8. Docker Compose 与部署

### 8.1 云服务器（同一台机器）

- **docker-compose.yml** 在云服务器上运行，包含：
  - `mysql`：MySQL 8，挂载数据卷，使用 `.env` 中的密码。**端口仅映射到主机 127.0.0.1**（如 `ports: ["127.0.0.1:3306:3306"]`），不绑定 0.0.0.0，这样云上 MySQL 不暴露公网，同时本机 SSH 隧道（`ssh -L 3306:localhost:3306 user@云服务器`）可连到主机 localhost:3306 再转发到容器；blog-api 通过 Docker 网络访问 MySQL。
  - `blog-api`：Python FastAPI，依赖 MySQL，暴露端口如 8000（或通过 Nginx 反向代理到 80/443）。
  - `blog-frontend`：静态构建结果由 Nginx 提供；暴露 80/443 或由 Nginx 统一反向代理。**生产环境推荐使用 Nginx** 做 HTTPS、静态资源与 API 反向代理。若不用 Nginx，需由 blog-api 提供静态文件或单独起静态服务，并明确端口/域名规划。
  - 可选：`redis`、`nginx`（推荐 Nginx 做 HTTPS 与静态资源）。
- 所有敏感配置来自 `env_file: .env`；博客前端、博客 API、MySQL 均部署在**同一台云服务器**。

### 8.2 本地电脑（管理后台）与 SSH 隧道连接 MySQL

管理后台不部署在云服务器，仅在**本地电脑**运行，**通过 SSH 隧道连接云上 MySQL**，不调用博客 API。

- 云上 **MySQL 不对外暴露 3306 端口**，仅本机或内网可访问（blog-api 等容器通过 Docker 网络访问）。
- 管理员在本地执行：`ssh -L 3306:localhost:3306 user@云服务器`，将本地 3306 转发到云服务器上的 MySQL。
- admin 后端配置 MySQL 为 `host=localhost`, `port=3306`，连接即通过隧道到达云上 MySQL；数据库不暴露在公网，复用 SSH 认证与加密。

**步骤**：

1. 在本地建立 SSH 隧道后，配置 admin 的 MySQL 连接（host=localhost, port=3306, user, password, database）。
2. 进入 `admin/backend` 与 `admin/frontend`，启动 admin 后端与前端。
3. 管理后台前端请求本地 admin 后端（如 `http://localhost:8001`），后端直连 MySQL 做登录校验与文章/评论/标签/About 的 CRUD；评论审核即更新 `comments.status`。

### 8.3 一键启动

- **云服务器**：`docker-compose up -d`，启动博客前端、blog-api、MySQL（同机）；博客 API 仅公开接口，无管理接口。
- **本地**：先执行 `ssh -L 3306:localhost:3306 user@云服务器` 建立隧道，再启动 admin 后端与前端。博客页面不包含任何后台入口。

### 8.4 本地开发环境

开发时可在本地运行 blog-api、blog-frontend、admin，无需部署到云服务器：

- **MySQL**：本地使用 Docker 启动 MySQL（如 `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=... mysql:8`），或使用 `docker-compose.dev.yml` 仅启动 MySQL + blog-api，前端 `npm run dev` 连本地 API。
- **blog-api**：本地 `uvicorn app.main:app --reload` 或等价命令，连接本地 MySQL（`.env` 中 `MYSQL_HOST=localhost`）。
- **blog-frontend**：本地 `npm run dev`，配置 API 地址为本地 blog-api（如 `http://localhost:8000`）。
- **admin**：本地启动 admin 后端与前端，连接本地 MySQL（`admin/backend/.env` 中 `MYSQL_HOST=localhost`）；或经 SSH 隧道连接云上 MySQL 做联调。首次建库与第一个管理员创建方式见 Phase 5 与部署文档。

---

## 9. 安全与访问控制

### 9.1 部署与访问控制

- **博客端**：只读 API + 评论提交；评论需在管理后台审核通过后才展示，并配合频率限制与反垃圾（如 Honeypot）。
- **后台**：管理后台仅在**本地电脑**运行，直连 MySQL（通过 SSH 隧道），不部署在云服务器、不调用博客 API；博客 API 无管理接口，公网不提供后台登录或入口。
- **博客页面**：不包含“后台登录”“管理入口”等任何链接或文案，避免泄露后台存在与地址。
- **MySQL**：云上 MySQL 不对外暴露 3306 端口；管理员仅通过 **SSH 隧道** 从本地连接。
- **admin 鉴权**：管理后台的登录与鉴权由 admin 本地后端实现（如 JWT 或 session），强密码、合理过期时间；与 blog-api 无关。

### 9.2 SQL 注入防护

- **禁止手写拼接 SQL**：所有数据库访问必须通过 **SQLAlchemy ORM** 或 **参数化查询**（如 `session.execute(text("SELECT ... WHERE id = :id"), {"id": id})`），绝不将用户输入或请求参数直接拼进 SQL 字符串。
- **校验与类型**：路径参数、查询参数、请求体统一用 Pydantic 做类型与格式校验（如 id 为整数、slug 为合法字符串），非法请求直接 400。
- **迁移与建表**：使用 Alembic 或脚本建表，表名、列名不依赖用户输入。

### 9.3 XSS 防护

- **评论与用户生成内容**：
  - **服务端**：评论内容、昵称等入库前做**转义或白名单过滤**（如使用 `bleach` 只允许安全标签/无标签纯文本）；或统一存为纯文本，禁止 HTML 标签。
  - **前端**：展示评论、昵称时使用**文本渲染**（如 React 默认转义、`textContent`），不要使用 `dangerouslySetInnerHTML` 渲染未过滤的用户内容；若需支持 Markdown，使用受控的 Markdown 渲染库（如 `react-markdown`）并关闭不安全的 HTML 或使用白名单。
- **文章与 About**：文章/About 为管理员在后台编辑的 Markdown，渲染时使用受控的 Markdown→HTML 管道，禁止执行脚本；若 Markdown 中允许 HTML，需严格白名单或关闭 raw HTML。
- **响应头**：设置 `Content-Type: application/json` 及合适的 `X-Content-Type-Options`，前端与 API 分离时注意 CORS 与 CSP（Content-Security-Policy）配置，减少内联脚本风险。

### 9.4 SSRF 防护

- **不代理或请求用户提供的 URL**：博客与后台功能中，不在服务端根据用户输入（如评论中的链接、表单中的 URL）去请求第三方 URL；若未来有“抓取预览”等需求，必须使用白名单域名、禁止内网 IP（如 127.0.0.1、10.x、172.16.x、192.168.x）、禁止 file:// 等协议，并做超时与大小限制。
- **评论中的链接**：若前端将评论中的 URL 转为可点击链接，仅做前端展示与 `rel="noopener noreferrer"`，不在服务端请求该 URL。
- **后台配置**：站点 URL、API 地址等由管理员在本地或配置文件中填写，不依赖未校验的用户输入。

### 9.5 评论相关安全

- **提交评论**：
  - 请求体严格校验：`author_name`、`author_email`、`content` 长度与格式（如邮箱格式）；`post_id` 必须存在且为已发布文章。
  - 内容入库前：昵称、内容做 XSS 过滤或纯文本存储；禁止在评论中插入未转义的 HTML/脚本。
- 限流：按 IP 或 IP+post_id 限制单位时间内提交次数（建议如每 IP 每分钟最多 5 条评论），防止刷评论与滥用。
- 可选：Honeypot、简单验证码或人机验证，降低机器人提交。
- **审核**：仅管理员在本地后台进行审核；审核通过前评论不在公开 API 中返回。
- **CSRF**：博客 API 为 JSON 接口、无 Cookie 会话时，可不依赖 CSRF Token；若博客前端与 API 同域且使用 Cookie 鉴权，需配置 SameSite 或 CSRF 防护。

### 9.6 其他安全建议

- **HTTPS**：云服务器对外一律使用 HTTPS；管理后台与云服务器之间通过 **SSH 隧道** 加密，不调用博客 API。
- **依赖**：定期更新 FastAPI、SQLAlchemy、前端依赖，修复已知漏洞。
- **敏感配置**：数据库密码、JWT 密钥等仅放在 `.env`，不提交仓库；生产环境不打印敏感信息。
- **CORS**：API 的 CORS 配置仅允许博客前端域名与（若需）本地开发域名，不使用 `*`。
- **错误信息**：生产环境不向用户返回详细堆栈或数据库错误，统一返回通用错误信息。

---

## 10. 开发阶段与任务拆分

### Phase 1：基础与数据库

1. 初始化 blog-api 项目（Python FastAPI、SQLAlchemy、连接 MySQL、读 `.env` 配置）。
2. 设计并执行数据库迁移（建表、索引）；所有查询使用 ORM/参数化，禁止拼接 SQL。
3. 编写 `.env.example`，文档说明各配置项。

### Phase 2：博客 API

1. 实现文章、标签、post_tags 的 CRUD 与公开查询接口；文章 content 为 Markdown 原文。
2. 实现 About 页接口与站点配置接口（若需）。
3. 实现评论的提交（无需登录，昵称/邮箱/内容，入库 status=pending）与列表（仅 approved）；提交时做 XSS 过滤、长度与格式校验、限流（见第 9 节）。评论审核由 admin 在 Phase 4 通过直连 MySQL 完成，blog-api 不提供审核接口。

### Phase 3：博客前端

1. 搭建 blog-frontend（路由：首页、文章详情、标签列表/标签文章、About）。
2. 对接文章列表/详情（Markdown 渲染）、标签、About、评论列表与提交表单（昵称、邮箱、内容）。
3. **日间 / 夜间模式**切换（主题切换 + 持久化到 localStorage）；样式与响应式；不包含任何后台入口。

### Phase 4：管理后台（仅本地运行，直连 MySQL）

1. 搭建 admin 后端（如 Python FastAPI）：连接 MySQL、登录校验（users 表）、文章/标签/评论/About 的 CRUD；**不**在 blog-api 中提供 `/api/admin/*`，所有管理逻辑在 admin 后端完成。
2. 搭建 admin 前端（登录页、仪表盘、文章/标签/评论/About 管理）；**文章编辑使用 Markdown 编辑器**，提交 Markdown 原文到本地 admin 后端；**文章预览**：编辑时支持实时或按需预览，与博客前端渲染效果一致（如使用同一套 Markdown 渲染库与样式），便于编辑时查看最终展示效果。
3. 文档说明：管理后台在**本地电脑**启动，通过 SSH 隧道连接云服务器 MySQL，不部署在云服务器、不调用博客 API。

### Phase 5：Docker 与部署（云服务器）

1. 各项目 Dockerfile；**docker-compose.yml** 在云服务器上整合 MySQL、blog-api、blog-frontend（同机部署）；blog-api **仅公开接口**，无管理路由。
2. 配置统一从 `.env` 注入；Nginx 配置 HTTPS 与反向代理（可选）。
3. 编写部署文档（首次建库、**如何创建第一个管理员账号**（如 Alembic/脚本建表后手动或脚本插入 users 表、或 admin 首次打开时引导创建）、本地 SSH 隧道命令及如何启动 admin 并连接 MySQL）。

### Phase 6：完善与优化

1. 评论审核流程、通知（可选）；安全复查（XSS/SSRF/SQL 注入、限流、CORS）。
2. 标签与文章缓存（若使用 Redis）。
3. SEO、sitemap、RSS（可选）。

---

## 11. 文档与约定

### 11.1 分页与错误码约定

- **分页**：列表类接口建议统一使用 `page`（从 1 开始）、`size`（每页条数，默认如 10）；响应中可包含 `total` 或 `has_more` 便于前端分页。
- **错误响应**：统一 JSON 格式，如 `{"detail": "错误描述", "code": "ERROR_CODE"}`；HTTP 状态码：400 参数错误、401 未认证、403 无权限、404 未找到、429 限流。具体字段与错误码可在 blog-api 的 OpenAPI 中维护。

### 11.2 文档与 README

- **README.md**：项目介绍、本地开发命令（见第 8.4 节）、Docker 部署命令；不描述后台公网地址，仅说明“后台仅本地使用”。部署步骤、环境要求以**本文档**为准，README 做简要入口并链接至 `docs/DEVELOPMENT.md`。
- **API 文档**：可使用 OpenAPI/Swagger 在 blog-api 中维护，便于前后端对齐；分页参数与错误码在 OpenAPI 中与 11.1 一致。
- **分支与提交**：主分支保持可部署；功能在 feature 分支开发，通过 PR 合并。
- **文档维护**：实现时同步更新本文档（如具体 API 路径、错误码、表字段变更）；`.env.example` 与目录结构以本文档为准。
