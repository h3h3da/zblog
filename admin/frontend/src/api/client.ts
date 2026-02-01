const API_BASE = "";

function getToken(): string | null {
  return localStorage.getItem("zblog_admin_token");
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("zblog_admin_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const auth = {
  login: (username: string, password: string) =>
    api<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => api<{ username: string }>("/api/auth/me"),
};

export const posts = {
  list: (params?: { page?: number; size?: number; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.size) sp.set("size", String(params.size));
    if (params?.status) sp.set("status", params.status);
    const q = sp.toString();
    return api<Post[]>(`/api/posts${q ? `?${q}` : ""}`);
  },
  get: (id: number) => api<Post>(`/api/posts/${id}`),
  create: (body: PostCreate) => api<Post>("/api/posts", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: PostUpdate) =>
    api<Post>(`/api/posts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => api<void>(`/api/posts/${id}`, { method: "DELETE" }),
};

export const tags = {
  list: () => api<Tag[]>("/api/tags"),
  create: (body: { name: string; slug: string }) =>
    api<Tag>("/api/tags", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: { name?: string; slug?: string }) =>
    api<Tag>(`/api/tags/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => api<void>(`/api/tags/${id}`, { method: "DELETE" }),
};

export const comments = {
  list: (params?: { post_id?: number; status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.post_id) sp.set("post_id", String(params.post_id));
    if (params?.status) sp.set("status", params.status);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.size) sp.set("size", String(params.size));
    const q = sp.toString();
    return api<Comment[]>(`/api/comments${q ? `?${q}` : ""}`);
  },
  setStatus: (id: number, status: "approved" | "rejected") =>
    api<{ ok: boolean }>(`/api/comments/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  delete: (id: number) => api<void>(`/api/comments/${id}`, { method: "DELETE" }),
};

export const pages = {
  list: () => api<Page[]>("/api/pages"),
  get: (slug: string) => api<Page>(`/api/pages/${slug}`),
  update: (slug: string, body: { title?: string; content?: string }) =>
    api<Page>(`/api/pages/${slug}`, { method: "PUT", body: JSON.stringify(body) }),
};

export type SiteConfig = {
  title?: string;
  description?: string;
  nav_home?: string;
  nav_tags?: string;
  nav_about?: string;
  footer?: string;
};

export const siteConfig = {
  get: () => api<SiteConfig>("/api/site"),
  update: (body: SiteConfig) =>
    api<SiteConfig>("/api/site", { method: "PUT", body: JSON.stringify(body) }),
};

export type Stats = {
  total_views: number;
  post_count: number;
  published_post_count: number;
  comment_count: number;
  tag_count: number;
};

export const stats = {
  get: () => api<Stats>("/api/stats"),
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  status: string;
  author_id: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  tag_ids: number[];
};

export type PostCreate = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  status: string;
  tag_ids: number[];
};

export type PostUpdate = Partial<PostCreate>;

export type Tag = { id: number; name: string; slug: string };

export type Comment = {
  id: number;
  post_id?: number;
  page_slug?: string;
  post_slug?: string;
  post_title?: string;
  post_url?: string;
  parent_id?: number;
  author_name: string;
  author_email: string;
  content: string;
  status: string;
  created_at: string;
};

export type Page = { id: number; slug: string; title: string; content?: string; updated_at: string };
