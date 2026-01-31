import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { tags } from "../api/client";

export default function TagList() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const { data: list, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: tags.list,
  });

  const createTag = useMutation({
    mutationFn: () => tags.create({ name, slug: slug || name.replace(/\s+/g, "-").toLowerCase() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setName("");
      setSlug("");
    },
  });

  const deleteTag = useMutation({
    mutationFn: (id: number) => tags.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });

  if (isLoading) return <div>加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签</h1>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-3">新建标签</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="留空自动生成"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={() => createTag.mutate()}
            disabled={!name.trim() || createTag.isPending}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            添加
          </button>
        </div>
        {createTag.isError && <p className="text-red-500 text-sm mt-2">{String(createTag.error)}</p>}
      </div>
      <ul className="bg-white rounded-lg shadow divide-y">
        {list?.map((t) => (
          <li key={t.id} className="px-4 py-3 flex justify-between items-center">
            <span className="font-medium">{t.name}</span>
            <span className="text-gray-500 text-sm">{t.slug}</span>
            <button
              type="button"
              onClick={() => deleteTag.mutate(t.id)}
              className="text-red-600 hover:underline text-sm"
            >
              删除
            </button>
          </li>
        ))}
      </ul>
      {!list?.length && <p className="text-gray-500">暂无标签</p>}
    </div>
  );
}
