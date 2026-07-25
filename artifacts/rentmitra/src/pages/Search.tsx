import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { SeoHead } from "@/components/SeoHead";
import {
  Search as SearchIcon, SlidersHorizontal, X, ChevronDown,
  Star, Building2, MapPin, Zap, Clock, Filter
} from "lucide-react";
import {
  useGetListings, getGetListingsQueryKey,
  useGetNearbyListings, getGetNearbyListingsQueryKey,
  GetListingsParams, GetNearbyListingsParams,
} from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES, STATES, CITIES_BY_STATE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ────────────────────────────────────────────────────────────────

function parseUrlParams(): SearchFilters {
  const sp = new URLSearchParams(window.location.search);
  return {
    q:             sp.get("q")             || "",
    category:      sp.get("category")      || "",
    state:         sp.get("state")         || "",
    city:          sp.get("city")          || "",
    condition:     sp.get("condition")     || "",
    minPrice:      sp.get("minPrice")      || "",
    maxPrice:      sp.get("maxPrice")      || "",
    sortBy:        sp.get("sortBy")        || "newest",
    featuredOnly:  sp.get("featuredOnly")  === "true",
    businessOnly:  sp.get("businessOnly")  === "true",
    availableToday:sp.get("availableToday")=== "true",
    radiusKm:      sp.get("radiusKm")      ? Number(sp.get("radiusKm")) : 25,
  };
}

function toUrlString(f: SearchFilters, hasGeo: boolean): string {
  const sp = new URLSearchParams();
  if (f.q)              sp.set("q", f.q);
  if (f.category)       sp.set("category", f.category);
  if (f.state)          sp.set("state", f.state);
  if (f.city)           sp.set("city", f.city);
  if (f.condition)      sp.set("condition", f.condition);
  if (f.minPrice)       sp.set("minPrice", f.minPrice);
  if (f.maxPrice)       sp.set("maxPrice", f.maxPrice);
  if (f.sortBy && f.sortBy !== "newest") sp.set("sortBy", f.sortBy);
  if (f.featuredOnly)   sp.set("featuredOnly", "true");
  if (f.businessOnly)   sp.set("businessOnly", "true");
  if (f.availableToday) sp.set("availableToday", "true");
  if (hasGeo && f.radiusKm !== 25) sp.set("radiusKm", String(f.radiusKm));
  return sp.toString();
}

// ─── types ───────────────────────────────────────────────────────────────────

interface SearchFilters {
  q:             string;
  category:      string;
  state:         string;
  city:          string;
  condition:     string;
  minPrice:      string;
  maxPrice:      string;
  sortBy:        string;
  featuredOnly:  boolean;
  businessOnly:  boolean;
  availableToday:boolean;
  radiusKm:      number;
}

const BLANK: SearchFilters = {
  q: "", category: "", state: "", city: "", condition: "",
  minPrice: "", maxPrice: "", sortBy: "newest",
  featuredOnly: false, businessOnly: false, availableToday: false, radiusKm: 25,
};

const SORT_OPTS = [
  { value: "newest",    label: "Newest first" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc",label: "Price: High → Low" },
];

const CONDITIONS = [
  ["", "Any condition"], ["new", "New"], ["like_new", "Like New"], ["good", "Good"], ["fair", "Fair"],
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function Search() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<SearchFilters>(parseUrlParams);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Local (unsubmitted) price inputs — debounced before going into filters
  const [priceMin, setPriceMin] = useState(filters.minPrice);
  const [priceMax, setPriceMax] = useState(filters.maxPrice);
  const priceDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Geolocation
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [distanceActive, setDistanceActive] = useState(false);

  // ── URL sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const qs = toUrlString(filters, distanceActive);
    const newUrl = `/search${qs ? `?${qs}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [filters, distanceActive]);

  // ── Price debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(priceDebounce.current);
    priceDebounce.current = setTimeout(() => {
      setFilters(f => ({ ...f, minPrice: priceMin, maxPrice: priceMax }));
    }, 500);
    return () => clearTimeout(priceDebounce.current);
  }, [priceMin, priceMax]);

  // ── Geolocation ───────────────────────────────────────────────────────────
  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported"); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDistanceActive(true);
        setGeoLoading(false);
        setGeoError(null);
      },
      () => {
        setGeoError("Location access denied");
        setGeoLoading(false);
      }
    );
  }, []);

  const clearGeo = useCallback(() => {
    setGeo(null);
    setDistanceActive(false);
    setGeoError(null);
  }, []);

  // ── Build API params ──────────────────────────────────────────────────────
  const listingParams: GetListingsParams = {
    ...(filters.q          && { q: filters.q }),
    ...(filters.category   && { category: filters.category }),
    ...(filters.state      && { state: filters.state }),
    ...(filters.city       && { city: filters.city }),
    ...(filters.condition  && { condition: filters.condition as any }),
    ...(filters.minPrice   && { minPrice: Number(filters.minPrice) }),
    ...(filters.maxPrice   && { maxPrice: Number(filters.maxPrice) }),
    sortBy: filters.sortBy as any,
    ...(filters.featuredOnly  && { featuredOnly: true }),
    ...(filters.businessOnly  && { businessOnly: true }),
    ...(filters.availableToday && { availableToday: true }),
    limit: 30,
  };

  const nearbyParams: GetNearbyListingsParams = {
    lat: geo?.lat ?? 0,
    lng: geo?.lng ?? 0,
    radiusKm: filters.radiusKm,
    limit: 30,
    ...(filters.category    && { category: filters.category }),
    ...(filters.q           && { q: filters.q }),
    ...(filters.city        && { city: filters.city }),
    ...(filters.state       && { state: filters.state }),
    ...(filters.condition   && { condition: filters.condition as any }),
    ...(filters.minPrice    && { minPrice: Number(filters.minPrice) }),
    ...(filters.maxPrice    && { maxPrice: Number(filters.maxPrice) }),
    ...(filters.featuredOnly   && { featuredOnly: true }),
    ...(filters.businessOnly   && { businessOnly: true }),
    ...(filters.availableToday && { availableToday: true }),
  };

  const { data: listingData, isLoading: listingLoading } = useGetListings(listingParams, {
    query: { enabled: !distanceActive, queryKey: getGetListingsQueryKey(listingParams) },
  });
  const { data: nearbyData, isLoading: nearbyLoading } = useGetNearbyListings(nearbyParams, {
    query: { enabled: distanceActive && !!geo, queryKey: getGetNearbyListingsQueryKey(nearbyParams) },
  });

  const isLoading = distanceActive ? nearbyLoading : listingLoading;
  const results   = distanceActive ? (nearbyData ?? []) : (listingData?.data ?? []);
  const total     = distanceActive ? nearbyData?.length ?? 0 : listingData?.total ?? 0;

  // ── Filter counts ─────────────────────────────────────────────────────────
  const activeCount = [
    filters.category, filters.state, filters.city, filters.condition,
    filters.minPrice, filters.maxPrice,
    filters.featuredOnly  ? "1" : "",
    filters.businessOnly  ? "1" : "",
    filters.availableToday? "1" : "",
    distanceActive        ? "1" : "",
  ].filter(Boolean).length;

  const set = <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) =>
    setFilters(f => ({ ...f, [k]: v }));

  const clearAll = () => {
    const cleared = { ...BLANK, q: filters.q, sortBy: filters.sortBy };
    setFilters(cleared);
    setPriceMin(""); setPriceMax("");
    clearGeo();
  };

  // ── Shared filter panel ───────────────────────────────────────────────────
  const filterPanel = (
    <FilterPanel
      filters={filters} set={set}
      priceMin={priceMin} priceMax={priceMax}
      setPriceMin={setPriceMin} setPriceMax={setPriceMax}
      geo={geo} geoLoading={geoLoading} geoError={geoError}
      distanceActive={distanceActive}
      requestGeo={requestGeo} clearGeo={clearGeo}
      activeCount={activeCount} clearAll={clearAll}
    />
  );

  // Dynamic SEO title from active filters
  const seoTitle = (() => {
    const catLabel = filters.category
      ? CATEGORIES.find(c => c.slug === filters.category)?.name
      : null;
    const parts: string[] = [];
    if (catLabel) parts.push(`${catLabel} for Rent`);
    else if (filters.q) parts.push(`"${filters.q}"`);
    if (filters.city) parts.push(`in ${filters.city}`);
    else if (filters.state) parts.push(`in ${filters.state}`);
    return parts.length ? parts.join(" ") : "Search Rentals";
  })();

  const seoDescription = (() => {
    const catLabel = filters.category
      ? CATEGORIES.find(c => c.slug === filters.category)?.name?.toLowerCase()
      : null;
    if (catLabel && filters.city)
      return `Find ${catLabel} for rent in ${filters.city} on RentNEarn. Browse ${total.toLocaleString("en-IN")} listings, compare prices, and contact owners directly on WhatsApp.`;
    if (catLabel)
      return `Rent ${catLabel} near you on RentNEarn. Browse ${total.toLocaleString("en-IN")} listings across India — cameras, drones, furniture, outfits & more.`;
    if (filters.q)
      return `Search results for "${filters.q}" on RentNEarn. Find items for rent near you — compare prices and contact owners directly.`;
    return "Search thousands of rental listings across India. Find cameras, drones, furniture, outfits & more — peer-to-peer, zero commission.";
  })();

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl pb-24 md:pb-6">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonical={`/search${window.location.search}`}
      />
      {/* ── Top bar ── */}
      <div className="flex gap-2 mb-5">
        {/* Keyword */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Search cameras, drills, strollers…"
            value={filters.q}
            onChange={e => set("q", e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-9 rounded-xl border border-border bg-card text-sm font-medium",
              "placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            )}
          />
          {filters.q && (
            <button onClick={() => set("q", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort — desktop */}
        <div className="hidden md:block relative">
          <select
            value={filters.sortBy}
            onChange={e => set("sortBy", e.target.value)}
            className="h-11 pl-3 pr-8 rounded-xl border border-border bg-card text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:border-primary transition-all"
          >
            {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Filter toggle — mobile */}
        <button
          onClick={() => setIsFilterOpen(o => !o)}
          className={cn(
            "md:hidden relative h-11 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all duration-200",
            activeCount > 0 ? "border-primary bg-primary/8 text-primary" : "border-border bg-card"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Active filter chips (keyword area) ── */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.category && (
            <Chip label={CATEGORIES.find(c => c.slug === filters.category)?.name ?? filters.category} onRemove={() => set("category", "")} />
          )}
          {filters.state && <Chip label={filters.state} onRemove={() => set("state", "")} />}
          {filters.city && <Chip label={filters.city} onRemove={() => set("city", "")} />}
          {filters.condition && <Chip label={conditions_label(filters.condition)} onRemove={() => set("condition", "")} />}
          {(filters.minPrice || filters.maxPrice) && (
            <Chip
              label={`₹${filters.minPrice || "0"} – ${filters.maxPrice ? "₹" + filters.maxPrice : "any"}`}
              onRemove={() => { setPriceMin(""); setPriceMax(""); setFilters(f => ({ ...f, minPrice: "", maxPrice: "" })); }}
            />
          )}
          {filters.featuredOnly   && <Chip label="⭐ Featured only"   onRemove={() => set("featuredOnly", false)} />}
          {filters.businessOnly   && <Chip label="🏢 Business only"   onRemove={() => set("businessOnly", false)} />}
          {filters.availableToday && <Chip label="✅ Available today" onRemove={() => set("availableToday", false)} />}
          {distanceActive && geo && (
            <Chip label={`📍 Within ${filters.radiusKm} km`} onRemove={clearGeo} />
          )}
          <button onClick={clearAll} className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex flex-col gap-5 w-60 shrink-0">
          {filterPanel}
        </aside>

        {/* ── Mobile drawer ── */}
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
                className="fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border overflow-y-auto md:hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="font-bold">Filters</span>
                    {activeCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {activeCount}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setIsFilterOpen(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-5 flex-1 overflow-y-auto">
                  {filterPanel}
                </div>
                <div className="p-4 border-t border-border shrink-0 flex gap-2">
                  {activeCount > 0 && (
                    <button onClick={clearAll} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    Show {total} result{total !== 1 ? "s" : ""}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <main className="flex-1 min-w-0">
          {/* Count + sort mobile */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground font-medium">
              {isLoading
                ? "Searching…"
                : distanceActive
                ? `${total} result${total !== 1 ? "s" : ""} nearby`
                : `${total.toLocaleString("en-IN")} result${total !== 1 ? "s" : ""}`}
            </p>
            <div className="md:hidden relative">
              <select
                value={filters.sortBy}
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
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-5">
                <SearchIcon className="w-9 h-9 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-1.5">No listings found</h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-4">
                Try a different keyword, expand the distance radius, or clear some filters.
              </p>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-primary text-sm font-semibold hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((l: any) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Filter panel ────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: SearchFilters;
  set: <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) => void;
  priceMin: string; priceMax: string;
  setPriceMin: (v: string) => void; setPriceMax: (v: string) => void;
  geo: { lat: number; lng: number } | null;
  geoLoading: boolean; geoError: string | null;
  distanceActive: boolean;
  requestGeo: () => void; clearGeo: () => void;
  activeCount: number; clearAll: () => void;
}

function FilterPanel({
  filters, set,
  priceMin, priceMax, setPriceMin, setPriceMax,
  geo, geoLoading, geoError, distanceActive,
  requestGeo, clearGeo,
  activeCount, clearAll,
}: FilterPanelProps) {
  return (
    <>
      {/* ── Quick toggles ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Quick Filters</h3>
        <div className="flex flex-col gap-2">
          <ToggleChip
            active={filters.featuredOnly}
            icon={<Star className="w-3.5 h-3.5" />}
            label="Featured only"
            color="amber"
            onClick={() => set("featuredOnly", !filters.featuredOnly)}
          />
          <ToggleChip
            active={filters.businessOnly}
            icon={<Building2 className="w-3.5 h-3.5" />}
            label="Business only"
            color="blue"
            onClick={() => set("businessOnly", !filters.businessOnly)}
          />
          <ToggleChip
            active={filters.availableToday}
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Available today"
            color="green"
            onClick={() => set("availableToday", !filters.availableToday)}
          />
        </div>
      </section>

      {/* ── Distance ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Distance</h3>
        {distanceActive && geo ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Within {filters.radiusKm} km
              </span>
              <button onClick={clearGeo} className="text-xs text-muted-foreground hover:text-foreground underline">
                Remove
              </button>
            </div>
            <input
              type="range" min="5" max="100" step="5"
              value={filters.radiusKm}
              onChange={e => set("radiusKm", Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>5 km</span><span>50 km</span><span>100 km</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={requestGeo}
              disabled={geoLoading}
              className={cn(
                "w-full h-10 flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all",
                geoLoading ? "opacity-60 cursor-wait" : "hover:border-primary hover:text-primary",
                "border-border text-muted-foreground"
              )}
            >
              <MapPin className="w-4 h-4" />
              {geoLoading ? "Locating…" : "Use my location"}
            </button>
            {geoError && <p className="text-xs text-red-500 text-center">{geoError}</p>}
          </div>
        )}
      </section>

      {/* ── Price range ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Daily Price (₹)</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
            <input
              type="number" min="0" placeholder="Min"
              value={priceMin}
              onChange={e => setPriceMin(e.target.value)}
              className="w-full h-10 pl-6 pr-2 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <span className="flex items-center text-muted-foreground text-sm">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
            <input
              type="number" min="0" placeholder="Max"
              value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              className="w-full h-10 pl-6 pr-2 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── Category ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Category</h3>
        <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
          <FilterBtn active={!filters.category} onClick={() => set("category", "")}>All Categories</FilterBtn>
          {CATEGORIES.map(c => (
            <FilterBtn key={c.slug} active={filters.category === c.slug} onClick={() => set("category", c.slug)}>
              {c.name}
            </FilterBtn>
          ))}
        </div>
      </section>

      {/* ── State ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">State</h3>
        <div className="relative">
          <select
            value={filters.state}
            onChange={e => set("state", e.target.value)}
            className="w-full h-10 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium appearance-none focus:outline-none focus:border-primary transition-all"
          >
            <option value="">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </section>

      {/* ── City ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">City</h3>
        {filters.state && CITIES_BY_STATE[filters.state] ? (
          <div className="relative">
            <select
              value={filters.city}
              onChange={e => set("city", e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">All Cities</option>
              {CITIES_BY_STATE[filters.state].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        ) : (
          <input
            value={filters.city}
            onChange={e => set("city", e.target.value)}
            placeholder="e.g. Mumbai"
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        )}
      </section>

      {/* ── Condition ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Condition</h3>
        <div className="flex flex-col gap-0.5">
          {CONDITIONS.map(([val, label]) => (
            <FilterBtn
              key={val}
              active={filters.condition === val || (!filters.condition && val === "")}
              onClick={() => set("condition", val)}
            >
              {label}
            </FilterBtn>
          ))}
        </div>
      </section>

      {/* ── Clear all (desktop) ── */}
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full h-9 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        >
          Clear all filters
        </button>
      )}
    </>
  );
}

// ─── Small reusable components ───────────────────────────────────────────────

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

type ChipColor = "amber" | "blue" | "green" | "primary";
const CHIP_COLORS: Record<ChipColor, { on: string; off: string }> = {
  amber:   { on: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300", off: "border-border text-muted-foreground hover:border-amber-300 hover:text-amber-700" },
  blue:    { on: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300", off: "border-border text-muted-foreground hover:border-blue-300 hover:text-blue-700" },
  green:   { on: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300", off: "border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-700" },
  primary: { on: "bg-primary/10 text-primary border-primary/40", off: "border-border text-muted-foreground hover:border-primary/40 hover:text-primary" },
};

function ToggleChip({ active, icon, label, color = "primary", onClick }: { active: boolean; icon: React.ReactNode; label: string; color?: ChipColor; onClick: () => void }) {
  const c = CHIP_COLORS[color];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 h-9 px-3 rounded-xl border text-sm font-semibold transition-all duration-150 w-full text-left",
        active ? c.on : c.off
      )}
    >
      {icon}
      {label}
      {active && <span className="ml-auto w-2 h-2 rounded-full bg-current opacity-70" />}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
      {label}
      <button onClick={onRemove} className="w-4 h-4 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

function conditions_label(val: string): string {
  return CONDITIONS.find(([v]) => v === val)?.[1] ?? val;
}
