import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { pages } from "../api/client";

export default function AboutEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: about, isLoading, error } = useQuery({
    queryKey: ["about-page"],
    queryFn: () => pages.get("about"),
    retry: false,
  });

  useEffect(() => {
    if (about) {
      setTitle(about.title);
      setContent(about.content || "");
    }
  }, [about]);

  const updatePage = useMutation({
    mutationFn: () => pages.update("about", { title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-page"] });
      navigate("/");
    },
  });

  if (isLoading) return <div>加载中...</div>;
  if (error || !about)
    return (
      <div>
        About 页不存在。请先在服务器上执行：<code className="bg-gray-200 px-1 rounded">python -m scripts.init_data</code>（在 blog-api 目录下）以创建默认 About 页。
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑 About</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">内容 (Markdown)</label>
          <div data-color-mode="light">
            <MDEditor value={content} onChange={(v) => setContent(v ?? "")} height={400} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => updatePage.mutate()}
          disabled={updatePage.isPending}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
        >
          保存
        </button>
        {updatePage.isError && (
          <p className="text-red-500 text-sm">{String(updatePage.error)}</p>
        )}
      </div>
    </div>
  );
}
