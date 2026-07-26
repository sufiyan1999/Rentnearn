import { Link } from "wouter";
import { ShieldAlert, Scale, AlertTriangle, Ban } from "lucide-react";
import { SeoHead } from "@/components/SeoHead";

const PROHIBITED = [
  {
    icon: "🔫",
    title: "Firearms & Guns",
    law: "Arms Act, 1959",
    items: [
      "Pistols, revolvers, rifles, shotguns, muskets",
      "Air guns, pellet guns, BB guns",
      "Any unlicensed firearm or part thereof",
    ],
  },
  {
    icon: "💣",
    title: "Ammunition & Explosives",
    law: "Arms Act, 1959 · Explosives Act, 1884",
    items: [
      "Bullets, cartridges, shell casings",
      "Bombs, grenades, landmines, detonators",
      "Gunpowder, dynamite and blasting materials",
    ],
  },
  {
    icon: "⚔️",
    title: "Prohibited Weapons",
    law: "Arms Act, 1959",
    items: [
      "Swords, daggers, stilettos",
      "Switchblades, gravity knives, butterfly knives",
      "Brass knuckles, knuckle dusters, nunchaku",
      "Shurikens (throwing stars), slingshots",
    ],
  },
  {
    icon: "🔞",
    title: "Adult / Obscene Items",
    law: "IPC Sections 292–294",
    items: [
      "Sex toys, vibrators, dildos and similar devices",
      "Pornographic or obscene material",
      "Bondage and BDSM equipment",
      "Any item classified as obscene under Indian law",
    ],
  },
  {
    icon: "💊",
    title: "Narcotics & Controlled Drugs",
    law: "NDPS Act, 1985",
    items: [
      "Marijuana, cannabis, ganja, charas, bhang",
      "Cocaine, heroin, opium, fentanyl",
      "MDMA, LSD, amphetamines, methamphetamine",
      "Any psychotropic substance listed under the NDPS Act",
    ],
  },
  {
    icon: "🌿",
    title: "Drug Paraphernalia",
    law: "NDPS Act, 1985",
    items: [
      "Pipes and equipment used for smoking narcotics",
      "Items primarily used for consuming controlled substances",
    ],
  },
  {
    icon: "🐘",
    title: "Wildlife & Endangered Species Products",
    law: "Wildlife Protection Act, 1972",
    items: [
      "Ivory, rhino horn, tiger or leopard skin",
      "Shahtoosh shawls, turtle shells, bear bile",
      "Any product derived from a protected species",
    ],
  },
  {
    icon: "💸",
    title: "Counterfeit & Forged Items",
    law: "IPC Sections 489A–489E",
    items: [
      "Fake or counterfeit currency notes",
      "Forged identity documents, certificates or stamps",
      "Replica firearms or weapons designed to deceive",
    ],
  },
  {
    icon: "📡",
    title: "Illegal Surveillance & Jamming Devices",
    law: "Indian Wireless Telegraphy Act, 1933 · IT Act, 2000",
    items: [
      "Signal jammers (GSM, GPS, phone, drone jammers)",
      "Covert / hidden spy cameras",
      "IMSI catchers and similar interception devices",
    ],
  },
  {
    icon: "☢️",
    title: "Hazardous Materials",
    law: "Environment Protection Act, 1986",
    items: [
      "Radioactive or nuclear material",
      "Chemical weapons, nerve agents (sarin, VX, mustard gas)",
      "Biological or biohazardous materials",
    ],
  },
  {
    icon: "💻",
    title: "Cybercrime Tools",
    law: "IT Act, 2000",
    items: [
      "ATM or credit card skimmers",
      "Phishing kits and malware packages",
      "Tools designed for unauthorised access to systems",
    ],
  },
];

export default function ProhibitedItems() {
  return (
    <>
      <SeoHead
        title="Prohibited Items Policy — RentNEarn"
        description="Items that cannot be listed or rented on RentNEarn as per Indian law. Review our complete prohibited items policy before creating a listing."
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-b border-border">
          <div className="container mx-auto px-4 py-14 max-w-4xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/40 mb-5">
              <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Prohibited Items Policy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              The items below <strong>cannot be listed or rented</strong> on RentNEarn. Listings
              violating this policy will be removed immediately and may be reported to the
              relevant authorities.
            </p>
          </div>
        </div>

        {/* Policy cards */}
        <div className="container mx-auto px-4 py-12 max-w-4xl">

          {/* Info bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            {[
              { icon: Scale, text: "Based on Indian law" },
              { icon: AlertTriangle, text: "Violations reported to authorities" },
              { icon: Ban, text: "Listings removed without notice" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 bg-secondary rounded-xl px-4 py-3 flex-1 text-sm font-medium text-muted-foreground">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                {text}
              </div>
            ))}
          </div>

          <div className="grid gap-5">
            {PROHIBITED.map((cat) => (
              <div
                key={cat.title}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl leading-none mt-0.5">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                      <h2 className="text-base font-bold">{cat.title}</h2>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
                        {cat.law}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {cat.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-red-500 mt-0.5 shrink-0 font-bold">✕</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-10 bg-primary/8 border border-primary/20 rounded-2xl p-6 text-center">
            <h3 className="font-bold text-lg mb-1">Not sure if your item is allowed?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contact our support team before creating your listing and we'll confirm for you.
            </p>
            <a
              href="mailto:support@rentnearn.com"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </a>
            <p className="text-xs text-muted-foreground mt-5">
              This policy was last updated in July 2026 and reflects applicable Indian law at that time.
              RentNEarn reserves the right to update this list at any time.{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              {" "}·{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
