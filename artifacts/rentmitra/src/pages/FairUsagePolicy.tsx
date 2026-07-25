import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, Ban } from "lucide-react";

export default function FairUsagePolicy() {
  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-7 h-7" />
            <h1 className="text-3xl md:text-4xl font-bold">Fair Usage Policy</h1>
          </div>
          <p className="text-white/75 text-sm">Last updated: July 2026</p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Intro */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <p className="text-muted-foreground leading-relaxed">
            RentNEarn is committed to maintaining a healthy, trustworthy marketplace for all users. This Fair
            Usage Policy outlines the acceptable use of our platform, particularly for Business plan holders
            who receive high listing limits, and the actions RentNEarn may take when usage falls outside these
            guidelines.
          </p>
        </motion.section>

        {/* Business membership */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Business Membership — Active Listing Limit
          </h2>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Business memberships include up to <strong className="text-foreground">500 active listings</strong> at
              any given time. This limit is designed to support genuine multi-item rental businesses while
              maintaining platform performance for all users.
            </p>
            <p>
              If you require more than 500 concurrent active listings, please contact our team at{" "}
              <a href="mailto:support@rentnearn.com" className="text-primary hover:underline">
                support@rentnearn.com
              </a>{" "}
              to discuss an enterprise arrangement.
            </p>
          </div>
        </motion.section>

        {/* Prohibited */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            Prohibited Activities
          </h2>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-6">
            <p className="text-sm text-red-800 dark:text-red-300 mb-4 leading-relaxed">
              The following activities are strictly prohibited and may result in immediate suspension or
              permanent ban of your account:
            </p>
            <ul className="space-y-3">
              {[
                "Posting spam, duplicate, or near-duplicate listings to inflate visibility",
                "Using automated scripts, bots, or tools to create or manage listings in bulk",
                "Creating fake listings or listings for items you do not own or have authority to rent",
                "Repeatedly renewing listings with minor edits solely to gain fresher timestamps",
                "Using multiple accounts to circumvent listing limits or platform restrictions",
                "Any activity that negatively impacts platform performance or user experience",
                "Misrepresenting item condition, availability, or rental terms in listings",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-red-700 dark:text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Investigation */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Investigation & Enforcement
          </h2>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              RentNEarn reserves the right to investigate any account that shows signs of spam, duplicate
              listings, automated uploads, or activity that negatively impacts platform performance or other
              users' experience.
            </p>
            <p>Enforcement actions may include, but are not limited to:</p>
            <ul className="space-y-2 ml-4">
              {[
                "Temporary restriction of listing creation privileges",
                "Removal of specific listings that violate this policy",
                "Downgrade of membership tier without refund",
                "Permanent suspension of the account",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <p>
              We will attempt to notify you via email before taking action, except in cases of severe or
              repeated violations where immediate action is warranted.
            </p>
          </div>
        </motion.section>

        {/* Acceptable use */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            What Acceptable Use Looks Like
          </h2>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6">
            <ul className="space-y-3">
              {[
                "Each listing represents a distinct, real item you own and are renting out",
                "Listings contain accurate photos, descriptions, and pricing",
                "You respond to renters within a reasonable timeframe",
                "You renew listings only when the item is genuinely still available for rent",
                "You use the platform in good faith to connect with renters",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Plan limits */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <h2 className="text-xl font-bold mb-4">Listing Limits by Plan</h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left px-4 py-3 font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold">Max Active Listings</th>
                  <th className="text-left px-4 py-3 font-semibold">Max Images/Listing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { plan: "Free Trial (90 days)", listings: "3", images: "5" },
                  { plan: "Basic — ₹49/month", listings: "5", images: "8" },
                  { plan: "Plus — ₹199/month", listings: "25", images: "8" },
                  { plan: "Business — ₹1,999/year", listings: "500", images: "8" },
                ].map(row => (
                  <tr key={row.plan} className="bg-card hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{row.plan}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.listings}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.images}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 text-center"
        >
          <h2 className="text-lg font-bold mb-2">Questions or Concerns?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            If you believe your account has been incorrectly flagged, or if you have questions about this
            policy, please reach out.
          </p>
          <a
            href="mailto:support@rentnearn.com"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </motion.section>
      </div>
    </div>
  );
}
