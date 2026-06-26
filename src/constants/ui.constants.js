/**
 * Nelum AI UI Constants
 */
export const CONVERSATION_STARTERS = [
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

export const QUICK_ACTIONS = [
  { text: "Under Rs.5000", action: "price-5000" },
  { text: "Under Rs.10000", action: "price-10000" },
  { text: "Same Day Delivery", action: "delivery-sameday" },
  { text: "Best Sellers", action: "filter-bestseller" },
  { text: "Gifts for Wife", action: "context-wife" },
  { text: "Gifts for Mom", action: "context-mom" }
];

export const CATEGORY_QUERIES = {
  cakes: "cake",
  flowers: "flower",
  chocolates: "chocolate",
  groceries: "tea",
  grocery: "tea",
  electronics: "electronic",
  toys: "toy",
  clothing: "shirt",
  fashion: "handbag",
  food: "food",
  fruit_baskets: "basket",
  gift_packs: "pack"
};

export const CATEGORY_REPLIES = {
  cakes: "Looking for cakes? 🍰\n\nIs this for:\n• Birthday\n• Anniversary\n• Celebration\n• Office Party\n\nLet me help you choose the best flavor!",
  flowers: "Looking for flowers? 🌹\n\nIs this for:\n• Birthday\n• Anniversary\n• Apology\n• Just Because\n\nLet me help you choose.",
  chocolates: "Craving or gifting chocolates? 🍫\n\nWould you like:\n• Premium Imports (Ferrero, Toblerone)\n• Local Handcrafted\n• Assorted Gift Boxes\n\nLet know your preference!",
  clothing: "Searching for clothing? 👕\n\nWho is this for:\n• Men\n• Women\n• Kids\n\nLet's find the perfect fit and style!",
  electronics: "Need some electronics? 🎮\n\nWhat are you looking for:\n• Gaming & Consoles\n• Audio & Headphones\n• Smart Accessories\n\nLet's find the right tech for you!",
  food: "Hungry? 🍔\n\nAre you interested in:\n• Fast Food & Burgers\n• Traditional Sri Lankan\n• Desserts & Treats\n\nI can recommend the tastiest options!",
  grocery: "Stocking up on groceries? 🛒\n\nWhich department:\n• Ceylon Tea & Beverages\n• Pantry Staples\n• Fresh Produce\n\nLet's add these essentials to your list!",
  toys: "Shopping for toys? 🧸\n\nWhat age group:\n• Toddlers (0-3 years)\n• Kids (4-8 years)\n• Teens (9+ years)\n\nLet's find something fun!",
  fashion: "Looking for fashion accessories? 👗\n\nWhat are we styling today:\n• Handbags & Wallets\n• Jewelry & Watches\n• Perfumes & Cosmetics\n\nLet's pick something elegant!",
  fruit_baskets: "Want a healthy fruit basket? 🧺\n\nWho is this surprise for:\n• Get Well Soon\n• Congratulations\n• Family Sharing\n\nLet's select a fresh, premium assortment!",
  gift_packs: "Sending a curated gift pack? 🎁\n\nWhat's the vibe:\n• Luxury Pampering\n• Tea Connoisseur\n• Sweet & Savory Mix\n\nLet's find a pre-packaged box of joy!"
};

export const TIME_LABELS = {
  any: "Anytime (8 AM - 6 PM)",
  morning: "Morning (8 AM - 12 PM)",
  afternoon: "Afternoon (12 PM - 4 PM)",
  evening: "Evening (4 PM - 8 PM)"
};

export default {
  CONVERSATION_STARTERS,
  QUICK_ACTIONS,
  CATEGORY_QUERIES,
  CATEGORY_REPLIES,
  TIME_LABELS
};
