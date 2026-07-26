import { useAuth } from "@/contexts/AuthContext";
import { useGetMyListings, getGetMyListingsQueryKey, useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/ui-core";
import { User, LogOut, Settings, Package, Heart } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Profile() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: listings, isLoading } = useGetMyListings({ status: "all" }, {
    query: {
      enabled: isAuthenticated,
      queryKey: getGetMyListingsQueryKey({ status: "all" })
    }
  });

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logout();
        toast.success("Logged out");
        setLocation("/");
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-background border-2 border-input rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex-shrink-0 border-4 border-background shadow-lg">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <User className="w-10 h-10" />
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="mt-2 inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full capitalize">
            {user.userType} Account
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/dashboard?tab=profile")}>
            <Settings className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
          <Button variant="destructive" className="w-full justify-start bg-red-50 text-red-600 border-none shadow-none hover:bg-red-100" onClick={handleLogout} isLoading={logoutMutation.isPending}>
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> My Listings
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <div className="aspect-square bg-secondary rounded-2xl animate-pulse"></div>
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="bg-secondary rounded-3xl p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-lg">No listings yet</h3>
            <p className="text-muted-foreground mb-6">Start sharing your items and earn money.</p>
            <Button onClick={() => setLocation("/listings/new")}>Create Listing</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
