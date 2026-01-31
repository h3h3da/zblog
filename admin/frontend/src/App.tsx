import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { auth } from "./api/client";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PostList from "./pages/PostList";
import PostEdit from "./pages/PostEdit";
import TagList from "./pages/TagList";
import CommentList from "./pages/CommentList";
import AboutEdit from "./pages/AboutEdit";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: auth.me,
    retry: false,
  });
  if (isLoading) return <div className="p-8">加载中...</div>;
  if (error || !data) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<PostList />} />
        <Route path="posts/new" element={<PostEdit />} />
        <Route path="posts/:id" element={<PostEdit />} />
        <Route path="tags" element={<TagList />} />
        <Route path="comments" element={<CommentList />} />
        <Route path="about" element={<AboutEdit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
