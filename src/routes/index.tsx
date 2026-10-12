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
  BookmarkCheck,
  GraduationCap,
  Check,
  Plus,
  BookOpen,
} from "lucide-react";
import { fetchAllBatches } from "@/lib/api";
import { Shell, PageTitle, Loading, ErrorBox, EmptyBox } from "@/components/shell";
import { useEnrolledBatches } from "@/hooks/use-enrolled-batches";
import { RequireAuth } from "@/components/RequireAuth";

const PAGE_SIZE = 50;

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = Number(search["page"]);
    const tab = search["tab"] === "enrolled" ? "enrolled" : undefined;
    return {
      page: !isNaN(raw) && raw > 1 ? Math.floor(raw) : undefined,
      tab: tab as "enrolled" | undefined,
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
    const day = d.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";
    const month = d.toLocaleDateString("en-IN", { month: "short" });
    const year = String(d.getFullYear()).slice(-2);
    return `${day}${suffix} ${month}’${year}`;
  } catch {
    return dateStr;
  }
}

function BatchesPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const page = search.page || 1;
  const activeTab = search.tab || "all";

  const { isEnrolled, toggleEnroll, enrolledIds, enrolledCount } = useEnrolledBatches();

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
          search: (prev) => ({ ...prev, page: 1 }),
        });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, navigate]);

  // Enrolled batches list
  const enrolledBatches = useMemo(() => {
    const idSet = new Set(enrolledIds);
    return allBatches.filter((b) => idSet.has(b._id));
  }, [allBatches, enrolledIds]);

  const targetBatches = activeTab === "enrolled" ? enrolledBatches : allBatches;

  // Global search across target batches
  const filteredBatches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return targetBatches;
    return targetBatches.filter((b) =>
      `${b.name} ${b.byName ?? ""} ${b.class ?? ""} ${b.type ?? ""}`.toLowerCase().includes(needle),
    );
  }, [targetBatches, query]);

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
      search: (prev) => ({ ...prev, page: newPage }),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const switchTab = (tab: "all" | "enrolled") => {
    navigate({
      to: "/",
      search: { tab, page: 1 },
    });
    setQ("");
    setQuery("");
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
    <RequireAuth>
      <Shell>
        {/* PW Subheader: "Batches" and Section Tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 text-sm font-normal font-['Inter']">
            <span>Batches</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => switchTab("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-neutral-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-stone-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              All Courses ({allBatches.length})
            </button>
            <button
              type="button"
              onClick={() => switchTab("enrolled")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === "enrolled"
                  ? "bg-neutral-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-stone-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Enrolled ({enrolledBatches.length})
            </button>
          </div>
        </div>

        {/* Section Heading: "Popular Courses" */}
        <div className="pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-neutral-800 dark:text-neutral-100 text-xl font-bold font-['Inter']">
            {activeTab === "enrolled" ? "My Enrolled Batches" : "Popular Courses"}
          </h1>
          <span className="text-xs text-neutral-400 font-medium font-['Inter']">
            {targetBatches.length} courses
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              activeTab === "enrolled"
                ? "Search your enrolled batches…"
                : "Search popular courses by name, faculty, target…"
            }
            className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-neutral-400 focus:border-neutral-700 dark:focus:border-zinc-500 focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isLoading && <Loading text="Loading batches upfront…" />}
        {error && <ErrorBox message={(error as Error).message} />}

        {/* Empty State for Enrolled Batches Tab */}
        {!isLoading && !error && activeTab === "enrolled" && enrolledBatches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 p-12 text-center">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
              <BookmarkCheck className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              No Enrolled Batches Yet
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              You haven't enrolled in any batches yet. Browse our free batch catalog and tap{" "}
              <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">
                "+ Enroll"
              </strong>{" "}
              on any batch to save it here for quick daily study!
            </p>
            <button
              type="button"
              onClick={() => switchTab("all")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/25 transition hover:brightness-105 active:scale-98 cursor-pointer"
            >
              <span>Browse All Batches</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {!isLoading &&
          !error &&
          filteredBatches.length === 0 &&
          (activeTab !== "enrolled" || enrolledBatches.length > 0) && (
            <EmptyBox
              message={
                query
                  ? `No batches found matching "${query}".`
                  : "No batches found in this section."
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
                    {targetBatches.length}
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
              {activeTab === "enrolled"
                ? `${enrolledCount} enrolled batches`
                : `${allBatches.length} total batches loaded`}
            </span>
          </div>
        )}

        {/* Batches Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {displayedBatches.map((b) => {
            const enrolled = isEnrolled(b._id);

            const fee = b.feeTotal && b.feeTotal > 0 ? b.feeTotal : 0;
            const originalPrice = fee > 0 ? Math.round(fee * 1.5) : 4999;
            const discountPercent =
              fee > 0 ? Math.round(((originalPrice - fee) / originalPrice) * 100) : 100;

            const classText = b.class
              ? `Class ${b.class} ${b.type ? b.type.replace("_", " ") : "JEE"}`
              : b.type
                ? b.type.replace("_", " ")
                : "Class 11 JEE";
            const languageText = (b.language || "HINGLISH").toUpperCase();
            const targetExamText =
              b.byName || (b.name.includes("NEET") ? "NEET 2026/27" : "JEE 2027/28");
            const dateFormatted = b.startDate
              ? `Started on ${formatBatchDate(b.startDate)}`
              : "All Lectures Uploaded";

            return (
              <div
                key={b._id}
                className="group flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-300 dark:border-slate-800 shadow-xs hover:shadow-md transition duration-200"
              >
                <div>
                  {/* Top Banner Image (PW 240px style) */}
                  <Link
                    to="/batches/$batchId"
                    params={{ batchId: b._id }}
                    className="block relative h-56 sm:h-60 w-full overflow-hidden bg-black"
                  >
                    {b.previewImage ? (
                      <img
                        src={b.previewImage}
                        alt={`${b.name} batch cover`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-102"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-950 text-white font-bold text-2xl">
                        {b.name.slice(0, 3).toUpperCase()}
                      </div>
                    )}

                    {/* Enrolled Badge Overlay */}
                    {enrolled && (
                      <div className="absolute top-3 left-3 rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-bold shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                        <Check className="h-3.5 w-3.5 stroke-3" />
                        <span>Enrolled</span>
                      </div>
                    )}
                  </Link>

                  {/* Card Content Area */}
                  <div className="p-5">
                    {/* Row 1: Orange Class Tag + Language Pill */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-orange-600 dark:text-orange-400 font-semibold text-xs sm:text-sm tracking-tight truncate">
                        {classText}
                      </span>
                      <span className="inline-flex items-center justify-center bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 px-2.5 py-0.5 rounded text-[10.5px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide shrink-0">
                        {languageText}
                      </span>
                    </div>

                    {/* Row 2: Batch Title */}
                    <Link to="/batches/$batchId" params={{ batchId: b._id }} className="block">
                      <h2 className="text-zinc-800 dark:text-zinc-100 text-lg font-bold line-clamp-1 group-hover:text-primary transition leading-snug">
                        {b.name}
                      </h2>
                    </Link>

                    {/* Row 3: Target Exam with Icon */}
                    <div className="mt-3 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 text-sm font-normal">
                      <BookOpen className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                      <span className="truncate">{targetExamText}</span>
                    </div>

                    {/* Row 4: Status + Separator + Started on Date */}
                    <div className="mt-2.5 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm font-normal">
                      <span className="size-2.5 rounded-full bg-rose-700 shrink-0 inline-block" />
                      <span className="shrink-0">{b.status || "Ongoing"}</span>
                      <span className="w-px h-3.5 bg-stone-300 dark:bg-slate-700 shrink-0" />
                      <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate">
                        {dateFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 5: Price & Action Buttons (PW Signature Bottom Row) */}
                <div className="p-5 pt-0">
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {/* Price Side */}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-zinc-800 dark:text-white text-base sm:text-lg font-bold">
                          {fee > 0 ? `₹${fee.toLocaleString("en-IN")}` : "FREE"}
                        </span>
                        <span className="text-neutral-400 text-xs line-through">
                          ₹{originalPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-green-700 dark:text-green-400 text-xs sm:text-sm font-bold mt-0.5">
                        {discountPercent > 0 ? `${discountPercent}% OFF` : "FREE ACCESS"}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        to="/batches/$batchId"
                        params={{ batchId: b._id }}
                        className="w-28 h-11 bg-neutral-800 hover:bg-neutral-900 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-bold text-sm rounded-lg shadow-xs transition flex items-center justify-center cursor-pointer font-['Inter']"
                      >
                        <span>{enrolled ? "Study Now" : "Buy Now"}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleEnroll(b._id, b.name)}
                        title={enrolled ? "Unenroll batch" : "Enroll batch"}
                        className={`w-12 h-11 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                          enrolled
                            ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400"
                            : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-750 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {enrolled ? (
                          <Check className="h-4 w-4 stroke-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <BookmarkCheck className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
    </RequireAuth>
  );
}
