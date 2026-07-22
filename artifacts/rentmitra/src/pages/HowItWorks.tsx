import { motion } from "framer-motion";
import { UserPlus, Search, MessageCircle, Package, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const RENTER_STEPS = [
  { icon: UserPlus, step: "1", title: "Create a Free Account", desc: "Sign up with your email or Google in under a minute. No payment details required." },
  { icon: Search, step: "2", title: "Find What You Need", desc: "Search by keyword, browse categories, or use Nearby to find items close to you." },
  { icon: MessageCircle, step: "3", title: "Contact the Owner", desc: "Tap WhatsApp to message the owner directly. Agree on pickup time, price, and deposit." },
  { icon: Package, step: "4", title: "Pick Up & Return", desc: "Inspect the item, document its condition, enjoy your rental, and return it on time." },
];

const OWNER_STEPS = [
  { icon: UserPlus, step: "1", title: "Create an Account", desc: "Register for free. Business users can also create a verified business profile." },
  { icon: Package, step: "2", title: "List Your Item", desc: "Add photos, description, pricing (daily/weekly/monthly), and your city. Submit for review." },
  { icon: Star, step: "3", title: "Get Approved", desc: "Our team reviews your listing within 24 hours and sends you an email when it goes live." },
  { icon: MessageCircle, step: "4", title: "Start Earning", desc: "Renters contact you directly on WhatsApp. Arrange pickup and collect your rental fee." },
];

export default function HowItWorks() {
  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-3">How RentMitra Works</h1>
            <p className="text-white/80">Renting or listing — it takes just a few simple steps.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12 space-y-14">
        {/* For Renters */}
        <section>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-7">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">For Renters</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {RENTER_STEPS.map(({ icon: Icon, step, title, desc }, i) => (
                <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="relative">
                  {i < RENTER_STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-2.5 top-5 w-4 h-4 text-muted-foreground z-10" />
                  )}
                  <div className="bg-card border border-border rounded-2xl p-5 h-full">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm mb-4">
                      {step}
                    </div>
                    <h3 className="font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/search">
                <Button className="rounded-full">Start Renting <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <div className="border-t border-border" />

        {/* For Owners */}
        <section>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-7">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">For Owners</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {OWNER_STEPS.map(({ icon: Icon, step, title, desc }, i) => (
                <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }} className="relative">
                  {i < OWNER_STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-2.5 top-5 w-4 h-4 text-muted-foreground z-10" />
                  )}
                  <div className="bg-card border border-border rounded-2xl p-5 h-full">
                    <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background font-bold text-sm mb-4">
                      {step}
                    </div>
                    <h3 className="font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/listings/new">
                <Button variant="outline" className="rounded-full">List Your First Item <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Why RentMitra */}
        <section>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-primary text-white rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Why RentMitra?</h2>
            <div className="grid grid-cols-3 gap-6 mt-6">
              {[
                { value: "Free", label: "No fees or commissions" },
                { value: "24h", label: "Listing review time" },
                { value: "50+", label: "Cities across India" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-bold">{value}</p>
                  <p className="text-sm text-white/70 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
