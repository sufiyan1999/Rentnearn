import { useState } from "react";
import { motion } from "framer-motion";
import { SeoHead } from "@/components/SeoHead";
import { Mail, MessageCircle, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CONTACT_OPTIONS = [
  { icon: Mail, title: "Email Support", detail: "support@rentnearn.com", desc: "Typically replies within 24 hours", href: "mailto:support@rentnearn.com", color: "text-primary" },
  { icon: MessageCircle, title: "WhatsApp", detail: "+91 70393 63031", desc: "Mon–Sat, 9 AM – 6 PM IST", href: "https://wa.me/917039363031", color: "text-green-500" },
  { icon: MapPin, title: "Registered Office", detail: "11 Granada, LBS Marg, Opp. Phoenix Mall, Kurla West, Mumbai – 400070", desc: "AlliedReach", href: null, color: "text-primary" },
  { icon: Clock, title: "Support Hours", detail: "Mon–Sat", desc: "9:00 AM – 6:00 PM IST", href: null, color: "text-amber-500" },
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="pb-24 md:pb-0">
      <SeoHead
        title="Contact Us"
        description="Get in touch with the RentNEarn team. We're here to help with listing questions, account issues, or partnership inquiries."
        canonical="/contact"
      />
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
            <p className="text-white/80 text-base">We'd love to hear from you. Reach out for support, partnerships, or feedback.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Contact options */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            <h2 className="text-xl font-bold mb-5">Get in Touch</h2>
            {CONTACT_OPTIONS.map(({ icon: Icon, title, detail, desc, href, color }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">{detail}</a>
                  ) : (
                    <p className="text-sm text-foreground">{detail}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-xl font-bold mb-5">Send a Message</h2>
            {sent ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">Message Sent!</h3>
                <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
                <Button className="mt-5" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                  Send Another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Name</label>
                    <Input placeholder="Your name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="you@email.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="How can we help?" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea placeholder="Describe your issue or question..." rows={5} required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full rounded-xl">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
