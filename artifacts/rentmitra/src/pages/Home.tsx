import { useGetListings, getGetListingsQueryKey, useGetCategories, getGetCategoriesQueryKey, useGetFeaturedListings, getGetFeaturedListingsQueryKey, useGetNearbyListings, getGetNearbyListingsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Link, useLocation } from "wouter";
import { Search, MapPin, ChevronRight, Compass, Star, ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/ui-core";
import { motion } from "framer-motion";

const HOME_CATS = CATEGORIES.slice(0, 12);

const STATS = [
  { value: "10,000+", label: "Active Listings" },
  { value: "50+", label: "Cities" },
  { value: "₹0", label: "Commission" },
  { value: "100%", label: "Peer-to-Peer" },
];

const POPULAR_SEARCHES = ["DSLR Camera", "Drone", "Wheelchair", "PlayStation 5", "Baby Stroller", "Sherwani", "Treadmill", "Luxury Car"];

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn("Geolocation denied or failed")
    );
  }, []);

  const { data: featured } = useGetFeaturedListings({ limit: 4 }, {
    query: { queryKey: getGetFeaturedListingsQueryKey({ limit: 4 }) },
  });
  const { data: nearby } = useGetNearbyListings(
    coords ? { lat: coords.lat, lng: coords.lng, limit: 4 } : { lat: 0, lng: 0, limit: 4 },
    { query: { enabled: !!coords, queryKey: getGetNearbyListingsQueryKey({ lat: coords?.lat ?? 0, lng: coords?.lng ?? 0, limit: 4 }) } }
  );
  const { data: recentListings } = useGetListings({ limit: 6 }, {
    query: { queryKey: getGetListingsQueryKey({ limit: 6 }) },
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (q) setLocation(`/search?q=${encodeURIComponent(q.toString())}`);
  };

  return (
    <div className="flex flex-col">

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-primary text-white">
        {/* Mesh / orb background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-black/15 blur-3xl" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 to-black/20" />
        </div>

        <div className="relative z-10 container mx-auto max-w-4xl px-4 pt-16 pb-32 flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 backdrop-blur-sm"
          >
            <Zap className="w-3 h-3 fill-white" />
            India's #1 peer-to-peer rental marketplace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-5 text-balance"
          >
            Rent what you need.<br />
            <span className="opacity-80">Earn from what you own.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="text-white/70 text-lg md:text-xl mb-8 max-w-xl leading-relaxed"
          >
            Don't buy it — rent it from someone nearby.
          </motion.p>

          {/* Search bar */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            onSubmit={handleSearch}
            className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex items-center gap-2 shadow-2xl shadow-black/20"
          >
            <div className="pl-3 text-white/50 shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <input
              name="q"
              type="text"
              placeholder="Search cameras, drills, lehenga, PS5…"
              className="flex-1 bg-transparent border-none focus:outline-none px-2 text-white placeholder:text-white/40 py-3 text-sm md:text-base font-medium"
            />
            <button
              type="submit"
              className="bg-white text-primary font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-white/90 transition-all duration-200 active:scale-95 shrink-0"
            >
              Search
            </button>
          </motion.form>

          {/* Popular searches */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-4 flex flex-wrap justify-center gap-2"
          >
            {POPULAR_SEARCHES.map(s => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="text-xs text-white font-semibold bg-white/20 hover:bg-white/35 border border-white/35 rounded-full px-3 py-1.5 transition-all duration-150"
              >
                {s}
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ STATS STRIP ══════════ */}
      <section className="bg-foreground text-background">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-4 divide-x divide-background/10">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="py-4 md:py-5 text-center px-2"
              >
                <p className="text-lg md:text-2xl font-extrabold tracking-tight">{s.value}</p>
                <p className="text-[10px] md:text-xs text-background/50 font-medium mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="container mx-auto max-w-5xl px-4 py-10 flex flex-col gap-12">

        {/* ── Categories ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full gradient-primary inline-block" />
              Categories
            </h2>
            <Link href="/categories" className="text-primary text-sm font-semibold flex items-center gap-0.5 hover:gap-2 transition-all duration-200">
              All {CATEGORIES.length} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {HOME_CATS.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.035, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/search?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-border/50 shadow-sm flex items-center justify-center p-1 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:border-primary/30">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      width={56}
                      height={56}
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-semibold text-center leading-tight text-muted-foreground group-hover:text-primary transition-colors duration-200 max-w-[64px]">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Quick-search chips */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:flex-wrap md:overflow-visible md:mx-0 md:px-0">
            {["Saree", "DSLR Camera", "Wheelchair", "PlayStation", "Drone", "Treadmill", "Baby Stroller", "Luxury Car", "Tent"].map(s => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="shrink-0 text-xs bg-secondary hover:bg-primary hover:text-white text-muted-foreground border border-border hover:border-primary rounded-full px-3.5 py-1.5 transition-all duration-200 font-semibold whitespace-nowrap"
              >
                {s}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Nearby ── */}
        {coords && nearby && nearby.length > 0 && (
          <section>
            <SectionHeader icon={<MapPin className="w-4 h-4 text-primary" />} title="Near You" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {nearby.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}

        {/* ── Featured ── */}
        {featured && featured.length > 0 && (
          <section>
            <SectionHeader icon={<Star className="w-4 h-4 text-amber-500 fill-amber-500" />} title="Featured Finds" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}

        {/* ── Why RentMitra ── */}
        <section>
          <SectionHeader icon={<Shield className="w-4 h-4 text-primary" />} title="Why RentMitra?" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🤝", title: "Direct P2P", body: "Connect directly via WhatsApp. No middlemen, no commissions on rentals." },
              { icon: "💰", title: "Save Money", body: "Pay ₹49 to list. Renters contact you for free. You keep 100% of earnings." },
              { icon: "🔒", title: "Verified Listings", body: "Every listing is reviewed and approved by our team before going live." },
            ].map(({ icon, title, body }) => (
              <motion.div
                key={title}
                whileHover={{ y: -3 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Sustainability ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 px-6 py-7 flex items-start gap-4"
        >
          <div className="text-3xl shrink-0 mt-0.5">🌱</div>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Every item rented instead of bought helps reduce waste, conserve valuable resources, and extend the life of products already in circulation. By choosing to rent, you're supporting a more sustainable future for India.
            </p>
          </div>
        </motion.section>

        {/* ── Recent ── */}
        {recentListings && recentListings.data.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <SectionHeader icon={<Compass className="w-4 h-4 text-primary" />} title="Freshly Listed" noMargin />
              <Link href="/search" className="text-primary text-sm font-semibold flex items-center gap-0.5 hover:gap-2 transition-all duration-200">
                Explore <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recentListings.data.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl gradient-primary text-white text-center py-14 px-6 shadow-2xl shadow-primary/25"
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative z-10">
            <TrendingUp className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Have something idle at home?</h2>
            <p className="text-white/70 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
              List it in 5 minutes for just ₹49 and start earning from things you already own.
            </p>
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3 rounded-full text-sm hover:bg-white/90 transition-all duration-200 shadow-lg active:scale-95"
            >
              Start Listing Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

function SectionHeader({
  icon, title, noMargin = false
}: { icon: React.ReactNode; title: string; noMargin?: boolean }) {
  return (
    <h2 className={cn("text-xl font-extrabold tracking-tight flex items-center gap-2", noMargin ? "" : "mb-5")}>
      <span className="w-1.5 h-5 rounded-full gradient-primary inline-block" />
      {title}
    </h2>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
