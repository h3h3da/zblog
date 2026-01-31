import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { posts } from "../api/client";

export default function PostList() {
  const { data: list, isLoading } = useQuery({
    queryKey: ["posts-list"],
    queryFn: () => posts.list({ page: 1, size: 50 }),
  });

  if (isLoading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章</h1>
        <Link
          to="/posts/new"
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          新建文章
        </Link>
      </div>
      {list?.length ? (
        <ul className="bg-white rounded-lg shadow overflow-hidden">
          {list.map((p) => (
            <li
              key={p.id}
              className="border-b border-gray-100 last:border-0 px-4 py-3 flex justify-between items-center"
            >
              <div>
                <Link to={`/posts/${p.id}`} className="font-medium text-blue-600 hover:underline">
                  {p.title}
                </Link>
                <span className="text-gray-500 text-sm ml-2">/{p.slug}</span>
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    p.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p.status === "published" ? "已发布" : "草稿"}
                </span>
              </div>
              <span className="text-gray-400 text-sm">
                {new Date(p.updated_at).toLocaleDateString("zh-CN")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">暂无文章</p>
      )}
    </div>
  );
}
