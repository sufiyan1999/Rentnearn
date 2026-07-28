import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAdminGetUsers, getAdminGetUsersQueryKey, useVerifyUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/ui-core";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserX, UserCheck, ChevronDown, Search, X, Package, CreditCard } from "lucide-react";
import { useSuspendUser, useActivateUser, useUserDetail } from "@/lib/useAdminData";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function UserDetailDrawer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, isLoading } = useUserDetail(userId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">User Detail</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : !data ? (
          <p className="text-muted-foreground text-sm text-center py-8">Failed to load user details</p>
        ) : (
          <div className="space-y-5">
            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">{data.user.name[0].toUpperCase()}</div>
              <div>
                <p className="font-bold">{data.user.name}</p>
                <p className="text-sm text-muted-foreground">{data.user.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded-full capitalize">{data.user.userType}</span>
                  {(data.user as any).isSuspended && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspended</span>}
                </div>
              </div>
            </div>

            {/* Memberships */}
            {data.memberships.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Memberships</p>
                <div className="space-y-2">
                  {data.memberships.map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-secondary rounded-xl px-3 py-2">
                      <span className="font-medium">{m.planName}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                          m.membership.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>{m.membership.status}</span>
                        <span className="text-xs text-muted-foreground">Exp: {new Date(m.membership.expiresAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listings */}
            {data.listings.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> Recent Listings</p>
                <div className="space-y-1.5">
                  {data.listings.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between text-sm bg-secondary rounded-xl px-3 py-2">
                      <span className="truncate max-w-[200px] font-medium">{l.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                          l.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          l.status === "pending" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        )}>{l.status}</span>
                        <span className="text-[10px] text-muted-foreground">{l.viewCount ?? 0} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.listings.length === 0 && data.memberships.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No listings or memberships yet</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detailUserId, setDetailUserId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "admin") setLocation("/");
  }, [isAuthenticated, user, setLocation]);

  const queryParams = { limit: 100, q: debouncedSearch || undefined } as any;
  const queryKey = [...getAdminGetUsersQueryKey({ limit: 100 }), debouncedSearch];

  const { data: usersData, isLoading } = useAdminGetUsers(queryParams, {
    query: { enabled: isAuthenticated && user?.userType === "admin", queryKey }
  });

  const verifyMutation  = useVerifyUser();
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const handleVerify = (id: number) => {
    verifyMutation.mutate({ userId: id }, { onSuccess: () => { toast.success("User identity verified"); invalidate(); } });
  };

  const handleSuspend = async (id: number, name: string) => {
    if (!confirm(`Suspend account for "${name}"? They will be unable to log in.`)) return;
    try { await suspendMutation.mutateAsync(id); toast.success("User suspended"); invalidate(); }
    catch { toast.error("Failed to suspend user"); }
  };

  const handleActivate = async (id: number) => {
    try { await activateMutation.mutateAsync(id); toast.success("User reactivated"); invalidate(); }
    catch { toast.error("Failed to activate user"); }
  };

  if (!isAuthenticated || user?.userType !== "admin") return null;

  const users = (usersData as any)?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View, verify, suspend, and manage all users</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="h-9 pl-9 pr-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-56"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Membership</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell text-center">Listings</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(8)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td></tr>)
              ) : !users.length ? (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No users found{search ? ` for "${search}"` : ""}</td></tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className={cn("hover:bg-muted/40 transition-colors", u.isSuspended && "opacity-60")}>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailUserId(u.id)} className="flex items-center gap-2 hover:text-primary transition-colors text-left group">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm group-hover:text-primary transition-colors">{u.name}</span>
                            {u.isVerified && <ShieldCheck className="w-3 h-3 text-primary shrink-0" />}
                            {u.isSuspended && <UserX className="w-3 h-3 text-red-500 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{u.city ? `${u.city}${u.state ? ", " + u.state : ""}` : "—"}</p>
                        </div>
                        <ChevronDown className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                        u.userType === "admin" ? "bg-primary/10 text-primary" :
                        u.userType === "business" ? "bg-blue-100 text-blue-700" :
                        "bg-secondary text-muted-foreground"
                      )}>{u.userType}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.activeMembership ? (
                        <span className="text-xs font-semibold">{u.activeMembership}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-center">
                      <span className="text-xs font-semibold tabular-nums">{u.listingCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {u.emailVerified ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 w-fit">Email ✓</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 w-fit">Unverified</span>
                        )}
                        {u.isSuspended && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600 w-fit">Suspended</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {!u.isVerified && u.userType !== "admin" && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-primary border-primary/30 hover:bg-primary/5" onClick={() => handleVerify(u.id)}>
                            <ShieldCheck className="w-3 h-3 mr-1" /> Verify
                          </Button>
                        )}
                        {u.userType !== "admin" && (
                          u.isSuspended ? (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => handleActivate(u.id)} disabled={activateMutation.isPending}>
                              <UserCheck className="w-3 h-3 mr-1" /> Activate
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleSuspend(u.id, u.name)} disabled={suspendMutation.isPending}>
                              <UserX className="w-3 h-3 mr-1" /> Suspend
                            </Button>
                          )
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

      {/* User Detail Drawer */}
      <AnimatePresence>
        {detailUserId !== null && (
          <UserDetailDrawer userId={detailUserId} onClose={() => setDetailUserId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
