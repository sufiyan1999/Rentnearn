import { useGetListings, getGetListingsQueryKey, useGetCategories, getGetCategoriesQueryKey, useGetFeaturedListings, getGetFeaturedListingsQueryKey, useGetNearbyListings, getGetNearbyListingsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Link, useLocation } from "wouter";
import { Search, MapPin, ChevronRight, Compass, Star } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/ui-core";

export default function Home() {
  const [, setLocation] = useLocation();
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Geolocation denied or failed")
      );
    }
  }, []);

  const { data: featured } = useGetFeaturedListings({ limit: 4 }, {
    query: { queryKey: getGetFeaturedListingsQueryKey({ limit: 4 }) }
  });

  const { data: nearby } = useGetNearbyListings(
    coords ? { lat: coords.lat, lng: coords.lng, limit: 4 } : { lat: 0, lng: 0, limit: 4 }, 
    { query: { enabled: !!coords, queryKey: getGetNearbyListingsQueryKey({ lat: coords?.lat||0, lng: coords?.lng||0, limit: 4 }) } }
  );

  const { data: recentListings } = useGetListings({ limit: 6 }, {
    query: { queryKey: getGetListingsQueryKey({ limit: 6 }) }
  });

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (q) setLocation(`/search?q=${encodeURIComponent(q.toString())}`);
  };

  return (
    <div className="flex flex-col pb-10">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground pt-12 pb-24 px-4 rounded-b-[2.5rem] md:rounded-b-[4rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1000x500/f96d0b/ffffff?text=Pattern')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="container mx-auto max-w-4xl relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Rent anything, anywhere.
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 max-w-2xl">
            Join thousands of Indians sharing their tools, cameras, and gear. Why buy when you can RentMitra?
          </p>

          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl bg-background rounded-full p-2 flex items-center shadow-xl">
            <div className="pl-4 text-muted-foreground">
              <Search className="w-5 h-5" />
            </div>
            <input 
              name="q"
              type="text" 
              placeholder="What do you need? (e.g. DSLR, Drill, Tent)" 
              className="flex-1 bg-transparent border-none focus:outline-none px-4 text-foreground py-3"
            />
            <Button type="submit" className="rounded-full shadow-none px-6">
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 -mt-10 relative z-20 flex flex-col gap-10">
        {/* Categories */}
        <section className="bg-background rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Categories</h2>
            <Link href="/categories" className="text-primary text-sm font-semibold flex items-center hover:underline">
              See all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {CATEGORIES.slice(0, 8).map(cat => {
              const Icon = Icons[cat.icon as keyof typeof Icons] as React.ElementType;
              return (
                <Link key={cat.id} href={`/search?category=${cat.slug}`} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-full bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                    {Icon && <Icon className="w-6 h-6" />}
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Nearby if available */}
        {coords && nearby && nearby.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Near You
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {nearby.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {featured && featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-primary fill-primary" /> Featured Finds
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
              {recentListings.data.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
