import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { tags } from "../api/client";

export default function TagPosts() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["tag-posts", slug],
    queryFn: () => tags.posts(slug!, { page: 1, size: 20 }),
    enabled: !!slug,
  });

  if (isLoading || !slug) return <div className="text-[var(--muted)]">加载中...</div>;
  if (error) return <div className="text-red-500">加载失败</div>;
  if (!data?.items?.length)
    return (
      <div>
        <p className="text-[var(--muted)]">该标签下暂无文章</p>
        <Link to="/tags" className="text-blue-500 hover:underline mt-4 inline-block">
          返回标签列表
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">标签: {slug}</h1>
      <ul className="space-y-4">
        {data.items.map((p) => (
          <li key={p.id}>
            <Link to={`/post/${p.slug}`} className="block group">
              <h2 className="text-lg font-semibold group-hover:underline">{p.title}</h2>
              <span className="text-[var(--muted)] text-sm">
                {new Date(p.created_at).toLocaleDateString("zh-CN")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/tags" className="text-[var(--muted)] hover:text-[var(--text)]">
        返回标签列表
      </Link>
    </div>
  );
}
