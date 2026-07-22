import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, Zap, Package, Building2, Star, ShieldCheck, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/ui-core";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    id: "single",
    name: "Starter",
    price: 49,
    label: "₹49",
    period: "per listing / 30 days",
    icon: Package,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-200",
    description: "Perfect for individuals renting out one item.",
    features: [
      "1 active listing for 30 days",
      "Up to 5 photos per listing",
      "WhatsApp contact button",
      "Basic search visibility",
      "Listing renewal available",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "bundle",
    name: "Bundle",
    price: 199,
    label: "₹199",
    period: "5 listings / 30 days",
    icon: Zap,
    color: "bg-primary/10 text-primary",
    border: "border-primary",
    description: "Great for people with multiple items to rent out.",
    features: [
      "5 active listings for 30 days",
      "Up to 5 photos per listing",
      "WhatsApp contact button",
      "Higher search ranking",
      "Save ₹46 vs. individual listings",
      "Listing renewal available",
    ],
    cta: "Choose Bundle",
    popular: true,
  },
  {
    id: "unlimited",
    name: "Business",
    price: 499,
    label: "₹499",
    period: "per month · unlimited",
    icon: Building2,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-200",
    description: "Ideal for rental businesses and dealers.",
    features: [
      "Unlimited listings for 30 days",
      "Up to 5 photos per listing",
      "Business profile badge",
      "Priority search placement",
      "WhatsApp contact button",
      "Dedicated support",
    ],
    cta: "Go Business",
    popular: false,
  },
];

const FEATURED = {
  id: "featured",
  price: 99,
  label: "₹99",
  period: "per listing · 7 days",
  description: "Boost any existing listing to the top of search results and the Featured section on the homepage.",
  features: [
    "Homepage Featured section placement",
    "Top of category search results",
    "\"Featured\" badge on listing card",
    "7 days of boosted visibility",
  ],
};

const FAQS = [
  {
    q: "Is my listing live immediately after payment?",
    a: "Your listing goes into review first (usually within a few hours). Once approved by our team, it goes live automatically. Payment confirms your slot — not instant visibility.",
  },
  {
    q: "Can I get a refund if my listing is rejected?",
    a: "If your listing is rejected due to a policy violation we cannot refund the listing fee. We recommend reading our listing guidelines before publishing to ensure approval.",
  },
  {
    q: "What payment methods does RentMitra accept?",
    a: "All payments are processed via Razorpay. You can pay using UPI (GPay, PhonePe, Paytm), debit/credit cards, net banking, and EMI options.",
  },
  {
    q: "Does RentMitra take a commission on rentals?",
    a: "No. RentMitra charges only listing and featured fees. All rental payments happen directly between the owner and renter — we are not involved in any transaction.",
  },
  {
    q: "What happens when my 30-day listing expires?",
    a: "Your listing is automatically marked expired. You can renew it for another 30 days at the same price from your dashboard.",
  },
  {
    q: "Can I feature a listing I've already paid to list?",
    a: "Yes. Featured is a separate add-on (₹99) that you can apply to any approved listing at any time from your dashboard.",
  },
];

export default function Pricing() {
  const { isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function loadRazorpay(): Promise<boolean> {
    if (window.Razorpay) return true;
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function handleCheckout(planId: string, amount: number, planName: string) {
    if (!isAuthenticated) {
      setLocation("/login?redirect=/pricing");
      return;
    }

    setLoadingPlan(planId);

    try {
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      // Create Razorpay order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planId, amountPaise: amount * 100 }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Could not create payment order.");
        return;
      }

      const { orderId, keyId, amount: orderAmount, currency } = await res.json();

      const options = {
        key: keyId,
        amount: orderAmount,
        currency,
        name: "RentMitra",
        description: `${planName} Plan`,
        order_id: orderId,
        prefill: {},
        theme: { color: "#f96d0b" },
        handler: async (response: any) => {
          // Verify payment
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            toast.success("Payment successful! Your plan is now active.");
            setLocation("/listings/new");
          } else {
            toast.error("Payment verification failed. Contact support@rentmitra.in");
          }
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => toast.error("Payment failed. Please try again."));
      rzp.open();
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="pb-24 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-1 text-xs font-bold mb-5 tracking-wider uppercase">
              Simple, Transparent Pricing
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              List once. Earn repeatedly.
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              No commissions. No hidden fees. Pay only to list — all rental payments happen directly between you and the renter.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-12 space-y-16">

        {/* Plans */}
        <section>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative bg-card border-2 rounded-3xl p-7 flex flex-col ${plan.popular ? `${plan.border} shadow-xl shadow-primary/10` : "border-border"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${plan.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-snug">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black">{plan.label}</span>
                    <span className="text-muted-foreground text-sm ml-2">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleCheckout(plan.id, plan.price, plan.name)}
                    isLoading={loadingPlan === plan.id}
                    variant={plan.popular ? "default" : "outline"}
                    className={`w-full rounded-2xl py-3 font-bold ${plan.popular ? "" : ""}`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Featured add-on */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-8"
          >
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold">Featured Listing Boost</h3>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">Add-on</span>
                </div>
                <p className="text-muted-foreground text-sm mb-5 max-w-lg">{FEATURED.description}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FEATURED.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
                <div className="text-center md:text-right">
                  <span className="text-4xl font-black text-amber-600">{FEATURED.label}</span>
                  <p className="text-muted-foreground text-xs mt-1">{FEATURED.period}</p>
                </div>
                <Button
                  onClick={() => handleCheckout("featured", FEATURED.price, "Featured Listing")}
                  isLoading={loadingPlan === "featured"}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-8 font-bold"
                >
                  Boost a Listing
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Trust strip */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, title: "Secure Payments", body: "All payments are processed by Razorpay — India's most trusted payment gateway. UPI, cards, net banking supported." },
              { icon: Package, title: "No Commission", body: "RentMitra charges only listing fees. We don't take any cut from your rental earnings. Every rupee is yours." },
              { icon: Zap, title: "Instant Activation", body: "After payment, your listing goes for review. Most listings are approved within a few hours." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-secondary rounded-2xl p-6">
                <Icon className="w-6 h-6 text-primary mb-3" />
                <h4 className="font-bold mb-1">{title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left font-semibold text-sm hover:bg-secondary transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center py-4">
          <p className="text-muted-foreground text-sm mb-2">Still have questions?</p>
          <Link href="/contact" className="text-primary font-semibold text-sm hover:underline">
            Contact our support team →
          </Link>
        </section>
      </div>
    </div>
  );
}
