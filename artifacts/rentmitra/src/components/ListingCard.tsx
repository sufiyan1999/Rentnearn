import { Listing, ListingWithDistance } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAddFavourite, useRemoveFavourite, useGetFavouriteIds, getGetFavouriteIdsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

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
    query: { enabled: isAuthenticated, queryKey: getGetFavouriteIdsQueryKey() },
  });
  const isFavourited = favIdsResponse?.ids.includes(listing.id) ?? false;

  const toggleFavourite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    if (isFavourited) {
      removeFav.mutate({ listingId: listing.id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFavouriteIdsQueryKey() }),
      });
    } else {
      addFav.mutate({ data: { listingId: listing.id } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFavouriteIdsQueryKey() }),
      });
    }
  };

  const imageUrl =
    listing.thumbnails?.[0] ||
    listing.images?.[0] ||
    "https://placehold.co/400x400/f0f0f0/bbb?text=No+Image";

  const distance = "distanceKm" in listing && listing.distanceKm != null
    ? `${listing.distanceKm.toFixed(1)} km`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/listings/${listing.id}`}
        className={cn("group block", className)}
      >
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
          <img
            src={imageUrl}
            alt={listing.title}
            loading="lazy"
            className="object-cover w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />

          {/* Bottom gradient + price overlay */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none rounded-b-2xl" />

          {/* Price badge in image */}
          <div className="absolute bottom-2.5 left-3 text-white">
            {(() => {
              const p = listing.rentalPrice;
              const val = p?.daily || p?.weekly || p?.monthly;
              const unit = p?.daily ? "/day" : p?.weekly ? "/wk" : p?.monthly ? "/mo" : "";
              return val ? (
                <>
                  <span className="font-bold text-sm drop-shadow-sm">₹{val}</span>
                  <span className="text-[10px] text-white/75 ml-0.5">{unit}</span>
                </>
              ) : (
                <span className="text-[10px] text-white/75">Contact for price</span>
              );
            })()}
          </div>

          {/* Featured badge */}
          {listing.isFeatured && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide text-amber-900 shadow-sm"
              style={{ background: "linear-gradient(135deg,#fde68a,#fbbf24)" }}>
              <Star className="w-2.5 h-2.5 fill-amber-700 text-amber-700" />
              FEATURED
            </div>
          )}

          {/* Availability badge */}
          {(() => {
            const avail = listing.availabilityStatus ?? "available";
            const MAP: Record<string, { label: string; cls: string }> = {
              reserved:            { label: "Reserved",            cls: "bg-amber-100 text-amber-700 border border-amber-300" },
              rented_out:          { label: "Rented Out",          cls: "bg-red-100 text-red-700 border border-red-300" },
              under_maintenance:   { label: "Maintenance",         cls: "bg-orange-100 text-orange-700 border border-orange-300" },
              no_longer_available: { label: "Unavailable",         cls: "bg-zinc-200 text-zinc-600 border border-zinc-300" },
            };
            const m = MAP[avail];
            return m ? (
              <div className={cn("absolute bottom-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold", m.cls)}>
                {m.label}
              </div>
            ) : null;
          })()}

          {/* Heart button */}
          {isAuthenticated && (
            <motion.button
              onClick={toggleFavourite}
              whileTap={{ scale: 0.82 }}
              className={cn(
                "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center",
                "glass-card shadow-sm transition-all duration-200",
                "hover:scale-110"
              )}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-all duration-200",
                  isFavourited
                    ? "fill-red-500 text-red-500 scale-110"
                    : "text-white drop-shadow"
                )}
              />
            </motion.button>
          )}
        </div>

        {/* Info */}
        <div className="pt-2.5 px-0.5 space-y-0.5">
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{listing.city}{distance ? ` · ${distance}` : ""}</span>
            <span className="text-border">·</span>
            <span className="capitalize truncate">{listing.category}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
