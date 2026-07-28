import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { useAdminGetListings, getAdminGetListingsQueryKey, useApproveListing, useRejectListing, useFeatureListing, AdminGetListingsStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/ui-core";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Star, Eye, Trash2, CalendarClock, ChevronDown, MessageCircle, Phone, Share2, QrCode, Award } from "lucide-react";
import { useDeleteListing, useExtendExpiry } from "@/lib/useAdminData";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const AVAILABILITY_COLORS: Record<string, string> = {
  available:           "bg-emerald-100 text-emerald-700",
  reserved:            "bg-amber-100 text-amber-700",
  rented_out:          "bg-blue-100 text-blue-700",
  under_maintenance:   "bg-orange-100 text-orange-700",
  no_longer_available: "bg-slate-100 text-slate-600",
};

export default function AdminListings() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(window.location.search);
  const initialStatus = (searchParams.get("status") as AdminGetListingsStatus) || "pending";
  const [statusFilter, setStatusFilter] = useState<AdminGetListingsStatus>(initialStatus);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [extendMenuId, setExtendMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "admin") setLocation("/");
  }, [isAuthenticated, user, setLocation]);

  const queryKey = getAdminGetListingsQueryKey({ status: statusFilter, limit: 100 });

  const { data: listings, isLoading } = useAdminGetListings({ status: statusFilter, limit: 100 }, {
    query: { enabled: isAuthenticated && user?.userType === "admin", queryKey }
  });

  const approveMutation  = useApproveListing();
  const rejectMutation   = useRejectListing();
  const featureMutation  = useFeatureListing();
  const deleteMutation   = useDeleteListing();
  const extendMutation   = useExtendExpiry();

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, { onSuccess: () => { toast.success("Listing approved"); invalidate(); } });
  };

  const handleReject = (id: number) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      rejectMutation.mutate({ id, data: { reason } }, { onSuccess: () => { toast.success("Listing rejected"); invalidate(); } });
    }
  };

  const toggleFeature = (id: number, current: boolean) => {
    featureMutation.mutate({ id, data: { featured: !current } }, { onSuccess: () => { toast.success(current ? "Unfeatured" : "Featured!"); invalidate(); } });
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Listing deleted");
      invalidate();
    } catch { toast.error("Failed to delete listing"); }
  };

  const handleExtend = async (id: number, days: 30 | 60 | 90) => {
    try {
      await extendMutation.mutateAsync({ id, days });
      toast.success(`Expiry extended by ${days} days`);
      invalidate();
      setExtendMenuId(null);
    } catch { toast.error("Failed to extend expiry"); }
  };

  if (!isAuthenticated || user?.userType !== "admin") return null;

  const data = (listings as any)?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Manage Listings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Approve, moderate, and monitor all listings</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdminGetListingsStatus)}
          className="h-9 px-3 border border-border rounded-xl bg-background text-sm font-medium focus:outline-none focus:border-primary"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Listing</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Owner</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell text-right">Views</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell text-right">Contacts</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(6)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td></tr>)
              ) : !data.length ? (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No listings found</td></tr>
              ) : (
                data.map((listing: any) => {
                  const contacts = (listing.whatsappClicks ?? 0) + (listing.phoneClicks ?? 0);
                  const isExpanded = expandedId === listing.id;

                  return (
                    <>
                      <tr key={listing.id} className={cn("hover:bg-muted/40 transition-colors", isExpanded && "bg-muted/20")}>
                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono">#{listing.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {listing.thumbnails?.[0] && (
                              <img src={listing.thumbnails[0]} alt="" className="w-8 h-8 rounded-lg object-cover border border-border shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm truncate max-w-[160px]">{listing.title}</span>
                                {listing.isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                              </div>
                              <p className="text-[10px] text-muted-foreground">{listing.category} · {listing.city}</p>
                            </div>
                            <button onClick={() => setExpandedId(isExpanded ? null : listing.id)} className="shrink-0 ml-1 text-muted-foreground hover:text-foreground transition-colors">
                              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm font-medium">{listing.owner?.name ?? "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{listing.owner?.email ?? ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold",
                            listing.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                            listing.status === "pending"  ? "bg-amber-100 text-amber-700" :
                            listing.status === "expired"  ? "bg-slate-100 text-slate-600" :
                            "bg-red-100 text-red-700"
                          )}>{listing.status}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-right">
                          <span className="text-xs font-semibold tabular-nums">{(listing.viewCount ?? 0).toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-right">
                          <span className="text-xs font-semibold tabular-nums">{contacts.toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Link href={`/listings/${listing.id}`}>
                              <Button size="sm" variant="outline" title="View listing" className="h-7 w-7 p-0">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            {listing.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50" title="Approve" onClick={() => handleApprove(listing.id)}>
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50" title="Reject" onClick={() => handleReject(listing.id)}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}

                            {listing.status === "approved" && (
                              <Button size="sm" variant="outline" className={cn("h-7 w-7 p-0", listing.isFeatured ? "text-amber-500 border-amber-300 bg-amber-50" : "text-muted-foreground")} title={listing.isFeatured ? "Unfeature" : "Feature"} onClick={() => toggleFeature(listing.id, listing.isFeatured || false)}>
                                <Star className={cn("w-3.5 h-3.5", listing.isFeatured ? "fill-amber-500" : "")} />
                              </Button>
                            )}

                            {/* Extend expiry dropdown */}
                            <div className="relative">
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-muted-foreground" title="Extend expiry" onClick={() => setExtendMenuId(extendMenuId === listing.id ? null : listing.id)}>
                                <CalendarClock className="w-3.5 h-3.5" />
                              </Button>
                              <AnimatePresence>
                                {extendMenuId === listing.id && (
                                  <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                    className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[120px]"
                                  >
                                    {([30, 60, 90] as const).map(days => (
                                      <button key={days} onClick={() => handleExtend(listing.id, days)} disabled={extendMutation.isPending}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors font-medium">
                                        +{days} days
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:border-red-200" title="Delete" onClick={() => handleDelete(listing.id, listing.title)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded analytics row */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr key={`${listing.id}-expand`}>
                            <td colSpan={7} className="px-0 py-0">
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden bg-muted/20 border-t border-border/50">
                                <div className="px-6 py-4">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                                    {[
                                      { label: "Views", value: listing.viewCount ?? 0, icon: Eye },
                                      { label: "WhatsApp", value: listing.whatsappClicks ?? 0, icon: MessageCircle },
                                      { label: "Phone", value: listing.phoneClicks ?? 0, icon: Phone },
                                      { label: "Shares", value: listing.shareCount ?? 0, icon: Share2 },
                                      { label: "QR Scans", value: listing.qrScans ?? 0, icon: QrCode },
                                      { label: "Rentals", value: listing.timesRented ?? 0, icon: Award },
                                    ].map(stat => (
                                      <div key={stat.label} className="bg-card border border-border rounded-xl p-2.5 text-center">
                                        <stat.icon className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-sm font-bold">{stat.value.toLocaleString("en-IN")}</p>
                                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                                      </div>
                                    ))}
                                    <div className="bg-card border border-border rounded-xl p-2.5 text-center">
                                      <p className="text-[10px] text-muted-foreground mb-1">Availability</p>
                                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", AVAILABILITY_COLORS[listing.availabilityStatus ?? "available"] ?? "bg-secondary text-muted-foreground")}>
                                        {(listing.availabilityStatus ?? "available").replace(/_/g, " ")}
                                      </span>
                                    </div>
                                  </div>
                                  {listing.expiresAt && (
                                    <p className="text-[10px] text-muted-foreground mt-3">
                                      Expires: {new Date(listing.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      {listing.rejectionReason && <span className="ml-3 text-red-500">Rejection reason: {listing.rejectionReason}</span>}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
