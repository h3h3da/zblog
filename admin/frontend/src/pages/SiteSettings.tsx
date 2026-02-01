import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { siteConfig, type SiteConfig } from "../api/client";

export default function SiteSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-config"],
    queryFn: siteConfig.get,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [navHome, setNavHome] = useState("");
  const [navTags, setNavTags] = useState("");
  const [navAbout, setNavAbout] = useState("");
  const [footer, setFooter] = useState("");

  useEffect(() => {
    if (data) {
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setNavHome(data.nav_home ?? "");
      setNavTags(data.nav_tags ?? "");
      setNavAbout(data.nav_about ?? "");
      setFooter(data.footer ?? "");
    }
  }, [data]);

  const update = useMutation({
    mutationFn: (body: SiteConfig) => siteConfig.update(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
      navigate("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      title: title || undefined,
      description: description || undefined,
      nav_home: navHome || undefined,
      nav_tags: navTags || undefined,
      nav_about: navAbout || undefined,
      footer: footer || undefined,
    });
  };

  if (isLoading) return <div>加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">站点设置</h1>
      <p className="text-gray-600 mb-4">以下内容将显示在博客前端导航和标题。</p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">博客名称</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="zblog"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">站点描述</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="My blog"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">导航：首页</label>
          <input
            type="text"
            value={navHome}
            onChange={(e) => setNavHome(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="首页"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">导航：标签</label>
          <input
            type="text"
            value={navTags}
            onChange={(e) => setNavTags(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="标签"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">导航：About</label>
          <input
            type="text"
            value={navAbout}
            onChange={(e) => setNavAbout(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="About"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">页脚 (Footer)</label>
          <textarea
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder={"© 2025 · About · Contact\n类似 GitHub 页脚，支持多行"}
          />
          <p className="text-xs text-gray-500 mt-1">显示在博客每页底部，支持换行。留空则不显示页脚。</p>
        </div>
        <button
          type="submit"
          disabled={update.isPending}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {update.isPending ? "保存中..." : "保存"}
        </button>
        {update.isSuccess && <p className="text-green-600 text-sm">已保存</p>}
        {update.isError && (
          <p className="text-red-500 text-sm">{String(update.error)}</p>
        )}
      </form>
    </div>
  );
}
