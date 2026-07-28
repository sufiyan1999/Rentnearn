import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { useAdminGetStats, getAdminGetStatsQueryKey, useAdminGetListings, getAdminGetListingsQueryKey, useAdminGetUsers, getAdminGetUsersQueryKey } from "@workspace/api-client-react";
import { useAdminSubscriptions, useAdminPlans, useCancelSubscription, useTogglePlan } from "@/lib/useMembership";
import {
  useAdminBusinessProfiles, useApproveBusinessProfile, useRejectBusinessProfile,
  useAdminCategories, useAddCategory, useUpdateCategory,
  useAdminReports, useAdminEnhancedStats, useAdminAuditLog,
  useAdminPaymentAnalytics, useAdminGoals, useCreateGoal, useDeleteGoal,
  useAdminTrending, useFeatureListingAdmin,
} from "@/lib/useAdminData";
import {
  Users, Package, Clock, Heart, CheckCircle, Star, ShieldCheck, TrendingUp,
  AlertCircle, CreditCard, Crown, Building2, Gift, Zap, ToggleLeft, ToggleRight, XCircle,
  BarChart2, Tag, Plus, ChevronDown, ChevronRight, Check, X, IndianRupee,
  Eye, MessageCircle, Phone, Share2, QrCode, Activity, Target, Leaf,
  Brain, Sparkles, ArrowUpRight, ArrowDownRight, Minus, Trash2, Search,
  Filter, History, TrendingDown, Award, Calendar, ChevronLeft, RefreshCw, Download,
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
  free_trial: Gift, basic: Zap, plus: TrendingUp, business: Building2,
};

const PLAN_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const TABS = ["Overview", "Memberships", "Businesses", "Categories", "Reports", "Activity Log", "Payments", "Trending"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Partial<Record<Tab, typeof CreditCard>> = {
  Memberships: CreditCard, Businesses: Building2, Categories: Tag,
  Reports: BarChart2, "Activity Log": History, Payments: IndianRupee, Trending: TrendingUp,
};

// ─── Shared helpers ───────────────────────────────────────────────────────────
const inputCls = "w-full h-9 px-3 rounded-xl border border-border bg-background text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

async function downloadCsv(path: string, filename: string) {
  try {
    const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
    const token = localStorage.getItem("rentnearn_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE}${path}`, { headers });
    if (!res.ok) { toast.error("Export failed — please try again"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Export failed");
  }
}

function PctBadge({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return null;
  if (pct > 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full"><ArrowUpRight className="w-2.5 h-2.5" />{pct}%</span>;
  if (pct < 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full"><ArrowDownRight className="w-2.5 h-2.5" />{Math.abs(pct)}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full"><Minus className="w-2.5 h-2.5" />0%</span>;
}

function KpiCard({ label, value, sub, icon: Icon, iconColor = "text-primary", pct, loading }: { label: string; value: string | number | undefined; sub?: string; icon: typeof Users; iconColor?: string; pct?: number | null; loading?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <Icon className={cn("w-4 h-4", iconColor)} />
        {pct !== undefined && <PctBadge pct={pct} />}
      </div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide leading-none">{label}</p>
      {loading ? <div className="h-7 w-16 bg-muted rounded animate-pulse" /> : <p className="text-2xl font-bold leading-tight">{value ?? 0}</p>}
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function useAnimatedCount(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(p * target));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return val;
}

// ─── Business Health Score ────────────────────────────────────────────────────
function HealthGauge({ score, label }: { score: number; label: string }) {
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 80 ? "#10b981" : score >= 60 ? "#f97316" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="bg-card border border-border rounded-3xl p-5 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 self-start">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">Business Health</h2>
      </div>
      <svg viewBox="0 0 140 140" className="w-36 h-36">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor">{score}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">/100</text>
      </svg>
      <span className={cn("text-sm font-bold px-3 py-1 rounded-full",
        score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 60 ? "bg-orange-100 text-orange-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
      )}>{label}</span>
      <div className="grid grid-cols-2 gap-1 w-full text-[10px] text-muted-foreground text-center">
        {[["≥80", "Excellent", "#10b981"], ["≥60", "Good", "#f97316"], ["≥40", "Average", "#f59e0b"], ["<40", "Needs Help", "#ef4444"]].map(([s, l, c]) => (
          <div key={s} className="flex items-center gap-1 justify-center">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
            <span>{s} · {l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Environmental Impact ─────────────────────────────────────────────────────
function EnvImpact({ timesRented }: { timesRented: number }) {
  const rentals   = useAnimatedCount(timesRented);
  const avoided   = useAnimatedCount(Math.round(timesRented * 0.8));
  const co2       = useAnimatedCount(timesRented * 2);
  const savings   = useAnimatedCount(timesRented * 500);

  const items = [
    { icon: "♻️", label: "Products Reused", value: rentals.toLocaleString("en-IN"), sub: "rental transactions" },
    { icon: "🛒", label: "Purchases Avoided", value: avoided.toLocaleString("en-IN"), sub: "est. new purchases" },
    { icon: "🌿", label: "CO₂ Saved", value: `${co2.toLocaleString("en-IN")} kg`, sub: "est. carbon footprint" },
    { icon: "💰", label: "Community Savings", value: `₹${savings.toLocaleString("en-IN")}`, sub: "est. money saved" },
  ];

  return (
    <section className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-5 h-5 text-emerald-600" />
        <h2 className="font-bold text-lg">Environmental Impact</h2>
        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Estimated</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.label} className="bg-white/60 dark:bg-white/5 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── AI Business Insights ─────────────────────────────────────────────────────
function AiInsights({ insights }: { insights: string[] }) {
  return (
    <section className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-200 dark:border-violet-800 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-violet-600" />
        <h2 className="font-bold text-lg">AI Business Insights</h2>
        <Sparkles className="w-4 h-4 text-violet-400" />
      </div>
      <ul className="space-y-2.5">
        {insights.map((ins, i) => (
          <li key={i} className="flex gap-2.5 items-start text-sm">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
            <span className="text-foreground/80">{ins}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Founder Command Center ───────────────────────────────────────────────────
function CommandCenter({ stats }: { stats: any }) {
  const quickStats = [
    { label: "New Users Today", value: stats?.newUsersToday ?? 0, icon: Users, color: "text-blue-500" },
    { label: "New Listings Today", value: "—", icon: Package, color: "text-orange-500" },
    { label: "Revenue Today", value: `₹${Math.round((stats?.revenueTodayPaise ?? 0) / 100).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-500", isText: true },
    { label: "Views Today", value: stats?.viewsToday ?? 0, icon: Eye, color: "text-primary" },
  ];

  const actionItems = [
    { icon: Clock, label: "Pending Listing Approvals", count: stats?.pendingApprovals ?? 0, href: "/admin/listings?status=pending", color: "text-amber-500", urgent: (stats?.pendingApprovals ?? 0) > 5 },
    { icon: Building2, label: "Pending Business Verifications", count: (stats?.totalBusiness ?? 0) - (stats?.verifiedBusiness ?? 0), href: null, color: "text-blue-500", urgent: false },
    { icon: CreditCard, label: "Memberships Expiring (7d)", count: stats?.membershipsExpiringSoon ?? 0, href: null, color: "text-violet-500", urgent: (stats?.membershipsExpiringSoon ?? 0) > 0 },
    { icon: XCircle, label: "Failed Payments", count: stats?.failedPayments ?? 0, href: null, color: "text-red-500", urgent: (stats?.failedPayments ?? 0) > 0 },
  ];

  return (
    <section className="bg-card border border-border rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="font-bold text-lg">Founder Command Center</h2>
        <span className="ml-auto text-xs text-muted-foreground">Today, {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {quickStats.map(s => (
          <div key={s.label} className="bg-secondary rounded-2xl p-3">
            <s.icon className={cn("w-4 h-4 mb-1", s.color)} />
            <p className="text-lg font-bold">{(s as any).isText ? s.value : s.value.toLocaleString?.("en-IN") ?? s.value}</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Action items */}
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Today's Action Items</p>
      <ul className="space-y-2">
        {actionItems.map(item => (
          <li key={item.label} className={cn("flex items-center justify-between gap-3 p-3 rounded-xl transition-colors", item.urgent ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-secondary")}>
            <div className="flex items-center gap-2 min-w-0">
              <item.icon className={cn("w-4 h-4 shrink-0", item.urgent ? "text-red-500" : item.color)} />
              <span className="text-sm truncate">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn("text-sm font-bold tabular-nums", item.urgent ? "text-red-600" : "")}>{item.count}</span>
              {item.href && item.count > 0 && (
                <Link href={item.href}><Button size="sm" className="h-6 text-[10px] rounded-full px-2">Review</Button></Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Goals & Targets ──────────────────────────────────────────────────────────
function GoalsSection() {
  const { data: goals, isLoading } = useAdminGoals();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", targetValue: "", metricType: "users", deadline: "" });

  const metricLabels: Record<string, string> = {
    users: "Total Users", listings: "Active Listings", businesses: "Business Accounts", revenue_paise: "Revenue (₹)"
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.targetValue) { toast.error("Title and target are required"); return; }
    try {
      await createGoal.mutateAsync({ title: form.title.trim(), targetValue: Number(form.targetValue), metricType: form.metricType, deadline: form.deadline || undefined });
      toast.success("Goal created");
      setForm({ title: "", targetValue: "", metricType: "users", deadline: "" });
      setShowForm(false);
    } catch { toast.error("Failed to create goal"); }
  };

  const fmtValue = (metricType: string, v: number) =>
    metricType === "revenue_paise" ? `₹${Math.round(v / 100).toLocaleString("en-IN")}` : v.toLocaleString("en-IN");

  return (
    <section className="bg-card border border-border rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Goals & Targets</h2>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors">
          <Plus className="w-3 h-3" /> Add Goal
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="bg-secondary rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Goal Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={cn(inputCls, "mt-1")} placeholder="e.g. 100 New Users" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Metric</label>
                  <select value={form.metricType} onChange={e => setForm(f => ({ ...f, metricType: e.target.value }))} className={cn(inputCls, "mt-1")}>
                    {Object.entries(metricLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Target Value</label>
                  <input type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} className={cn(inputCls, "mt-1")} placeholder="e.g. 100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Deadline (optional)</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className={cn(inputCls, "mt-1")} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={createGoal.isPending} className="flex items-center gap-1 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-60">
                  {createGoal.isPending ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-3 h-3" />} Save Goal
                </button>
                <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground px-3 transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div>
      ) : !goals?.length ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No goals set yet. Add your first business goal.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            return (
              <li key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{goal.title}</p>
                    <p className="text-[11px] text-muted-foreground">{metricLabels[goal.metricType] ?? goal.metricType} · {fmtValue(goal.metricType, goal.currentValue)} / {fmtValue(goal.metricType, goal.targetValue)}{goal.deadline ? ` · Due ${new Date(goal.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs font-bold tabular-nums", pct >= 100 ? "text-emerald-600" : pct >= 60 ? "text-primary" : "text-amber-600")}>{pct}%</span>
                    <button onClick={() => deleteGoal.mutate(goal.id)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-2 rounded-full", pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-primary" : "bg-amber-500")}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── Live-refresh status bar ──────────────────────────────────────────────────
function LiveStatusBar({ dataUpdatedAt, isFetching, refetch }: { dataUpdatedAt: number; isFetching: boolean; refetch: () => void }) {
  const [, tick] = useState(0);

  // Re-render every 15 s so the "X ago" label stays accurate
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const secsAgo = dataUpdatedAt ? Math.round((Date.now() - dataUpdatedAt) / 1000) : null;
  const label = secsAgo === null ? "—"
    : secsAgo < 10  ? "just now"
    : secsAgo < 60  ? `${secsAgo}s ago`
    : secsAgo < 3600 ? `${Math.floor(secsAgo / 60)}m ago`
    : `${Math.floor(secsAgo / 3600)}h ago`;

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/40 border border-border rounded-2xl mb-4">
      <div className="flex items-center gap-2">
        {/* Live pulse dot */}
        <span className="relative flex h-2 w-2">
          {!isFetching && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", isFetching ? "bg-amber-400" : "bg-emerald-500")} />
        </span>
        <span className="text-xs text-muted-foreground">
          {isFetching ? "Refreshing…" : `Updated ${label}`}
        </span>
        <span className="hidden sm:inline text-[10px] text-muted-foreground/50">· auto-refreshes every 60 s · paused when tab hidden</span>
      </div>
      <button
        onClick={() => refetch()}
        disabled={isFetching}
        title="Refresh now"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
      >
        <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ pendingData, pendingLoading, usersData, usersLoading }: any) {
  const { data: stats, isLoading, isFetching, dataUpdatedAt, refetch } = useAdminEnhancedStats();

  const pctUsers = stats ? (stats.prevUsersMonth > 0 ? Math.round(((stats.newUsersMonth - stats.prevUsersMonth) / stats.prevUsersMonth) * 100) : null) : null;

  const userCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, iconColor: "text-blue-500", pct: pctUsers },
    { label: "New Today", value: stats?.newUsersToday, icon: Users, iconColor: "text-emerald-500" },
    { label: "New This Week", value: stats?.newUsersWeek, icon: TrendingUp, iconColor: "text-orange-500" },
    { label: "New This Month", value: stats?.newUsersMonth, icon: Calendar, iconColor: "text-violet-500" },
    { label: "Business Accounts", value: stats?.totalBusiness, icon: Building2, iconColor: "text-primary" },
    { label: "Verified Businesses", value: stats?.verifiedBusiness, icon: ShieldCheck, iconColor: "text-emerald-500" },
  ];

  const listingCards = [
    { label: "Total Listings", value: stats?.totalListings, icon: Package, iconColor: "text-primary" },
    { label: "Active", value: stats?.activeListings, icon: CheckCircle, iconColor: "text-emerald-500" },
    { label: "Pending Approval", value: stats?.pendingApprovals, icon: Clock, iconColor: "text-amber-500" },
    { label: "Rejected", value: stats?.rejectedListings, icon: X, iconColor: "text-red-500" },
    { label: "Expired", value: stats?.expiredListings, icon: AlertCircle, iconColor: "text-slate-400" },
    { label: "Featured", value: stats?.featuredListings, icon: Star, iconColor: "text-amber-400" },
  ];

  const analyticsCards = [
    { label: "Total Views", value: stats?.totalViews?.toLocaleString("en-IN"), icon: Eye, iconColor: "text-primary" },
    { label: "Views Today", value: stats?.viewsToday, icon: Eye, iconColor: "text-blue-500" },
    { label: "Contact Clicks", value: stats?.totalContactClicks?.toLocaleString("en-IN"), icon: Phone, iconColor: "text-emerald-500" },
    { label: "Favourites", value: stats?.totalFavourites?.toLocaleString("en-IN"), icon: Heart, iconColor: "text-rose-500" },
    { label: "WhatsApp Clicks", value: stats?.totalWhatsappClicks?.toLocaleString("en-IN"), icon: MessageCircle, iconColor: "text-emerald-600" },
    { label: "Rentals Logged", value: stats?.totalTimesRented, icon: Award, iconColor: "text-violet-500" },
  ];

  const revenueCards = [
    { label: "Revenue Today", value: `₹${Math.round((stats?.revenueTodayPaise ?? 0) / 100).toLocaleString("en-IN")}`, icon: IndianRupee, iconColor: "text-primary", isText: true },
    { label: "This Week", value: `₹${Math.round((stats?.revenueWeekPaise ?? 0) / 100).toLocaleString("en-IN")}`, icon: IndianRupee, iconColor: "text-blue-500", isText: true },
    { label: "This Month", value: `₹${Math.round((stats?.revenueMonthPaise ?? 0) / 100).toLocaleString("en-IN")}`, icon: IndianRupee, iconColor: "text-emerald-500", pct: stats?.pctRevenueChange, isText: true },
    { label: "This Year", value: `₹${Math.round((stats?.revenueYearPaise ?? 0) / 100).toLocaleString("en-IN")}`, icon: IndianRupee, iconColor: "text-violet-500", isText: true },
    { label: "Payment Success", value: `${stats?.paymentSuccessRate ?? 100}%`, icon: CheckCircle, iconColor: "text-emerald-500", isText: true },
    { label: "Failed Payments", value: stats?.failedPayments, icon: XCircle, iconColor: "text-red-500" },
  ];

  const SectionLabel = ({ label, icon: Icon, color }: { label: string; icon: typeof Users; color: string }) => (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Live status bar */}
      <LiveStatusBar dataUpdatedAt={dataUpdatedAt} isFetching={isFetching} refetch={refetch} />

      {/* KPI Grid */}
      <div className="space-y-4">
        <SectionLabel label="Users" icon={Users} color="text-blue-500" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {userCards.map(c => <KpiCard key={c.label} {...c} loading={isLoading} />)}
        </div>

        <SectionLabel label="Listings" icon={Package} color="text-primary" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {listingCards.map(c => <KpiCard key={c.label} {...c} loading={isLoading} />)}
        </div>

        <SectionLabel label="Analytics" icon={Eye} color="text-emerald-500" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {analyticsCards.map(c => <KpiCard key={c.label} {...(c as any)} loading={isLoading} />)}
        </div>

        <SectionLabel label="Revenue & Payments" icon={IndianRupee} color="text-amber-500" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {revenueCards.map(c => <KpiCard key={c.label} {...(c as any)} loading={isLoading} />)}
        </div>
      </div>

      {/* Health + Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <HealthGauge score={stats?.healthScore ?? 0} label={stats?.healthLabel ?? "—"} />
        <div className="lg:col-span-2">
          <CommandCenter stats={stats} />
        </div>
      </div>

      {/* Environmental Impact */}
      <EnvImpact timesRented={stats?.totalTimesRented ?? 0} />

      {/* AI Insights */}
      {stats?.insights?.length ? <AiInsights insights={stats.insights} /> : null}

      {/* Goals */}
      <GoalsSection />

      {/* Top Favourites */}
      {(stats?.topFavourites?.length ?? 0) > 0 && (
        <section className="bg-card border border-border rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <h2 className="font-bold text-lg">Top Favourited Listings</h2>
            </div>
          </div>
          <ul className="space-y-2">
            {stats!.topFavourites.map((item, i) => (
              <li key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/60 transition-colors">
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0", i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-300 text-white" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate flex items-center gap-1">
                    {item.title}
                    {item.isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span className="text-sm font-bold">{item.favouriteCount}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Top Categories */}
      {(stats?.topCategories?.length ?? 0) > 0 && (
        <section className="bg-card border border-border rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Top Categories</h2>
          </div>
          <div className="space-y-3">
            {stats!.topCategories.map((cat, i) => {
              const max = stats!.topCategories[0]?.count ?? 1;
              const pct = Math.round((cat.count / max) * 100);
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-5 text-right">{i + 1}</span>
                  <span className="text-sm font-medium w-36 truncate">{cat.category}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <motion.div className="bg-primary h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Membership tab ───────────────────────────────────────────────────────────
function MembershipTab() {
  const { data: plans, isLoading: plansLoading } = useAdminPlans();
  const [subPage, setSubPage] = useState(1);
  const { data: subs, isLoading: subsLoading } = useAdminSubscriptions(subPage);
  const cancelSub = useCancelSubscription();
  const togglePlan = useTogglePlan();

  return (
    <div className="space-y-8">
      <section className="bg-card border border-border rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-5"><CreditCard className="w-5 h-5 text-primary" /><h2 className="font-bold text-lg">Membership Plans</h2></div>
        {plansLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground text-xs border-b border-border"><th className="pb-3 pr-4 font-semibold">Plan</th><th className="pb-3 pr-4 font-semibold">Price</th><th className="pb-3 pr-4 font-semibold">Period</th><th className="pb-3 pr-4 font-semibold">Max Listings</th><th className="pb-3 pr-4 font-semibold">Max Images</th><th className="pb-3 font-semibold">Status</th></tr></thead>
              <tbody className="divide-y divide-border/50">
                {(plans ?? []).map(p => {
                  const Icon = PLAN_ICONS[p.slug] ?? Gift;
                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 pr-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-3.5 h-3.5 text-primary" /></div><span className="font-semibold">{p.name}</span></div></td>
                      <td className="py-3 pr-4 font-semibold">{p.pricePaise === 0 ? "Free" : `₹${(p.pricePaise / 100).toFixed(0)}`}</td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">{p.billingPeriod}</td>
                      <td className="py-3 pr-4">{p.maxListings}</td>
                      <td className="py-3 pr-4">{p.maxImages}</td>
                      <td className="py-3">
                        <button onClick={async () => { await togglePlan.mutateAsync({ id: p.id, isActive: !p.isActive }); toast.success(`Plan ${p.isActive ? "disabled" : "enabled"}`); }} className={cn("flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors", p.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-secondary text-muted-foreground hover:bg-border")}>
                          {p.isActive ? <><ToggleRight className="w-3.5 h-3.5" /> Active</> : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}
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

      <section className="bg-card border border-border rounded-3xl p-5">
        <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /><h2 className="font-bold text-lg">All Subscriptions</h2>{subs && <Badge variant="outline">{subs.total} total</Badge>}</div></div>
        {subsLoading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground text-xs border-b border-border"><th className="pb-3 pr-4 font-semibold">User</th><th className="pb-3 pr-4 font-semibold hidden sm:table-cell">Email</th><th className="pb-3 pr-4 font-semibold">Plan</th><th className="pb-3 pr-4 font-semibold">Status</th><th className="pb-3 pr-4 font-semibold hidden md:table-cell">Expires</th><th className="pb-3 font-semibold">Actions</th></tr></thead>
                <tbody className="divide-y divide-border/50">
                  {(subs?.data ?? []).map(row => (
                    <tr key={row.membership?.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{row.user.name}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{row.user.email}</td>
                      <td className="py-2.5 pr-4"><Badge variant="outline" className="capitalize text-xs">{row.plan.name}</Badge></td>
                      <td className="py-2.5 pr-4"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[row.membership?.status ?? "expired"] ?? "bg-secondary text-muted-foreground")}>{row.membership?.status ?? "—"}</span></td>
                      <td className="py-2.5 pr-4 text-muted-foreground hidden md:table-cell text-xs">{row.membership?.expiresAt ? new Date(row.membership.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="py-2.5">{row.membership?.status === "active" && (<button onClick={async () => { if (!confirm("Cancel this subscription?")) return; await cancelSub.mutateAsync(row.membership!.id); toast.success("Subscription cancelled"); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"><XCircle className="w-3.5 h-3.5" /> Cancel</button>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        <div className="flex items-center gap-2"><h2 className="text-xl font-bold">Business Accounts</h2>{pendingCount > 0 && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{pendingCount} pending</span>}</div>
        <div className="flex gap-2">{(["all", "pending", "verified"] as const).map(f => (<button key={f} onClick={() => setFilter(f)} className={cn("h-8 px-3 rounded-full text-xs font-bold transition-colors capitalize", filter === f ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-border")}>{f}</button>))}</div>
      </div>
      {isLoading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />)}</div> : !data?.length ? (
        <div className="bg-secondary rounded-3xl p-12 text-center border border-border"><Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" /><p className="font-semibold text-muted-foreground">No business accounts found</p></div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground text-xs border-b border-border bg-muted/30"><th className="px-5 py-3 font-semibold">Business</th><th className="px-5 py-3 font-semibold hidden md:table-cell">Owner</th><th className="px-5 py-3 font-semibold hidden lg:table-cell">Contact</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Actions</th></tr></thead>
              <tbody className="divide-y divide-border/50">
                {data.map(row => (
                  <tr key={row.user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4"><div className="flex items-center gap-3">{row.profile?.logo ? <img src={row.profile.logo} alt="" className="w-9 h-9 rounded-xl object-cover border border-border" /> : <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0"><Building2 className="w-4 h-4 text-muted-foreground" /></div>}<div className="min-w-0"><p className="font-semibold truncate">{row.profile?.businessName ?? row.user.name}</p>{row.profile?.city && <p className="text-xs text-muted-foreground">{row.profile.city}</p>}</div></div></td>
                    <td className="px-5 py-4 hidden md:table-cell"><p className="font-medium">{row.user.name}</p><p className="text-xs text-muted-foreground">{row.user.email}</p></td>
                    <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground text-xs">{row.profile?.contactPhone && <p>{row.profile.contactPhone}</p>}{!row.profile?.contactPhone && <span className="text-muted-foreground/50">—</span>}</td>
                    <td className="px-5 py-4"><span className={cn("text-xs px-2.5 py-1 rounded-full font-bold", row.user.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{row.user.isVerified ? "Verified" : "Pending"}</span></td>
                    <td className="px-5 py-4">
                      {!row.user.isVerified ? (
                        <button onClick={async () => { await approve.mutateAsync(row.user.id); toast.success(`${row.profile?.businessName ?? row.user.name} approved`); }} disabled={approve.isPending} className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"><Check className="w-3.5 h-3.5" /> Approve</button>
                      ) : (
                        <button onClick={async () => { if (!confirm("Revoke verification?")) return; await reject.mutateAsync(row.user.id); toast.success("Verification revoked"); }} disabled={reject.isPending} className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"><X className="w-3.5 h-3.5" /> Revoke</button>
                      )}
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
    try { await addCat.mutateAsync({ name: form.name.trim(), slug: form.slug.trim(), icon: form.icon, description: form.description || undefined }); toast.success(`Category "${form.name}" added`); setForm({ name: "", slug: "", icon: "Package", description: "" }); setShowAdd(false); }
    catch (e: any) { toast.error(e.message ?? "Failed to add category"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3"><h2 className="text-xl font-bold">Categories</h2><button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"><Plus className="w-3.5 h-3.5" /> Add category</button></div>
      <AnimatePresence>{showAdd && (<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-card border border-border rounded-2xl p-5"><h3 className="font-bold text-sm mb-4">New Top-Level Category</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"><div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Home & Garden" /></div><div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slug</label><input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} className={inputCls} placeholder="e.g. home-garden" /></div><div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Icon (Lucide name)</label><input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className={inputCls} placeholder="e.g. Home" /></div><div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Optional" /></div></div><div className="flex gap-2"><button onClick={handleAdd} disabled={addCat.isPending} className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors">{addCat.isPending ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Save</button><button onClick={() => setShowAdd(false)} className="text-xs font-semibold text-muted-foreground hover:text-foreground px-4 transition-colors">Cancel</button></div></motion.div>)}</AnimatePresence>
      {isLoading ? <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-2xl animate-pulse" />)}</div> : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground text-xs border-b border-border bg-muted/30"><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold hidden sm:table-cell">Slug</th><th className="px-5 py-3 font-semibold text-right">Listings</th><th className="px-5 py-3 font-semibold hidden md:table-cell text-center">Subcategories</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead>
            <tbody className="divide-y divide-border/50">
              {(cats ?? []).map(cat => (
                <>
                  <tr key={cat.id} className={cn("hover:bg-muted/30 transition-colors", !cat.isActive && "opacity-50")}>
                    <td className="px-5 py-3.5"><button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)} className="flex items-center gap-2 font-semibold hover:text-primary transition-colors">{cat.subcategories?.length > 0 && (expanded === cat.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />)}<Tag className="w-3.5 h-3.5 text-primary/60 shrink-0" />{cat.name}</button></td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-muted-foreground font-mono text-xs">{cat.slug}</td>
                    <td className="px-5 py-3.5 text-right font-bold">{cat.listingCount}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-center text-muted-foreground">{cat.subcategories?.length ?? 0}</td>
                    <td className="px-5 py-3.5"><button onClick={() => updateCat.mutateAsync({ id: cat.id, isActive: !cat.isActive }).then(() => toast.success(`Category ${!cat.isActive ? "activated" : "deactivated"}`)).catch(() => toast.error("Failed"))} disabled={updateCat.isPending} className={cn("flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors", cat.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-secondary text-muted-foreground hover:bg-border")}>{cat.isActive ? <><ToggleRight className="w-3.5 h-3.5" /> Active</> : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}</button></td>
                  </tr>
                  <AnimatePresence>{expanded === cat.id && cat.subcategories?.length > 0 && (<tr key={`${cat.id}-subs`}><td colSpan={5} className="px-0 py-0"><motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden bg-muted/20 border-t border-border/50"><div className="px-6 py-3"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Subcategories</p><div className="flex flex-wrap gap-2">{cat.subcategories.map(sub => (<span key={sub.id} className="flex items-center gap-1 text-xs bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground"><Tag className="w-2.5 h-2.5" /> {sub.name}</span>))}</div></div></motion.div></td></tr>)}</AnimatePresence>
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
  if (isLoading) return <div className="space-y-6">{[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-secondary rounded-3xl animate-pulse" />)}</div>;
  if (!reports) return <div className="bg-secondary rounded-3xl p-10 text-center border border-border"><BarChart2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" /><p className="text-muted-foreground font-semibold">No report data available yet</p></div>;
  const fmtDay = (d: string) => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reports</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv("/api/admin/listings/export", `listings-${new Date().toISOString().slice(0,10)}.csv`)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> All Listings
          </button>
          <button
            onClick={() => downloadCsv("/api/admin/reports/export", `reports-analytics-${new Date().toISOString().slice(0,10)}.csv`)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5 sm:col-span-1"><div className="flex items-center gap-2 mb-2"><IndianRupee className="w-5 h-5 text-primary" /><p className="text-sm font-semibold text-muted-foreground">Total Revenue</p></div><p className="text-4xl font-bold">₹{Math.round(reports.totalRevenuePaise / 100).toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground mt-1">From paid memberships</p></div>
        <div className="bg-card border border-border rounded-3xl p-5 sm:col-span-2"><p className="text-sm font-bold mb-3">Revenue by Plan</p>{reports.revenueByPlan.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No paid revenue yet</p> : (<ResponsiveContainer width="100%" height={150}><BarChart data={reports.revenueByPlan} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="planName" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `₹${v}`} /><Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} /><Bar dataKey="totalRupees" radius={[4, 4, 0, 0]}>{reports.revenueByPlan.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>)}</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5"><p className="text-sm font-bold mb-4">Listings — Last 30 Days</p>{reports.listingsPerDay.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No listing data for this period</p> : (<ResponsiveContainer width="100%" height={180}><LineChart data={reports.listingsPerDay.map(d => ({ ...d, day: fmtDay(d.day) }))} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} /><Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} name="Listings" /></LineChart></ResponsiveContainer>)}</div>
        <div className="bg-card border border-border rounded-3xl p-5"><p className="text-sm font-bold mb-4">User Growth — Last 30 Days</p>{reports.userGrowth.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No user data for this period</p> : (<ResponsiveContainer width="100%" height={180}><LineChart data={reports.userGrowth.map(d => ({ ...d, day: fmtDay(d.day) }))} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} /><Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="New Users" /></LineChart></ResponsiveContainer>)}</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5"><p className="text-sm font-bold mb-4">Top 10 Cities by Listings</p>{reports.topCities.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No city data available</p> : (<ResponsiveContainer width="100%" height={220}><BarChart data={reports.topCities} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} /><YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={72} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} /><Bar dataKey="count" radius={[0, 4, 4, 0]} name="Listings">{reports.topCities.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>)}</div>
        <div className="bg-card border border-border rounded-3xl p-5"><p className="text-sm font-bold mb-4">Active Memberships by Plan</p>{reports.membershipBreakdown.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No active memberships</p> : (<div className="flex flex-col items-center"><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={reports.membershipBreakdown} dataKey="count" nameKey="planName" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>{reports.membershipBreakdown.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="flex flex-wrap justify-center gap-3 mt-1">{reports.membershipBreakdown.map((item, i) => (<div key={item.planName} className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} /><span className="text-muted-foreground">{item.planName}</span><span className="font-bold">{item.count}</span></div>))}</div></div>)}</div>
      </div>
    </div>
  );
}

// ─── Activity Log tab ─────────────────────────────────────────────────────────
function ActivityLogTab() {
  const [page, setPage] = useState(1);
  const [module, setModule] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useAdminAuditLog(page, module, debouncedSearch);

  const modules = ["all", "listings", "users", "businesses", "categories", "goals"];

  const fmtAction = (action: string) => action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const moduleColor: Record<string, string> = {
    listings: "bg-blue-100 text-blue-700", users: "bg-violet-100 text-violet-700",
    businesses: "bg-emerald-100 text-emerald-700", categories: "bg-orange-100 text-orange-700",
    goals: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Activity Log</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative"><Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search actions…" className="h-8 pl-8 pr-3 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-40" /></div>
          <div className="flex gap-1 overflow-x-auto">
            {modules.map(m => (<button key={m} onClick={() => { setModule(m); setPage(1); }} className={cn("h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize", module === m ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-border")}>{m}</button>))}
          </div>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (module !== "all") params.set("module", module);
              if (debouncedSearch) params.set("search", debouncedSearch);
              const qs = params.toString();
              downloadCsv(`/api/admin/audit-log/export${qs ? `?${qs}` : ""}`, `activity-log-${new Date().toISOString().slice(0,10)}.csv`);
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground text-xs border-b border-border bg-muted/30"><th className="px-4 py-3 font-semibold">Time</th><th className="px-4 py-3 font-semibold">Action</th><th className="px-4 py-3 font-semibold">Module</th><th className="px-4 py-3 font-semibold hidden sm:table-cell">Record</th><th className="px-4 py-3 font-semibold hidden md:table-cell">IP</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [...Array(8)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>)
              ) : !data?.data.length ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><History className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No activity logs yet</p></td></tr>
              ) : (
                data.data.map(row => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(row.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3 text-xs font-medium">{fmtAction(row.action)}</td>
                    <td className="px-4 py-3"><span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", moduleColor[row.module] ?? "bg-secondary text-muted-foreground")}>{row.module}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{row.affectedType ?? "—"}{row.affectedId ? ` #${row.affectedId}` : ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono hidden md:table-cell">{row.ipAddress ?? "—"}</td>
                    <td className="px-4 py-3"><span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", row.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>{row.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-xs text-muted-foreground">Page {page} of {data.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payment Analytics tab ────────────────────────────────────────────────────
function PaymentsTab() {
  const { data, isLoading } = useAdminPaymentAnalytics();

  const cards = [
    { label: "Today", value: data ? `₹${Math.round(data.revenueTodayPaise / 100).toLocaleString("en-IN")}` : "—", icon: IndianRupee, color: "text-emerald-500" },
    { label: "This Week", value: data ? `₹${Math.round(data.revenueWeekPaise / 100).toLocaleString("en-IN")}` : "—", icon: IndianRupee, color: "text-blue-500" },
    { label: "This Month", value: data ? `₹${Math.round(data.revenueMonthPaise / 100).toLocaleString("en-IN")}` : "—", icon: IndianRupee, color: "text-primary" },
    { label: "This Year", value: data ? `₹${Math.round(data.revenueYearPaise / 100).toLocaleString("en-IN")}` : "—", icon: IndianRupee, color: "text-violet-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Payment Analytics</h2>
        <button
          onClick={() => downloadCsv("/api/admin/payment-analytics/export", `payment-analytics-${new Date().toISOString().slice(0,10)}.csv`)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-4">
            <c.icon className={cn("w-5 h-5 mb-2", c.color)} />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{c.label}</p>
            {isLoading ? <div className="h-6 w-20 bg-muted rounded animate-pulse mt-1" /> : <p className="text-2xl font-bold">{c.value}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-3xl p-5">
          <p className="text-sm font-bold mb-1">Revenue by Plan</p>
          <p className="text-xs text-muted-foreground mb-4">All-time paid memberships</p>
          {isLoading ? <div className="h-48 bg-muted rounded-2xl animate-pulse" /> : !data?.byPlan.length ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No paid revenue yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.byPlan} dataKey="totalRupees" nameKey="planName" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
                  {data.byPlan.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {data?.byPlan && (
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {data.byPlan.map((p, i) => (
                <div key={p.planName} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                  <span className="text-muted-foreground">{p.planName}</span>
                  <span className="font-bold">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <p className="text-sm font-bold">Payment Health</p>
          {isLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}</div> : (
            <>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden"><div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${data?.successRate ?? 100}%` }} /></div>
                  <span className="text-sm font-bold text-emerald-600">{data?.successRate ?? 100}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Successful Payments</span>
                <span className="text-sm font-bold text-emerald-600">{data?.successCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Failed / Cancelled</span>
                <span className={cn("text-sm font-bold", (data?.failedCount ?? 0) > 0 ? "text-red-500" : "text-muted-foreground")}>{data?.failedCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Avg. Payment Value</span>
                <span className="text-sm font-bold">₹{data?.avgPaymentRupees?.toLocaleString("en-IN") ?? 0}</span>
              </div>
              {data?.mostPopularPlan && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Most Popular Plan</span>
                  <Badge variant="outline" className="text-xs">{data.mostPopularPlan}</Badge>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trending tab ─────────────────────────────────────────────────────────────
function TrendingTab() {
  const { data: listings, isLoading } = useAdminTrending(30);
  const featureMutation = useFeatureListingAdmin();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Trending Listings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ranked by interest score (views + contacts × 5)</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground text-xs border-b border-border bg-muted/30"><th className="px-4 py-3 font-semibold w-8">#</th><th className="px-4 py-3 font-semibold">Listing</th><th className="px-4 py-3 font-semibold text-right hidden sm:table-cell">Views</th><th className="px-4 py-3 font-semibold text-right hidden md:table-cell">Contacts</th><th className="px-4 py-3 font-semibold text-right hidden lg:table-cell">Score</th><th className="px-4 py-3 font-semibold">Badge</th><th className="px-4 py-3 font-semibold">Feature</th></tr></thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [...Array(8)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td></tr>)
              ) : !listings?.length ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No approved listings yet</p></td></tr>
              ) : (
                listings.map((listing, i) => (
                  <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-300 text-white" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {listing.isFeatured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                        <div className="min-w-0">
                          <Link href={`/listings/${listing.id}`} className="font-semibold hover:text-primary truncate block max-w-[180px]">{listing.title}</Link>
                          <p className="text-[10px] text-muted-foreground">{listing.category} · {listing.city}{listing.ownerName ? ` · ${listing.ownerName}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell"><span className="text-xs font-semibold tabular-nums">{listing.viewCount.toLocaleString("en-IN")}</span></td>
                    <td className="px-4 py-3 text-right hidden md:table-cell"><span className="text-xs font-semibold tabular-nums">{(listing.whatsappClicks + listing.phoneClicks).toLocaleString("en-IN")}</span></td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell"><span className="text-xs font-bold tabular-nums text-primary">{listing.interestScore.toLocaleString("en-IN")}</span></td>
                    <td className="px-4 py-3">
                      {listing.badge ? (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-secondary rounded-full whitespace-nowrap">{listing.badge.emoji} {listing.badge.label}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          await featureMutation.mutateAsync({ id: listing.id, featured: !listing.isFeatured });
                          toast.success(listing.isFeatured ? "Unfeatured" : "Featured!");
                        }}
                        disabled={featureMutation.isPending}
                        className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-60",
                          listing.isFeatured ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-secondary text-muted-foreground hover:bg-border"
                        )}
                      >
                        <Star className={cn("w-3 h-3", listing.isFeatured ? "fill-amber-500" : "")} />
                        {listing.isFeatured ? "Unfeature" : "Feature"}
                      </button>
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "admin") setLocation("/");
  }, [isAuthenticated, user, setLocation]);

  const { data: pendingData, isLoading: pendingLoading } = useAdminGetListings(
    { status: "pending", limit: 6 },
    { query: { enabled: isAuthenticated && user?.userType === "admin", queryKey: getAdminGetListingsQueryKey({ status: "pending", limit: 6 }) } }
  );
  const { data: usersData, isLoading: usersLoading } = useAdminGetUsers(
    { limit: 8 },
    { query: { enabled: isAuthenticated && user?.userType === "admin", queryKey: getAdminGetUsersQueryKey({ limit: 8 }) } }
  );
  const { data: bizData } = useAdminBusinessProfiles("false");
  const { data: statsLegacy } = useAdminGetStats({ query: {
    enabled: isAuthenticated && user?.userType === "admin",
    queryKey: getAdminGetStatsQueryKey(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  } });
  const pendingBizCount = bizData?.length ?? 0;

  if (!isAuthenticated || user?.userType !== "admin") return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">Enterprise administration portal</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-border mb-8 overflow-x-auto scrollbar-none">
        {TABS.map(tab => {
          const Icon = TAB_ICONS[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-all duration-150 relative",
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab}
              {tab === "Businesses" && pendingBizCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">{pendingBizCount > 9 ? "9+" : pendingBizCount}</span>
              )}
              {tab === "Overview" && (statsLegacy?.pendingApprovals ?? 0) > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">{(statsLegacy?.pendingApprovals ?? 0) > 9 ? "9+" : statsLegacy?.pendingApprovals}</span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "Overview"      && <OverviewTab pendingData={pendingData} pendingLoading={pendingLoading} usersData={usersData} usersLoading={usersLoading} />}
          {activeTab === "Memberships"   && <MembershipTab />}
          {activeTab === "Businesses"    && <BusinessesTab />}
          {activeTab === "Categories"    && <CategoriesTab />}
          {activeTab === "Reports"       && <ReportsTab />}
          {activeTab === "Activity Log"  && <ActivityLogTab />}
          {activeTab === "Payments"      && <PaymentsTab />}
          {activeTab === "Trending"      && <TrendingTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
