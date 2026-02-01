const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

export const posts = {
  list: (params?: { page?: number; size?: number; tag?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.size) sp.set("size", String(params.size));
    if (params?.tag) sp.set("tag", params.tag);
    const q = sp.toString();
    return api<{ items: Post[]; total: number; page: number; size: number }>(
      `/api/posts${q ? `?${q}` : ""}`
    );
  },
  get: (slug: string) => api<PostDetail>(`/api/posts/${slug}`),
};

export const tags = {
  list: () => api<Tag[]>("/api/tags"),
  posts: (slug: string, params?: { page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.size) sp.set("size", String(params.size));
    const q = sp.toString();
    return api<{ items: Post[]; total: number; page: number; size: number }>(
      `/api/tags/${encodeURIComponent(slug)}/posts${q ? `?${q}` : ""}`
    );
  },
};

export const comments = {
  list: (
    params: { post_id?: number; page_slug?: string; page?: number; size?: number }
  ) => {
    const sp = new URLSearchParams();
    if (params.post_id != null) sp.set("post_id", String(params.post_id));
    if (params.page_slug) sp.set("page_slug", params.page_slug);
    if (params.page) sp.set("page", String(params.page));
    if (params.size) sp.set("size", String(params.size));
    return api<{ items: Comment[]; total: number; page: number; size: number }>(
      `/api/comments?${sp.toString()}`
    );
  },
  create: (body: {
    author_name: string;
    author_email: string;
    content: string;
    post_id?: number;
    page_slug?: string;
    parent_id?: number;
  }) => api<Comment>("/api/comments", { method: "POST", body: JSON.stringify(body) }),
};

export const pages = {
  about: () => api<Page>("/api/pages/about"),
};

export const site = {
  info: () =>
    api<{
      title?: string;
      description?: string;
      nav_home?: string;
      nav_tags?: string;
      nav_about?: string;
      footer?: string;
    }>("/api/site"),
};

export type Tag = { id: number; name: string; slug: string; post_count?: number };
export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image?: string;
  status: string;
  view_count: number;
  created_at: string;
  published_at?: string;
  tags: Tag[];
};
export type PostDetail = Post & { content: string };
export type Comment = {
  id: number;
  post_id?: number;
  page_slug?: string;
  parent_id?: number;
  author_name: string;
  content: string;
  created_at: string;
};
export type Page = { id: number; slug: string; title: string; content?: string; updated_at: string };
