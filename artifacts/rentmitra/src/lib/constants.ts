export interface SubCategory {
  name: string;
  slug: string;
}

export interface CategoryDef {
  id: number;
  name: string;
  slug: string;
  icon: string;
  image: string;       // Path to 3D icon PNG in /public/icons/categories/
  color: string;       // Tailwind bg class for the icon circle (fallback)
  subcategories: SubCategory[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 1, name: "Accommodation Rentals", slug: "accommodation", icon: "Building2", image: "/icons/categories/accommodation.png", color: "bg-sky-100 text-sky-600",
    subcategories: [
      { name: "1BHK Flat", slug: "1bhk-flat" },
      { name: "2BHK Flat", slug: "2bhk-flat" },
      { name: "3BHK Flat", slug: "3bhk-flat" },
      { name: "Studio Apartment", slug: "studio-apartment" },
      { name: "Independent House", slug: "independent-house" },
      { name: "Villa / Bungalow", slug: "villa-bungalow" },
      { name: "Farmhouse", slug: "farmhouse" },
      { name: "Furnished Room", slug: "furnished-room" },
      { name: "PG / Hostel Room", slug: "pg-hostel" },
      { name: "Serviced Apartment", slug: "serviced-apartment" },
    ],
  },
  {
    id: 2, name: "Agriculture", slug: "agriculture", icon: "Wheat", image: "/icons/categories/agriculture.png", color: "bg-green-100 text-green-700",
    subcategories: [
      { name: "Tractor", slug: "tractor" }, { name: "Rotavator", slug: "rotavator" },
      { name: "Water Pump", slug: "water-pump" }, { name: "Sprayer", slug: "sprayer" },
      { name: "Seeder", slug: "seeder" }, { name: "Harvester", slug: "harvester" },
      { name: "Power Tiller", slug: "power-tiller" }, { name: "Grass Cutter", slug: "grass-cutter" },
    ],
  },
  {
    id: 3, name: "Apparel & Fashion", slug: "apparel", icon: "Shirt", image: "/icons/categories/apparel.png", color: "bg-rose-100 text-rose-600",
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
    id: 4, name: "Art & Creative", slug: "art", icon: "Palette", image: "/icons/categories/art.png", color: "bg-fuchsia-100 text-fuchsia-600",
    subcategories: [
      { name: "Easel", slug: "easel" }, { name: "3D Printer", slug: "3d-printer" },
      { name: "Laser Cutter", slug: "laser-cutter" }, { name: "Cricut Machine", slug: "cricut" },
      { name: "Sewing Machine", slug: "sewing-machine" }, { name: "Embroidery Machine", slug: "embroidery-machine" },
      { name: "Pottery Wheel", slug: "pottery-wheel" },
    ],
  },
  {
    id: 5, name: "Automotive", slug: "automotive", icon: "Car", image: "/icons/categories/automotive.png", color: "bg-slate-100 text-slate-600",
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
    id: 6, name: "Baby Products", slug: "baby", icon: "Baby", image: "/icons/categories/baby.png", color: "bg-pink-100 text-pink-600",
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
    id: 7, name: "Camping & Outdoor", slug: "camping", icon: "Tent", image: "/icons/categories/camping.png", color: "bg-emerald-100 text-emerald-600",
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
    id: 8, name: "Construction", slug: "construction", icon: "HardHat", image: "/icons/categories/construction.png", color: "bg-orange-100 text-orange-700",
    subcategories: [
      { name: "Mini Excavator", slug: "mini-excavator" }, { name: "Forklift", slug: "forklift" },
      { name: "Plate Compactor", slug: "plate-compactor" }, { name: "Road Roller", slug: "road-roller" },
      { name: "Scaffolding", slug: "construction-scaffolding" }, { name: "Earth Auger", slug: "earth-auger" },
      { name: "Cement Cutter", slug: "cement-cutter" },
    ],
  },
  {
    id: 9, name: "Education & Learning", slug: "education", icon: "BookOpen", image: "/icons/categories/education.png", color: "bg-cyan-100 text-cyan-600",
    subcategories: [
      // Equipment
      { name: "Laptop / Notebook", slug: "edu-laptop" },
      { name: "Tablet / iPad", slug: "edu-tablet" },
      { name: "Projector", slug: "edu-projector" },
      { name: "Drawing Board", slug: "drawing-board" },
      { name: "Microscope", slug: "microscope" },
      { name: "Lab Equipment", slug: "lab-equipment" },
      { name: "Exam Prep Kit", slug: "exam-prep-kit" },
      // Books — Academic
      { name: "School Textbooks", slug: "school-textbooks" },
      { name: "College Textbooks", slug: "college-textbooks" },
      { name: "Engineering Books", slug: "engineering-books" },
      { name: "Medical Books", slug: "medical-books" },
      { name: "Law Books", slug: "law-books" },
      { name: "MBA & Management", slug: "mba-management-books" },
      { name: "CA / CS / CMA", slug: "ca-cs-cma-books" },
      { name: "UPSC Books", slug: "upsc-books" },
      { name: "IIT-JEE Books", slug: "iit-jee-books" },
      { name: "NEET Books", slug: "neet-books" },
      { name: "GATE Books", slug: "gate-books" },
      { name: "Banking / SSC Books", slug: "banking-ssc-books" },
      { name: "Railway Exam Books", slug: "railway-exam-books" },
      { name: "State PSC Books", slug: "state-psc-books" },
      { name: "Competitive Exam Books", slug: "competitive-exam-books" },
      // Books — Professional
      { name: "IT & Programming", slug: "it-programming-books" },
      { name: "Finance & Accounting", slug: "finance-accounting-books" },
      { name: "Marketing Books", slug: "marketing-books" },
      { name: "Architecture & Design", slug: "architecture-design-books" },
      { name: "Language Learning", slug: "language-learning-books" },
    ],
  },
  {
    id: 10, name: "Electronics", slug: "electronics", icon: "Laptop", image: "/icons/categories/electronics.png", color: "bg-sky-100 text-sky-600",
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
    id: 11, name: "Furniture", slug: "furniture", icon: "Armchair", image: "/icons/categories/furniture.png", color: "bg-amber-100 text-amber-600",
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
    id: 12, name: "Gaming", slug: "gaming", icon: "Gamepad2", image: "/icons/categories/gaming.png", color: "bg-indigo-100 text-indigo-600",
    subcategories: [
      { name: "PlayStation", slug: "playstation" }, { name: "Xbox", slug: "xbox" },
      { name: "Nintendo Switch", slug: "nintendo-switch" }, { name: "Gaming Laptop", slug: "gaming-laptop" },
      { name: "Gaming PC", slug: "gaming-pc" }, { name: "VR Headset", slug: "vr-headset" },
      { name: "Racing Simulator", slug: "racing-simulator" }, { name: "Gaming Chair", slug: "gaming-chair" },
      { name: "Gaming Monitor", slug: "gaming-monitor" },
    ],
  },
  {
    id: 13, name: "Home Appliances", slug: "home-appliances", icon: "Home", image: "/icons/categories/home-appliances.png", color: "bg-teal-100 text-teal-600",
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
    id: 14, name: "Medical Equipment", slug: "medical", icon: "HeartPulse", image: "/icons/categories/medical.png", color: "bg-red-100 text-red-600",
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
    id: 15, name: "Miscellaneous", slug: "others", icon: "Package", image: "/icons/categories/others.png", color: "bg-gray-100 text-gray-600",
    subcategories: [
      { name: "Travel Luggage", slug: "travel-luggage" }, { name: "Storage Box", slug: "storage-box" },
      { name: "Safe / Locker", slug: "safe" }, { name: "Utility Cart", slug: "utility-cart" },
      { name: "Shopping Cart", slug: "shopping-cart" },
    ],
  },
  {
    id: 16, name: "Musical Instruments", slug: "music", icon: "Music", image: "/icons/categories/music.png", color: "bg-purple-100 text-purple-600",
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
    id: 17, name: "Party & Events", slug: "party", icon: "PartyPopper", image: "/icons/categories/party.png", color: "bg-yellow-100 text-yellow-600",
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
    id: 18, name: "Pet Supplies", slug: "pets", icon: "PawPrint", image: "/icons/categories/pets.png", color: "bg-lime-100 text-lime-600",
    subcategories: [
      { name: "Pet Carrier", slug: "pet-carrier" }, { name: "Pet Cage", slug: "pet-cage" },
      { name: "Aquarium", slug: "aquarium" }, { name: "Dog Crate", slug: "dog-crate" },
      { name: "Pet Stroller", slug: "pet-stroller" }, { name: "Grooming Kit", slug: "grooming-kit" },
    ],
  },
  {
    id: 19, name: "Photography & Video", slug: "photography", icon: "Camera", image: "/icons/categories/photography.png", color: "bg-violet-100 text-violet-600",
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
    id: 20, name: "Sports & Fitness", slug: "fitness", icon: "Dumbbell", image: "/icons/categories/fitness.png", color: "bg-blue-100 text-blue-600",
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
    id: 21, name: "Tools & Hardware", slug: "tools", icon: "Wrench", image: "/icons/categories/tools.png", color: "bg-orange-100 text-orange-600",
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
];

export const STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana",
  "Gujarat", "Rajasthan", "West Bengal", "Uttar Pradesh", "Madhya Pradesh",
  "Kerala", "Punjab", "Haryana", "Bihar", "Andhra Pradesh", "Odisha",
  "Jharkhand", "Assam", "Uttarakhand", "Himachal Pradesh", "Goa", "Chhattisgarh"
];

/** Comprehensive city list per state, sorted alphabetically within each state */
export const CITIES_BY_STATE: Record<string, string[]> = {
  "Maharashtra": [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Baramati", "Bhiwandi",
    "Chandrapur", "Dhule", "Ichalkaranji", "Jalgaon", "Jalna", "Kalyan",
    "Kolhapur", "Latur", "Mumbai", "Nagpur", "Nanded", "Nashik", "Navi Mumbai",
    "Pandharpur", "Parbhani", "Pimpri-Chinchwad", "Pune", "Sangli", "Satara",
    "Solapur", "Thane", "Ulhasnagar", "Vasai-Virar", "Yavatmal",
  ],
  "Delhi": [
    "Burari", "Dilshad Garden", "Dwarka", "Janakpuri", "Karol Bagh",
    "Lajpat Nagar", "Mayur Vihar", "New Delhi", "Pitampura", "Rohini",
    "Saket", "Sarita Vihar", "Shahdara", "Vasant Kunj",
  ],
  "Karnataka": [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru (Bangalore)", "Bidar",
    "Chikkamagaluru", "Chitradurga", "Davangere", "Dharwad", "Gadag",
    "Gulbarga (Kalaburagi)", "Hassan", "Hubli", "Mangaluru", "Mandya",
    "Mysuru (Mysore)", "Raichur", "Shivamogga (Shimoga)", "Tumkur", "Udupi",
    "Vijayapura",
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Hosur",
    "Kanchipuram", "Karur", "Madurai", "Nagercoil", "Pudukkottai", "Salem",
    "Sivakasi", "Thanjavur", "Tirunelveli", "Tiruppur", "Tiruchirappalli (Trichy)",
    "Tiruvallur", "Tuticorin (Thoothukudi)", "Vellore",
  ],
  "Telangana": [
    "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar", "Nalgonda",
    "Nizamabad", "Ramagundam", "Sangareddy", "Secunderabad", "Siddipet",
    "Suryapet", "Warangal", "Zahirabad",
  ],
  "Gujarat": [
    "Ahmedabad", "Amreli", "Anand", "Ankleshwar", "Bharuch", "Bhavnagar",
    "Bhuj", "Gandhinagar", "Godhra", "Jamnagar", "Junagadh", "Mehsana",
    "Morbi", "Nadiad", "Navsari", "Palanpur", "Porbandar", "Rajkot",
    "Surat", "Surendranagar", "Vadodara", "Valsad", "Vapi",
  ],
  "Rajasthan": [
    "Ajmer", "Alwar", "Banswara", "Barmer", "Bharatpur", "Bhilwara",
    "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur",
    "Hanumangarh", "Jaipur", "Jaisalmer", "Jhalawar", "Jhunjhunu",
    "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Sawai Madhopur",
    "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur",
  ],
  "West Bengal": [
    "Asansol", "Baharampur", "Bardhaman", "Cooch Behar", "Durgapur",
    "Haldia", "Howrah", "Jalpaiguri", "Kharagpur", "Kolkata", "Krishnanagar",
    "Malda", "Medinipur", "Raiganj", "Siliguri",
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Allahabad (Prayagraj)", "Ayodhya", "Azamgarh",
    "Bahraich", "Bareilly", "Bijnor", "Bulandshahr", "Etah", "Etawah",
    "Farrukhabad", "Fatehpur", "Firozabad", "Ghaziabad", "Gonda",
    "Gorakhpur", "Hardoi", "Jaunpur", "Jhansi", "Kanpur", "Lakhimpur Kheri",
    "Lucknow", "Mathura", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar",
    "Noida", "Rampur", "Saharanpur", "Shahjahanpur", "Sitapur",
    "Unnao", "Varanasi",
  ],
  "Madhya Pradesh": [
    "Balaghat", "Betul", "Bhopal", "Chhatarpur", "Chhindwara",
    "Damoh", "Datia", "Dewas", "Dhar", "Gwalior", "Hoshangabad",
    "Indore", "Jabalpur", "Katni", "Khandwa", "Khargone", "Morena",
    "Narsinghpur", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore",
    "Shivpuri", "Singrauli", "Ujjain", "Vidisha",
  ],
  "Kerala": [
    "Alappuzha (Alleppey)", "Idukki", "Kannur", "Kasaragod", "Kochi (Cochin)",
    "Kollam", "Kottayam", "Kozhikode (Calicut)", "Malappuram", "Palakkad",
    "Pathanamthitta", "Thrissur", "Thiruvananthapuram (Trivandrum)",
    "Thrissur", "Wayanad",
  ],
  "Punjab": [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
    "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
    "Kapurthala", "Ludhiana", "Mansa", "Moga", "Mohali (SAS Nagar)",
    "Muktsar", "Nawanshahr", "Patiala", "Ropar", "Rupnagar", "Sangrur",
    "Tarn Taran",
  ],
  "Haryana": [
    "Ambala", "Bahadurgarh", "Bhiwani", "Faridabad", "Fatehabad",
    "Gurugram (Gurgaon)", "Hisar", "Jhajjar", "Jind", "Kaithal",
    "Karnal", "Kurukshetra", "Mahendragarh", "Manesar", "Nuh",
    "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak",
    "Sirsa", "Sonipat", "Yamunanagar",
  ],
  "Bihar": [
    "Araria", "Arrah (Bhojpur)", "Aurangabad", "Begusarai", "Bhagalpur",
    "Bihar Sharif", "Buxar", "Darbhanga", "Gaya", "Gopalganj",
    "Hajipur", "Katihar", "Kishanganj", "Madhepura", "Madhubani",
    "Munger", "Muzaffarpur", "Patna", "Purnia", "Samastipur",
    "Sasaram", "Siwan", "Vaishali",
  ],
  "Andhra Pradesh": [
    "Anantapur", "Chittoor", "Eluru", "Guntur", "Kadapa", "Kakinada",
    "Kurnool", "Machilipatnam", "Nandyal", "Nellore", "Ongole",
    "Rajahmundry", "Srikakulam", "Tirupati", "Vijayawada",
    "Visakhapatnam (Vizag)", "Vizianagaram",
  ],
  "Odisha": [
    "Angul", "Balasore", "Bargarh", "Berhampur (Brahmapur)", "Bhubaneswar",
    "Cuttack", "Jharsuguda", "Kendujhar", "Puri", "Rairangpur",
    "Rourkela", "Sambalpur", "Sundargarh",
  ],
  "Jharkhand": [
    "Bokaro", "Chaibasa", "Deoghar", "Dhanbad", "Dumka",
    "Giridih", "Hazaribagh", "Jamshedpur", "Khunti", "Lohardaga",
    "Medininagar (Daltonganj)", "Phusro", "Ramgarh", "Ranchi", "Simdega",
  ],
  "Assam": [
    "Barpeta", "Bongaigaon", "Dhemaji", "Dhubri", "Dibrugarh",
    "Diphu", "Goalpara", "Golaghat", "Guwahati", "Hojai",
    "Jorhat", "Karimganj", "Lakhimpur", "Nagaon", "Nalbari",
    "Sibsagar", "Silchar", "Tezpur", "Tinsukia",
  ],
  "Uttarakhand": [
    "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar",
    "Haldwani", "Kashipur", "Mussoorie", "Nainital", "Pauri",
    "Pithoragarh", "Rishikesh", "Roorkee", "Rudrapur", "Srinagar (Garhwal)",
    "Tehri", "Udham Singh Nagar", "Uttarkashi",
  ],
  "Himachal Pradesh": [
    "Baddi", "Bilaspur", "Chamba", "Dharamsala (Dharamshala)", "Hamirpur",
    "Kangra", "Kullu", "Manali", "Mandi", "Nahan",
    "Palampur", "Shimla", "Solan", "Una",
  ],
  "Goa": [
    "Calangute", "Canacona", "Mapusa", "Margao", "Mormugao (Vasco da Gama)",
    "Panaji", "Ponda", "Quepem", "Sanquelim", "Valpoi",
  ],
  "Chhattisgarh": [
    "Ambikapur", "Bhilai", "Bilaspur", "Chhatarpur", "Dhamtari",
    "Durg", "Jagdalpur", "Janjgir", "Kanker", "Kawardha",
    "Korba", "Koriya", "Mahasamund", "Rajnandgaon", "Raigarh",
    "Raipur", "Sakti",
  ],
};
