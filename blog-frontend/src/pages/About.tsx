import { useQuery } from "@tanstack/react-query";
import { pages } from "../api/client";
import Markdown from "../components/Markdown";

export default function About() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["about"],
    queryFn: pages.about,
  });

  if (isLoading) return <div className="text-[var(--muted)]">加载中...</div>;
  if (error) return <div className="text-red-500">加载失败</div>;
  if (!data) return <div className="text-[var(--muted)]">暂无内容</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{data.title || "About"}</h1>
      {data.content ? <Markdown content={data.content} /> : <p className="text-[var(--muted)]">暂无介绍</p>}
    </div>
  );
}
