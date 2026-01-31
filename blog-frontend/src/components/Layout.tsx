import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)]">
        <nav className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg hover:opacity-80">
            zblog
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[var(--muted)] hover:text-[var(--text)]">
              首页
            </Link>
            <Link to="/tags" className="text-[var(--muted)] hover:text-[var(--text)]">
              标签
            </Link>
            <Link to="/about" className="text-[var(--muted)] hover:text-[var(--text)]">
              About
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
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
