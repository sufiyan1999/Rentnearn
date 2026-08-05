import { Helmet } from "react-helmet-async";
import { IndianRupee, Info, TrendingDown } from "lucide-react";
import { PRICING_GUIDE } from "@/lib/pricingGuide";

function fmt(n?: number) {
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function PricingGuide() {
  return (
    <>
      <Helmet>
        <title>Pricing Guide for Owners — RentNEarn</title>
        <meta
          name="description"
          content="See recommended rental rates for cameras, appliances, baby gear, tools, apparel and more. Price your listing competitively and get more bookings."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <IndianRupee className="w-4 h-4" />
            Owner Pricing Guide
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            What should you charge?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            These benchmarks are based on successful listings across India. Competitive
            pricing leads to more enquiries, faster bookings, and better reviews.
          </p>
        </div>

        {/* Tips banner */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30 p-5 mb-10 flex gap-3">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1.5">
            <p className="font-semibold">Three things that trip up new owners</p>
            <p>
              <strong>Ownership recovery fallacy</strong> — You don't need to recover your
              purchase cost in 2–3 transactions. Renting is passive yield on an asset that's
              sitting idle.
            </p>
            <p>
              <strong>Bundling replacement risk into daily rate</strong> — Set a separate
              <em> refundable security deposit</em> instead of inflating your day rate. It
              lets you price lower and still feel protected.
            </p>
            <p>
              <strong>Ignoring wear & tear reality</strong> — Minor scuffs happen. Price to
              get frequent orders rather than waiting months for one "perfect" booking.
            </p>
          </div>
        </div>

        {/* Category cards */}
        <div className="space-y-8">
          {PRICING_GUIDE.map((cat) => (
            <div
              key={cat.slug}
              className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
            >
              {/* Category header */}
              <div className="px-5 py-4 border-b border-border bg-muted/40">
                <h2 className="font-bold text-base">{cat.name}</h2>
                {cat.note && (
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.note}</p>
                )}
                {/* Quick range chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {cat.dailyRange && (
                    <span className="text-[11px] font-medium bg-background border border-border rounded-full px-2.5 py-0.5">
                      Daily ₹{cat.dailyRange[0].toLocaleString("en-IN")}–₹{cat.dailyRange[1].toLocaleString("en-IN")}
                    </span>
                  )}
                  {cat.weeklyRange && (
                    <span className="text-[11px] font-medium bg-background border border-border rounded-full px-2.5 py-0.5">
                      Weekly ₹{cat.weeklyRange[0].toLocaleString("en-IN")}–₹{cat.weeklyRange[1].toLocaleString("en-IN")}
                    </span>
                  )}
                  {cat.monthlyRange && (
                    <span className="text-[11px] font-medium bg-background border border-border rounded-full px-2.5 py-0.5">
                      Monthly ₹{cat.monthlyRange[0].toLocaleString("en-IN")}–₹{cat.monthlyRange[1].toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Items table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="px-5 py-2.5 font-medium">Item</th>
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap">Avg MRP</th>
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap">Daily</th>
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap">Weekly</th>
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap">Monthly</th>
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap">Security Deposit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cat.items.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-medium leading-tight">
                          {item.name}
                          {item.blockNote && (
                            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                              {item.blockNote}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{item.mrp ?? "—"}</td>
                        <td className="px-3 py-3 font-semibold text-primary whitespace-nowrap">{fmt(item.daily)}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{fmt(item.weekly)}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{fmt(item.monthly)}</td>
                        <td className="px-3 py-3 text-muted-foreground text-xs whitespace-nowrap">{item.deposit ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer nudge */}
        <div className="mt-12 rounded-2xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <TrendingDown className="w-8 h-8 text-primary shrink-0" />
          <div>
            <p className="font-bold text-base">Lower price = more bookings = more total income</p>
            <p className="text-muted-foreground text-sm mt-0.5">
              An item rented 10 times at ₹250/day earns more than the same item rented twice at
              ₹500/day — and builds you a stronger review profile.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
