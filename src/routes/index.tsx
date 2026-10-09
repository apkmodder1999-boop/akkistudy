import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { fetchBatches } from "@/lib/api";
import { Shell, PageTitle, Loading, ErrorBox, EmptyBox } from "@/components/shell";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = Number(search["page"]);
    return {
      page: !isNaN(raw) && raw > 0 ? Math.floor(raw) : 1,
    };
  },
  head: () => ({
    meta: [
      { title: "Akki Study — Premium Batches, Lectures & Study Material" },
      {
        name: "description",
        content:
          "Browse study batches, stream video lectures, and access chapter notes and DPPs instantly.",
      },
      { property: "og:title", content: "Akki Study — Premium Batches, Lectures & Study Material" },
      {
        property: "og:description",
        content:
          "Browse study batches, stream video lectures, and access chapter notes and DPPs instantly.",
      },
    ],
  }),
  component: BatchesPage,
});

function formatBatchDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function BatchesPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const page = search.page || 1;

  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [jumpPageInput, setJumpPageInput] = useState("");

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["batches", page],
    queryFn: () => fetchBatches(page, 50),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const totalPages = data?.totalPages ?? 1;
  const hasMore = data?.hasMore ?? false;
  const totalCount = data?.total;

  const batches = useMemo(() => {
    const rawBatches = data?.batches ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rawBatches;
    return rawBatches.filter((b) =>
      (b.name + " " + (b.byName ?? "")).toLowerCase().includes(needle),
    );
  }, [data?.batches, query]);

  const goToPage = (newPage: number) => {
    if (newPage < 1) return;
    navigate({
      to: "/",
      search: { page: newPage },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(target) && target > 0) {
      goToPage(target);
      setJumpPageInput("");
    }
  };

  // Generate page numbers to display around the current page
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const start = Math.max(1, page - 2);
    const end = Math.max(
      start + maxPagesToShow - 1,
      totalPages ? Math.min(page + 2, totalPages) : page + 2,
    );

    for (let p = start; p <= end; p++) {
      if (totalPages && p > totalPages && p > page) break;
      pages.push(p);
      if (pages.length >= maxPagesToShow) break;
    }
    return pages;
  }, [page, totalPages]);

  return (
    <Shell>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-600">
        <Sparkles className="h-3.5 w-3.5 text-sky-500" />
        <span>Akki Study Batches</span>
      </div>
      <PageTitle
        title="Explore Batches"
        subtitle="Browse all completed and active batches, full lectures, notes, and DPPs."
      />

      {/* Polished Search Bar with Sky Accent */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search batches on this page by name, class, faculty…"
          className="w-full rounded-2xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition hover:border-sky-200 dark:hover:border-slate-700 focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950/50"
        />
      </div>

      {isLoading && <Loading text={`Loading batches (page ${page})…`} />}
      {error && <ErrorBox message={(error as Error).message} />}
      {!isLoading && !error && batches.length === 0 && (
        <EmptyBox
          message={
            query ? `No batches found matching "${query}".` : `No batches found on page ${page}.`
          }
        />
      )}

      {!isLoading && !error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {batches.length}
              </strong>{" "}
              batches on{" "}
              <span className="font-bold text-sky-600 dark:text-sky-400">Page {page}</span>
              {totalCount ? ` (of ~${totalCount} total)` : ""}
            </span>
            {isFetching && (
              <span className="inline-flex items-center text-[11px] text-sky-500 animate-pulse">
                Updating…
              </span>
            )}
          </div>

          <span className="text-[11px] bg-sky-50 dark:bg-slate-800 px-2.5 py-1 rounded-md text-sky-700 dark:text-sky-300 font-medium">
            Limit: 50 batches / page
          </span>
        </div>
      )}

      {/* Batches Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {batches.map((b) => (
          <Link
            key={b._id}
            to="/batches/$batchId"
            params={{ batchId: b._id }}
            className="group card-surface flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md hover:shadow-sky-100 dark:hover:shadow-none"
          >
            <div>
              {b.previewImage ? (
                <div className="relative h-44 w-full overflow-hidden bg-sky-50 dark:bg-slate-800">
                  <img
                    src={b.previewImage}
                    alt={`${b.name} batch cover`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-102"
                  />
                  {b.status && (
                    <div className="absolute right-3 top-3 rounded-md bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-300 shadow-sm backdrop-blur-xs">
                      {b.status}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-44 w-full bg-gradient-to-br from-sky-50 to-sky-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-xl">
                  {b.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="p-5">
                {/* Clean unboxed metadata per Frontend Design Constitution */}
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>{b.language ?? "Hinglish"}</span>
                  {b.class && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span>Class {b.class}</span>
                    </>
                  )}
                  {b.type && !b.class && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span>{(b.type ?? "").replace("_", " ")}</span>
                    </>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition leading-snug">
                  {b.name}
                </h2>

                {b.byName && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {b.byName}
                  </p>
                )}

                {(b.startDate || b.endDate) && (
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {b.startDate ? formatBatchDate(b.startDate) : ""}
                    {b.endDate ? ` → ${formatBatchDate(b.endDate)}` : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-sky-100/80 dark:border-slate-800/80 bg-sky-50/30 dark:bg-slate-850/50 px-5 py-3.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {b.feeTotal ? (
                  <span className="text-slate-400 dark:text-slate-500 line-through mr-1 font-normal">
                    ₹{b.feeTotal?.toLocaleString("en-IN")}
                  </span>
                ) : null}
                FREE ACCESS
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition">
                <span>Explore Batch</span>
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination Bar */}
      {!isLoading && !error && (
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-sky-100/80 dark:border-slate-800 pt-6 sm:flex-row">
          {/* Previous & Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(1)}
              disabled={page <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:bg-sky-50 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-sky-50 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
          </div>

          {/* Numbered Page Selectors */}
          <div className="flex items-center gap-1.5">
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goToPage(p)}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs font-bold transition cursor-pointer ${
                  p === page
                    ? "bg-sky-600 text-white shadow-sm shadow-sky-500/30"
                    : "border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Next Page and Jump form */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore && page >= totalPages}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-sky-50 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            {totalPages > 0 && page < totalPages && (
              <button
                type="button"
                onClick={() => goToPage(totalPages)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:bg-sky-50 dark:hover:bg-slate-800"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            )}

            {/* Quick Page Jump Input */}
            <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 ml-2">
              <input
                type="number"
                min={1}
                max={totalPages || 99}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder="Go to"
                className="w-14 rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-center text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition cursor-pointer"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
