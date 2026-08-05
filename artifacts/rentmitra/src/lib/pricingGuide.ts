// Pricing benchmark data for each category.
// Source: RentNEarn internal pricing guidance (Aug 2026).

export interface PricingItem {
  name: string;
  mrp?: string;
  daily?: number;
  weekly?: number;
  monthly?: number;
  deposit?: string;
  blockNote?: string; // e.g. "(3-day event block)"
}

export interface CategoryGuide {
  slug: string;
  name: string;
  /** Typical daily range [min, max] */
  dailyRange?: [number, number];
  /** Typical weekly range [min, max] */
  weeklyRange?: [number, number];
  /** Typical monthly range [min, max] */
  monthlyRange?: [number, number];
  /** Extra context shown in the tip box */
  note?: string;
  /** Detailed item-level benchmarks for the full guide page */
  items: PricingItem[];
}

export const PRICING_GUIDE: CategoryGuide[] = [
  {
    slug: "photography",
    name: "Photography & Video",
    dailyRange: [600, 1200],
    weeklyRange: [2400, 5000],
    monthlyRange: [6000, 12000],
    items: [
      { name: "DSLR Camera (e.g. Sony Alpha / Canon)", mrp: "₹65,000", daily: 1200, weekly: 5000, monthly: 12000, deposit: "Govt. ID + ₹5,000" },
      { name: "Home Theatre / DJ Speakers", mrp: "₹25,000", daily: 600, weekly: 2400, monthly: 6000, deposit: "₹3,000" },
      { name: "Multimedia Projector", mrp: "₹30,000", daily: 700, weekly: 2800, monthly: 7000, deposit: "₹4,000" },
    ],
  },
  {
    slug: "electronics",
    name: "Electronics",
    dailyRange: [500, 1000],
    weeklyRange: [2000, 4000],
    monthlyRange: [5000, 10000],
    note: "Prices vary widely by device. Use a security deposit to protect high-value items.",
    items: [
      { name: "Multimedia Projector", mrp: "₹30,000", daily: 700, weekly: 2800, monthly: 7000, deposit: "₹4,000" },
      { name: "Home Theatre / DJ Speakers", mrp: "₹25,000", daily: 600, weekly: 2400, monthly: 6000, deposit: "₹3,000" },
    ],
  },
  {
    slug: "tools",
    name: "Tools & Hardware",
    dailyRange: [250, 350],
    weeklyRange: [1000, 1400],
    monthlyRange: [2500, 3500],
    note: "Keep rates affordable — frequent short rentals earn more than one long high-price booking.",
    items: [
      { name: "Power Drill / Demolition Hammer (e.g. Bosch)", mrp: "₹5,500", daily: 250, weekly: 1000, monthly: 2500, deposit: "₹1,500" },
      { name: "High-Pressure Car Washer", mrp: "₹8,000", daily: 350, weekly: 1400, monthly: 3500, deposit: "₹2,000" },
    ],
  },
  {
    slug: "baby",
    name: "Baby Products",
    dailyRange: [200, 400],
    weeklyRange: [800, 1600],
    monthlyRange: [2200, 4000],
    items: [
      { name: "Premium Baby Stroller / Pram", mrp: "₹12,000", daily: 200, weekly: 800, monthly: 2200, deposit: "₹2,000" },
      { name: "Kids' Battery Ride-On Car", mrp: "₹15,000", daily: 400, weekly: 1600, monthly: 4000, deposit: "₹3,000" },
    ],
  },
  {
    slug: "camping",
    name: "Camping & Outdoor",
    dailyRange: [200, 250],
    weeklyRange: [750, 1000],
    monthlyRange: [1800, 2800],
    items: [
      { name: "Waterproof Camping Tent (3–4 Person)", mrp: "₹4,000", daily: 200, weekly: 750, monthly: 1800, deposit: "₹1,000" },
      { name: "Mountain Bike / Bicycle", mrp: "₹14,000", daily: 250, weekly: 1000, monthly: 2800, deposit: "₹2,000" },
    ],
  },
  {
    slug: "medical",
    name: "Medical Equipment",
    dailyRange: [150, 800],
    weeklyRange: [500, 3000],
    monthlyRange: [1200, 7500],
    note: "High-value medical devices should include a security deposit + Aadhaar verification.",
    items: [
      { name: "Foldable Wheelchair", mrp: "₹6,500", daily: 150, weekly: 500, monthly: 1200, deposit: "₹1,500" },
      { name: "Oxygen Concentrator", mrp: "₹45,000", daily: 800, weekly: 3000, monthly: 7500, deposit: "₹5,000" },
    ],
  },
  {
    slug: "apparel",
    name: "Apparel & Fashion",
    dailyRange: [600, 2000],
    note: "Fashion items use 3-day event block pricing. The quoted rate covers the full 3-day block (pickup, event, return).",
    items: [
      { name: "Heavy Wedding Lehenga / Bridal", mrp: "₹35,000", daily: 2000, deposit: "₹5,000", blockNote: "3-day block" },
      { name: "Designer Sherwani / Indo-Western", mrp: "₹20,000", daily: 1200, deposit: "₹3,000", blockNote: "3-day block" },
      { name: "Designer Blazer / Tuxedo", mrp: "₹8,000", daily: 600, deposit: "₹2,000", blockNote: "3-day block" },
      { name: "Luxury Handbag (Coach / MK)", mrp: "₹25,000", daily: 800, weekly: 3200, deposit: "Aadhaar + Post-dated Cheque" },
    ],
  },
  {
    slug: "home-appliances",
    name: "Home Appliances",
    dailyRange: [200, 600],
    weeklyRange: [750, 2400],
    monthlyRange: [1800, 6000],
    note: "Include a clean-up clause — renters should return appliances clean, or factor a ₹150 sanitation fee.",
    items: [
      { name: "Microwave Oven / OTG", mrp: "₹8,500", daily: 200, weekly: 800, monthly: 2000, deposit: "Aadhaar + ₹1,500" },
      { name: "Air Cooler (Symphony / Bajaj)", mrp: "₹9,000", daily: 250, weekly: 900, monthly: 2200, deposit: "Aadhaar + ₹2,000" },
      { name: "Robot Vacuum Cleaner (Ecovacs)", mrp: "₹28,000", daily: 600, weekly: 2400, monthly: 6000, deposit: "Aadhaar + Cheque" },
      { name: "Deep Fryer / Air Fryer (Philips)", mrp: "₹7,500", daily: 200, weekly: 750, monthly: 1800, deposit: "Aadhaar + ₹1,500" },
    ],
  },
  {
    slug: "fitness",
    name: "Sports & Fitness",
    dailyRange: [200, 500],
    weeklyRange: [800, 2000],
    monthlyRange: [2200, 4500],
    items: [
      { name: "Motorized Treadmill (Fitkit)", mrp: "₹24,000", daily: 500, weekly: 2000, monthly: 4500, deposit: "Aadhaar + 1 month advance" },
      { name: "Adjustable Dumbbells Set", mrp: "₹12,000", daily: 200, weekly: 800, monthly: 2200, deposit: "Aadhaar + ₹2,000" },
    ],
  },
  {
    slug: "party",
    name: "Party & Events",
    dailyRange: [150, 500],
    weeklyRange: [500, 2000],
    monthlyRange: [1200, 4500],
    items: [
      { name: "Portable Karaoke Machine with Mic", mrp: "₹14,000", daily: 500, weekly: 2000, monthly: 4500, deposit: "Aadhaar + ₹2,500" },
      { name: "Barbeque Grill Setup (Charcoal)", mrp: "₹3,500", daily: 150, weekly: 500, monthly: 1200, deposit: "Aadhaar + ₹1,000" },
    ],
  },
  {
    slug: "construction",
    name: "Construction",
    dailyRange: [300, 800],
    weeklyRange: [1200, 3000],
    monthlyRange: [3000, 8000],
    note: "Heavy equipment should always include an Aadhaar-verified identity check before handover.",
    items: [
      { name: "Electric Concrete Mixer", mrp: "₹12,000", daily: 500, weekly: 1800, monthly: 4500, deposit: "₹3,000" },
      { name: "Tile Cutter / Angle Grinder", mrp: "₹4,500", daily: 300, weekly: 1200, monthly: 3000, deposit: "₹1,500" },
    ],
  },
  {
    slug: "agriculture",
    name: "Agriculture",
    dailyRange: [500, 2000],
    weeklyRange: [2000, 7000],
    monthlyRange: [5000, 18000],
    note: "Seasonal demand — prices can vary significantly in peak sowing or harvest months.",
    items: [
      { name: "Water Pump (1–2 HP)", mrp: "₹6,000", daily: 500, weekly: 2000, monthly: 5000, deposit: "₹2,000" },
      { name: "Power Sprayer", mrp: "₹8,000", daily: 600, weekly: 2400, monthly: 6000, deposit: "₹2,500" },
      { name: "Rotavator / Tiller Attachment", mrp: "₹35,000", daily: 2000, weekly: 7000, monthly: 18000, deposit: "₹5,000" },
    ],
  },
  {
    slug: "music",
    name: "Musical Instruments",
    dailyRange: [200, 800],
    weeklyRange: [800, 3000],
    monthlyRange: [2000, 8000],
    items: [
      { name: "Acoustic / Electric Guitar", mrp: "₹8,000", daily: 200, weekly: 800, monthly: 2000, deposit: "₹1,500" },
      { name: "Electronic Keyboard (61-key)", mrp: "₹15,000", daily: 400, weekly: 1500, monthly: 4000, deposit: "₹2,500" },
      { name: "Tabla / Dholak Set", mrp: "₹6,000", daily: 250, weekly: 900, monthly: 2500, deposit: "₹1,500" },
    ],
  },
];

/** Look up the pricing guide for a given category slug. */
export function getCategoryGuide(slug: string): CategoryGuide | undefined {
  return PRICING_GUIDE.find(g => g.slug === slug);
}

/** Return the 🟢/🟡/🔴 price indicator for an entered price vs the benchmark ceiling. */
export function getPriceIndicator(enteredPrice: number, benchmarkMax: number): {
  emoji: string;
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
} {
  if (enteredPrice <= benchmarkMax) {
    return {
      emoji: "🟢",
      label: "Good Price",
      description: "Your price is competitive.",
      colorClass: "text-green-700 dark:text-green-400",
      bgClass: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/40",
    };
  } else if (enteredPrice <= benchmarkMax * 1.5) {
    return {
      emoji: "🟡",
      label: "Slightly High",
      description: "You may receive fewer enquiries.",
      colorClass: "text-amber-700 dark:text-amber-400",
      bgClass: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40",
    };
  } else {
    return {
      emoji: "🔴",
      label: "Much Higher than Average",
      description: "Consider lowering your price.",
      colorClass: "text-red-700 dark:text-red-400",
      bgClass: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/40",
    };
  }
}
