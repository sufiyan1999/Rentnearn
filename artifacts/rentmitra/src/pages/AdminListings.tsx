import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { useAdminGetListings, getAdminGetListingsQueryKey, useApproveListing, useRejectListing, useFeatureListing, AdminGetListingsStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/ui-core";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Star, Eye } from "lucide-react";

export default function AdminListings() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(window.location.search);
  const initialStatus = (searchParams.get("status") as AdminGetListingsStatus) || "pending";

  const [statusFilter, setStatusFilter] = useState<AdminGetListingsStatus>(initialStatus);

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'admin') {
      setLocation("/");
    }
  }, [isAuthenticated, user, setLocation]);

  const { data: listings, isLoading } = useAdminGetListings({ status: statusFilter, limit: 100 }, {
    query: {
      enabled: isAuthenticated && user?.userType === 'admin',
      queryKey: getAdminGetListingsQueryKey({ status: statusFilter, limit: 100 })
    }
  });

  const approveMutation = useApproveListing();
  const rejectMutation = useRejectListing();
  const featureMutation = useFeatureListing();

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Listing approved");
        queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey({ status: statusFilter, limit: 100 }) });
      }
    });
  };

  const handleReject = (id: number) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      rejectMutation.mutate({ id, data: { reason } }, {
        onSuccess: () => {
          toast.success("Listing rejected");
          queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey({ status: statusFilter, limit: 100 }) });
        }
      });
    }
  };

  const toggleFeature = (id: number, current: boolean) => {
    featureMutation.mutate({ id, data: { featured: !current } }, {
      onSuccess: () => {
        toast.success(`Listing ${!current ? 'featured' : 'unfeatured'}`);
        queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey({ status: statusFilter, limit: 100 }) });
      }
    });
  };

  if (!isAuthenticated || user?.userType !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Listings</h1>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdminGetListingsStatus)}
          className="p-2 border-2 border-input rounded-xl bg-background text-sm font-medium"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Owner</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : !listings?.data?.length ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No listings found</td></tr>
              ) : (
                listings.data.map(listing => (
                  <tr key={listing.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">#{listing.id}</td>
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        {listing.title}
                        {listing.isFeatured && <Star className="w-3 h-3 text-primary fill-primary" />}
                      </div>
                    </td>
                    <td className="p-4">{listing.owner?.name || 'Unknown'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        listing.status === 'approved' ? 'bg-green-100 text-green-700' :
                        listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/listings/${listing.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="text-muted-foreground hover:text-foreground" title="View listing">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {listing.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" title="Approve" onClick={() => handleApprove(listing.id)}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" title="Reject" onClick={() => handleReject(listing.id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {listing.status === 'approved' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className={listing.isFeatured ? "text-primary border-primary bg-primary/10" : "text-muted-foreground"}
                            title={listing.isFeatured ? "Unfeature" : "Feature"}
                            onClick={() => toggleFeature(listing.id, listing.isFeatured || false)}
                          >
                            <Star className={`w-4 h-4 ${listing.isFeatured ? "fill-primary" : ""}`} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
