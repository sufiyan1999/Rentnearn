export interface SubCategory {
  name: string;
  slug: string;
}

export interface CategoryDef {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;       // Tailwind bg class for the icon circle
  subcategories: SubCategory[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 1, name: "Tools & Hardware", slug: "tools", icon: "Wrench", color: "bg-orange-100 text-orange-600",
    subcategories: [
      { name: "Drill Machine", slug: "drill-machine" }, { name: "Angle Grinder", slug: "angle-grinder" },
      { name: "Circular Saw", slug: "circular-saw" }, { name: "Pressure Washer", slug: "pressure-washer" },
      { name: "Generator", slug: "generator" }, { name: "Welding Machine", slug: "welding-machine" },
      { name: "Ladder", slug: "ladder" }, { name: "Scaffolding", slug: "scaffolding" },
      { name: "Jack Hammer", slug: "jack-hammer" }, { name: "Concrete Mixer", slug: "concrete-mixer" },
      { name: "Paint Sprayer", slug: "paint-sprayer" }, { name: "Nail Gun", slug: "nail-gun" },
      { name: "Air Compressor", slug: "air-compressor" }, { name: "Lawn Mower", slug: "lawn-mower" },
      { name: "Chainsaw", slug: "chainsaw" }, { name: "Tile Cutter", slug: "tile-cutter" },
      { name: "Tool Kit", slug: "tool-kit" }, { name: "Wheelbarrow", slug: "wheelbarrow" },
    ],
  },
  {
    id: 2, name: "Photography & Video", slug: "photography", icon: "Camera", color: "bg-violet-100 text-violet-600",
    subcategories: [
      { name: "DSLR Camera", slug: "dslr-camera" }, { name: "Mirrorless Camera", slug: "mirrorless-camera" },
      { name: "Cinema Camera", slug: "cinema-camera" }, { name: "GoPro / Action Camera", slug: "action-camera" },
      { name: "Drone", slug: "drone" }, { name: "Camera Lens", slug: "camera-lens" },
      { name: "Tripod", slug: "tripod" }, { name: "Gimbal / Stabilizer", slug: "gimbal" },
      { name: "Studio Lights", slug: "studio-lights" }, { name: "Ring Light", slug: "ring-light" },
      { name: "Green Screen", slug: "green-screen" }, { name: "Microphone", slug: "microphone" },
      { name: "Projector", slug: "projector" }, { name: "Teleprompter", slug: "teleprompter" },
      { name: "Flash", slug: "flash" }, { name: "Softbox", slug: "softbox" },
    ],
  },
  {
    id: 3, name: "Baby Products", slug: "baby", icon: "Baby", color: "bg-pink-100 text-pink-600",
    subcategories: [
      { name: "Baby Stroller", slug: "baby-stroller" }, { name: "Baby Car Seat", slug: "baby-car-seat" },
      { name: "Baby Crib / Cot", slug: "baby-crib" }, { name: "Baby Swing", slug: "baby-swing" },
      { name: "Baby Walker", slug: "baby-walker" }, { name: "Feeding Chair", slug: "feeding-chair" },
      { name: "Baby Carrier", slug: "baby-carrier" }, { name: "Playpen", slug: "playpen" },
      { name: "Breast Pump", slug: "breast-pump" }, { name: "Baby Monitor", slug: "baby-monitor" },
      { name: "Baby Bathtub", slug: "baby-bathtub" }, { name: "Toy Package", slug: "toy-package" },
    ],
  },
  {
    id: 4, name: "Medical Equipment", slug: "medical", icon: "HeartPulse", color: "bg-red-100 text-red-600",
    subcategories: [
      { name: "Wheelchair", slug: "wheelchair" }, { name: "Electric Wheelchair", slug: "electric-wheelchair" },
      { name: "Walker", slug: "walker" }, { name: "Hospital Bed", slug: "hospital-bed" },
      { name: "Oxygen Concentrator", slug: "oxygen-concentrator" }, { name: "CPAP Machine", slug: "cpap-machine" },
      { name: "Nebulizer", slug: "nebulizer" }, { name: "Patient Lift", slug: "patient-lift" },
      { name: "Blood Pressure Monitor", slug: "bp-monitor" }, { name: "Pulse Oximeter", slug: "pulse-oximeter" },
      { name: "Medical Mattress", slug: "medical-mattress" }, { name: "Commode Chair", slug: "commode-chair" },
      { name: "Oxygen Cylinder", slug: "oxygen-cylinder" }, { name: "Crutches", slug: "crutches" },
    ],
  },
  {
    id: 5, name: "Party & Events", slug: "party", icon: "PartyPopper", color: "bg-yellow-100 text-yellow-600",
    subcategories: [
      { name: "Chairs", slug: "chairs" }, { name: "Tables", slug: "tables" },
      { name: "Tent / Canopy", slug: "tent-canopy" }, { name: "Stage", slug: "stage" },
      { name: "DJ Equipment", slug: "dj-equipment" }, { name: "Speaker & Amplifier", slug: "speaker" },
      { name: "LED Screen", slug: "led-screen" }, { name: "Smoke Machine", slug: "smoke-machine" },
      { name: "Bubble Machine", slug: "bubble-machine" }, { name: "Dance Floor", slug: "dance-floor" },
      { name: "Wedding Decoration", slug: "wedding-decoration" }, { name: "Balloon Decoration", slug: "balloon-decoration" },
      { name: "Projector", slug: "party-projector" }, { name: "Decorative Lights", slug: "decorative-lights" },
    ],
  },
  {
    id: 6, name: "Camping & Outdoor", slug: "camping", icon: "Tent", color: "bg-emerald-100 text-emerald-600",
    subcategories: [
      { name: "Camping Tent", slug: "camping-tent" }, { name: "Sleeping Bag", slug: "sleeping-bag" },
      { name: "Air Mattress", slug: "air-mattress" }, { name: "Camping Stove", slug: "camping-stove" },
      { name: "Camping Chair", slug: "camping-chair" }, { name: "Ice Box / Cooler", slug: "ice-box" },
      { name: "BBQ Grill", slug: "bbq-grill" }, { name: "Portable Generator", slug: "portable-generator" },
      { name: "Trekking Pole", slug: "trekking-pole" }, { name: "Hiking Backpack", slug: "hiking-backpack" },
      { name: "Binoculars", slug: "binoculars" }, { name: "Kayak", slug: "kayak" },
      { name: "Inflatable Boat", slug: "inflatable-boat" },
    ],
  },
  {
    id: 7, name: "Sports & Fitness", slug: "fitness", icon: "Dumbbell", color: "bg-blue-100 text-blue-600",
    subcategories: [
      { name: "Bicycle", slug: "bicycle" }, { name: "Mountain Bike", slug: "mountain-bike" },
      { name: "Electric Bike", slug: "electric-bike" }, { name: "Treadmill", slug: "treadmill" },
      { name: "Exercise Cycle", slug: "exercise-cycle" }, { name: "Rowing Machine", slug: "rowing-machine" },
      { name: "Home Gym", slug: "home-gym" }, { name: "Bench Press", slug: "bench-press" },
      { name: "Dumbbells", slug: "dumbbells" }, { name: "Yoga Mat", slug: "yoga-mat" },
      { name: "Punching Bag", slug: "punching-bag" }, { name: "Cricket Kit", slug: "cricket-kit" },
      { name: "Football Kit", slug: "football-kit" }, { name: "Badminton Kit", slug: "badminton-kit" },
      { name: "Tennis Kit", slug: "tennis-kit" }, { name: "Golf Kit", slug: "golf-kit" },
      { name: "Skating Gear", slug: "skating-gear" },
    ],
  },
  {
    id: 8, name: "Gaming", slug: "gaming", icon: "Gamepad2", color: "bg-indigo-100 text-indigo-600",
    subcategories: [
      { name: "PlayStation", slug: "playstation" }, { name: "Xbox", slug: "xbox" },
      { name: "Nintendo Switch", slug: "nintendo-switch" }, { name: "Gaming Laptop", slug: "gaming-laptop" },
      { name: "Gaming PC", slug: "gaming-pc" }, { name: "VR Headset", slug: "vr-headset" },
      { name: "Racing Simulator", slug: "racing-simulator" }, { name: "Gaming Chair", slug: "gaming-chair" },
      { name: "Gaming Monitor", slug: "gaming-monitor" },
    ],
  },
  {
    id: 9, name: "Electronics", slug: "electronics", icon: "Laptop", color: "bg-sky-100 text-sky-600",
    subcategories: [
      { name: "Laptop", slug: "laptop" }, { name: "Desktop Computer", slug: "desktop" },
      { name: "Monitor", slug: "monitor" }, { name: "Printer / Scanner", slug: "printer" },
      { name: "Tablet / iPad", slug: "tablet" }, { name: "Mobile Phone", slug: "mobile-phone" },
      { name: "WiFi Router", slug: "wifi-router" }, { name: "Portable WiFi", slug: "portable-wifi" },
      { name: "Power Bank", slug: "power-bank" }, { name: "UPS", slug: "ups" },
      { name: "External Storage", slug: "external-storage" },
    ],
  },
  {
    id: 10, name: "Musical Instruments", slug: "music", icon: "Music", color: "bg-purple-100 text-purple-600",
    subcategories: [
      { name: "Guitar", slug: "guitar" }, { name: "Bass Guitar", slug: "bass-guitar" },
      { name: "Keyboard / Piano", slug: "keyboard" }, { name: "Drum Set", slug: "drum-set" },
      { name: "Violin", slug: "violin" }, { name: "Saxophone", slug: "saxophone" },
      { name: "Tabla", slug: "tabla" }, { name: "Harmonium", slug: "harmonium" },
      { name: "Dhol", slug: "dhol" }, { name: "Cajon", slug: "cajon" },
      { name: "Amplifier", slug: "amplifier" }, { name: "DJ Controller", slug: "dj-controller" },
    ],
  },
  {
    id: 11, name: "Automotive", slug: "automotive", icon: "Car", color: "bg-slate-100 text-slate-600",
    subcategories: [
      { name: "Car", slug: "car" }, { name: "SUV", slug: "suv" },
      { name: "Luxury Car", slug: "luxury-car" }, { name: "Bike / Motorcycle", slug: "bike" },
      { name: "Scooter", slug: "scooter" }, { name: "Electric Scooter", slug: "electric-scooter" },
      { name: "Bicycle Rack", slug: "bicycle-rack" }, { name: "Roof Box", slug: "roof-box" },
      { name: "GPS Device", slug: "gps-device" }, { name: "Dash Camera", slug: "dash-camera" },
      { name: "Jump Starter", slug: "jump-starter" },
    ],
  },
  {
    id: 12, name: "Home Appliances", slug: "home-appliances", icon: "Home", color: "bg-teal-100 text-teal-600",
    subcategories: [
      { name: "Refrigerator", slug: "refrigerator" }, { name: "Washing Machine", slug: "washing-machine" },
      { name: "Air Conditioner", slug: "air-conditioner" }, { name: "Air Cooler", slug: "air-cooler" },
      { name: "Microwave / Oven", slug: "microwave" }, { name: "Coffee Machine", slug: "coffee-machine" },
      { name: "Vacuum Cleaner", slug: "vacuum-cleaner" }, { name: "Water Purifier", slug: "water-purifier" },
      { name: "Air Purifier", slug: "air-purifier" }, { name: "Room Heater", slug: "room-heater" },
      { name: "Dishwasher", slug: "dishwasher" }, { name: "Air Fryer", slug: "air-fryer" },
    ],
  },
  {
    id: 13, name: "Furniture", slug: "furniture", icon: "Armchair", color: "bg-amber-100 text-amber-600",
    subcategories: [
      { name: "Sofa / Recliner", slug: "sofa" }, { name: "Dining Table", slug: "dining-table" },
      { name: "Office Chair", slug: "office-chair" }, { name: "Office Desk", slug: "office-desk" },
      { name: "Study Table", slug: "study-table" }, { name: "Wardrobe", slug: "wardrobe" },
      { name: "Bookshelf", slug: "bookshelf" }, { name: "TV Unit", slug: "tv-unit" },
      { name: "Bed", slug: "bed" }, { name: "Mattress", slug: "mattress" },
      { name: "Folding Table", slug: "folding-table" },
    ],
  },
  {
    id: 14, name: "Apparel & Fashion", slug: "apparel", icon: "Shirt", color: "bg-rose-100 text-rose-600",
    subcategories: [
      { name: "Wedding Dress / Bridal", slug: "wedding-dress" }, { name: "Sherwani", slug: "sherwani" },
      { name: "Tuxedo / Suit", slug: "tuxedo" }, { name: "Saree", slug: "saree" },
      { name: "Lehenga", slug: "lehenga" }, { name: "Costume", slug: "costume" },
      { name: "Jewellery", slug: "jewellery" }, { name: "Luxury Handbags", slug: "luxury-handbags" },
      { name: "Luxury Watches", slug: "luxury-watches" }, { name: "Ethnic Wear", slug: "ethnic-wear" },
      { name: "Kids Costume", slug: "kids-costume" }, { name: "Designer Wear", slug: "designer-wear" },
    ],
  },
  {
    id: 15, name: "Education & Office", slug: "education", icon: "BookOpen", color: "bg-cyan-100 text-cyan-600",
    subcategories: [
      { name: "Whiteboard", slug: "whiteboard" }, { name: "Projector", slug: "edu-projector" },
      { name: "Laptop", slug: "edu-laptop" }, { name: "Tablet", slug: "edu-tablet" },
      { name: "Printer / Scanner", slug: "edu-printer" }, { name: "Office Chair", slug: "edu-chair" },
      { name: "Conference Equipment", slug: "conference-equipment" },
    ],
  },
  {
    id: 16, name: "Pet Supplies", slug: "pets", icon: "PawPrint", color: "bg-lime-100 text-lime-600",
    subcategories: [
      { name: "Pet Carrier", slug: "pet-carrier" }, { name: "Pet Cage", slug: "pet-cage" },
      { name: "Aquarium", slug: "aquarium" }, { name: "Dog Crate", slug: "dog-crate" },
      { name: "Pet Stroller", slug: "pet-stroller" }, { name: "Grooming Kit", slug: "grooming-kit" },
    ],
  },
  {
    id: 17, name: "Construction", slug: "construction", icon: "HardHat", color: "bg-orange-100 text-orange-700",
    subcategories: [
      { name: "Mini Excavator", slug: "mini-excavator" }, { name: "Forklift", slug: "forklift" },
      { name: "Plate Compactor", slug: "plate-compactor" }, { name: "Road Roller", slug: "road-roller" },
      { name: "Scaffolding", slug: "construction-scaffolding" }, { name: "Earth Auger", slug: "earth-auger" },
      { name: "Cement Cutter", slug: "cement-cutter" },
    ],
  },
  {
    id: 18, name: "Agriculture", slug: "agriculture", icon: "Wheat", color: "bg-green-100 text-green-700",
    subcategories: [
      { name: "Tractor", slug: "tractor" }, { name: "Rotavator", slug: "rotavator" },
      { name: "Water Pump", slug: "water-pump" }, { name: "Sprayer", slug: "sprayer" },
      { name: "Seeder", slug: "seeder" }, { name: "Harvester", slug: "harvester" },
      { name: "Power Tiller", slug: "power-tiller" }, { name: "Grass Cutter", slug: "grass-cutter" },
    ],
  },
  {
    id: 19, name: "Art & Creative", slug: "art", icon: "Palette", color: "bg-fuchsia-100 text-fuchsia-600",
    subcategories: [
      { name: "Easel", slug: "easel" }, { name: "3D Printer", slug: "3d-printer" },
      { name: "Laser Cutter", slug: "laser-cutter" }, { name: "Cricut Machine", slug: "cricut" },
      { name: "Sewing Machine", slug: "sewing-machine" }, { name: "Embroidery Machine", slug: "embroidery-machine" },
      { name: "Pottery Wheel", slug: "pottery-wheel" },
    ],
  },
  {
    id: 20, name: "Miscellaneous", slug: "others", icon: "Package", color: "bg-gray-100 text-gray-600",
    subcategories: [
      { name: "Travel Luggage", slug: "travel-luggage" }, { name: "Storage Box", slug: "storage-box" },
      { name: "Safe / Locker", slug: "safe" }, { name: "Utility Cart", slug: "utility-cart" },
      { name: "Shopping Cart", slug: "shopping-cart" },
    ],
  },
];

export const STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana",
  "Gujarat", "Rajasthan", "West Bengal", "Uttar Pradesh", "Madhya Pradesh",
  "Kerala", "Punjab", "Haryana", "Bihar", "Andhra Pradesh", "Odisha",
  "Jharkhand", "Assam", "Uttarakhand", "Himachal Pradesh", "Goa", "Chhattisgarh"
];
