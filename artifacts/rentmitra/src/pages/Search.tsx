import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, Filter, SlidersHorizontal } from "lucide-react";
import { useGetListings, getGetListingsQueryKey, GetListingsParams } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Input, Button } from "@/components/ui/ui-core";
import { CATEGORIES, STATES } from "@/lib/constants";

export default function Search() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [params, setParams] = useState<GetListingsParams>({
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    city: searchParams.get("city") || undefined,
    state: searchParams.get("state") || undefined,
    condition: searchParams.get("condition") || undefined,
    sortBy: "newest"
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, isLoading } = useGetListings(params, {
    query: { queryKey: getGetListingsQueryKey(params) }
  });

  const updateParam = (key: keyof GetListingsParams, value: any) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      if (!value) delete newParams[key];
      return newParams;
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex gap-2">
          <Input 
            placeholder="Search listings..." 
            value={params.q || ""}
            onChange={e => updateParam("q", e.target.value)}
            className="bg-secondary border-none"
          />
          <Button variant="secondary" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters Sidebar */}
        <aside className={`md:w-64 flex flex-col gap-6 ${isFilterOpen ? 'block' : 'hidden'} md:block`}>
          <div>
            <h3 className="font-bold mb-3">Category</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => updateParam("category", undefined)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium ${!params.category ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              >
                All Categories
              </button>
              {CATEGORIES.map(c => (
                <button 
                  key={c.slug}
                  onClick={() => updateParam("category", c.slug)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium ${params.category === c.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-3">Location</h3>
            <select 
              value={params.state || ""}
              onChange={(e) => updateParam("state", e.target.value)}
              className="w-full p-2 border-2 border-input rounded-xl bg-background text-sm font-medium mb-2"
            >
              <option value="">All States</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input 
              placeholder="City..." 
              value={params.city || ""}
              onChange={e => updateParam("city", e.target.value)}
            />
          </div>

          <div>
            <h3 className="font-bold mb-3">Condition</h3>
            <select 
              value={params.condition || ""}
              onChange={(e) => updateParam("condition", e.target.value)}
              className="w-full p-2 border-2 border-input rounded-xl bg-background text-sm font-medium"
            >
              <option value="">Any Condition</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="hidden md:flex items-center gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Search tools, cameras, gear..." 
                value={params.q || ""}
                onChange={e => updateParam("q", e.target.value)}
                className="pl-10 bg-secondary border-none"
              />
            </div>
            <select 
              value={params.sortBy || "newest"}
              onChange={e => updateParam("sortBy", e.target.value)}
              className="p-2 border-2 border-input rounded-xl bg-background text-sm font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-secondary rounded-2xl"></div>
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                <SearchIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">No results found</h2>
              <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {data?.data.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
