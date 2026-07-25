import { motion } from "framer-motion";
import { SeoHead } from "@/components/SeoHead";
import { ShieldCheck, Users, MapPin, Leaf, Star, Wrench } from "lucide-react";

const VALUES = [
  { icon: ShieldCheck, title: "Trust & Safety", desc: "Every listing goes through admin review before it goes live. We put community safety first." },
  { icon: Users, title: "Community First", desc: "Built for Indians, by Indians. We connect neighbours and build local sharing economies." },
  { icon: Leaf, title: "Sustainable Living", desc: "Why buy when you can rent? We reduce waste and help Indians make the most of what they own." },
  { icon: MapPin, title: "Hyperlocal", desc: "Find items near you. Our location-first approach means less travel and faster pickups." },
  { icon: Star, title: "Quality Listings", desc: "We curate and approve every listing so renters always find reliable, well-described items." },
  { icon: Wrench, title: "All Categories", desc: "Tools, cameras, baby gear, medical equipment, party supplies — one platform for everything." },
];

const TEAM = [
  { name: "Arjun Mehta", role: "Co-Founder & CEO", city: "Bangalore" },
  { name: "Priyanka Sharma", role: "Co-Founder & CTO", city: "Mumbai" },
  { name: "Rahul Nair", role: "Head of Operations", city: "Kochi" },
  { name: "Sneha Patel", role: "Head of Design", city: "Pune" },
];

export default function About() {
  return (
    <div className="pb-24 md:pb-0">
      <SeoHead
        title="About RentNEarn"
        description="RentNEarn is India's #1 peer-to-peer rental marketplace — connecting renters and owners directly, with zero commission. Learn our story, mission, and values."
        canonical="/about"
      />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg">
              R
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">About RentNEarn</h1>
            <p className="text-lg text-white/85 leading-relaxed max-w-2xl mx-auto">
              India's trusted peer-to-peer rental marketplace, connecting people who have things
              with people who need them — safely, locally, and affordably.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-14">
        {/* Mission */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-14">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            At RentNEarn, we believe that not everything needs to be owned. Our mission is to connect people who have
            underused items with those who need them, making renting simple, affordable, and accessible across India.
          </p>
          <p className="text-muted-foreground leading-relaxed text-base mt-4">
            By extending the life of everyday products, reducing unnecessary purchases, and encouraging responsible sharing,
            we help people save money, earn extra income, and contribute to a cleaner, greener, and more sustainable future.
          </p>
          <p className="text-muted-foreground leading-relaxed text-base mt-4">
            Every rental supports a smarter circular economy where communities benefit while reducing waste and making
            better use of existing resources.
          </p>
        </motion.section>

        {/* Values */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Team */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-14">
          <h2 className="text-2xl font-bold mb-6">The Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TEAM.map(({ name, role, city }) => (
              <div key={name} className="bg-card border border-border rounded-2xl p-5 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">{name[0]}</span>
                </div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{role}</p>
                <p className="text-xs text-primary mt-1">{city}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="bg-primary text-white rounded-3xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "10,000+", label: "Listings" },
              { value: "50+", label: "Cities" },
              { value: "25,000+", label: "Users" },
              { value: "12", label: "Categories" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm text-white/70 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
