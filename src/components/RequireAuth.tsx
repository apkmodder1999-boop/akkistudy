import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, getStoredAuthState } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const state = getStoredAuthState();
    if (!state.isAuthenticated) {
      const currentUrl =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      navigate({
        to: "/login",
        search: { redirect: currentUrl },
      });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-8 w-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Redirecting to student login...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
