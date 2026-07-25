import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import {
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetMyListings, getGetMyListingsQueryKey,
} from "@workspace/api-client-react";
import { useMyMembership } from "@/lib/useMembership";
import { ListingCard } from "@/components/ListingCard";
import { motion } from "framer-motion";
import {
  Package, Clock, CheckCircle2, XCircle, CreditCard, TrendingUp,
  Crown, Gift, Zap, Building2, ArrowRight, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_CONFIG: Record<string, { icon: typeof Gift; gradient: string; color: string }> = {
  free_trial: { icon: Gift,      gradient: "from-emerald-500 to-teal-500",  color: "text-emerald-600 dark:text-emerald-400" },
  basic:      { icon: Zap,       gradient: "from-blue-500 to-indigo-500",   color: "text-blue-600 dark:text-blue-400" },
  plus:       { icon: TrendingUp, gradient: "from-primary to-orange-500",    color: "text-primary" },
  business:   { icon: Building2,  gradient: "from-zinc-700 to-zinc-950",     color: "text-zinc-700 dark:text-zinc-300" },
};

function PlanIcon({ slug }: { slug: string }) {
  const cfg = PLAN_CONFIG[slug] ?? PLAN_CONFIG["free_trial"];
  const Icon = cfg.icon;
  return (
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0", cfg.gradient)}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  );
}

function StatusPill({ status, daysRemaining }: { status: string; daysRemaining: number }) {
  if (status === "active" && daysRemaining <= 7)
    return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">Expires in {daysRemaining}d</span>;
  if (status === "active")
    return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">Active</span>;
  if (status === "expired")
    return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">Expired</span>;
  return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{status}</span>;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { enabled: isAuthenticated, queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: listings, isLoading: listingsLoading } = useGetMyListings(
    { status: "all" },
    { query: { enabled: isAuthenticated, queryKey: getGetMyListingsQueryKey({ status: "all" }) } }
  );

  const { data: membershipInfo, isLoading: membershipLoading } = useMyMembership();

  if (!isAuthenticated) return null;

  const plan = membershipInfo?.plan;
  const membership = membershipInfo?.membership;
  const listingsUsed = membershipInfo?.listingsUsed ?? 0;
  const listingLimit = membershipInfo?.listingLimit ?? 0;
  const daysRemaining = membershipInfo?.daysRemaining ?? 0;
  const pct = listingLimit > 0 ? Math.min(100, Math.round((listingsUsed / listingLimit) * 100)) : 0;
  const isNearLimit = pct >= 80;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-bold mb-1">My Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-8">Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋</p>
      </motion.div>

      {/* ── Membership card ── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        {membershipLoading ? (
          <div className="h-36 bg-secondary rounded-3xl animate-pulse" />
        ) : !plan ? (
          /* No membership */
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 dark:text-amber-100">No active membership</p>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Your trial may have expired. Subscribe to a plan to keep listing.
              </p>
            </div>
            <Link href="/pricing"
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
              View Plans
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Plan summary */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <PlanIcon slug={plan.slug} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg leading-tight">{plan.name}</span>
                    {membership && <StatusPill status={membership.status} daysRemaining={daysRemaining} />}
                  </div>
                  {plan.slug === "free_trial" ? (
                    <p className="text-sm text-muted-foreground mt-0.5">Free 90-day trial · {daysRemaining} days remaining</p>
                  ) : plan.billingPeriod === "monthly" ? (
                    <p className="text-sm text-muted-foreground mt-0.5">Monthly plan · ₹{(plan.pricePaise / 100).toFixed(0)}/month · {daysRemaining} days left</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5">Yearly plan · ₹{(plan.pricePaise / 100).toFixed(0)}/year · {daysRemaining} days left</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {plan.slug !== "business" && (
                  <Link href="/pricing"
                    className="flex items-center gap-1.5 bg-primary text-white font-semibold text-xs px-3.5 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                    <Crown className="w-3.5 h-3.5" />
                    Upgrade
                  </Link>
                )}
                <Link href="/pricing"
                  className="flex items-center gap-1.5 bg-secondary text-foreground font-semibold text-xs px-3.5 py-2 rounded-xl hover:bg-border transition-colors">
                  <CreditCard className="w-3.5 h-3.5" />
                  Plans
                </Link>
              </div>
            </div>

            {/* Usage bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Listings Used</span>
                <span className={cn("text-xs font-bold", isNearLimit ? "text-amber-600" : "text-foreground")}>
                  {listingsUsed} / {listingLimit}
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                  className={cn("h-full rounded-full", isNearLimit ? "bg-amber-500" : "bg-primary")}
                />
              </div>
              {isNearLimit && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  You're close to your listing limit. Consider upgrading.
                </p>
              )}
              {isExpiringSoon && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Your membership expires in {daysRemaining} days.
                  <Link href="/pricing" className="underline font-semibold ml-0.5">Renew now</Link>
                </p>
              )}
            </div>
          </div>
        )}
      </motion.section>

      {/* ── Stats grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { icon: Package,      label: "Total Listings",    value: stats?.totalListings,   color: "bg-primary/10 text-primary" },
          { icon: CheckCircle2, label: "Active",             value: stats?.activeListings,   color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" },
          { icon: Clock,        label: "Pending",            value: stats?.pendingListings,  color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600" },
          { icon: XCircle,      label: "Rejected/Expired",  value: (stats?.rejectedListings ?? 0) + (stats?.expiredListings ?? 0), color: "bg-red-100 dark:bg-red-900/40 text-red-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border p-5 rounded-3xl">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold">{statsLoading ? "–" : (value ?? 0)}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Listings ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Listings</h2>
          <Link href="/listings/new"
            className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            <Package className="w-3.5 h-3.5" /> New Listing
          </Link>
        </div>

        {listingsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-secondary rounded-2xl" />)}
          </div>
        ) : !listings?.length ? (
          <div className="bg-secondary rounded-3xl p-10 text-center border border-border">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground mb-3">No listings yet</p>
            <Link href="/listings/new"
              className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              Create your first listing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(listings as any[]).map((listing: any) => (
              <div key={listing.id} className="relative">
                <ListingCard listing={listing} />
                <div className={cn(
                  "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm",
                  listing.status === "approved" ? "bg-emerald-500 text-white" :
                  listing.status === "pending"  ? "bg-amber-500 text-white" :
                  "bg-red-500 text-white"
                )}>
                  {listing.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
