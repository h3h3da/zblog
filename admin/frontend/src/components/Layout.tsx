import { Outlet, Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../api/client";

export default function Layout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("zblog_admin_token");
    queryClient.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-gray-800">zblog 管理后台</span>
          <div className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">仪表盘</Link>
            <Link to="/posts" className="text-gray-600 hover:text-gray-900">文章</Link>
            <Link to="/tags" className="text-gray-600 hover:text-gray-900">标签</Link>
            <Link to="/comments" className="text-gray-600 hover:text-gray-900">评论</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link to="/site" className="text-gray-600 hover:text-gray-900">站点设置</Link>
            <button type="button" onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
              退出
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
