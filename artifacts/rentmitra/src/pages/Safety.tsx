import { motion } from "framer-motion";
import { SeoHead } from "@/components/SeoHead";
import { ShieldCheck, Eye, MapPin, CreditCard, Phone, AlertTriangle, CheckCircle, Camera } from "lucide-react";

const TIPS = [
  {
    icon: MapPin,
    color: "bg-blue-500/10 text-blue-600",
    title: "Meet in a Public Place",
    tips: [
      "For first-time transactions, meet in a busy public area — a mall, market, or coffee shop.",
      "Avoid exchanging items at your home or the owner's home for first-time rentals.",
      "Daytime meetings are safer. Avoid late-night exchanges with unknown parties.",
    ],
  },
  {
    icon: Eye,
    color: "bg-emerald-500/10 text-emerald-600",
    title: "Inspect Before You Rent",
    tips: [
      "Always test the item before accepting it. Power it on, check for missing parts, and confirm it works as described.",
      "Document existing damage with photos or video before taking the item.",
      "Ask for the manual or original packaging where relevant.",
    ],
  },
  {
    icon: Camera,
    color: "bg-amber-500/10 text-amber-600",
    title: "Document Everything",
    tips: [
      "Photograph the item's condition at pickup and return — front, back, and any visible defects.",
      "Keep a record of all WhatsApp or chat conversations.",
      "Agree on rental terms in writing (start date, return date, price, deposit) before pickup.",
    ],
  },
  {
    icon: CreditCard,
    color: "bg-rose-500/10 text-rose-600",
    title: "Handle Payments Safely",
    tips: [
      "Never send full payment before inspecting the item in person.",
      "Use UPI with proper transaction history. Avoid cash for large deposits.",
      "Be wary of owners who ask for payment on platforms outside RentNEarn conversations.",
    ],
  },
  {
    icon: Phone,
    color: "bg-violet-500/10 text-violet-600",
    title: "Verify the Person",
    tips: [
      "Check if the user has a verified badge on RentNEarn.",
      "Search for the phone number online if something feels off.",
      "Trust your instincts — if the deal seems too good to be true, it likely is.",
    ],
  },
  {
    icon: AlertTriangle,
    color: "bg-orange-500/10 text-orange-600",
    title: "Spot & Report Scams",
    tips: [
      "Report listings that look fake, have stock photos, or list prices far below market value.",
      "Never pay an 'advance booking fee' to hold an item — this is a common scam.",
      "Report suspicious users to support@rentnearn.com immediately.",
    ],
  },
];

const QUICK_TIPS = [
  "Always verify the item in person before completing any payment",
  "Use WhatsApp to keep a record of all communications",
  "Never share OTPs, passwords, or banking details",
  "Return items in the same condition you received them",
  "Agree on a clear return time and condition policy upfront",
  "Inform a friend or family member about your meeting location",
];

export default function Safety() {
  return (
    <div className="pb-24 md:pb-0">
      <SeoHead
        title="Safety Tips for Renting"
        description="Stay safe while renting on RentNEarn. Tips on meeting safely, verifying items, making payments, and protecting yourself as a renter or owner."
        canonical="/safety"
      />
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Safety Tips</h1>
            <p className="text-white/80 text-base max-w-xl mx-auto">
              RentNEarn connects you with people nearby. Follow these guidelines to rent safely and confidently.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        {/* Quick checklist */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 mb-10">
          <h2 className="font-bold text-lg mb-4 text-emerald-800 dark:text-emerald-300">Quick Safety Checklist</h2>
          <ul className="space-y-2.5">
            {QUICK_TIPS.map(tip => (
              <li key={tip} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm text-emerald-900 dark:text-emerald-200">{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Detailed tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TIPS.map(({ icon: Icon, color, title, tips }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-3">{title}</h3>
              <ul className="space-y-2">
                {tips.map(tip => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="text-sm text-muted-foreground leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">Important Reminder</h3>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/70 leading-relaxed">
                RentNEarn is a listing platform that connects owners and renters. We are not a party to any rental agreement and
                are not responsible for the condition of items, payment disputes, damages, or any issues arising from a rental
                transaction. Users enter into rental agreements at their own risk.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
