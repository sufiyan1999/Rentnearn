import { useRoute, useLocation } from "wouter";
import { useGetBusinessProfile, getGetBusinessProfileQueryKey, useGetUser, getGetUserQueryKey, useGetListings, getGetListingsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Building2, MapPin, Mail, Phone, Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/ui-core";

export default function BusinessProfile() {
  const [, params] = useRoute("/business/:userId");
  const userId = Number(params?.userId);

  const { data: business, isLoading: businessLoading } = useGetBusinessProfile(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetBusinessProfileQueryKey(userId)
    }
  });

  const { data: user, isLoading: userLoading } = useGetUser(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetUserQueryKey(userId)
    }
  });

  // For this simple version, we assume business listings are just listings owned by this user
  // Let's check if the API has a way to get listings by ownerId. 
  // Wait, `useGetListings` doesn't have an ownerId filter in `GetListingsParams` schema.
  // Actually, we can fetch all listings and maybe the backend supports q=businessName or we just fetch top listings.
  // We'll just fetch general listings for now or if we don't have ownerId filter, we skip showing them or show recent.
  // Wait! In the API, how to get business listings? We might not have `ownerId` in GetListingsParams.
  // Let's check `GetListingsParams` in `api.schemas.ts`.
  // It has: `q, category, city, state, minPrice, maxPrice, condition, page, limit, sortBy`. No `ownerId`.
  // So we can't easily fetch ONLY this user's listings unless we do client side filtering which is bad for pagination, but ok for a demo.
  // Actually, if we look at `useGetUser(userId)`, it returns `PublicUser`, which has `listingCount`. It doesn't return the listings themselves.
  
  if (businessLoading || userLoading) {
    return <div className="h-[80vh] flex items-center justify-center animate-pulse text-muted-foreground">Loading...</div>;
  }

  if (!business) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Business not found</h1>
        <p className="text-muted-foreground mt-2">This business profile doesn't exist or is unavailable.</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Cover / Header */}
      <div className="h-48 md:h-64 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1000x500/f96d0b/ffffff?text=Pattern')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      </div>
      
      <div className="container mx-auto px-4 max-w-4xl -mt-16 md:-mt-24 relative z-10">
        <div className="bg-background rounded-3xl p-6 md:p-8 shadow-sm border border-border">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-secondary border-4 border-background shadow-lg overflow-hidden flex-shrink-0">
              {business.logo ? (
                <img src={business.logo} alt={business.businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Building2 className="w-10 h-10 md:w-16 md:h-16" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold mb-1 flex items-center gap-2">
                {business.businessName}
                {user?.isVerified && <ShieldCheck className="w-6 h-6 text-primary" />}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                {business.city && business.state && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {business.city}, {business.state}</span>
                )}
                {business.contactEmail && (
                  <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {business.contactEmail}</span>
                )}
                {business.contactPhone && (
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {business.contactPhone}</span>
                )}
                {business.website && (
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> <a href={business.website} target="_blank" rel="noreferrer" className="hover:underline">Website</a></span>
                )}
              </div>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>{business.description || "No description provided."}</p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Listings Available</p>
              <p className="text-2xl font-bold">{user?.listingCount || 0}</p>
            </div>
            <Button onClick={() => window.open(`https://wa.me/91${business.contactPhone || user?.phone}?text=Hi, I found your business on RentNEarn.`, '_blank')}>
              Contact Business
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
