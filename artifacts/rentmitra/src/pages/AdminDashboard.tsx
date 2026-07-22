import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { useAdminGetStats, getAdminGetStatsQueryKey, useAdminGetListings, getAdminGetListingsQueryKey, useAdminGetUsers, getAdminGetUsersQueryKey } from "@workspace/api-client-react";
import { Users, Package, Clock, Heart, CheckCircle, XCircle, Star, ShieldCheck, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending:  "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  expired:  "bg-slate-100 text-slate-600",
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "admin") setLocation("/");
  }, [isAuthenticated, user, setLocation]);

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    query: { enabled: isAuthenticated && user?.userType === "admin", queryKey: getAdminGetStatsQueryKey() },
  });

  const { data: pendingData, isLoading: pendingLoading } = useAdminGetListings(
    { status: "pending", limit: 6 },
    { query: { enabled: isAuthenticated && user?.userType === "admin", queryKey: getAdminGetListingsQueryKey({ status: "pending", limit: 6 }) } }
  );

  const { data: usersData, isLoading: usersLoading } = useAdminGetUsers(
    { limit: 8 },
    { query: { enabled: isAuthenticated && user?.userType === "admin", queryKey: getAdminGetUsersQueryKey({ limit: 8 }) } }
  );

  if (!isAuthenticated || user?.userType !== "admin") return null;

  const pending = (pendingData as any)?.data ?? [];
  const users = (usersData as any)?.data ?? [];
  const topFavs: Array<{ id: number; title: string; category: string; city: string; favouriteCount: number; isFeatured: boolean }> =
    (stats as any)?.topFavourites ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Platform overview and quick actions</p>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { href: "/admin/users",   icon: Users,   label: "Total Users",     value: stats?.totalUsers,       bg: "bg-primary text-primary-foreground", iconColor: "opacity-80" },
          { href: "/admin/listings",icon: Package,  label: "Total Listings",  value: stats?.totalListings,    bg: "bg-card border border-border",        iconColor: "text-primary" },
          { href: "/admin/listings?status=pending", icon: Clock, label: "Pending Approval", value: stats?.pendingApprovals, bg: "bg-card border border-border", iconColor: "text-amber-500", ping: (stats?.pendingApprovals ?? 0) > 0 },
          { href: null,             icon: Heart,   label: "Total Favourites", value: stats?.totalFavourites,  bg: "bg-secondary",                        iconColor: "text-rose-500" },
        ].map(({ href, icon: Icon, label, value, bg, iconColor, ping }, i) => {
          const card = (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`${bg} p-5 rounded-3xl shadow-sm relative overflow-hidden ${href ? "hover:scale-[1.03] transition-transform cursor-pointer" : ""}`}
            >
              <Icon className={`w-7 h-7 mb-3 ${iconColor}`} />
              <p className={`text-sm font-semibold mb-1 ${bg.includes("primary") ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p>
              <p className="text-4xl font-bold">{statsLoading ? "–" : (value ?? 0)}</p>
              {ping && <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
            </motion.div>
          );
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ── Pending Approvals ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-lg">Pending Approvals</h2>
              {(stats?.pendingApprovals ?? 0) > 0 && (
                <Badge className="bg-amber-100 text-amber-700 border-0">{stats?.pendingApprovals}</Badge>
              )}
            </div>
            <Link href="/admin/listings?status=pending">
              <Button variant="ghost" size="sm" className="text-primary text-xs">View all</Button>
            </Link>
          </div>

          {pendingLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : pending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-medium">All clear! No pending listings.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pending.map((l: any) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/60 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{l.category} · {l.city}</p>
                  </div>
                  <Link href="/admin/listings?status=pending">
                    <Button size="sm" className="rounded-full text-xs h-7 shrink-0">Review</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* ── Top Favourites ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-lg">Top Favourited Listings</h2>
          </div>

          {statsLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : topFavs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No favourites recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {topFavs.map((item, i) => (
                <li key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/60 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-300 text-white" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate flex items-center gap-1">
                      {item.title}
                      {item.isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.category} · {item.city}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span className="text-sm font-bold">{item.favouriteCount}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* ── Recent Users ── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card border border-border rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Recent Users</h2>
          </div>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="text-primary text-xs">View all</Button>
          </Link>
        </div>

        {usersLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground text-xs border-b border-border">
                  <th className="pb-2 pr-4 font-semibold">Name</th>
                  <th className="pb-2 pr-4 font-semibold hidden sm:table-cell">Email</th>
                  <th className="pb-2 pr-4 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium flex items-center gap-1">
                        {u.name}
                        {u.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="capitalize text-xs">{u.userType}</Badge>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {u.emailVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* ── Category Stats ── */}
      {(stats as any)?.topCategories?.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-3xl p-5 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Top Categories</h2>
          </div>
          <div className="space-y-3">
            {(stats as any).topCategories.map((cat: any, i: number) => {
              const max = (stats as any).topCategories[0]?.count ?? 1;
              const pct = Math.round((cat.count / max) * 100);
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-5 text-right">{i + 1}</span>
                  <span className="text-sm font-medium w-36 truncate">{cat.category}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}
    </div>
  );
}
