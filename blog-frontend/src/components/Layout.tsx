import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../context/ThemeContext";
import { site } from "../api/client";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { data: siteInfo } = useQuery({ queryKey: ["site"], queryFn: site.info });
  const title = siteInfo?.title ?? "zblog";
  const navHome = siteInfo?.nav_home ?? "首页";
  const navTags = siteInfo?.nav_tags ?? "标签";
  const navAbout = siteInfo?.nav_about ?? "About";
  const footer = siteInfo?.footer ?? "";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <header className="border-b border-[var(--border)]">
        <nav className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg hover:opacity-80">
            {title}
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[var(--muted)] hover:text-[var(--text)]">
              {navHome}
            </Link>
            <Link to="/tags" className="text-[var(--muted)] hover:text-[var(--text)]">
              {navTags}
            </Link>
            <Link to="/about" className="text-[var(--muted)] hover:text-[var(--text)]">
              {navAbout}
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded p-2 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label={theme === "dark" ? "切换到日间模式" : "切换到夜间模式"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 flex-1 w-full">{children}</main>
      {footer ? (
        <footer className="border-t border-[var(--border)] mt-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">{footer}</p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
