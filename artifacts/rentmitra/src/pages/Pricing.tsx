import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trackInitiateCheckout, trackPurchase } from "@/lib/metaPixel";
import { SeoHead } from "@/components/SeoHead";
import { motion } from "framer-motion";
import {
  Check, X, Star, Zap, Building2, Gift, Crown, ChevronDown, ChevronUp,
  Rocket, Shield, TrendingUp, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyMembership } from "@/lib/useMembership";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Plan definitions ────────────────────────────────────────────────────────
const PLANS = [
  {
    slug: "free_trial",
    name: "Free Trial",
    badge: null,
    price: 0,
    pricePaise: 0,
    priceLabel: "Free",
    period: "3 months",
    billingNote: "No credit card required",
    icon: Gift,
    gradient: "from-emerald-500 to-teal-500",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    ctaLabel: "Start Free Trial",
    highlight: false,
    features: [
      "3 months free access",
      "Up to 3 active listings",
      "5 images per listing",
      "WhatsApp & phone contact",
      "QR code per listing",
      "Favourite listings",
      "Recently viewed",
      "Listing renewal during trial",
    ],
  },
  {
    slug: "basic",
    name: "Basic",
    badge: null,
    price: 49,
    pricePaise: 4900,
    priceLabel: "₹49",
    period: "/month",
    billingNote: "Billed monthly",
    icon: Zap,
    gradient: "from-blue-500 to-indigo-500",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    ctaLabel: "Get Basic",
    highlight: false,
    features: [
      "Up to 5 active listings",
      "8 images per listing",
      "WhatsApp & phone contact",
      "QR code per listing",
      "Listing renewal",
      "Email notifications",
    ],
  },
  {
    slug: "plus",
    name: "Plus",
    badge: "Most Popular",
    price: 199,
    pricePaise: 19900,
    priceLabel: "₹199",
    period: "/month",
    billingNote: "Billed monthly",
    icon: TrendingUp,
    gradient: "from-primary to-orange-500",
    border: "border-primary",
    bg: "bg-primary/5",
    ctaLabel: "Get Plus",
    highlight: true,
    features: [
      "Up to 25 active listings",
      "8 images per listing",
      "Priority search ranking",
      "Featured listing discount",
      "WhatsApp & phone contact",
      "QR code per listing",
      "Email notifications",
      "Basic business analytics",
    ],
  },
  {
    slug: "business",
    name: "Business",
    badge: "Best Value",
    price: 1999,
    pricePaise: 199900,
    priceLabel: "₹1,999",
    period: "/year",
    billingNote: "Billed annually · Save 58%",
    icon: Building2,
    gradient: "from-zinc-800 to-zinc-950",
    border: "border-zinc-300 dark:border-zinc-700",
    bg: "bg-zinc-950 text-white",
    ctaLabel: "Get Business",
    highlight: false,
    dark: true,
    features: [
      "Up to 500 active listings",
      "8 images per listing",
      "Business profile page",
      "Business logo upload",
      "Verified Business badge ✓",
      "Priority search ranking",
      "Business dashboard",
      "Analytics",
      "Email support",
      "Bulk upload ready (coming soon)",
    ],
  },
];

const FEATURED_PLANS = [
  { duration: "7 Days Featured", price: "₹29", desc: "Boost any listing for a week" },
  { duration: "30 Days Featured", price: "₹99", desc: "Maximum visibility for a month" },
];

const FAQS = [
  { q: "What happens when my free trial ends?", a: "After 90 days, your account automatically switches to a limited free state. Your existing listings will be paused until you subscribe to a paid plan. Your data is preserved — nothing is deleted." },
  { q: "Can I upgrade mid-cycle?", a: "Yes. When you upgrade, your new plan activates immediately and your previous plan is cancelled. Contact us at support@rentnearn.com for any billing adjustments." },
  { q: "What does 'Priority Search Ranking' mean?", a: "Plus and Business listings appear higher in search results compared to Basic and Free Trial listings, giving you more visibility to potential renters." },
  { q: "Can I purchase Featured Listings on any plan?", a: "Yes — Featured Listing boosts are available as add-ons for any plan including Free Trial. Featured listings appear above standard listings with a gold badge." },
  { q: "How is the Business plan billed?", a: "Business is billed at ₹1,999 per year (roughly ₹167/month), which saves you 58% compared to a hypothetical monthly billing." },
  { q: "Is there a refund policy?", a: "We offer a 7-day refund for new subscriptions if no listings were created during that period. Contact support@rentnearn.com within 7 days of purchase." },
];

// ─── Comparison table ────────────────────────────────────────────────────────
const FEATURES_TABLE = [
  { feature: "Active Listings",     trial: "3",     basic: "5",    plus: "25",      biz: "500" },
  { feature: "Images per Listing",  trial: "5",     basic: "8",    plus: "8",       biz: "8" },
  { feature: "WhatsApp Contact",    trial: true,    basic: true,   plus: true,      biz: true },
  { feature: "Phone Contact",       trial: true,    basic: true,   plus: true,      biz: true },
  { feature: "QR Code",             trial: true,    basic: true,   plus: true,      biz: true },
  { feature: "Listing Renewal",     trial: true,    basic: true,   plus: true,      biz: true },
  { feature: "Email Notifications", trial: false,   basic: true,   plus: true,      biz: true },
  { feature: "Priority Search",     trial: false,   basic: false,  plus: true,      biz: true },
  { feature: "Business Profile",    trial: false,   basic: false,  plus: false,     biz: true },
  { feature: "Verified Badge",      trial: false,   basic: false,  plus: false,     biz: true },
  { feature: "Analytics",           trial: false,   basic: false,  plus: "Basic",   biz: "Advanced" },
  { feature: "Email Support",       trial: false,   basic: false,  plus: false,     biz: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="w-4 h-4 text-emerald-500 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs font-semibold text-primary">{value}</span>;
}

// ─── Razorpay loader ─────────────────────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Pricing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data: membershipInfo, refetch: refetchMembership } = useMyMembership();
  const qc = useQueryClient();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [paying, setPaying] = useState<string | null>(null); // slug of plan being paid

  const activePlanSlug = membershipInfo?.plan?.slug;

  async function handleCheckout(plan: typeof PLANS[number]) {
    if (!isAuthenticated) { setLocation("/register"); return; }

    trackInitiateCheckout({ currency: "INR", content_ids: [plan.slug], num_items: 1 });
    setPaying(plan.slug);
    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load payment gateway. Please try again.");
        return;
      }

      // 2. Create Razorpay order on the server
      const token = localStorage.getItem("rentnearn_token");
      const orderRes = await fetch(`${BASE}/api/memberships/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planSlug: plan.slug }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        toast.error(err.error || "Failed to create payment order.");
        return;
      }
      const { orderId, keyId, amount, currency } = await orderRes.json();

      // 3. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: keyId,
          amount,
          currency,
          name: "RentNEarn",
          description: `${plan.name} Plan`,
          order_id: orderId,
          prefill: {
            name: (user as any)?.name ?? "",
            email: (user as any)?.email ?? "",
          },
          theme: { color: "#f97316" },
          modal: { ondismiss: () => resolve() },
          handler: async (response: any) => {
            try {
              // 4. Verify payment on the server
              const verifyRes = await fetch(`${BASE}/api/memberships/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => ({}));
                toast.error(err.error || "Payment verification failed. Contact support.");
                resolve();
                return;
              }
              // 5. Success — refresh membership state
              await qc.invalidateQueries({ queryKey: ["memberships", "me"] });
              trackPurchase({ value: amount / 100, currency: "INR", content_ids: [plan.slug], content_name: plan.name });
              toast.success(`🎉 ${plan.name} plan activated! Enjoy your upgraded account.`);
              resolve();
            } catch {
              toast.error("Something went wrong after payment. Contact support@rentnearn.com.");
              resolve();
            }
          },
        });
        rzp.open();
      });
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Payment could not be started. Please try again.");
    } finally {
      setPaying(null);
    }
  }

  return (
    <div className="pb-24 md:pb-0">
      <SeoHead
        title="Rental Plans & Pricing"
        description="RentNEarn plans start free — list up to 3 items with a 3-month free trial. Upgrade to Basic (₹49/mo), Plus (₹199/mo), or Business (₹1,999/yr) for more listings and features."
        canonical="/pricing"
      />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white py-14 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 container mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Gift className="w-3.5 h-3.5" /> 3 Months FREE for every new member
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Simple, transparent pricing</h1>
          <p className="text-white/75 text-lg">Start free. Upgrade when you're ready. No hidden fees.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-16">

        {/* ── Current plan banner ── */}
        {isAuthenticated && membershipInfo?.plan && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-semibold text-primary">
                Current plan: <span className="font-bold">{membershipInfo.plan.name}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {membershipInfo.listingsUsed}/{membershipInfo.listingLimit} listings used
                {membershipInfo.daysRemaining > 0 && ` · ${membershipInfo.daysRemaining} days remaining`}
              </p>
            </div>
            <Link href="/dashboard" className="text-xs font-semibold text-primary hover:underline shrink-0">
              View dashboard →
            </Link>
          </motion.div>
        )}

        {/* ── Plan cards ── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon;
              const isCurrent = activePlanSlug === plan.slug;
              const isFree = plan.slug === "free_trial";
              const isLoading = paying === plan.slug;

              return (
                <motion.div
                  key={plan.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "relative rounded-3xl border-2 flex flex-col overflow-hidden",
                    plan.highlight ? "border-primary shadow-xl shadow-primary/15 scale-[1.02]" : plan.border,
                    (plan as any).dark ? "bg-zinc-950 text-white" : "bg-card"
                  )}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={cn(
                      "absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full",
                      plan.highlight ? "bg-primary text-white" : "bg-amber-400 text-zinc-900"
                    )}>
                      {plan.badge}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      Current
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    {/* Icon + name */}
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", `bg-gradient-to-br ${plan.gradient}`)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={cn("font-bold text-xl mb-1", (plan as any).dark ? "text-white" : "")}>{plan.name}</h3>

                    {/* Price */}
                    <div className="mb-1">
                      <span className={cn("text-4xl font-extrabold tracking-tight", (plan as any).dark ? "text-white" : "")}>{plan.priceLabel}</span>
                      <span className={cn("text-sm ml-1", (plan as any).dark ? "text-white/60" : "text-muted-foreground")}>{plan.period}</span>
                    </div>
                    <p className={cn("text-xs mb-5", (plan as any).dark ? "text-white/50" : "text-muted-foreground")}>{plan.billingNote}</p>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className={cn("flex items-start gap-2 text-sm", (plan as any).dark ? "text-white/80" : "text-foreground/80")}>
                          <Check className={cn("w-4 h-4 shrink-0 mt-0.5", plan.highlight ? "text-primary" : (plan as any).dark ? "text-emerald-400" : "text-emerald-500")} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {isCurrent ? (
                      <div className="text-center py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 text-sm font-semibold border border-emerald-200 dark:border-emerald-800">
                        ✓ Active Plan
                      </div>
                    ) : isFree ? (
                      <Link
                        href={isAuthenticated ? "/dashboard" : "/register"}
                        className={cn(
                          "block text-center py-2.5 rounded-2xl text-sm font-bold transition-all duration-200",
                          "bg-secondary hover:bg-primary hover:text-white border border-border"
                        )}
                      >
                        {isAuthenticated ? "Go to Dashboard" : plan.ctaLabel}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleCheckout(plan)}
                        disabled={isLoading || paying !== null}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
                          plan.highlight
                            ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
                            : (plan as any).dark
                            ? "bg-white text-zinc-950 hover:bg-white/90"
                            : "bg-secondary hover:bg-primary hover:text-white border border-border"
                        )}
                      >
                        {isLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                        ) : (
                          plan.ctaLabel
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Secure payment note */}
          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Payments are processed securely via Razorpay. Your card details are never stored on our servers.
          </p>
        </section>

        {/* ── Featured boosts ── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-5 rounded-full bg-amber-400 inline-block" />
            <h2 className="text-xl font-extrabold tracking-tight">Featured Listing Boosts</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full font-medium">Available on any plan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {FEATURED_PLANS.map((fp, i) => (
              <motion.div
                key={fp.duration}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{fp.price}</span>
                </div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">{fp.duration}</h3>
                <p className="text-sm text-amber-700/70 dark:text-amber-400/70 mb-4">{fp.desc}</p>
                <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                  {["Appears above standard listings", "Gold ⭐ Featured badge", "Higher search priority"].map(f => (
                    <li key={f} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Featured listings are reviewed before activation. Purchase from your listing detail page after approval.
          </p>
        </section>

        {/* ── Comparison table ── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-5 rounded-full gradient-primary inline-block" />
            <h2 className="text-xl font-extrabold tracking-tight">Plan Comparison</h2>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="text-left px-5 py-3.5 font-semibold min-w-[160px]">Feature</th>
                  {["Free Trial", "Basic", "Plus", "Business"].map((h, i) => (
                    <th key={h} className={cn("px-4 py-3.5 text-center font-semibold", i === 2 ? "text-primary" : i === 3 ? "text-zinc-900 dark:text-white" : "")}>
                      {h}
                      {i === 2 && <div className="text-[10px] font-normal text-primary/70">★ Popular</div>}
                      {i === 3 && <div className="text-[10px] font-normal text-amber-600">Best Value</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FEATURES_TABLE.map(row => (
                  <tr key={row.feature} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-muted-foreground">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><Cell value={row.trial} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.basic} /></td>
                    <td className="px-4 py-3 text-center bg-primary/3"><Cell value={row.plus} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.biz} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-5 rounded-full bg-indigo-400 inline-block" />
            <h2 className="text-xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3 max-w-3xl">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm hover:bg-secondary/50 transition-colors"
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-3" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-3" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="gradient-primary text-white rounded-3xl p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10">
            <Rocket className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Ready to start renting?</h2>
            <p className="text-white/70 mb-6 max-w-sm mx-auto text-sm">
              Join free today. No credit card required. Start listing in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="bg-white text-primary font-bold px-7 py-3 rounded-full text-sm hover:bg-white/90 transition-all">
                Start Free Trial
              </Link>
              <Link href="/contact" className="bg-white/15 text-white font-semibold px-7 py-3 rounded-full text-sm border border-white/25 hover:bg-white/25 transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
