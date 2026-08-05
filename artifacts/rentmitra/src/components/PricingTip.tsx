import { Info } from "lucide-react";
import { Link } from "wouter";
import { getCategoryGuide, getPriceIndicator } from "@/lib/pricingGuide";

interface PricingTipProps {
  category: string;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  monthlyPrice?: number | null;
}

export function PricingTip({ category, dailyPrice, weeklyPrice, monthlyPrice }: PricingTipProps) {
  const guide = getCategoryGuide(category);
  if (!guide) return null;

  // Use daily as primary comparison; fall back to weekly/monthly
  const enteredPrice = dailyPrice || weeklyPrice || monthlyPrice;
  const benchmarkMax = guide.dailyRange?.[1] ?? guide.weeklyRange?.[1] ?? guide.monthlyRange?.[1];

  const indicator =
    enteredPrice && benchmarkMax ? getPriceIndicator(enteredPrice, benchmarkMax) : null;

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-950/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            Suggested rates — {guide.name}
          </p>
          {guide.note && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 leading-relaxed">
              {guide.note}
            </p>
          )}
        </div>
      </div>

      {/* Price ranges */}
      <div className="flex flex-wrap gap-4 text-xs text-blue-700 dark:text-blue-300">
        {guide.dailyRange && (
          <div>
            <span className="font-semibold">Daily</span>
            <br />
            ₹{guide.dailyRange[0].toLocaleString("en-IN")} – ₹{guide.dailyRange[1].toLocaleString("en-IN")}
          </div>
        )}
        {guide.weeklyRange && (
          <div>
            <span className="font-semibold">Weekly</span>
            <br />
            ₹{guide.weeklyRange[0].toLocaleString("en-IN")} – ₹{guide.weeklyRange[1].toLocaleString("en-IN")}
          </div>
        )}
        {guide.monthlyRange && (
          <div>
            <span className="font-semibold">Monthly</span>
            <br />
            ₹{guide.monthlyRange[0].toLocaleString("en-IN")} – ₹{guide.monthlyRange[1].toLocaleString("en-IN")}
          </div>
        )}
      </div>

      {/* Price indicator */}
      {indicator && (
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${indicator.bgClass}`}>
          <span className="text-base leading-none">{indicator.emoji}</span>
          <span className={`font-semibold ${indicator.colorClass}`}>{indicator.label}</span>
          <span className="text-muted-foreground text-xs font-normal">— {indicator.description}</span>
        </div>
      )}

      {/* Link to full guide */}
      <Link
        href="/pricing-guide"
        className="text-xs text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-200"
      >
        See full pricing guide →
      </Link>
    </div>
  );
}
