import { useState } from "react";
import { Link } from "wouter";
import { SeoHead } from "@/components/SeoHead";
import { CATEGORIES } from "@/lib/constants";
import { useGetCategories, getGetCategoriesQueryKey } from "@workspace/api-client-react";
import { ChevronRight, ChevronLeft, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

type ApiCat = { id: number; slug: string; listingCount: number; subcategories?: ApiCat[] };

export default function Categories() {
  const [selected, setSelected] = useState<(typeof CATEGORIES)[0] | null>(null);
  const [search, setSearch] = useState("");

  const { data: apiData } = useGetCategories({ query: { queryKey: getGetCategoriesQueryKey() } });

  // Merge API listing counts into constants
  const merged = CATEGORIES.map(c => {
    const api = (apiData as ApiCat[] | undefined)?.find(a => a.slug === c.slug);
    return { ...c, listingCount: api?.listingCount ?? 0 };
  });

  // Search across all parent+subcategory names
  const searchResults = search.trim().length > 1
    ? CATEGORIES.flatMap(cat =>
        [cat, ...cat.subcategories.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))]
          .filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase())
          )
          .map(item => ({ ...item, parentName: cat.name, parentSlug: cat.slug, parentImage: cat.image, parentColor: cat.color }))
      )
    : [];

  return (
    <div className="pb-24 md:pb-0">
      <SeoHead
        title="Browse All Rental Categories"
        description={`Explore ${CATEGORIES.length} categories on RentNEarn — cameras, drones, furniture, wedding outfits, medical equipment, tools & more. Find what you need to rent near you.`}
        canonical="/categories"
      />
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white py-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Browse by Category</h1>
          <p className="text-white/75 mb-5 text-sm">
            {CATEGORIES.length} categories · explore hundreds of subcategories
          </p>
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Search categories (e.g. Drone, Sherwani, Tractor)..."
              className="w-full bg-white/15 border border-white/25 rounded-full px-4 pl-11 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Search results */}
        {search.trim().length > 1 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">{searchResults.length} results for "{search}"</p>
            {searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No categories found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {searchResults.map(item => (
                    <Link
                      key={item.slug}
                      href={`/search?category=${(item as any).parentSlug}&subcategory=${item.slug}`}
                      className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-border/50 shadow-sm flex items-center justify-center p-1 shrink-0">
                        <img
                          src={(item as any).parentImage ?? `/icons/categories/${(item as any).parentSlug}.png`}
                          alt={(item as any).parentName}
                          loading="lazy"
                          decoding="async"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">{item.name}</p>
                        {(item as any).parentName && (item as any).parentName !== item.name && (
                          <p className="text-xs text-muted-foreground truncate">{(item as any).parentName}</p>
                        )}
                      </div>
                    </Link>
                ))}
              </div>
            )}
          </div>
        ) : selected ? (
          /* ── Subcategory view ── */
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.slug}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              {/* Back */}
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary mb-6 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                All Categories
              </button>

              {/* Parent header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-border/50 shadow-md flex items-center justify-center p-2 shrink-0">
                  <img
                    src={selected.image}
                    alt={selected.name}
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground">{selected.subcategories.length} subcategories</p>
                </div>
              </div>

              {/* Browse all link */}
              <Link
                href={`/search?category=${selected.slug}`}
                className="flex items-center gap-2 bg-primary text-white rounded-2xl px-5 py-3 mb-6 w-fit text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Browse all {selected.name} listings
                <ChevronRight className="w-4 h-4" />
              </Link>

              {/* Subcategory grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selected.subcategories.map(sub => (
                  <Link
                    key={sub.slug}
                    href={`/search?category=${selected.slug}&subcategory=${sub.slug}`}
                    className="bg-card border border-border rounded-2xl p-4 hover:border-primary hover:shadow-sm transition-all group"
                  >
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors leading-snug">{sub.name}</p>
                  </Link>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* ── Parent grid ── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {merged.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSelected(cat)}
                  className="bg-card border border-border rounded-3xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group cursor-pointer"
                >
                  {/* 3D Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-border/40 shadow-md flex items-center justify-center p-2.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/15">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      width={80}
                      height={80}
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cat.subcategories.length} types · {cat.listingCount} listings
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                    <span>Explore</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
