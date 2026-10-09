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
  X,
} from "lucide-react";
import { fetchAllBatches } from "@/lib/api";
import { Shell, PageTitle, Loading, ErrorBox, EmptyBox } from "@/components/shell";

const PAGE_SIZE = 50;

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

  const {
    data: allBatches = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["all-batches"],
    queryFn: fetchAllBatches,
    staleTime: 15 * 60 * 1000,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q);
      // Reset to page 1 when user types a search query
      if (q.trim()) {
        navigate({
          to: "/",
          search: { page: 1 },
        });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, navigate]);

  // Global search across ALL batches
  const filteredBatches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allBatches;
    return allBatches.filter((b) =>
      `${b.name} ${b.byName ?? ""} ${b.class ?? ""} ${b.type ?? ""}`.toLowerCase().includes(needle),
    );
  }, [allBatches, query]);

  const totalFiltered = filteredBatches.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  // Paginated display
  const displayedBatches = useMemo(() => {
    // If search active and results are small, display all directly
    if (query.trim() && totalFiltered <= PAGE_SIZE) {
      return filteredBatches;
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBatches.slice(start, start + PAGE_SIZE);
  }, [filteredBatches, currentPage, query, totalFiltered]);

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    navigate({
      to: "/",
      search: { page: newPage },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      goToPage(target);
      setJumpPageInput("");
    }
  };

  // Generate page numbers to display around the current page
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxPagesToShow - 1);

    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }, [currentPage, totalPages]);

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

      {/* Global Search Bar with Clear Button */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search batches by name, class, faculty…"
          className="w-full rounded-2xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 pl-11 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition hover:border-sky-200 dark:hover:border-slate-700 focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950/50"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading && <Loading text="Loading all batches upfront…" />}
      {error && <ErrorBox message={(error as Error).message} />}
      {!isLoading && !error && filteredBatches.length === 0 && (
        <EmptyBox
          message={
            query ? `No batches found matching "${query}".` : "No batches found in the catalog."
          }
        />
      )}

      {/* Exact Count Header matching the user screenshot */}
      {!isLoading && !error && filteredBatches.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {query.trim() ? (
              <span>
                Showing{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  {totalFiltered}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  {totalFiltered}
                </strong>{" "}
                batches
              </span>
            ) : (
              <span>
                Showing{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  {displayedBatches.length}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  {allBatches.length}
                </strong>{" "}
                batches
                {totalPages > 1 && (
                  <span className="ml-1 text-slate-400">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </span>
            )}
          </div>

          <span className="text-[11px] bg-sky-50 dark:bg-slate-800 px-2.5 py-1 rounded-md text-sky-700 dark:text-sky-300 font-medium">
            {allBatches.length} total batches loaded
          </span>
        </div>
      )}

      {/* Batches Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {displayedBatches.map((b) => (
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

      {/* Pagination Bar (only when more than 1 page) */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-sky-100/80 dark:border-slate-800 pt-6 sm:flex-row">
          {/* Previous & Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(1)}
              disabled={currentPage <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:bg-sky-50 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
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
                  p === currentPage
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
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-sky-50 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            {currentPage < totalPages && (
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
                max={totalPages}
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
