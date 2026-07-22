import { useGetFavourites, getGetFavouritesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { ListingCard } from "@/components/ListingCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/ui-core";

export default function Favourites() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data, isLoading } = useGetFavourites({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetFavouritesQueryKey()
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-primary fill-primary" /> Saved Items
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-secondary rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-secondary rounded-3xl">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold">No favourites yet</h2>
          <p className="text-muted-foreground mb-6">Save items you like to find them easily later.</p>
          <Button onClick={() => setLocation("/search")}>Explore Listings</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {data.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
