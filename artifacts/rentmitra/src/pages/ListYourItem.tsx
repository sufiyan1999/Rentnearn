import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { SeoHead } from "@/components/SeoHead";
import { SITE_URL } from "@/lib/siteUrl";
import { CATEGORIES } from "@/lib/constants";
import {
  ArrowRight, Check, Zap, Shield, Smartphone, IndianRupee,
  MessageCircle, Building2, BadgeCheck, Leaf, Recycle, TrendingDown,
  UserPlus, ImageIcon, Phone, Wallet, ChevronDown, Star, MapPin,
} from "lucide-react";

// ─── Analytics ────────────────────────────────────────────────────────────────
function trackEvent(eventType: string, meta?: Record<string, unknown>) {
  try {
    const visitorKey = localStorage.getItem("rn_vid") ?? undefined;
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, page: "/list-your-item", meta, visitorKey }),
      credentials: "include",
    }).catch(() => {/* swallow */});
  } catch { /* analytics must never break UX */ }
}


// ─── Data ──────────────────────────────────────────────────────────────────────
const SHOW_CAT_SLUGS = [
  "photography", "electronics", "tools", "music", "camping",
  "automotive", "fitness", "baby", "party", "medical", "furniture", "gaming",
];
const SHOW_CATS = CATEGORIES.filter(c => SHOW_CAT_SLUGS.includes(c.slug));

const STEPS = [
  { icon: UserPlus,  step: 1, title: "Create an Account",      body: "Sign up free in seconds. No credit card required." },
  { icon: ImageIcon, step: 2, title: "List Your Item",          body: "Add photos, set your price and location. Takes about 2 minutes." },
  { icon: Phone,     step: 3, title: "Get Contacted by Renters",body: "Renters reach you directly via WhatsApp or phone — zero commission." },
  { icon: Wallet,    step: 4, title: "Earn Money",              body: "Agree terms with the renter and collect your payment directly." },
];

const BENEFITS = [
  { icon: MessageCircle, title: "Direct Contact with Renters",       body: "Renters reach you instantly via WhatsApp or phone. No middlemen, no delays." },
  { icon: IndianRupee,   title: "Set Your Own Pricing",               body: "Choose daily, weekly, or monthly rates. You decide what you charge." },
  { icon: Building2,     title: "Individual & Business Accounts",     body: "List as an individual or set up a verified business profile to grow faster." },
  { icon: Smartphone,    title: "Mobile-Friendly Platform",           body: "Manage your listings from any device — desktop, tablet, or phone." },
  { icon: Shield,        title: "Admin-Reviewed Before Publishing",   body: "Every listing is reviewed by our team before going live, protecting your reputation." },
  { icon: BadgeCheck,    title: "Zero Commission on Rentals",         body: "We charge a small listing fee only. Every rupee from your rental is yours to keep." },
];

const PLANS = [
  { name: "Starter",  price: "₹49",    period: "/month", popular: false, badge: null,           features: ["1 active listing", "WhatsApp & phone contact", "Admin-reviewed", "Cancel anytime"] },
  { name: "Growth",   price: "₹199",   period: "/month", popular: true,  badge: "Most Popular", features: ["Up to 5 active listings", "WhatsApp & phone contact", "Admin-reviewed", "Cancel anytime"] },
  { name: "Business", price: "₹1,999", period: "/year",  popular: false, badge: "Best Value",   features: ["Up to 10 active listings", "Business profile badge", "Priority review", "Annual billing"] },
];

const ECO_POINTS = [
  { icon: Recycle,      title: "Extends Product Life",      body: "Every rented item is one fewer thing manufactured. Keeping products in active use is the simplest form of recycling." },
  { icon: IndianRupee,  title: "Saves the Community Money", body: "Renters pay a fraction of the purchase price. Owners earn from items that would otherwise sit idle." },
  { icon: TrendingDown, title: "Reduces Waste & Landfill",  body: "Items that get rented get maintained, repaired, and reused — not discarded after a single use." },
];

const FAQ_ITEMS = [
  { q: "Is it really free to list my item?",
    a: "Yes. During our launch period you can list up to 3 active items completely free for 3 months. After the trial, plans start from just ₹49/month." },
  { q: "How do renters contact me?",
    a: "Renters contact you directly via WhatsApp or phone number. There's no middleman — all communication happens between you and the renter." },
  { q: "Do you take commission on what I earn from rentals?",
    a: "No. RentNEarn charges a flat listing fee only. We take zero commission from your rental income — everything you earn goes directly to you." },
  { q: "What types of items can I list?",
    a: "Almost anything that can be rented: cameras, tools, furniture, baby gear, outfits, sporting equipment, vehicles, musical instruments, medical equipment and much more. Check our Prohibited Items page for exceptions." },
  { q: "How long does it take for my listing to be approved?",
    a: "Our admin team reviews listings within 24 hours on business days. You'll receive an email notification once your listing is live." },
  { q: "Can I list more than one item?",
    a: "Absolutely. With the free launch offer you can have up to 3 active listings simultaneously. Upgrade to a paid plan to list more at the same time." },
  { q: "What happens after my 3-month free trial ends?",
    a: "You'll receive a reminder email before your trial ends. You can then choose: ₹49/month for 1 listing, ₹199/month for up to 5, or ₹1,999/year for our Business Membership." },
  { q: "Is my personal information safe?",
    a: "Your phone number is never shown publicly on the listing page. Only your city/area is visible. Renters can only contact you once they view your listing and choose to reach out." },
];

// ─── Motion variants ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}
      className={className}>
      {children}
    </motion.div>
  );
}

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ListYourItem() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const impactRef  = useRef<HTMLDivElement>(null);
  const impactView = useInView(impactRef, { once: true, margin: "-100px" });

  // Track page view once on mount
  useEffect(() => { trackEvent("page_view"); }, []);

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "List Your Item and Earn — RentNEarn",
    description: "Turn your unused items into extra income by listing them for rent on RentNEarn. Free for 3 months. Zero commission on rentals. Pan India.",
    url: `${SITE_URL}/list-your-item`,
    publisher: { "@type": "Organization", name: "RentNEarn", url: SITE_URL },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",           item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "List Your Item", item: `${SITE_URL}/list-your-item` },
      ],
    },
  };

  return (
    <div className="flex flex-col pb-24 md:pb-0">
      <SeoHead
        title="List Your Item and Earn"
        description="Turn your unused items into extra income by listing them for rent on RentNEarn. Free for 3 months. Zero commission on rentals. 21 categories. Pan India."
        canonical="/list-your-item"
        image="/og-default.png"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
      </Helmet>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-primary text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-black/15 blur-3xl" />
          <div className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 to-black/25" />
        </div>

        <div className="relative z-10 container mx-auto max-w-4xl px-4 pt-16 pb-28 flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-xs font-bold mb-6 backdrop-blur-sm"
          >
            <Zap className="w-3 h-3 fill-white" />
            Launch Offer — List Up to 3 Items FREE for 3 Months
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.07 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.07] mb-5 text-balance"
          >
            💰 Earn Money From Things<br />
            <span className="opacity-85">You Already Own</span>
          </motion.h1>

          {/* Item list — visible immediately, no scrolling needed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-6 text-white/90 text-sm md:text-base font-semibold"
          >
            {[
              { emoji: "📷", label: "Cameras" },
              { emoji: "🚲", label: "Bikes" },
              { emoji: "♿", label: "Wheelchairs" },
              { emoji: "💻", label: "Laptops" },
              { emoji: "🔧", label: "Power Tools" },
              { emoji: "👶", label: "Baby Gear" },
              { emoji: "⛺", label: "Camping Gear" },
            ].map(({ emoji, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="text-base leading-none">{emoji}</span> {label}
              </span>
            ))}
          </motion.div>

          {/* Speed promise */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="text-white/70 text-base md:text-lg mb-8 font-medium"
          >
            List your first item in under 2 minutes. Zero commission on rentals.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            {/* City + Start Earning pill */}
            <div className="flex items-center bg-white rounded-full shadow-xl shadow-black/20 overflow-hidden w-full max-w-md">
              <div className="flex items-center gap-2 px-4 flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Your city (e.g. Mumbai)"
                  className="flex-1 py-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 bg-transparent outline-none min-w-0"
                />
              </div>
              <Link
                href={city.trim() ? `/register?city=${encodeURIComponent(city.trim())}` : "/register"}
                onClick={() => trackEvent("cta_click", { cta: "hero_start_earning", city: city.trim() || undefined })}
                className="bg-primary text-white font-bold px-6 py-4 rounded-full hover:bg-primary/90 transition-all duration-200 active:scale-95 text-sm md:text-base whitespace-nowrap shrink-0 m-1"
              >
                Start Earning — It's Free
              </Link>
            </div>

            <Link
              href="/categories"
              onClick={() => trackEvent("cta_click", { cta: "hero_browse_categories" })}
              className="bg-white/15 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/25 transition-all duration-200 active:scale-95 backdrop-blur-sm text-sm whitespace-nowrap flex items-center gap-2"
            >
              Browse Categories <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.44 }}
            className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/60 text-xs font-semibold"
          >
            {["Zero Commission", "Admin-Reviewed", "Pan India", "Free to Start"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-white/75" /> {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ STATS STRIP ══════════ */}
      <section className="bg-foreground text-background">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-4 divide-x divide-background/10">
            {[
              { value: "₹0", label: "Commission" },
              { value: "21", label: "Categories" },
              { value: "Free", label: "To List" },
              { value: "Pan India", label: "Coverage" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="py-4 md:py-5 text-center px-2"
              >
                <p className="text-lg md:text-2xl font-extrabold tracking-tight">{s.value}</p>
                <p className="text-[10px] md:text-xs text-background/50 font-medium mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ LAUNCH OFFER ══════════ */}
      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <Section>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 text-xs font-bold mb-4">
              <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" /> Launch Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Start Listing — Completely Free</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">No credit card needed. Get up to 3 active listings free for your first 3 months, then choose a plan that fits.</p>
          </motion.div>

          {/* Free tier highlight */}
          <motion.div variants={fadeUp}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-3xl p-8 md:p-10 mb-8 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500 text-white rounded-full px-4 py-1.5 text-xs font-bold mb-4">
              🎉 FREE for 3 Months
            </div>
            <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 mb-2">₹0</p>
            <p className="text-muted-foreground font-semibold mb-5">List up to 3 active items. No payment required to get started.</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {["Up to 3 active listings", "Full WhatsApp & phone contact", "Admin review included", "No credit card needed"].map(f => (
                <span key={f} className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" /> {f}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Paid plans */}
          <motion.div variants={fadeUp}>
            <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">After Your Free Trial</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map(plan => (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl border p-6 flex flex-col transition-all duration-200 ${
                    plan.popular
                      ? "border-primary shadow-xl shadow-primary/10 bg-primary/5 dark:bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full ${
                      plan.popular ? "bg-primary text-white" : "bg-amber-400 text-amber-900"
                    }`}>
                      {plan.badge}
                    </div>
                  )}
                  <p className="text-sm font-bold text-muted-foreground mb-1">{plan.name}</p>
                  <div className="flex items-end gap-0.5 mb-4">
                    <span className="text-3xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className={`w-3.5 h-3.5 shrink-0 ${plan.popular ? "text-primary" : "text-emerald-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    onClick={() => trackEvent("cta_click", { cta: `pricing_${plan.name.toLowerCase()}` })}
                    className={`text-center rounded-xl py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
                      plan.popular
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border border-border hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    Start Free Trial
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="bg-secondary/50 border-y border-border py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-bold mb-4 border border-primary/20">
                How It Works
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">List Your Item in Minutes</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Four simple steps from sign-up to your first rental enquiry.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {STEPS.map(({ icon: Icon, step, title, body }) => (
                <motion.div key={step} variants={fadeUp}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300 group-hover:scale-105">
                      <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-extrabold flex items-center justify-center shadow-lg">
                      {step}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm mb-1.5">{title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{body}</p>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} className="flex justify-center mt-10">
              <Link
                href="/register"
                onClick={() => trackEvent("cta_click", { cta: "how_it_works" })}
                className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/25 flex items-center gap-2 text-sm"
              >
                Get Started — It's Free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ══════════ CATEGORIES ══════════ */}
      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <Section>
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Popular Rental Categories</h2>
              <p className="text-muted-foreground text-sm mt-1">From cameras to camping gear — renters are searching near you right now.</p>
            </div>
            <Link href="/categories" className="hidden md:flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all duration-200">
              All {CATEGORIES.length} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 gap-3">
            {SHOW_CATS.map((cat, i) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <Link
                  href={`/search?category=${cat.slug}`}
                  onClick={() => trackEvent("cta_click", { cta: "category", slug: cat.slug })}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-border/50 shadow-sm flex items-center justify-center p-1.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:border-primary/30">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      width={56}
                      height={56}
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-semibold text-center leading-tight text-muted-foreground group-hover:text-primary transition-colors duration-200 max-w-[68px]">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>
      </section>

      {/* ══════════ WHY LIST ══════════ */}
      <section className="bg-secondary/50 border-y border-border py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Why List on RentNEarn?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Built for owners who want simplicity, control, and earnings — without the complexity of running a rental business.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <motion.div key={title} variants={fadeUp}
                  className="bg-card border border-border rounded-3xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                    <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5">{title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{body}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ══════════ ENVIRONMENTAL IMPACT ══════════ */}
      <section
        ref={impactRef}
        className="relative overflow-hidden bg-[#0f2419] text-white py-16 md:py-24"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>
        <div className="relative container mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={impactView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-4 py-1.5 text-xs font-bold mb-6 text-emerald-300">
              <Leaf className="w-3.5 h-3.5" /> Environmental Impact
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Renting is Better for the Planet</h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-14 leading-relaxed">
              Every rented item is one fewer thing manufactured, packaged, and shipped. Together, the RentNEarn community is keeping
              products in use longer, reducing landfill waste, and building a circular economy — one rental at a time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
            {ECO_POINTS.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={impactView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                <p className="text-white/55 text-xs leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>

          {/* Circular economy points */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={impactView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {[
              { emoji: "♻️", text: "Extends product life" },
              { emoji: "📦", text: "Reduces overconsumption" },
              { emoji: "🌱", text: "Supports a circular economy" },
            ].map(({ emoji, text }) => (
              <div key={text} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-semibold text-white/75">
                {emoji} {text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        <Section>
          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about listing and earning on RentNEarn.</p>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-2">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <FaqItem
                key={i}
                q={q}
                a={a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="text-center text-sm text-muted-foreground mt-6">
            Still have questions?{" "}
            <Link href="/contact" className="text-primary font-semibold hover:underline">Contact us</Link>
            {" "}or visit our{" "}
            <Link href="/faq" className="text-primary font-semibold hover:underline">full FAQ page</Link>.
          </motion.p>
        </Section>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>
        <div className="relative container mx-auto max-w-3xl px-4 py-20 md:py-28 text-center">
          <Section className="flex flex-col items-center">
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-xs font-bold mb-6"
            >
              <Zap className="w-3 h-3 fill-white" /> Free for 3 months — no credit card
            </motion.div>
            <motion.h2 variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5 text-balance"
            >
              Ready to Turn Clutter into Cash?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/70 text-lg mb-9 max-w-xl">
              Join thousands of owners across India already earning from items they already own. Create your account and list your first item in under 5 minutes.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/register"
                onClick={() => trackEvent("cta_click", { cta: "final_create_account" })}
                className="bg-white text-primary font-bold px-9 py-4 rounded-full hover:bg-white/92 transition-all duration-200 active:scale-95 shadow-xl shadow-black/20 text-base"
              >
                Create a Free Account
              </Link>
              <Link
                href="/pricing"
                onClick={() => trackEvent("cta_click", { cta: "final_view_pricing" })}
                className="bg-white/15 border border-white/30 text-white font-semibold px-9 py-4 rounded-full hover:bg-white/25 transition-all duration-200 active:scale-95 backdrop-blur-sm text-base"
              >
                View Pricing
              </Link>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-5 text-white/45 text-xs">
              No credit card required · Cancel anytime · Admin-reviewed listings
            </motion.p>
          </Section>
        </div>
      </section>
    </div>
  );
}
