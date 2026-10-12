import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { type ReactNode } from "react";
import { useTheme } from "@/hooks/use-theme";

export function Shell({ children }: { children: ReactNode }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-foreground antialiased font-['Inter',sans-serif] selection:bg-orange-100 selection:text-orange-900 transition-colors duration-200">
      {/* PhysicsWallah signature top dark navigation bar */}
      <header className="sticky top-0 z-40 bg-neutral-800 text-white border-b border-neutral-700 shadow-xs">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-3 sm:px-6">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-6 w-7 rounded bg-black outline outline-2 outline-offset-[-0.90px] outline-gray-50 flex items-center justify-center font-black text-[11px] text-white">
                PW
              </div>
              <span className="font-bold text-sm tracking-tight text-white">Akki Study</span>
            </Link>
          </div>

          {/* Right: User Avatar + Theme Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="size-8 rounded-lg border border-neutral-700 bg-zinc-800 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer transition"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-300" />
              )}
            </button>

            {/* User Avatar Circle from snippet */}
            <div className="size-8 rounded-full bg-violet-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-violet-200">
              S
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 sm:px-6 pb-20 pt-2">{children}</main>
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

export function Crumbs({ items }: { items: { label: string; to?: ReactNode }[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      {items.map((item, index) => (
        <span key={index} className="inline-flex items-center gap-1.5">
          {item.to ? (
            <span className="transition hover:text-sky-600 dark:hover:text-sky-400">{item.to}</span>
          ) : (
            <span className="font-medium text-slate-900 dark:text-slate-200">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span className="text-slate-300 dark:text-slate-700">/</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Loading({ text = "Loading content…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-sky-500 border-t-transparent shadow-sm" />
      <p className="mt-3.5 text-xs font-medium text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/40 p-6 text-center text-xs text-red-700 dark:text-red-300 shadow-sm">
      <p className="font-bold text-sm text-red-800 dark:text-red-200">Something went wrong</p>
      <p className="mt-1 text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
}

export function EmptyBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-900/40 p-12 text-center text-xs text-slate-500 dark:text-slate-400">
      <Sparkles className="mx-auto mb-2.5 h-6 w-6 text-sky-400 opacity-80" />
      <p className="font-semibold text-slate-700 dark:text-slate-300">{message}</p>
    </div>
  );
}
