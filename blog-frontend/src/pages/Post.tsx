import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { posts, comments } from "../api/client";
import Markdown from "../components/Markdown";

export default function Post() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => posts.get(slug!),
    enabled: !!slug,
  });

  const { data: commentData } = useQuery({
    queryKey: ["comments", post?.id],
    queryFn: () => comments.list(post!.id, { page: 1, size: 50 }),
    enabled: !!post?.id,
  });

  const submitComment = useMutation({
    mutationFn: comments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", post?.id] });
      setContent("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    submitComment.mutate({ author_name: name, author_email: email, content, post_id: post.id });
  };

  if (isLoading || !slug) return <div className="text-[var(--muted)]">加载中...</div>;
  if (error || !post) return <div className="text-red-500">文章不存在</div>;

  return (
    <div className="space-y-8">
      <article>
        <div className="mb-4 text-[var(--muted)] text-sm">
          <Link to="/">首页</Link>
          <span className="mx-2">/</span>
          <span>{new Date(post.created_at).toLocaleDateString("zh-CN")}</span>
          {post.tags?.length ? (
            <>
              <span className="mx-2">·</span>
              {post.tags.map((t) => (
                <Link key={t.id} to={`/tag/${t.slug}`} className="mr-2 hover:underline">
                  #{t.name}
                </Link>
              ))}
            </>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="mt-6">
          <Markdown content={post.content} />
        </div>
      </article>

      <section className="border-t border-[var(--border)] pt-8">
        <h2 className="text-xl font-semibold mb-4">评论</h2>
        {commentData?.items?.length ? (
          <ul className="space-y-4 mb-8">
            {commentData.items.map((c) => (
              <li key={c.id} className="border-l-2 border-[var(--border)] pl-4">
                <span className="font-medium">{c.author_name}</span>
                <span className="text-[var(--muted)] text-sm ml-2">
                  {new Date(c.created_at).toLocaleString("zh-CN")}
                </span>
                <p className="mt-1 text-[var(--text)] whitespace-pre-wrap">{c.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--muted)] mb-8">暂无评论</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <p className="text-sm text-[var(--muted)]">提交后需管理员审核通过才会显示。</p>
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
            disabled={submitComment.isPending}
            className="rounded bg-neutral-700 dark:bg-neutral-300 text-white dark:text-black px-4 py-2 hover:opacity-90 disabled:opacity-50"
          >
            {submitComment.isPending ? "提交中..." : "提交评论"}
          </button>
          {submitComment.isError && (
            <p className="text-red-500 text-sm">{String(submitComment.error)}</p>
          )}
        </form>
      </section>
    </div>
  );
}
