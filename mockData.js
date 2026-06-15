// Mock Product and Gift Bundle Database for Nelum (Kapruka)
const NELUM_PRODUCTS = [
  {
    id: "p1",
    title: "Kapruka Signature Black Forest Gateau",
    price: 4800,
    category: "cakes",
    image: "assets/images/cake.png",
    rating: 4.9,
    reviews: 142,
    badge: "Bestseller",
    deliveryEstimate: "Today (Within 3 Hours)",
    available: true,
    description: "A rich, chocolatey Sri Lankan favorite, layered with fresh whipped cream, sweet cherries, and chocolate shavings. Baked fresh in the Kapruka kitchens.",
    specs: ["Size: 2.2 lbs (1kg)", "Serves: 8-10 people", "Eggless options available"]
  },
  {
    id: "p2",
    title: "Eternal Romance Red Rose Bouquet",
    price: 6500,
    category: "flowers",
    image: "assets/images/roses.png",
    rating: 4.8,
    reviews: 98,
    badge: "Premium Fresh",
    deliveryEstimate: "Today (Same Day)",
    available: true,
    description: "Twelve freshly-cut long-stemmed red roses arranged elegantly with baby's breath and fresh greenery. Wrapped in premium matte paper.",
    specs: ["Qty: 12 Premium Roses", "Height: 50cm", "Includes hydration pack"]
  },
  {
    id: "p3",
    title: "Chocolates & Joy Luxury Gift Box",
    price: 3800,
    category: "chocolates",
    image: "assets/images/chocolates.png",
    rating: 4.7,
    reviews: 84,
    badge: "Popular Choice",
    deliveryEstimate: "Today (Same Day)",
    available: true,
    description: "A handpicked selection of premium imported chocolates, including Ferrero Rocher, Lindt Lindor, and Cadbury Dairy Milk Silk, beautifully presented.",
    specs: ["Weight: 450g", "Contains nuts", "Includes personalized greeting card"]
  },
  {
    id: "p4",
    title: "Tropical Harvest Fresh Fruit Basket",
    price: 5200,
    category: "groceries",
    image: "assets/images/fruit_basket.png",
    rating: 4.6,
    reviews: 51,
    badge: "Freshly Picked",
    deliveryEstimate: "Tomorrow (Next Day)",
    available: true,
    description: "A combination of local Sri Lankan tropical fruits, including red bananas, pineapple, papaya, mangoes, and imported grapes, beautifully packaged in a cane basket.",
    specs: ["Weight: Approx 4kg", "100% Organic", "Hand-woven cane basket"]
  },
  {
    id: "p5",
    title: "Sony PlayStation 5 Console (Slim)",
    price: 185000,
    category: "electronics",
    image: "assets/images/electronics.png",
    rating: 4.9,
    reviews: 19,
    badge: "Free Delivery",
    deliveryEstimate: "2-3 Days",
    available: true,
    description: "Experience lightning-fast loading with an ultra-high-speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio.",
    specs: ["Storage: 1TB SSD", "Model: Slim Edition", "Warranty: 1 Year Kapruka Warranty"]
  },
  {
    id: "p6",
    title: "White Lilies of Peace Bouquet",
    price: 7200,
    category: "flowers",
    image: "assets/images/lilies.png",
    rating: 4.7,
    reviews: 35,
    badge: "Elegant",
    deliveryEstimate: "Today (Same Day)",
    available: true,
    description: "A serene arrangement of fresh white lilies and eucalyptus leaves. Perfect for expressing deep sympathy, apologies, or pure respect.",
    specs: ["Qty: 6 large stems", "Vase life: 7-10 days", "Delivered in bud form for longevity"]
  },
  {
    id: "p7",
    title: "Ceylon Premium Tea Selection Box",
    price: 4500,
    category: "groceries",
    image: "assets/images/tea_box.png",
    rating: 4.9,
    reviews: 73,
    badge: "Souvenir Grade",
    deliveryEstimate: "Today (Same Day)",
    available: true,
    description: "An exquisite wooden presentation box containing 6 varieties of premium Single Origin Ceylon Tea, representing Sri Lanka's finest tea gardens.",
    specs: ["6 Varieties", "60 Individually Wrapped foil bags", "100% Pure Ceylon Tea"]
  },
  {
    id: "p8",
    title: "Kids Joy Deluxe Teddy Bear",
    price: 3200,
    category: "toys",
    image: "assets/images/teddy.png",
    rating: 4.8,
    reviews: 112,
    badge: "Soft & Cuddly",
    deliveryEstimate: "Today (Same Day)",
    available: true,
    description: "An ultra-soft, premium quality teddy bear in a classic cream color, wearing a red Kapruka satin bow. Safe for all ages.",
    specs: ["Height: 40cm", "Material: Hypoallergenic plush", "Washable"]
  }
];

const NELUM_BUNDLES = [
  {
    id: "b1",
    title: "Birthday Delight Surprise Bundle",
    price: 13500,
    originalPrice: 14500,
    category: "birthday",
    image: "assets/images/birthday_bundle.png",
    badge: "Most Loved Surprise",
    deliveryEstimate: "Today (Within 3 Hours)",
    items: [
      "Kapruka Signature Black Forest Gateau (2.2 lbs)",
      "Eternal Romance Red Rose Bouquet (12 Roses)",
      "Kids Joy Deluxe Teddy Bear (40cm)",
      "Premium Printed Birthday Greeting Card"
    ],
    description: "The ultimate birthday setup! Combines our bestselling cake, fresh red roses, a soft teddy, and a card to create an unforgettable moment for your loved ones."
  },
  {
    id: "b2",
    title: "Sincere Apologies Sympathy Set",
    price: 10500,
    originalPrice: 11000,
    category: "sorry",
    image: "assets/images/sorry_bundle.png",
    badge: "Empathetic Choice",
    deliveryEstimate: "Today (Same Day)",
    items: [
      "White Lilies of Peace Bouquet (6 stems)",
      "Chocolates & Joy Luxury Gift Box (450g)",
      "Elegant Handwritten Apology Card"
    ],
    description: "Say 'I'm sorry' with pure elegance. This set combines peaceful white lilies with comforting luxury chocolates and a handwritten card to deliver your message gently."
  },
  {
    id: "b3",
    title: "Golden Anniversary Celebration Bundle",
    price: 14200,
    originalPrice: 15500,
    category: "anniversary",
    image: "assets/images/anniversary_bundle.png",
    badge: "Anniversary Special",
    deliveryEstimate: "Today (Same Day)",
    items: [
      "Eternal Romance Red Rose Bouquet (12 Roses)",
      "Chocolates & Joy Luxury Gift Box (450g)",
      "Ceylon Premium Tea Selection Box",
      "Special Anniversary Greeting Card"
    ],
    description: "Perfect for celebrating milestones of love. Combines red roses, premium chocolates, and Ceylon tea, wrapped elegantly in gold accent packaging."
  }
];

const CONVERSATION_STARTERS = [
  { icon: "🎂", text: "Birthday Gift", context: "birthday" },
  { icon: "🌹", text: "Sorry Gift", context: "sorry" },
  { icon: "💝", text: "Anniversary", context: "anniversary" },
  { icon: "👩", text: "For Mom", context: "mom" },
  { icon: "👨", text: "For Dad", context: "dad" },
  { icon: "🎮", text: "Electronics", context: "electronics" },
  { icon: "🍫", text: "Chocolates", context: "chocolates" },
  { icon: "🛒", text: "Groceries", context: "groceries" },
  { icon: "💐", text: "Flowers", context: "flowers" }
];

const QUICK_ACTIONS = [
  { text: "Under Rs.5000", action: "price-5000" },
  { text: "Under Rs.10000", action: "price-10000" },
  { text: "Same Day Delivery", action: "delivery-sameday" },
  { text: "Best Sellers", action: "filter-bestseller" },
  { text: "Gifts for Wife", action: "context-wife" },
  { text: "Gifts for Mom", action: "context-mom" }
];
