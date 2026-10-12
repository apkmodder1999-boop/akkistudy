import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PwLogo } from "@/components/PwLogo";
import { Lock, ArrowRight } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isReady, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isReady && !isAuthenticated) {
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      navigate({
        to: "/login",
        search: { redirect: currentPath },
      });
    }
  }, [mounted, isReady, isAuthenticated, navigate]);

  if (!mounted || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5a4bda] border-t-transparent" />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121624] p-6 text-center shadow-lg">
          <div className="mx-auto mb-4 flex justify-center">
            <PwLogo size="md" />
          </div>
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5a4bda] dark:text-indigo-400">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Login Required</h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Please login to access batches, video lectures, and study materials.
          </p>
          <div className="mt-5">
            <button
              onClick={() => navigate({ to: "/login" })}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5a4bda] hover:bg-[#4a3cc4] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              <span>Go to Login</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
