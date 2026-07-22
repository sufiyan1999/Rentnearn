import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const FAQS = [
  {
    category: "General",
    items: [
      { q: "What is RentMitra?", a: "RentMitra is India's peer-to-peer rental marketplace where you can rent items from people near you or list your own items for rent. We connect owners and renters directly — no middleman fees." },
      { q: "How does RentMitra work?", a: "Owners list items they're happy to rent out. Renters browse listings, find what they need, and contact the owner directly via WhatsApp or phone. The two parties agree on terms, price, and pickup arrangements privately." },
      { q: "Is RentMitra available across India?", a: "Yes! RentMitra is available in 50+ cities across India. If your city isn't covered yet, you can still list items — we're growing fast." },
      { q: "Is RentMitra free to use?", a: "Yes, RentMitra is completely free for both owners and renters. We don't charge listing fees, transaction fees, or commissions." },
    ],
  },
  {
    category: "For Renters",
    items: [
      { q: "How do I find items to rent?", a: "Search by keyword, browse by category, or use the Nearby feature to find items close to you. You can filter by price, condition, and location." },
      { q: "How do I contact an owner?", a: "Each listing has a WhatsApp button that opens a pre-filled message to the owner. You can also call or message them directly." },
      { q: "What should I check before renting an item?", a: "Always inspect the item in person before taking it. Check for damage, verify it works as described, and agree on a deposit arrangement with the owner directly. See our Safety Tips for a full checklist." },
      { q: "What if the item is damaged or not as described?", a: "RentMitra is a marketplace platform — we connect you with owners but don't manage individual transactions. Disputes should be resolved directly between you and the owner. We recommend inspecting everything carefully before agreeing to rent." },
    ],
  },
  {
    category: "For Owners",
    items: [
      { q: "How do I list an item?", a: "Create a free account, tap the '+' button, fill in your item details (name, category, photos, price, location), and submit. Our team reviews and approves listings within 24 hours." },
      { q: "How do I set my rental price?", a: "You set your own daily, weekly, and monthly prices. RentMitra doesn't take a cut. Check similar listings in your area for a fair market rate." },
      { q: "Can I pause or remove my listing?", a: "Yes. Go to your dashboard, find your listing, and you can edit, pause, or delete it at any time. Listings automatically expire after 30 days and can be renewed." },
      { q: "What items can I list?", a: "You can list almost anything legal — tools, cameras, bikes, baby gear, electronics, party equipment, medical devices, and more. See our Terms of Service for prohibited items." },
    ],
  },
  {
    category: "Account & Safety",
    items: [
      { q: "How do I create an account?", a: "Click Sign Up, enter your name, email, and password, or continue with Google. Verify your email and you're ready to go." },
      { q: "Is my personal information safe?", a: "Yes. We follow industry-standard security practices. Your email and phone number are not shared publicly — only when a renter contacts you directly." },
      { q: "How does verification work?", a: "RentMitra admins may manually verify users or businesses after reviewing their profile. Verified badges give other users extra confidence." },
      { q: "What should I do if I suspect fraud?", a: "Never transfer money via UPI or wire before inspecting an item. Meet in a public place for the first transaction. Report suspicious listings or users to support@rentmitra.in immediately." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-primary transition-colors"
      >
        <span className="font-medium text-sm leading-snug">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-primary" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="pb-4"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [search, setSearch] = useState("");

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      ({ q, a }) =>
        q.toLowerCase().includes(search.toLowerCase()) ||
        a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
            <p className="text-white/80 mb-7">Find quick answers about listing, renting, and account management.</p>
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="search"
                placeholder="Search questions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/15 border border-white/25 rounded-full px-4 pl-11 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-12 space-y-8">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No results found for "{search}"</p>
        ) : (
          filtered.map(({ category, items }, i) => (
            <motion.section key={category} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <h2 className="text-lg font-bold mb-2 text-primary">{category}</h2>
              <div className="bg-card border border-border rounded-2xl px-5 divide-y divide-border">
                {items.map(item => <FAQItem key={item.q} {...item} />)}
              </div>
            </motion.section>
          ))
        )}
      </div>
    </div>
  );
}
