import { Link } from "@tanstack/react-router";
import { GraduationCap, Moon, Sun, BookmarkCheck, LogIn, LogOut, User } from "lucide-react";
import { type ReactNode } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useEnrolledBatches } from "@/hooks/use-enrolled-batches";
import { useAuth } from "@/lib/auth";

export function Shell({ children }: { children: ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  const { enrolledCount } = useEnrolledBatches();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-sky-100 selection:text-sky-900 dark:selection:bg-sky-900 dark:selection:text-sky-100 transition-colors duration-200">
      <header className="sticky top-0 z-30 border-b border-sky-100/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-sm shadow-sky-500/25 transition group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary transition">
                Akki Study
              </span>
              <span className="text-[10px] font-medium tracking-wide text-sky-600 dark:text-sky-400 -mt-0.5">
                Free Lectures & Notes
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              search={{ tab: "all" }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-700 dark:hover:text-sky-300"
            >
              <span>All Batches</span>
            </Link>

            <Link
              to="/"
              search={{ tab: "enrolled" }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Enrolled</span>
              {enrolledCount > 0 && (
                <span className="ml-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                  {enrolledCount}
                </span>
              )}
            </Link>

            {/* Auth Sign In / User Status */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  <User className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                  <span className="max-w-24 truncate">
                    {user?.name || user?.phone || "Student"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 rounded-lg border border-sky-200 dark:border-sky-850 bg-sky-50 dark:bg-sky-950/40 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer shadow-2xs"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 rotate-0 scale-100" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 rotate-0 scale-100" />
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">{children}</main>
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
