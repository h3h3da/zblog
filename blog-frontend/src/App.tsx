import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Post from "./pages/Post";
import TagList from "./pages/TagList";
import TagPosts from "./pages/TagPosts";
import About from "./pages/About";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<Post />} />
        <Route path="/tags" element={<TagList />} />
        <Route path="/tag/:slug" element={<TagPosts />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
}

export default App;
