import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { tags } from "../api/client";

export default function TagList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tags"],
    queryFn: tags.list,
  });

  if (isLoading) return <div className="text-[var(--muted)]">加载中...</div>;
  if (error) return <div className="text-red-500">加载失败</div>;
  if (!data?.length) return <div className="text-[var(--muted)]">暂无标签</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签</h1>
      <ul className="flex flex-wrap gap-3">
        {data.map((t) => (
          <li key={t.id}>
            <Link
              to={`/tag/${t.slug}`}
              className="rounded-full px-4 py-2 bg-black/5 dark:bg-white/10 hover:opacity-80"
            >
              {t.name} ({t.post_count ?? 0})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
