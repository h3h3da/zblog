import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { comments, type Comment } from "../api/client";

export default function CommentList() {
  const queryClient = useQueryClient();
  const { data: list, isLoading } = useQuery({
    queryKey: ["comments-admin"],
    queryFn: () => comments.list({ page: 1, size: 100 }),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      comments.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments-admin"] }),
  });

  const deleteComment = useMutation({
    mutationFn: (id: number) => comments.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments-admin"] }),
  });

  if (isLoading) return <div>加载中...</div>;

  const pending = list?.filter((c: Comment) => c.status === "pending") ?? [];
  const approved = list?.filter((c: Comment) => c.status === "approved") ?? [];
  const rejected = list?.filter((c: Comment) => c.status === "rejected") ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">评论管理</h1>
      <p className="text-gray-600 mb-4">
        待审核: {pending.length} · 已通过: {approved.length} · 已拒绝: {rejected.length}
      </p>
      <ul className="space-y-4">
        {(list ?? []).map((c: Comment) => (
          <li key={c.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium">{c.author_name}</span>
                <span className="text-gray-500 text-sm ml-2">{c.author_email}</span>
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    c.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : c.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {c.status === "pending" ? "待审核" : c.status === "approved" ? "已通过" : "已拒绝"}
                </span>
                <p className="mt-2 text-gray-700">{c.content}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date(c.created_at).toLocaleString("zh-CN")}
                  {" · "}
                  {c.post_url && c.post_title ? (
                    <a
                      href={c.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      《{c.post_title}》
                    </a>
                  ) : (
                    <>文章 ID: {c.post_id}</>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {c.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStatus.mutate({ id: c.id, status: "approved" })}
                      className="text-green-600 hover:underline text-sm"
                    >
                      通过
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus.mutate({ id: c.id, status: "rejected" })}
                      className="text-red-600 hover:underline text-sm"
                    >
                      拒绝
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => deleteComment.mutate(c.id)}
                  className="text-gray-500 hover:underline text-sm"
                >
                  删除
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!list?.length && <p className="text-gray-500">暂无评论</p>}
    </div>
  );
}
