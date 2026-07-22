import { Listing, ListingWithDistance } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAddFavourite, useRemoveFavourite, useGetFavouriteIds, getGetFavouriteIdsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";

interface ListingCardProps {
  listing: Listing | ListingWithDistance;
  className?: string;
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const addFav = useAddFavourite();
  const removeFav = useRemoveFavourite();

  const { data: favIdsResponse } = useGetFavouriteIds({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetFavouriteIdsQueryKey()
    }
  });

  const isFavourited = favIdsResponse?.ids.includes(listing.id) || false;

  const toggleFavourite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) return; // In real app might trigger login modal

    if (isFavourited) {
      removeFav.mutate({ listingId: listing.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFavouriteIdsQueryKey() });
        }
      });
    } else {
      addFav.mutate({ data: { listingId: listing.id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFavouriteIdsQueryKey() });
        }
      });
    }
  };

  const imageUrl = listing.thumbnails?.[0] || listing.images?.[0] || "https://placehold.co/400x300/e2e8f0/8492a6?text=No+Image";

  return (
    <Link href={`/listings/${listing.id}`} className={cn("group flex flex-col gap-2 relative", className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary">
        <img 
          src={imageUrl} 
          alt={listing.title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Fav button */}
        {isAuthenticated && (
          <button 
            onClick={toggleFavourite}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/80 transition-colors"
          >
            <Heart className={cn("w-5 h-5", isFavourited ? "fill-destructive text-destructive" : "text-foreground")} />
          </button>
        )}

        {/* Featured badge */}
        {listing.isFeatured && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-sm">
            Featured
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-foreground line-clamp-1 flex-1">{listing.title}</h3>
        </div>
        
        <div className="flex items-center text-muted-foreground text-xs gap-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.city}{'distanceKm' in listing && listing.distanceKm != null ? ` (${listing.distanceKm.toFixed(1)} km)` : ''}
          </span>
          <span className="capitalize">{listing.category}</span>
        </div>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-bold text-lg text-foreground">₹{listing.rentalPrice?.daily || 0}</span>
          <span className="text-muted-foreground text-sm">/ day</span>
        </div>
      </div>
    </Link>
  );
}
