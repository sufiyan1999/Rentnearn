import { useState } from "react";
import { Link } from "wouter";
import {
  Facebook, Instagram, Linkedin, Twitter, Mail, MessageCircle,
  MapPin, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "FAQs", href: "/faq" },
      { label: "Safety Tips", href: "/safety" },
      { label: "How It Works", href: "/how-it-works" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Categories", href: "/categories" },
      { label: "Business Accounts", href: "/register" },
      { label: "Safety Guidelines", href: "/safety" },
      { label: "How It Works", href: "/how-it-works" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Disclaimer", href: "/disclaimer" },
    { label: "Fair Usage Policy", href: "/fair-usage-policy" },
    ],
  },
];

const SOCIAL = [
  { icon: Facebook,  label: "Facebook",  href: "https://facebook.com/rentmitra" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/rentmitra" },
  { icon: Linkedin,  label: "LinkedIn",  href: "https://linkedin.com/company/rentmitra" },
  { icon: Twitter,   label: "X (Twitter)", href: "https://x.com/rentmitra" },
];

function AccordionColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="md:hidden w-full flex items-center justify-between py-4 text-sm font-semibold text-white/90 tracking-wide uppercase"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
      </button>
      {/* Always visible on desktop */}
      <h3 className="hidden md:block text-sm font-semibold text-white/90 tracking-wide uppercase mb-5">{title}</h3>
      <ul className={cn("space-y-3 overflow-hidden transition-all duration-300 md:block", open ? "pb-4 max-h-96" : "max-h-0 md:max-h-none")}>
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-white/55 hover:text-white transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white hidden md:block">
      {/* Main grid */}
      <div className="container mx-auto px-4 pt-14 pb-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="md:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                R
              </div>
              <span className="font-bold text-2xl tracking-tight">RentMitra</span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              India's trusted peer-to-peer rental marketplace. Rent what you need, earn from what you own.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            {/* Contact block */}
            <div className="space-y-2 pt-2">
              <a href="mailto:support@rentmitra.in" className="flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                support@rentmitra.in
              </a>
              <a href="https://wa.me/919999000001" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4 text-green-400" />
                WhatsApp Support
              </a>
              <span className="flex items-center gap-2 text-sm text-white/40">
                <MapPin className="w-4 h-4 text-primary/60" />
                India
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <AccordionColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="container mx-auto px-4 py-5 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/35 text-center sm:text-left">
            &copy; 2026 RentMitra India. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Disclaimer", href: "/disclaimer" },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-xs text-white/35 hover:text-white/70 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
