import { useGetListings, getGetListingsQueryKey, useGetCategories, getGetCategoriesQueryKey, useGetFeaturedListings, getGetFeaturedListingsQueryKey, useGetNearbyListings, getGetNearbyListingsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Link, useLocation } from "wouter";
import { Search, MapPin, ChevronRight, Compass, Star } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/ui-core";
import { motion } from "framer-motion";

// Show 12 categories on home (3 rows of 4 on mobile, 2 rows of 6 on desktop)
const HOME_CATS = CATEGORIES.slice(0, 12);

export default function Home() {
  const [, setLocation] = useLocation();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Geolocation denied or failed")
      );
    }
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (q) setLocation(`/search?q=${encodeURIComponent(q.toString())}`);
  };

  return (
    <div className="flex flex-col pb-10">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground pt-12 pb-24 px-4 rounded-b-[2.5rem] md:rounded-b-[4rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="container mx-auto max-w-4xl relative z-10 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Rent anything, anywhere.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-primary-foreground/80 text-lg md:text-xl mb-8 max-w-2xl"
          >
            India's trusted peer-to-peer rental marketplace. Why buy when you can RentMitra?
          </motion.p>
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onSubmit={handleSearchSubmit}
            className="w-full max-w-2xl bg-background rounded-full p-2 flex items-center shadow-2xl"
          >
            <div className="pl-4 text-muted-foreground">
              <Search className="w-5 h-5" />
            </div>
            <input
              name="q"
              type="text"
              placeholder="Search cameras, drills, strollers, sherwani…"
              className="flex-1 bg-transparent border-none focus:outline-none px-4 text-foreground py-3 text-sm md:text-base"
            />
            <Button type="submit" className="rounded-full shadow-none px-6">Search</Button>
          </motion.form>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 -mt-10 relative z-20 flex flex-col gap-10">
        {/* ── Categories ── */}
        <section className="bg-background rounded-3xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Categories</h2>
            <Link href="/categories" className="text-primary text-sm font-semibold flex items-center hover:underline">
              All {CATEGORIES.length} <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
            {HOME_CATS.map((cat, i) => {
              const Icon = Icons[cat.icon as keyof typeof Icons] as React.ElementType;
              return (
                <Link key={cat.id} href={`/categories`} className="flex flex-col items-center gap-2 group">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`w-13 h-13 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-md ${cat.color}`}
                  >
                    {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6" />}
                  </motion.div>
                  <span className="text-[9px] md:text-[11px] font-semibold text-center leading-tight text-foreground group-hover:text-primary transition-colors max-w-[56px] md:max-w-none">
                    {cat.name.replace(" & ", "\n& ")}
                  </span>
                </Link>
              );
            })}
          </div>
          {/* Subcategory quick-links (top 8 popular subs) */}
          <div className="mt-4 flex flex-wrap gap-2">
            {["Wedding Dress / Bridal", "DSLR Camera", "Wheelchair", "PlayStation", "Drone", "Treadmill", "Baby Stroller", "Luxury Car"].map(sub => (
              <Link key={sub} href={`/search?q=${encodeURIComponent(sub)}`} className="text-xs bg-secondary rounded-full px-3 py-1.5 text-muted-foreground hover:bg-primary hover:text-white transition-colors font-medium">
                {sub}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Nearby ── */}
        {coords && nearby && nearby.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Near You
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {nearby.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          </section>
        )}

        {/* ── Featured ── */}
        {featured && featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-primary fill-primary" /> Featured Finds
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          </section>
        )}

        {/* ── Recent ── */}
        {recentListings && recentListings.data.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" /> Freshly Listed
              </h2>
              <Link href="/search" className="text-primary text-sm font-semibold hover:underline">
                Explore more
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {recentListings.data.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
