import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import {
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetMyListings, getGetMyListingsQueryKey,
  useGetRecentlyViewed, getGetRecentlyViewedQueryKey,
  useGetFavourites, getGetFavouritesQueryKey,
  useRemoveFavourite,
  useUpdateProfile,
  useGetMe,
} from "@workspace/api-client-react";
import { useMyMembership } from "@/lib/useMembership";
import { ListingCard } from "@/components/ListingCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, Clock, CheckCircle2, XCircle, CreditCard, TrendingUp,
  Crown, Gift, Zap, Building2, ArrowRight, AlertTriangle, Heart,
  Eye, Camera, Lock, Save, ChevronDown, LogOut, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { STATES } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "profile" | "listings" | "membership" | "recently-viewed" | "favourites";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile",         label: "Profile",         icon: User },
  { id: "listings",        label: "My Listings",     icon: Package },
  { id: "membership",      label: "Membership",      icon: CreditCard },
  { id: "recently-viewed", label: "Recently Viewed", icon: Eye },
  { id: "favourites",      label: "Favourites",      icon: Heart },
];

const STATUS_FILTERS = ["all", "approved", "pending", "rejected", "expired"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_LABELS: Record<string, string> = {
  all: "All", approved: "Active", pending: "Pending",
  rejected: "Rejected", expired: "Expired",
};

// ─── Plan config ─────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, { icon: typeof Gift; gradient: string }> = {
  free_trial: { icon: Gift,       gradient: "from-emerald-500 to-teal-500" },
  basic:      { icon: Zap,        gradient: "from-blue-500 to-indigo-500" },
  plus:       { icon: TrendingUp, gradient: "from-primary to-orange-500" },
  business:   { icon: Building2,  gradient: "from-zinc-700 to-zinc-950" },
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user: authUser, isAuthenticated, updateUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  // Active tab from URL
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("tab");
    return (TABS.find(x => x.id === t)?.id) ?? "profile";
  });

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/dashboard?tab=${tab}`);
  }, []);

  const { data: membershipInfo, isLoading: membershipLoading } = useMyMembership();
  const plan = membershipInfo?.plan;
  const membership = membershipInfo?.membership;
  const daysRemaining = membershipInfo?.daysRemaining ?? 0;
  const showTrialBanner =
    plan?.slug === "free_trial" && membership?.status === "active" && daysRemaining <= 14 && daysRemaining > 0;

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl pb-24">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-1">My Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Welcome back, {authUser?.name?.split(" ")[0] ?? "there"} 👋
        </p>
      </motion.div>

      {/* ── Trial expiry amber banner ── */}
      <AnimatePresence>
        {showTrialBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
              Your free trial expires in <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong>.
            </p>
            <Link href="/pricing" className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0">
              Upgrade now →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab nav ── */}
      <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto pb-px">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-all duration-150",
                activeTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "profile"         && <ProfileTab updateUser={updateUser} />}
          {activeTab === "listings"        && <MyListingsTab />}
          {activeTab === "membership"      && <MembershipTab />}
          {activeTab === "recently-viewed" && <RecentlyViewedTab />}
          {activeTab === "favourites"      && <FavouritesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ updateUser }: { updateUser: (u: any) => void }) {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { data: me, isLoading, refetch } = useGetMe();
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState({ name: "", phone: "", city: "", state: "" });
  const [editing, setEditing] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Password change
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (me) {
      setForm({
        name:  (me as any).name  ?? "",
        phone: (me as any).phone ?? "",
        city:  (me as any).city  ?? "",
        state: (me as any).state ?? "",
      });
    }
  }, [me]);

  const handleSave = () => {
    updateProfile.mutate(
      { data: { name: form.name || undefined, phone: form.phone || undefined, city: form.city || undefined, state: form.state || undefined } },
      {
        onSuccess: (updated) => {
          updateUser(updated);
          refetch();
          setEditing(false);
          toast.success("Profile updated");
        },
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem("rentnearn_token");
    const fd = new FormData();
    fd.append("photo", file);
    setPhotoLoading(true);
    try {
      const res = await fetch(`${BASE}/api/users/me/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { photoUrl } = await res.json();
      updateUser({ ...(me as any), profilePhoto: photoUrl });
      refetch();
      toast.success("Photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setPhotoLoading(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { toast.error("Passwords don't match"); return; }
    if (pwForm.next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    const token = localStorage.getItem("rentnearn_token");
    setPwLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Password changed successfully");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  if (isLoading) return <div className="h-64 skeleton rounded-3xl" />;

  const user = me as any;

  return (
    <div className="space-y-6">
      {/* ── Avatar + basic info ── */}
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border-4 border-background shadow-lg">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <button
            onClick={() => photoRef.current?.click()}
            disabled={photoLoading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {photoLoading ? <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-1 flex-wrap">
            <h2 className="text-xl font-bold">{user?.name}</h2>
            {!user?.hasPassword && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Google linked
              </span>
            )}
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
              {user?.userType} account
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Settings className="w-3.5 h-3.5" /> Edit profile
            </button>
          )}
        </div>
      </div>

      {/* ── Edit form ── */}
      {editing && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base">Edit Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Full name">
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls}
                placeholder="Your name"
              />
            </FieldGroup>
            <FieldGroup label="Phone">
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inputCls}
                placeholder="+91 98765 43210"
              />
            </FieldGroup>
            <FieldGroup label="City">
              <input
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Mumbai"
              />
            </FieldGroup>
            <FieldGroup label="State">
              <div className="relative">
                <select
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  className={cn(inputCls, "appearance-none pr-8")}
                >
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </FieldGroup>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {updateProfile.isPending ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
            <button onClick={() => setEditing(false)} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-4">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Change password (non-Google only) ── */}
      {user?.hasPassword && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" /> Change Password
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="Current password">
              <input
                type="password" value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                className={inputCls} placeholder="Current password"
              />
            </FieldGroup>
            <FieldGroup label="New password">
              <input
                type="password" value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                className={inputCls} placeholder="Min 8 characters"
              />
            </FieldGroup>
            <FieldGroup label="Confirm new password">
              <input
                type="password" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                className={inputCls} placeholder="Repeat new password"
              />
            </FieldGroup>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
            className="flex items-center gap-2 bg-secondary text-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-border transition-colors disabled:opacity-50"
          >
            {pwLoading ? <span className="w-4 h-4 border-2 border-foreground/40 border-t-foreground rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
            Update password
          </button>
        </div>
      )}
    </div>
  );
}

// ─── My Listings Tab ──────────────────────────────────────────────────────────

function MyListingsTab() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { data: listings, isLoading } = useGetMyListings(
    { status: "all" },
    { query: { queryKey: getGetMyListingsQueryKey({ status: "all" }) } }
  );

  const filtered = (listings as any[] ?? []).filter(l =>
    statusFilter === "all" ? true :
    statusFilter === "approved" ? l.status === "approved" :
    statusFilter === "pending"  ? l.status === "pending"  :
    statusFilter === "rejected" ? l.status === "rejected" :
    statusFilter === "expired"  ? l.status === "expired"  :
    true
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-bold">My Listings</h2>
        <Link href="/listings/new"
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
          <Package className="w-3.5 h-3.5" /> New Listing
        </Link>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "h-8 px-3.5 rounded-full text-xs font-bold transition-all",
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:bg-border hover:text-foreground"
            )}
          >
            {STATUS_LABELS[s]}
            {s !== "all" && listings && (
              <span className="ml-1.5 opacity-70">
                ({(listings as any[]).filter(l => s === "approved" ? l.status === "approved" : l.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-secondary rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-secondary rounded-3xl p-10 text-center border border-border">
          <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground mb-3">
            {statusFilter === "all" ? "No listings yet" : `No ${STATUS_LABELS[statusFilter].toLowerCase()} listings`}
          </p>
          {statusFilter === "all" && (
            <Link href="/listings/new"
              className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              Create your first listing <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((listing: any) => (
            <div key={listing.id} className="relative">
              <ListingCard listing={listing} />
              <div className={cn(
                "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm",
                listing.status === "approved" ? "bg-emerald-500 text-white" :
                listing.status === "pending"  ? "bg-amber-500 text-white" :
                "bg-red-500 text-white"
              )}>
                {listing.status === "approved" ? "Active" : listing.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Membership Tab ───────────────────────────────────────────────────────────

function MembershipTab() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });
  const { data: membershipInfo, isLoading: membershipLoading } = useMyMembership();

  const plan = membershipInfo?.plan;
  const membership = membershipInfo?.membership;
  const listingsUsed = membershipInfo?.listingsUsed ?? 0;
  const listingLimit = membershipInfo?.listingLimit ?? 0;
  const daysRemaining = membershipInfo?.daysRemaining ?? 0;
  const pct = listingLimit > 0 ? Math.min(100, Math.round((listingsUsed / listingLimit) * 100)) : 0;
  const isNearLimit = pct >= 80;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div className="space-y-6">
      {/* Membership card */}
      {membershipLoading ? (
        <div className="h-36 bg-secondary rounded-3xl animate-pulse" />
      ) : !plan ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-900 dark:text-amber-100">No active membership</p>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-0.5">Subscribe to a plan to keep listing.</p>
          </div>
          <Link href="/pricing" className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
            View Plans
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl p-5">
          <div className="flex flex-col sm:flex-row gap-4">
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
                  <p className="text-sm text-muted-foreground mt-0.5">Monthly · ₹{(plan.pricePaise / 100).toFixed(0)}/month · {daysRemaining} days left</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">Yearly · ₹{(plan.pricePaise / 100).toFixed(0)}/year · {daysRemaining} days left</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {plan.slug !== "business" && (
                <Link href="/pricing" className="flex items-center gap-1.5 bg-primary text-white font-semibold text-xs px-3.5 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                  <Crown className="w-3.5 h-3.5" /> Upgrade
                </Link>
              )}
              <Link href="/pricing" className="flex items-center gap-1.5 bg-secondary text-foreground font-semibold text-xs px-3.5 py-2 rounded-xl hover:bg-border transition-colors">
                <CreditCard className="w-3.5 h-3.5" /> Plans
              </Link>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Listings Used</span>
              <span className={cn("text-xs font-bold", isNearLimit ? "text-amber-600" : "")}>
                {listingsUsed} / {listingLimit}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                className={cn("h-full rounded-full", isNearLimit ? "bg-amber-500" : "bg-primary")}
              />
            </div>
            {isNearLimit && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> You're close to your listing limit.
                <Link href="/pricing" className="underline font-semibold ml-0.5">Upgrade</Link>
              </p>
            )}
            {isExpiringSoon && !isNearLimit && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Membership expires in {daysRemaining} days.
                <Link href="/pricing" className="underline font-semibold ml-0.5">Renew now</Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package,      label: "Total Listings",   value: stats?.totalListings,   color: "bg-primary/10 text-primary" },
          { icon: CheckCircle2, label: "Active",            value: stats?.activeListings,  color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" },
          { icon: Clock,        label: "Pending",           value: stats?.pendingListings, color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600" },
          { icon: XCircle,      label: "Rejected/Expired", value: (stats?.rejectedListings ?? 0) + (stats?.expiredListings ?? 0), color: "bg-red-100 dark:bg-red-900/40 text-red-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border p-5 rounded-3xl">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold">{statsLoading ? "–" : (value ?? 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recently Viewed Tab ──────────────────────────────────────────────────────

function RecentlyViewedTab() {
  const { data, isLoading } = useGetRecentlyViewed(
    { limit: 20 },
    { query: { queryKey: getGetRecentlyViewedQueryKey({ limit: 20 }) } }
  );

  if (isLoading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
    </div>
  );

  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-secondary rounded-3xl border border-border">
      <Eye className="w-14 h-14 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-bold mb-1">Nothing here yet</h2>
      <p className="text-muted-foreground text-sm mb-5">Listings you view will appear here.</p>
      <Link href="/search" className="bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
        Explore listings
      </Link>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Recently Viewed</h2>
      <div className="space-y-2">
        {(data as any[]).map((listing: any) => (
          <Link key={listing.id} href={`/listings/${listing.id}`}>
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                {listing.thumbnails?.[0] ? (
                  <img src={listing.thumbnails[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{listing.title}</p>
                <p className="text-xs text-muted-foreground">{listing.city} · {listing.category}</p>
              </div>
              <div className="text-right shrink-0">
                {listing.rentalPrice?.daily ? (
                  <p className="text-sm font-bold">₹{listing.rentalPrice.daily.toLocaleString("en-IN")}<span className="text-xs font-normal text-muted-foreground">/day</span></p>
                ) : (
                  <p className="text-xs text-muted-foreground">Contact for price</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Favourites Tab ───────────────────────────────────────────────────────────

function FavouritesTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetFavourites({
    query: { queryKey: getGetFavouritesQueryKey() }
  });
  const removeFav = useRemoveFavourite({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetFavouritesQueryKey() }) }
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-secondary rounded-2xl" />)}
    </div>
  );

  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-secondary rounded-3xl border border-border">
      <Heart className="w-14 h-14 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-bold mb-1">No favourites yet</h2>
      <p className="text-muted-foreground text-sm mb-5">Save items you like to find them easily later.</p>
      <Link href="/search" className="bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
        Explore listings
      </Link>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Favourites</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(data as any[]).map((listing: any) => (
          <div key={listing.id} className="relative group">
            <ListingCard listing={listing} />
            <button
              onClick={e => { e.preventDefault(); removeFav.mutate({ listingId: listing.id }); }}
              className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 dark:bg-black/70 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              title="Remove from favourites"
            >
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
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
