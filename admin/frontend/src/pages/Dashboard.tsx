import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { posts, comments } from "../api/client";

export default function Dashboard() {
  const { data: postList } = useQuery({
    queryKey: ["posts", 1],
    queryFn: () => posts.list({ page: 1, size: 5 }),
  });
  const { data: pendingComments } = useQuery({
    queryKey: ["comments", "pending"],
    queryFn: () => comments.list({ status: "pending", page: 1, size: 10 }),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">最近文章</h2>
          {postList?.length ? (
            <ul className="space-y-2">
              {postList.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link to={`/posts/${p.id}`} className="text-blue-600 hover:underline">
                    {p.title}
                  </Link>
                  <span className="text-gray-500 text-sm ml-2">({p.status})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">暂无文章</p>
          )}
          <Link to="/posts" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
            管理文章 →
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">待审核评论</h2>
          {pendingComments?.length ? (
            <ul className="space-y-2">
              {pendingComments.slice(0, 5).map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="font-medium">{c.author_name}</span>: {c.content.slice(0, 50)}…
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">暂无待审核评论</p>
          )}
          <Link to="/comments" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
            管理评论 →
          </Link>
        </div>
      </div>
      <div className="flex gap-4">
        <Link
          to="/posts/new"
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          写新文章
        </Link>
        <Link to="/about" className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
          编辑 About
        </Link>
      </div>
    </div>
  );
}
