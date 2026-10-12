import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setAdminBypassAuth } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Direct Access — Akki Study" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBypassPage,
});

function AdminBypassPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTo = search.redirect || "/";

  useEffect(() => {
    // Automatically grant bypass access without asking for phone or OTP
    setAdminBypassAuth();

    const t = setTimeout(() => {
      navigate({ to: redirectTo as string });
    }, 450);

    return () => clearTimeout(t);
  }, [navigate, redirectTo]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
          Access Granted
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Bypass mode active. Redirecting you to batches...
        </p>
        <div className="mt-5 flex justify-center">
          <span className="h-5 w-5 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin inline-block" />
        </div>
      </div>
    </div>
  );
}
