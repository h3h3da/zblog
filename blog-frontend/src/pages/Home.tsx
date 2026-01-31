import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { posts } from "../api/client";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts", 1],
    queryFn: () => posts.list({ page: 1, size: 10 }),
  });

  if (isLoading) return <div className="text-[var(--muted)]">加载中...</div>;
  if (error) return <div className="text-red-500">加载失败</div>;
  if (!data?.items?.length) return <div className="text-[var(--muted)]">暂无文章</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">文章列表</h1>
      <ul className="space-y-6">
        {data.items.map((p) => (
          <li key={p.id} className="border-b border-[var(--border)] pb-6">
            <Link to={`/post/${p.slug}`} className="block group">
              <h2 className="text-xl font-semibold group-hover:underline">{p.title}</h2>
              {p.excerpt && (
                <p className="mt-2 text-[var(--muted)] text-sm line-clamp-2">{p.excerpt}</p>
              )}
              <div className="mt-2 flex gap-2 text-sm text-[var(--muted)]">
                <span>{new Date(p.created_at).toLocaleDateString("zh-CN")}</span>
                {p.tags?.length ? (
                  <span>
                    {p.tags.map((t) => (
                      <Link
                        key={t.id}
                        to={`/tag/${t.slug}`}
                        className="mr-2 hover:text-[var(--text)]"
                      >
                        #{t.name}
                      </Link>
                    ))}
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {data.total > data.size && (
        <p className="text-[var(--muted)] text-sm">
          共 {data.total} 篇，当前第 1 页（可扩展分页）
        </p>
      )}
    </div>
  );
}
