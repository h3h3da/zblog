import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import ReactMarkdown from "react-markdown";
import { posts, tags } from "../api/client";

export default function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new" || !id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [preview, setPreview] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => posts.get(Number(id)),
    enabled: !isNew && !!id,
  });

  const { data: tagList } = useQuery({
    queryKey: ["tags"],
    queryFn: tags.list,
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setContent(post.content);
      setExcerpt(post.excerpt || "");
      setStatus(post.status as "draft" | "published");
      setTagIds(post.tag_ids || []);
    } else if (isNew) {
      setTitle("");
      setSlug("");
      setContent("");
      setExcerpt("");
      setStatus("draft");
      setTagIds([]);
    }
  }, [post, isNew]);

  const createPost = useMutation({
    mutationFn: posts.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-list"] });
      navigate("/posts");
    },
  });

  const updatePost = useMutation({
    mutationFn: (body: Parameters<typeof posts.update>[1]) => posts.update(Number(id), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-list"] });
      queryClient.invalidateQueries({ queryKey: ["post", id] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      title,
      slug: slug || title.replace(/\s+/g, "-").toLowerCase(),
      content,
      excerpt: excerpt || undefined,
      status,
      tag_ids: tagIds,
    };
    if (isNew) createPost.mutate(body);
    else updatePost.mutate(body);
  };

  const toggleTag = (tagId: number) => {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  if (!isNew && isLoading) return <div>加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isNew ? "新建文章" : "编辑文章"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="留空则根据标题生成"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">正文 (Markdown)</label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-sm text-blue-600 hover:underline"
            >
              {preview ? "编辑" : "预览"}
            </button>
          </div>
          {preview ? (
            <div className="border border-gray-300 rounded p-4 min-h-[300px] prose max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <div data-color-mode="light">
              <MDEditor value={content} onChange={(v) => setContent(v ?? "")} height={400} />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
          <div className="flex flex-wrap gap-2">
            {tagList?.map((t) => (
              <label key={t.id} className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tagIds.includes(t.id)}
                  onChange={() => toggleTag(t.id)}
                />
                <span>{t.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createPost.isPending || updatePost.isPending}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {isNew ? "创建" : "保存"}
          </button>
          {(createPost.isError || updatePost.isError) && (
            <p className="text-red-500 text-sm">
              {String(createPost.error || updatePost.error)}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
