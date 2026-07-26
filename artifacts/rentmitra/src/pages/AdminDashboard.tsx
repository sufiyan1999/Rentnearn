import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import {
  useAdminGetStats, getAdminGetStatsQueryKey,
  useAdminGetListings, getAdminGetListingsQueryKey,
  useAdminGetUsers, getAdminGetUsersQueryKey,
} from "@workspace/api-client-react";
import { useAdminSubscriptions, useAdminPlans, useCancelSubscription, useTogglePlan } from "@/lib/useMembership";
import {
  useAdminBusinessProfiles, useApproveBusinessProfile, useRejectBusinessProfile,
  useAdminCategories, useAddCategory, useUpdateCategory,
  useAdminReports,
} from "@/lib/useAdminData";
import {
  Users, Package, Clock, Heart, CheckCircle, Star, ShieldCheck, TrendingUp,
  AlertCircle, CreditCard, Crown, Building2, Gift, Zap, ToggleLeft, ToggleRight, XCircle,
  BarChart2, Tag, Plus, ChevronDown, ChevronRight, Check, X, IndianRupee,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending:  "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  expired:  "bg-slate-100 text-slate-600",
  active:   "bg-emerald-100 text-emerald-700",
  cancelled:"bg-red-100 text-red-700",
};

const PLAN_ICONS: Record<string, typeof Gift> = {
  free_trial: Gift,
  basic: Zap,
  plus: TrendingUp,
  business: Building2,
};

const PLAN_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const TABS = ["Overview", "Memberships", "Businesses", "Categories", "Reports"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Partial<Record<Tab, typeof CreditCard>> = {
  Memberships: CreditCard,
  Businesses: Building2,
  Categories: Tag,
  Reports: BarChart2,
};

// ─── Membership tab ──────────────────────────────────────────────────────────
function MembershipTab() {
  const { data: plans, isLoading: plansLoading } = useAdminPlans();
  const [subPage, setSubPage] = useState(1);
  const { data: subs, isLoading: subsLoading } = useAdminSubscriptions(subPage);
  const cancelSub = useCancelSubscription();
  const togglePlan = useTogglePlan();

  return (
    <div className="space-y-8">
      {/* Plans table */}
      <section className="bg-card border border-border rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Membership Plans</h2>
        </div>
        {plansLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground text-xs border-b border-border">
                  <th className="pb-3 pr-4 font-semibold">Plan</th>
                  <th className="pb-3 pr-4 font-semibold">Price</th>
                  <th className="pb-3 pr-4 font-semibold">Period</th>
                  <th className="pb-3 pr-4 font-semibold">Max Listings</th>
                  <th className="pb-3 pr-4 font-semibold">Max Images</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(plans ?? []).map(p => {
                  const Icon = PLAN_ICONS[p.slug] ?? Gift;
                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-semibold">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-semibold">
                        {p.pricePaise === 0 ? "Free" : `₹${(p.pricePaise / 100).toFixed(0)}`}
                      </td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">{p.billingPeriod}</td>
                      <td className="py-3 pr-4">{p.maxListings}</td>
                      <td className="py-3 pr-4">{p.maxImages}</td>
                      <td className="py-3">
                        <button
                          onClick={async () => {
                            await togglePlan.mutateAsync({ id: p.id, isActive: !p.isActive });
                            toast.success(`Plan ${p.isActive ? "disabled" : "enabled"}`);
                          }}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                            p.isActive
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-secondary text-muted-foreground hover:bg-border"
                          )}
                        >
                          {p.isActive
                            ? <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                            : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Subscriptions table */}
      <section className="bg-card border border-border rounded-3xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-lg">All Subscriptions</h2>
            {subs && <Badge variant="outline">{subs.total} total</Badge>}
          </div>
        </div>

        {subsLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground text-xs border-b border-border">
                    <th className="pb-3 pr-4 font-semibold">User</th>
                    <th className="pb-3 pr-4 font-semibold hidden sm:table-cell">Email</th>
                    <th className="pb-3 pr-4 font-semibold">Plan</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 pr-4 font-semibold hidden md:table-cell">Expires</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(subs?.data ?? []).map(row => (
                    <tr key={row.membership?.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{row.user.name}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{row.user.email}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="capitalize text-xs">{row.plan.name}</Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          STATUS_COLORS[row.membership?.status ?? "expired"] ?? "bg-secondary text-muted-foreground"
                        )}>
                          {row.membership?.status ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground hidden md:table-cell text-xs">
                        {row.membership?.expiresAt
                          ? new Date(row.membership.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="py-2.5">
                        {row.membership?.status === "active" && (
                          <button
                            onClick={async () => {
                              if (!confirm("Cancel this subscription?")) return;
                              await cancelSub.mutateAsync(row.membership!.id);
                              toast.success("Subscription cancelled");
                            }}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {subs && subs.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={subPage === 1} onClick={() => setSubPage(p => p - 1)}>Prev</Button>
                <span className="text-xs text-muted-foreground">Page {subPage} of {subs.totalPages}</span>
                <Button variant="outline" size="sm" disabled={subPage === subs.totalPages} onClick={() => setSubPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ─── Businesses tab ───────────────────────────────────────────────────────────
function BusinessesTab() {
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");
  const verified = filter === "pending" ? "false" : filter === "verified" ? "true" : undefined;
  const { data, isLoading } = useAdminBusinessProfiles(verified as any);
  const approve = useApproveBusinessProfile();
  const reject = useRejectBusinessProfile();

  const pendingCount = (data ?? []).filter(r => !r.user.isVerified).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Business Accounts</h2>
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "verified"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-bold transition-colors capitalize",
                filter === f ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-border"
              )}
            >{f}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />)}</div>
      ) : !data?.length ? (
        <div className="bg-secondary rounded-3xl p-12 text-center border border-border">
          <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">No business accounts found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground text-xs border-b border-border bg-muted/30">
                  <th className="px-5 py-3 font-semibold">Business</th>
                  <th className="px-5 py-3 font-semibold hidden md:table-cell">Owner</th>
                  <th className="px-5 py-3 font-semibold hidden lg:table-cell">Contact</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.map(row => (
                  <tr key={row.user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {row.profile?.logo ? (
                          <img src={row.profile.logo} alt="" className="w-9 h-9 rounded-xl object-cover border border-border" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{row.profile?.businessName ?? row.user.name}</p>
                          {row.profile?.city && <p className="text-xs text-muted-foreground">{row.profile.city}{row.profile.state ? `, ${row.profile.state}` : ""}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="font-medium">{row.user.name}</p>
                      <p className="text-xs text-muted-foreground">{row.user.email}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground text-xs">
                      {row.profile?.contactPhone && <p>{row.profile.contactPhone}</p>}
                      {row.profile?.website && <a href={row.profile.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{row.profile.website.replace(/^https?:\/\//, "")}</a>}
                      {!row.profile?.contactPhone && !row.profile?.website && <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-bold",
                        row.user.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {row.user.isVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {!row.user.isVerified ? (
                          <button
                            onClick={async () => {
                              await approve.mutateAsync(row.user.id);
                              toast.success(`${row.profile?.businessName ?? row.user.name} approved`);
                            }}
                            disabled={approve.isPending}
                            className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!confirm("Revoke verification for this business?")) return;
                              await reject.mutateAsync(row.user.id);
                              toast.success("Verification revoked");
                            }}
                            disabled={reject.isPending}
                            className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                          >
                            <X className="w-3.5 h-3.5" /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Categories tab ───────────────────────────────────────────────────────────
function CategoriesTab() {
  const { data: cats, isLoading } = useAdminCategories();
  const addCat = useAddCategory();
  const updateCat = useUpdateCategory();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", icon: "Package", description: "" });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.slug.trim()) { toast.error("Name and slug are required"); return; }
    try {
      await addCat.mutateAsync({ name: form.name.trim(), slug: form.slug.trim(), icon: form.icon, description: form.description || undefined });
      toast.success(`Category "${form.name}" added`);
      setForm({ name: "", slug: "", icon: "Package", description: "" });
      setShowAdd(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add category");
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await updateCat.mutateAsync({ id, isActive });
      toast.success(`Category ${isActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update category");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Categories</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add category
        </button>
      </div>

      {/* Add category form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <h3 className="font-bold text-sm mb-4">New Top-Level Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Home & Garden" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slug</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} className={inputCls} placeholder="e.g. home-garden" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Icon (Lucide name)</label>
                <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className={inputCls} placeholder="e.g. Home" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={addCat.isPending} className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {addCat.isPending ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Save
              </button>
              <button onClick={() => setShowAdd(false)} className="text-xs font-semibold text-muted-foreground hover:text-foreground px-4 transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground text-xs border-b border-border bg-muted/30">
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold hidden sm:table-cell">Slug</th>
                <th className="px-5 py-3 font-semibold text-right">Listings</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell text-center">Subcategories</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(cats ?? []).map(cat => (
                <>
                  <tr key={cat.id} className={cn("hover:bg-muted/30 transition-colors", !cat.isActive && "opacity-50")}>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                        className="flex items-center gap-2 font-semibold hover:text-primary transition-colors"
                      >
                        {cat.subcategories?.length > 0 && (
                          expanded === cat.id
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <Tag className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        {cat.name}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-muted-foreground font-mono text-xs">{cat.slug}</td>
                    <td className="px-5 py-3.5 text-right font-bold">{cat.listingCount}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-center text-muted-foreground">{cat.subcategories?.length ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggle(cat.id, !cat.isActive)}
                        disabled={updateCat.isPending}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                          cat.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-secondary text-muted-foreground hover:bg-border"
                        )}
                      >
                        {cat.isActive ? <><ToggleRight className="w-3.5 h-3.5" /> Active</> : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}
                      </button>
                    </td>
                  </tr>
                  {/* Inline subcategory expansion */}
                  <AnimatePresence>
                    {expanded === cat.id && cat.subcategories?.length > 0 && (
                      <tr key={`${cat.id}-subs`}>
                        <td colSpan={5} className="px-0 py-0">
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden bg-muted/20 border-t border-border/50">
                            <div className="px-6 py-3">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Subcategories</p>
                              <div className="flex flex-wrap gap-2">
                                {cat.subcategories.map(sub => (
                                  <span key={sub.id} className="flex items-center gap-1 text-xs bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                                    <Tag className="w-2.5 h-2.5" /> {sub.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Reports tab ──────────────────────────────────────────────────────────────
function ReportsTab() {
  const { data: reports, isLoading } = useAdminReports();

  if (isLoading) return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-secondary rounded-3xl animate-pulse" />)}
    </div>
  );

  if (!reports) return (
    <div className="bg-secondary rounded-3xl p-10 text-center border border-border">
      <BarChart2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground font-semibold">No report data available yet</p>
    </div>
  );

  const fmtDay = (d: string) => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });

  const pieColors = PLAN_COLORS;

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-primary" />
            <p className="text-sm font-semibold text-muted-foreground">Total Revenue</p>
          </div>
          <p className="text-4xl font-bold">₹{Math.round(reports.totalRevenuePaise / 100).toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted-foreground mt-1">From paid memberships</p>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 sm:col-span-2">
          <p className="text-sm font-bold mb-3">Revenue by Plan</p>
          {reports.revenueByPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No paid revenue yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={reports.revenueByPlan} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="planName" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="totalRupees" radius={[4, 4, 0, 0]}>
                  {reports.revenueByPlan.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Listings & Users over time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5">
          <p className="text-sm font-bold mb-4">Listings — Last 30 Days</p>
          {reports.listingsPerDay.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No listing data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={reports.listingsPerDay.map(d => ({ ...d, day: fmtDay(d.day) }))} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} name="Listings" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-3xl p-5">
          <p className="text-sm font-bold mb-4">User Growth — Last 30 Days</p>
          {reports.userGrowth.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No user data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={reports.userGrowth.map(d => ({ ...d, day: fmtDay(d.day) }))} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Cities & Membership Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5">
          <p className="text-sm font-bold mb-4">Top 10 Cities by Listings</p>
          {reports.topCities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No city data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reports.topCities} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={72} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Listings">
                  {reports.topCities.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-3xl p-5">
          <p className="text-sm font-bold mb-4">Active Memberships by Plan</p>
          {reports.membershipBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No active memberships</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={reports.membershipBreakdown}
                    dataKey="count"
                    nameKey="planName"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {reports.membershipBreakdown.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-1">
                {reports.membershipBreakdown.map((item, i) => (
                  <div key={item.planName} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                    <span className="text-muted-foreground">{item.planName}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

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

  // Business pending count for badge
  const { data: bizData } = useAdminBusinessProfiles("false");
  const pendingBizCount = bizData?.length ?? 0;

  if (!isAuthenticated || user?.userType !== "admin") return null;

  const pending = (pendingData as any)?.data ?? [];
  const users = (usersData as any)?.data ?? [];
  const topFavs: Array<{ id: number; title: string; category: string; city: string; favouriteCount: number; isFeatured: boolean }> =
    (stats as any)?.topFavourites ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">Platform overview and management</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = TAB_ICONS[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-all duration-150 relative",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab}
              {tab === "Businesses" && pendingBizCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {pendingBizCount > 9 ? "9+" : pendingBizCount}
                </span>
              )}
              {tab === "Overview" && (stats?.pendingApprovals ?? 0) > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {(stats?.pendingApprovals ?? 0) > 9 ? "9+" : stats?.pendingApprovals}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "Memberships" && <MembershipTab />}
          {activeTab === "Businesses"  && <BusinessesTab />}
          {activeTab === "Categories"  && <CategoriesTab />}
          {activeTab === "Reports"     && <ReportsTab />}
          {activeTab === "Overview"    && (
            <>
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
                      className={cn(bg, "p-5 rounded-3xl shadow-sm relative overflow-hidden", href ? "hover:scale-[1.03] transition-transform cursor-pointer" : "")}
                    >
                      <Icon className={cn("w-7 h-7 mb-3", iconColor)} />
                      <p className={cn("text-sm font-semibold mb-1", bg.includes("primary") ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</p>
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
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-300 text-white" : "bg-muted text-muted-foreground"
                          )}>
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
                          <th className="pb-2 font-semibold">Email</th>
                          <th className="pb-2 font-semibold hidden md:table-cell">Identity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {users.map((u: any) => (
                          <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2.5 pr-4">
                              <span className="font-medium">{u.name}</span>
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                            <td className="py-2.5 pr-4">
                              <Badge variant="outline" className="capitalize text-xs">{u.userType}</Badge>
                            </td>
                            <td className="py-2.5">
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                u.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {u.emailVerified ? "Email verified" : "Unverified"}
                              </span>
                            </td>
                            <td className="py-2.5 hidden md:table-cell">
                              {u.isVerified
                                ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><ShieldCheck className="w-3 h-3" /> ID verified</span>
                                : <span className="text-xs text-muted-foreground">—</span>}
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
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const inputCls = "w-full h-9 px-3 rounded-xl border border-border bg-background text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
