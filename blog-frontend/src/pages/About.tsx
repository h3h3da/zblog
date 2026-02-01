import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { pages, comments } from "../api/client";
import type { Comment } from "../api/client";
import Markdown from "../components/Markdown";

const PAGE_SLUG = "about";

/** 顶级评论 + 其下所有回复（扁平，仅二级） */
function buildCommentSections(items: Comment[]): { top: Comment; replies: Comment[] }[] {
  const byParent: Record<number, Comment[]> = {};
  const idToComment: Record<number, Comment> = {};
  items.forEach((c) => {
    idToComment[c.id] = c;
    const pid = c.parent_id ?? 0;
    if (!byParent[pid]) byParent[pid] = [];
    byParent[pid].push(c);
  });
  const topList = byParent[0] ?? [];
  function allDescendants(id: number): Comment[] {
    const direct = byParent[id] ?? [];
    return direct.concat(direct.flatMap((c) => allDescendants(c.id)));
  }
  return topList.map((top) => ({
    top,
    replies: allDescendants(top.id),
  }));
}

export default function About() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyingToName, setReplyingToName] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["about"],
    queryFn: pages.about,
  });

  const { data: commentData } = useQuery({
    queryKey: ["comments", "page", PAGE_SLUG],
    queryFn: () => comments.list({ page_slug: PAGE_SLUG, page: 1, size: 50 }),
  });

  const sections = useMemo(
    () => (commentData?.items ? buildCommentSections(commentData.items) : []),
    [commentData?.items]
  );
  const idToComment = useMemo(() => {
    const map: Record<number, Comment> = {};
    commentData?.items?.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [commentData?.items]);

  const submitComment = useMutation({
    mutationFn: comments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "page", PAGE_SLUG] });
      setContent("");
    },
  });

  const submitReply = useMutation({
    mutationFn: (body: {
      author_name: string;
      author_email: string;
      content: string;
      page_slug: string;
      parent_id: number;
    }) => comments.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "page", PAGE_SLUG] });
      setReplyingToId(null);
      setReplyingToName("");
      setContent("");
    },
  });

  const isReplyMode = replyingToId !== null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReplyMode) {
      submitReply.mutate({
        author_name: name,
        author_email: email,
        content,
        page_slug: PAGE_SLUG,
        parent_id: replyingToId,
      });
    } else {
      submitComment.mutate({
        author_name: name,
        author_email: email,
        content,
        page_slug: PAGE_SLUG,
      });
    }
  };

  const handleReply = (id: number, authorName: string) => {
    setReplyingToId(id);
    setReplyingToName(authorName);
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyingToName("");
  };

  const handleSubmitReplyForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingToId) return;
    submitReply.mutate({
      author_name: name,
      author_email: email,
      content,
      page_slug: PAGE_SLUG,
      parent_id: replyingToId,
    });
  };

  if (isLoading) return <div className="text-[var(--muted)]">加载中...</div>;
  if (error) return <div className="text-red-500">加载失败</div>;
  if (!data) return <div className="text-[var(--muted)]">暂无内容</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">{data.title || "About"}</h1>
        {data.content ? (
          <Markdown content={data.content} />
        ) : (
          <p className="text-[var(--muted)]">暂无介绍</p>
        )}
      </div>

      <section className="border-t border-[var(--border)] pt-8">
        <h2 className="text-xl font-semibold mb-4">评论</h2>

        {!replyingToId && (
          <div className="max-w-xl mb-8">
            <h3 className="text-lg font-medium mb-3">发表评论</h3>
            <p className="text-sm text-[var(--muted)] mb-4">
              提交后需管理员审核通过才会显示。
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">昵称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={64}
                  className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">评论内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  maxLength={2000}
                  rows={4}
                  className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={submitComment.isPending || submitReply.isPending}
                className="rounded bg-neutral-700 dark:bg-neutral-300 text-white dark:text-black px-4 py-2 hover:opacity-90 disabled:opacity-50"
              >
                {submitComment.isPending || submitReply.isPending ? "提交中…" : "提交评论"}
              </button>
              {(submitComment.isError || submitReply.isError) && (
                <p className="text-red-500 text-sm">
                  {String(submitComment.error || submitReply.error)}
                </p>
              )}
            </form>
          </div>
        )}

        {sections.length > 0 ? (
          <ul className="space-y-6 list-none pl-0">
            {sections.map(({ top, replies }) => (
              <li key={top.id}>
                <div className="border-l-2 border-[var(--border)] pl-4">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium">{top.author_name}</span>
                    <span className="text-[var(--muted)] text-sm">
                      {new Date(top.created_at).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <p className="mt-1 text-[var(--text)] whitespace-pre-wrap">{top.content}</p>
                  <button
                    type="button"
                    onClick={() => handleReply(top.id, top.author_name)}
                    className="mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    回复
                  </button>
                </div>
                {replyingToId === top.id && (
                  <div className="mt-4 ml-4 max-w-xl p-4 rounded-lg border border-[var(--border)]">
                    <p className="text-sm font-medium mb-3">
                      回复 <span className="text-blue-500">{replyingToName}</span>
                      <button
                        type="button"
                        onClick={cancelReply}
                        className="ml-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        取消
                      </button>
                    </p>
                    <p className="text-xs text-[var(--muted)] mb-3">提交后需管理员审核通过才会显示。</p>
                    <form onSubmit={handleSubmitReplyForm} className="space-y-3">
                      <div>
                        <label className="block text-xs text-[var(--muted)] mb-1">昵称</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          maxLength={64}
                          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--muted)] mb-1">邮箱</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--muted)] mb-1">回复内容</label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          required
                          maxLength={2000}
                          rows={3}
                          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitReply.isPending}
                        className="rounded bg-neutral-700 dark:bg-neutral-300 text-white dark:text-black px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-50"
                      >
                        {submitReply.isPending ? "提交中…" : "提交回复"}
                      </button>
                      {submitReply.isError && (
                        <p className="text-red-500 text-sm">{String(submitReply.error)}</p>
                      )}
                    </form>
                  </div>
                )}
                {replies.length > 0 && (
                  <ul className="mt-3 ml-4 space-y-3 list-none pl-4 border-l-2 border-[var(--border)]">
                    {replies.map((r) => {
                      const parentName = r.parent_id ? idToComment[r.parent_id]?.author_name : "";
                      return (
                        <li key={r.id}>
                          <div className="flex items-baseline gap-2 flex-wrap text-sm">
                            <span className="font-medium">{r.author_name}</span>
                            {parentName && (
                              <>
                                <span className="text-[var(--muted)]">回复</span>
                                <span className="font-medium text-[var(--muted)]">{parentName}</span>
                              </>
                            )}
                            <span className="text-[var(--muted)] text-xs">
                              {new Date(r.created_at).toLocaleString("zh-CN")}
                            </span>
                          </div>
                          <p className="mt-1 text-[var(--text)] whitespace-pre-wrap text-sm">
                            {r.content}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleReply(r.id, r.author_name)}
                            className="mt-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                          >
                            回复
                          </button>
                          {replyingToId === r.id && (
                            <div className="mt-4 max-w-xl p-4 rounded-lg border border-[var(--border)]">
                              <p className="text-sm font-medium mb-3">
                                回复 <span className="text-blue-500">{replyingToName}</span>
                                <button
                                  type="button"
                                  onClick={cancelReply}
                                  className="ml-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
                                >
                                  取消
                                </button>
                              </p>
                              <p className="text-xs text-[var(--muted)] mb-3">提交后需管理员审核通过才会显示。</p>
                              <form onSubmit={handleSubmitReplyForm} className="space-y-3">
                                <div>
                                  <label className="block text-xs text-[var(--muted)] mb-1">昵称</label>
                                  <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    maxLength={64}
                                    className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-[var(--muted)] mb-1">邮箱</label>
                                  <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-[var(--muted)] mb-1">回复内容</label>
                                  <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    maxLength={2000}
                                    rows={3}
                                    className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={submitReply.isPending}
                                  className="rounded bg-neutral-700 dark:bg-neutral-300 text-white dark:text-black px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-50"
                                >
                                  {submitReply.isPending ? "提交中…" : "提交回复"}
                                </button>
                                {submitReply.isError && (
                                  <p className="text-red-500 text-sm">{String(submitReply.error)}</p>
                                )}
                              </form>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--muted)]">暂无评论</p>
        )}
      </section>
    </div>
  );
}
