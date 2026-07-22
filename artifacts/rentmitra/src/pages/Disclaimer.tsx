import { motion } from "framer-motion";
import { AlertTriangle, XCircle, IndianRupee } from "lucide-react";
import { Link } from "wouter";

const LAST_UPDATED = "22 July 2026";

const NOT_HANDLED = [
  "Payments between owners and renters",
  "Booking or reservation management",
  "Security deposits or refunds",
  "Delivery or logistics",
  "Rental agreements or contracts",
  "Insurance on rented items",
  "Damage claims or disputes",
];

const SECTIONS = [
  {
    title: "1. Platform Role",
    body: `RentMitra ("we", "the platform") operates solely as a technology intermediary. We provide a listing service that connects people who wish to rent out items with people who wish to rent them. RentMitra is not an owner, operator, seller, lessor, or agent for any listed item. We do not take part in, supervise, or guarantee any transaction between users.`,
  },
  {
    title: "2. No Warranty on Listed Items",
    body: `RentMitra makes no representations or warranties about the accuracy, quality, safety, legality, or availability of any item listed on the platform. Listings are created by independent users. We approve listings for policy compliance only — not quality or accuracy. Renters are strongly advised to inspect items in person before completing a rental.`,
  },
  {
    title: "3. Payments, Deposits & Disputes",
    body: `RentMitra does not process, hold, or facilitate rental payments. All financial arrangements — including rental fees, security deposits, damage compensation, and refunds — are made directly between the owner and renter. RentMitra is not liable for any payment disputes, failed transfers, non-refunded deposits, or financial losses arising from a rental. Note: RentMitra does accept listing fees and featured listing payments for platform services only (see Revenue Model below).`,
  },
  {
    title: "4. Damage & Liability",
    body: `RentMitra is not liable for any damage to or loss of rented items, personal injury, property damage, or any other loss arising from a rental transaction. Owners and renters are responsible for agreeing on and enforcing their own terms regarding item condition, care, and liability for damage.`,
  },
  {
    title: "5. User Responsibility",
    body: `Users are responsible for: verifying the identity and legitimacy of the person they transact with; inspecting items before agreeing to rent them; using items safely and in accordance with their intended purpose; returning items on time and in the agreed condition; resolving any disputes directly with the other party.`,
  },
  {
    title: "6. Revenue Model",
    body: `RentMitra earns revenue solely from listing fees and featured listing promotions. We do not earn commissions from rentals, take a percentage of transactions, or receive payments from renters on behalf of owners. The current fee schedule is: ₹49 for 1 listing (30 days); ₹199 for 5 listings (30 days); ₹499/month for unlimited listings (businesses); and ₹99 to feature any approved listing for 7 days. These fees may change from time to time with notice.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `To the fullest extent permitted by applicable Indian law, RentMitra India, its directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including loss of profits, goodwill, data, or other intangible losses, even if advised of the possibility of such damages.`,
  },
  {
    title: "8. Third-Party Links",
    body: `RentMitra may contain links to third-party websites or services (e.g. WhatsApp, Google Maps, Razorpay). These links are provided for convenience only. RentMitra has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party sites or payment processors.`,
  },
  {
    title: "9. Governing Law",
    body: `This Disclaimer is governed by the laws of the Republic of India. Any dispute shall be subject to the exclusive jurisdiction of the courts of Bangalore, Karnataka, India.`,
  },
  {
    title: "10. Contact",
    body: `For questions about this Disclaimer: legal@rentmitra.in`,
  },
];

export default function Disclaimer() {
  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-[#111] text-white py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Disclaimer</h1>
            <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-10 space-y-8">

        {/* Primary notice */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-amber-900 dark:text-amber-200 mb-2">Important Notice</h2>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                RentMitra is a classifieds marketplace that connects owners and renters. We are <strong>not</strong> responsible
                for payments, deposits, damages, disputes, fraud, or the condition of listed items. All rental transactions are
                between private individuals. Use this platform at your own risk.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Platform does NOT handle */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <h2 className="font-bold text-red-900 dark:text-red-200">The Platform Does NOT Handle</h2>
          </div>
          <ul className="space-y-2.5">
            {NOT_HANDLED.map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-red-900/80 dark:text-red-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-red-700/70 dark:text-red-300/60 mt-4 leading-relaxed">
            All of the above must be arranged directly between the owner and renter. RentMitra bears no responsibility for any failure, loss, or dispute arising from these activities.
          </p>
        </motion.div>

        {/* Revenue model highlight */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <IndianRupee className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <h2 className="font-bold text-green-900 dark:text-green-200">How RentMitra Earns Money</h2>
          </div>
          <p className="text-sm text-green-900/80 dark:text-green-200/80 mb-4 leading-relaxed">
            RentMitra earns money <strong>only</strong> from listing fees and featured listing promotions paid by owners.
            We do <strong>not</strong> take any commission from rental transactions.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "1 Listing", price: "₹49", sub: "30 days" },
              { label: "5 Listings", price: "₹199", sub: "30 days" },
              { label: "Unlimited", price: "₹499", sub: "per month" },
              { label: "Featured", price: "₹99", sub: "per listing · 7 days" },
            ].map(t => (
              <div key={t.label} className="bg-white dark:bg-green-900/30 rounded-xl p-3 text-center border border-green-100 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">{t.label}</p>
                <p className="text-xl font-black text-green-700 dark:text-green-200">{t.price}</p>
                <p className="text-[10px] text-green-600/70 dark:text-green-400/70">{t.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-700/60 dark:text-green-400/60 mt-3">
            View full pricing details on our{" "}
            <Link href="/pricing" className="underline font-medium">Pricing page</Link>.
          </p>
        </motion.div>

        {/* Detailed sections */}
        {SECTIONS.map(({ title, body }) => (
          <motion.section key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-3">{title}</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
