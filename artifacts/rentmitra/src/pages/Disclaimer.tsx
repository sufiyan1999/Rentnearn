import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const LAST_UPDATED = "22 July 2026";

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
        {/* Highlight box */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-amber-900 dark:text-amber-200 mb-2">Important Notice</h2>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                RentMitra is a classifieds marketplace that connects owners and renters. We are <strong>not</strong> responsible
                for payments, deposits, damages, disputes, fraud, or the condition of listed items. All transactions are
                between private individuals. Use this platform at your own risk.
              </p>
            </div>
          </div>
        </motion.div>

        {[
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
            body: `RentMitra does not process, hold, or facilitate payments. All financial arrangements — including rental fees, security deposits, damage compensation, and refunds — are made directly between the owner and renter. RentMitra is not liable for any payment disputes, failed transfers, non-refunded deposits, or financial losses arising from a rental.`,
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
            title: "6. Limitation of Liability",
            body: `To the fullest extent permitted by applicable Indian law, RentMitra India, its directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including loss of profits, goodwill, data, or other intangible losses, even if advised of the possibility of such damages.`,
          },
          {
            title: "7. Third-Party Links",
            body: `RentMitra may contain links to third-party websites or services (e.g. WhatsApp, Google Maps). These links are provided for convenience only. RentMitra has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party sites.`,
          },
          {
            title: "8. Governing Law",
            body: `This Disclaimer is governed by the laws of the Republic of India. Any dispute shall be subject to the exclusive jurisdiction of the courts of Bangalore, Karnataka, India.`,
          },
          {
            title: "9. Contact",
            body: `For questions about this Disclaimer: legal@rentmitra.in`,
          },
        ].map(({ title, body }) => (
          <motion.section key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-3">{title}</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
