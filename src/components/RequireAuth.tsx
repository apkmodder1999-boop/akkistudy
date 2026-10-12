import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isMounted } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      const currentUrl =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      navigate({
        to: "/login",
        search: { redirect: currentUrl },
      });
    }
  }, [isMounted, isAuthenticated, navigate]);

  // While mounting on server/initial client hydration or if not authenticated,
  // render identical placeholder to guarantee zero hydration mismatch.
  if (!isMounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-8 w-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Verifying student access...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
