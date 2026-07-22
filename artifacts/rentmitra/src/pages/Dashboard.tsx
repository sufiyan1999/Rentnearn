import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetMyListings, getGetMyListingsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Package, Eye, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'business') {
      setLocation("/");
    }
  }, [isAuthenticated, user, setLocation]);

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: {
      enabled: isAuthenticated && user?.userType === 'business',
      queryKey: getGetDashboardStatsQueryKey()
    }
  });

  const { data: listings, isLoading: listingsLoading } = useGetMyListings({ status: "all" }, {
    query: {
      enabled: isAuthenticated,
      queryKey: getGetMyListingsQueryKey({ status: "all" })
    }
  });

  if (!isAuthenticated || user?.userType !== 'business') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Business Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-secondary p-6 rounded-3xl border border-border">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-4">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-muted-foreground text-sm font-semibold mb-1">Total Listings</p>
          <p className="text-3xl font-bold">{statsLoading ? '--' : stats?.totalListings || 0}</p>
        </div>
        
        <div className="bg-secondary p-6 rounded-3xl border border-border">
          <div className="w-10 h-10 bg-green-500/20 text-green-600 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-muted-foreground text-sm font-semibold mb-1">Active</p>
          <p className="text-3xl font-bold">{statsLoading ? '--' : stats?.activeListings || 0}</p>
        </div>

        <div className="bg-secondary p-6 rounded-3xl border border-border">
          <div className="w-10 h-10 bg-yellow-500/20 text-yellow-600 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-muted-foreground text-sm font-semibold mb-1">Pending</p>
          <p className="text-3xl font-bold">{statsLoading ? '--' : stats?.pendingListings || 0}</p>
        </div>

        <div className="bg-secondary p-6 rounded-3xl border border-border">
          <div className="w-10 h-10 bg-red-500/20 text-red-600 rounded-xl flex items-center justify-center mb-4">
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-muted-foreground text-sm font-semibold mb-1">Rejected/Expired</p>
          <p className="text-3xl font-bold">{statsLoading ? '--' : ((stats?.rejectedListings || 0) + (stats?.expiredListings || 0))}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Your Listings</h2>
      {listingsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          <div className="aspect-square bg-secondary rounded-2xl"></div>
        </div>
      ) : !listings?.length ? (
        <div className="bg-secondary rounded-3xl p-8 text-center border border-border">
          <p className="text-muted-foreground">You haven't created any listings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {listings.map(listing => (
            <div key={listing.id} className="relative">
              <ListingCard listing={listing} />
              <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold shadow-sm ${
                listing.status === 'approved' ? 'bg-green-500 text-white' : 
                listing.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {listing.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
