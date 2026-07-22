import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useGetListings, getGetListingsQueryKey, GetListingsParams } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Input, Button } from "@/components/ui/ui-core";
import { CATEGORIES, STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTS = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

export default function Search() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [params, setParams] = useState<GetListingsParams>({
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    city: searchParams.get("city") || undefined,
    state: searchParams.get("state") || undefined,
    condition: searchParams.get("condition") || undefined,
    sortBy: "newest",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, isLoading } = useGetListings(params, {
    query: { queryKey: getGetListingsQueryKey(params) },
  });

  const set = (k: keyof GetListingsParams, v: any) =>
    setParams(p => { const n = { ...p, [k]: v }; if (!v) delete n[k]; return n; });

  const activeFilterCount = [params.category, params.state, params.city, params.condition].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Top search + controls */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search cameras, drills, strollers…"
            value={params.q || ""}
            onChange={e => set("q", e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm font-medium",
              "placeholder:text-muted-foreground placeholder:font-normal",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            )}
          />
          {params.q && (
            <button onClick={() => set("q", undefined)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort - desktop */}
        <div className="hidden md:flex">
          <div className="relative">
            <select
              value={params.sortBy || "newest"}
              onChange={e => set("sortBy", e.target.value)}
              className={cn(
                "h-11 pl-3 pr-8 rounded-xl border border-border bg-card text-sm font-semibold appearance-none cursor-pointer",
                "focus:outline-none focus:border-primary transition-all"
              )}
            >
              {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Filter toggle - mobile */}
        <button
          onClick={() => setIsFilterOpen(o => !o)}
          className={cn(
            "md:hidden relative h-11 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all duration-200",
            isFilterOpen || activeFilterCount > 0
              ? "border-primary bg-primary/8 text-primary"
              : "border-border bg-card text-foreground"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full gradient-primary text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <AnimatePresence>
          {(isFilterOpen || true) && (
            <motion.aside
              key="filters"
              initial={false}
              className={cn(
                "flex-col gap-5 w-56 shrink-0",
                "hidden md:flex"
              )}
            >
              <FilterPanel params={params} set={set} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
                onClick={() => setIsFilterOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border overflow-y-auto md:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-bold">Filters</span>
                  <button onClick={() => setIsFilterOpen(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-5">
                  <FilterPanel params={params} set={set} />
                  <Button className="w-full" onClick={() => setIsFilterOpen(false)}>
                    Show {data?.data.length ?? 0} results
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Results */}
        <main className="flex-1 min-w-0">
          {/* Count + sort (mobile) */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground font-medium">
              {isLoading ? "Searching…" : `${data?.data.length ?? 0} result${data?.data.length !== 1 ? "s" : ""}`}
            </p>
            <div className="md:hidden relative">
              <select
                value={params.sortBy || "newest"}
                onChange={e => set("sortBy", e.target.value)}
                className="h-9 pl-3 pr-7 rounded-xl border border-border bg-card text-xs font-semibold appearance-none cursor-pointer focus:outline-none"
              >
                {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="aspect-square skeleton rounded-2xl" />
                  <div className="h-4 skeleton rounded-lg w-3/4" />
                  <div className="h-3 skeleton rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          ) : !data?.data.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-5">
                <SearchIcon className="w-9 h-9 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-1.5">No listings found</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Try a different keyword or clear some filters.</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setParams({ q: params.q, sortBy: params.sortBy })}
                  className="mt-4 text-primary text-sm font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.data.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FilterPanel({ params, set }: { params: GetListingsParams; set: (k: keyof GetListingsParams, v: any) => void }) {
  return (
    <>
      {/* Category */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Category</h3>
        <div className="flex flex-col gap-0.5">
          <FilterBtn active={!params.category} onClick={() => set("category", undefined)}>All Categories</FilterBtn>
          {CATEGORIES.map(c => (
            <FilterBtn key={c.slug} active={params.category === c.slug} onClick={() => set("category", c.slug)}>
              {c.name}
            </FilterBtn>
          ))}
        </div>
      </section>

      {/* State */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">State</h3>
        <div className="relative">
          <select
            value={params.state || ""}
            onChange={e => set("state", e.target.value)}
            className="w-full h-10 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium appearance-none focus:outline-none focus:border-primary transition-all"
          >
            <option value="">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </section>

      {/* City */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">City</h3>
        <input
          value={params.city || ""}
          onChange={e => set("city", e.target.value)}
          placeholder="e.g. Mumbai"
          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </section>

      {/* Condition */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Condition</h3>
        <div className="flex flex-col gap-0.5">
          {[["", "Any"], ["new", "New"], ["like_new", "Like New"], ["good", "Good"], ["fair", "Fair"]].map(([val, label]) => (
            <FilterBtn key={val} active={params.condition === val || (!params.condition && val === "")} onClick={() => set("condition", val || undefined)}>
              {label}
            </FilterBtn>
          ))}
        </div>
      </section>
    </>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
