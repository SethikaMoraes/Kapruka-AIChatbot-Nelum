// ==========================================================================
// NELUM BY KAPRUKA - INTERACTIVE APPLICATION CONTROLLER
// ==========================================================================

import { ConversationManager } from './src/runtime/conversationManager.js';
import { memoryStore } from './src/memory/memoryStore.js';
import { intentDetector } from './src/agents/intentDetector.js';
import { agentOrchestrator } from './src/agents/agentOrchestrator.js';
import { eventBus } from './src/utils/eventBus.js';
import { kaprukaClient } from './src/mcp/kaprukaClient.js';
import { preferenceEngine } from './src/memory/preferenceEngine.js';
import { habitLearningEngine } from './src/memory/habitLearningEngine.js';
import { voiceController } from './src/voice/voiceController.js';

document.addEventListener("DOMContentLoaded", () => {
  // --- Instantiate Conversation Manager ---
  const manager = new ConversationManager(memoryStore, intentDetector, agentOrchestrator);

  // Static configurations for Nelum Assistant UI
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

  // Initialize session context
  manager.processMessage('default-session', 'init_welcome');

  // --- State Variables ---
  let cart = [];
  let currentCategory = "all";
  let activeOrder = null;
  let voiceTimer = null;
  let trackingInterval = null;
  let activeTrackingStep = 1;

  // --- DOM Elements ---
  const startersGrid = document.getElementById("starters-grid");
  const quickChipsContainer = document.getElementById("quick-chips");
  
  const chatHero = document.getElementById("chat-hero");
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chatInput");
  const btnSend = document.getElementById("sendBtn");
  const btnVoice = document.getElementById("btn-voice");
  const btnVoiceCancel = document.getElementById("btn-voice-cancel");
  const voiceWave = document.getElementById("voice-wave");
  const btnAttach = document.getElementById("btn-attach");
  const typingIndicator = document.getElementById("typing-indicator");
  
  // Cart elements
  const btnCartToggle = document.getElementById("btn-cart-toggle");
  const cartDrawer = document.getElementById("cart-drawer");
  const btnCloseCart = document.getElementById("btn-close-cart");
  const cartEmpty = document.getElementById("cart-empty");
  const cartActive = document.getElementById("cart-active");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartTotal = document.getElementById("cart-total");
  const cartCountBadge = document.getElementById("cart-count");
  const mobileCartCountBadge = document.getElementById("mobile-cart-count");
  const giftMessageInput = document.getElementById("gift-message");
  const btnCartShop = document.getElementById("btn-cart-shop");
  
  // Detail elements
  const productDetailModal = document.getElementById("product-detail-modal");
  const btnCloseProduct = document.getElementById("btn-close-product");
  const detailImage = document.getElementById("detail-image");
  const detailTitle = document.getElementById("detail-title");
  const detailBadge = document.getElementById("detail-badge");
  const detailReviews = document.getElementById("detail-reviews");
  const detailPrice = document.getElementById("detail-price");
  const detailDesc = document.getElementById("detail-desc");
  const detailSpecs = document.getElementById("detail-specs");
  const detailDelivery = document.getElementById("detail-delivery");
  const btnDetailAdd = document.getElementById("btn-detail-add");
  const btnDetailSave = document.getElementById("btn-detail-save");
  
  const thumb1 = document.getElementById("thumb-1");
  const thumb2 = document.getElementById("thumb-2");
  const thumb3 = document.getElementById("thumb-3");

  // Delivery info elements
  const deliveryModal = document.getElementById("delivery-modal");
  const btnCloseDelivery = document.getElementById("btn-close-delivery");
  const btnContinueDelivery = document.getElementById("btn-continue-delivery");
  const btnReviewGifts = document.getElementById("btn-review-gifts");
  const deliveryForm = document.getElementById("delivery-form");
  const deliverySummaryItems = document.getElementById("delivery-summary-items");
  const deliveryCardPreview = document.getElementById("delivery-card-preview");
  const previewTextContent = document.getElementById("preview-text-content");
  
  // Order tracking elements
  const trackingModal = document.getElementById("tracking-modal");
  const btnCloseTracking = document.getElementById("btn-close-tracking");
  const btnTrackChat = document.getElementById("btn-track-chat");
  const timelineSteps = document.querySelectorAll(".timeline-step");
  
  // Mobile Nav items
  const navChat = document.getElementById("nav-chat");
  const navDiscover = document.getElementById("nav-discover");
  const navCart = document.getElementById("nav-cart");
  const navOrders = document.getElementById("nav-orders");

  // --- Loading Screen Handler ---
  function runLoadingScreen(appInitPromise) {
    const loader = document.getElementById("loading-screen");
    const video = document.getElementById("loading-video");
    const fill = document.getElementById("loading-progress-fill");
    
    if (!loader) return;

    let progress = 0;
    let isAppReady = false;
    let minimumTimeElapsed = false;
    const startTime = Date.now();
    const minDuration = 4000; // Minimum 4 seconds

    // Video play/error detection
    if (video) {
      video.addEventListener("playing", () => {
        video.classList.add("video-playing");
      });
      
      video.addEventListener("error", () => {
        console.warn("Loading video failed to load, falling back to brand gradient.");
        video.style.display = "none";
      });

      // Try playing manually in case autoplay needs a push
      video.play().catch(err => {
        console.warn("Video autoplay blocked or failed:", err);
      });

      // Autoplay fallback timer: if not playing in 1.5s, hide video and use gradient
      setTimeout(() => {
        if (video.readyState < 3) {
          console.warn("Video load timeout, falling back to brand gradient.");
          video.style.display = "none";
        }
      }, 1500);
    }

    // Set up progress bar interval
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (!isAppReady || !minimumTimeElapsed) {
        const targetProgress = Math.min(90, (elapsed / minDuration) * 90);
        progress = Math.max(progress, targetProgress);
      } else {
        progress += (100 - progress) * 0.2;
        if (progress >= 99.5) {
          progress = 100;
          clearInterval(progressInterval);
          finishLoading();
        }
      }
      
      if (fill) {
        fill.style.width = `${progress}%`;
        fill.setAttribute("aria-valuenow", Math.round(progress));
      }
    }, 50);

    // Timeout for minimum 3 seconds
    setTimeout(() => {
      minimumTimeElapsed = true;
      checkCompletion();
    }, minDuration);

    appInitPromise.then(() => {
      isAppReady = true;
      checkCompletion();
    }).catch(err => {
      console.error("App init failed but continuing loading flow:", err);
      isAppReady = true;
      checkCompletion();
    });

    function checkCompletion() {
      if (minimumTimeElapsed && isAppReady) {
        // Let the interval code accelerate the bar to 100% and trigger finishLoading
      }
    }

    function finishLoading() {
      loader.classList.add("fade-out");
      loader.addEventListener("transitionend", (e) => {
        if (e.propertyName === "opacity") {
          loader.remove();
        }
      });
      
      setTimeout(() => {
        if (loader.parentNode) {
          loader.remove();
        }
      }, 1000);
    }
  }

  // --- Initializers ---
  async function init() {
    loadRemindersAndRender();
    renderQuickChips();
    
    setupEventListeners();
    
    // Initialize Voice Subsytem
    voiceController.initialize(manager, chatInput, sendTextMessage);
    
    // Sync live transcript to chat-input field
    eventBus.on('voice:transcript', payload => {
      const chatInput = document.getElementById('chatInput');
      if (!chatInput) return;
      chatInput.value = payload.text;
      chatInput.dispatchEvent(new Event('input'));
    });
    
    // Set default date in delivery form to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("delivery-date").value = tomorrow.toISOString().split("T")[0];
    
    // Subscribe to State transition logging
    eventBus.subscribe('state_transition', (event) => {
      console.log(`[EventBus Notification] User transitioned states:`, event);
    });
  }

  function generateDynamicBundles(liveProducts) {
    const cakes = liveProducts.filter(p => p.category === 'cakes' || p.id.toLowerCase().startsWith('cake'));
    const flowers = liveProducts.filter(p => p.category === 'flowers' || p.id.toLowerCase().startsWith('flower') || p.id.toLowerCase().startsWith('ef_pc_flow'));
    
    const bundles = [];
    
    if (cakes.length > 0 && flowers.length > 0) {
      const cake = cakes[0];
      const flower = flowers[0];
      
      const b1Price = Math.round((cake.price + flower.price) * 0.9);
      bundles.push({
        id: "b1",
        title: "Birthday Delight Surprise Bundle",
        price: b1Price,
        originalPrice: cake.price + flower.price,
        category: "birthday",
        image: "assets/images/birthday_bundle.png",
        badge: "Most Loved Surprise",
        deliveryEstimate: "Today (Within 3 Hours)",
        items: [
          `${cake.title}`,
          `${flower.title}`,
          "Premium Printed Birthday Greeting Card"
        ],
        description: `The ultimate birthday setup! Combines our bestselling fresh ${cake.title} with the elegant ${flower.title} and a customized card.`
      });
      
      const b2Price = Math.round(flower.price * 1.15);
      bundles.push({
        id: "b2",
        title: "Sincere Apologies Sympathy Set",
        price: b2Price,
        originalPrice: Math.round(flower.price * 1.25),
        category: "sorry",
        image: "assets/images/sorry_bundle.png",
        badge: "Empathetic Choice",
        deliveryEstimate: "Today (Same Day)",
        items: [
          `${flower.title}`,
          "Chocolates & Joy Gift Box",
          "Elegant Handwritten Apology Card"
        ],
        description: `Say 'I'm sorry' with pure elegance. Combines the beautiful ${flower.title} with comforting chocolates and a handwritten card.`
      });
    } else {
      const items = liveProducts.slice(0, 2);
      if (items.length >= 2) {
        const item1 = items[0];
        const item2 = items[1];
        const bPrice = Math.round((item1.price + item2.price) * 0.9);
        bundles.push({
          id: "b1",
          title: "Nelum Celebration Surprise Bundle",
          price: bPrice,
          originalPrice: item1.price + item2.price,
          category: "birthday",
          image: "assets/images/birthday_bundle.png",
          badge: "Curated Bundle",
          deliveryEstimate: "Today (Same Day)",
          items: [
            `${item1.title}`,
            `${item2.title}`,
            "Special Occasion Greeting Card"
          ],
          description: `A custom curated combination featuring ${item1.title} and ${item2.title}.`
        });
      }
    }
    
    window.NELUM_CURRENT_BUNDLES = bundles;
    return bundles;
  }

  // --- Renderer Functions ---
  function renderStarters() {
    startersGrid.innerHTML = CONVERSATION_STARTERS.map(starter => `
      <button class="starter-btn" data-context="${starter.context}">
        <span class="starter-icon">${starter.icon}</span>
        <span>${starter.text}</span>
      </button>
    `).join("");
  }

  async function loadRemindersAndRender() {
    try {
      const profile = await memoryStore.loadUserProfile('default-user');
      const today = '2026-06-17'; // Anchor to current time context
      const reminders = preferenceEngine.checkUpcomingOccasions(profile, today);
      
      if (reminders.length > 0) {
        const reminder = reminders[0];
        console.log(`[Nelum Memory] Detected upcoming occasion:`, reminder);
        
        // Customize the hero subtitle
        const daysText = reminder.daysRemaining === 0 ? "today" : `in ${reminder.daysRemaining} days`;
        chatHero.querySelector(".hero-subtitle").innerHTML = 
          `Ayubowan! 🌸 **${reminder.recipient}**'s birthday is ${daysText} (${profile.frequentRecipients.find(r => r.name === reminder.recipient)?.birthday || ''}). Should I help you schedule a surprise for them?`;
        
        // Add a specialized starter at the beginning
        const updatedStarters = [
          { icon: "🎂", text: `Surprise ${reminder.recipient}`, context: `schedule-reminder:${reminder.recipient}` },
          ...CONVERSATION_STARTERS.filter(s => s.context !== 'birthday')
        ];
        
        startersGrid.innerHTML = updatedStarters.map(starter => `
          <button class="starter-btn" data-context="${starter.context}">
            <span class="starter-icon">${starter.icon}</span>
            <span>${starter.text}</span>
          </button>
        `).join("");
      } else {
        renderStarters();
      }
    } catch (e) {
      console.error("Error loading user profile or reminders:", e);
      renderStarters();
    }
  }

  function renderQuickChips() {
    quickChipsContainer.innerHTML = QUICK_ACTIONS.map(chip => `
      <button class="chip-btn" data-action="${chip.action}">
        ${chip.text}
      </button>
    `).join("");
  }

  // --- Conversational Helpers & Inline Catalog Fetching ---
  async function fetchAndAddNelumMessage(replyText, context) {
    const showProducts = ['RECOMMENDATION', 'COMPARISON', 'PRODUCT_SEARCH'].includes(context?.activeState);
    if (!showProducts) {
      addMessageBubble(replyText, "nelum");
      return;
    }

    if (context?.recommendedProducts && context.recommendedProducts.length > 0) {
      const displayProducts = context.recommendedProducts.slice(0, 6);
      const dynamicBundles = generateDynamicBundles(displayProducts);
      addMessageBubble(replyText, "nelum", displayProducts, dynamicBundles);
      return;
    }

    let category = "all";
    if (context && context.extractedEntities && context.extractedEntities.category) {
      category = context.extractedEntities.category;
    } else if (context && context.activeState === 'PRODUCT_SEARCH') {
      category = "all";
    }

    let searchWord = "cake";
    let isRushOnly = false;
    let isSaleOnly = false;
    let maxPrice = (context && context.extractedEntities && context.extractedEntities.budget) || null;

    if (category === "all") {
      searchWord = "cake";
    } else if (category === "birthday") {
      searchWord = "cake";
    } else if (category === "sorry") {
      searchWord = "flower";
    } else if (category === "anniversary") {
      searchWord = "flower";
    } else if (category === "mom") {
      searchWord = "flower";
    } else if (category === "dad") {
      searchWord = "tea";
    } else {
      const categoryQueries = {
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
      searchWord = categoryQueries[category] || category;
    }

    if (context && context.extractedEntities && context.extractedEntities.deliveryMode === 'same-day') {
      isRushOnly = true;
    }

    try {
      let liveProducts = [];
      if (category === "all") {
        const [cakes, flowers] = await Promise.all([
          kaprukaClient.searchProducts("cake"),
          kaprukaClient.searchProducts("flower")
        ]);
        liveProducts = [...cakes.slice(0, 3), ...flowers.slice(0, 3)];
      } else {
        liveProducts = await kaprukaClient.searchProducts(searchWord, null, maxPrice);
      }

      if (isRushOnly) {
        liveProducts = liveProducts.filter(p => p.deliveryEstimate.toLowerCase().includes("today") || p.deliveryEstimate.toLowerCase().includes("same day"));
      }

      const displayProducts = liveProducts.slice(0, 6);
      const dynamicBundles = generateDynamicBundles(liveProducts);

      addMessageBubble(replyText, "nelum", displayProducts, dynamicBundles);
    } catch (err) {
      console.error("Error loading inline products:", err);
      addMessageBubble(replyText, "nelum");
    }
  }

  async function handleCategoryClick(categoryKey, label) {
    chatHero.style.display = "none";
    chatMessages.style.display = "flex";

    addMessageBubble(`I want to explore ${label}`, "user");
    showTypingIndicator(true);

    const customReplies = {
      cakes: "Looking for cakes? 🍰\n\nIs this for:\n• Birthday\n• Anniversary\n• Celebration\n• Office Party\n\nLet me help you choose the best flavor!",
      flowers: "Looking for flowers? 🌹\n\nIs this for:\n• Birthday\n• Anniversary\n• Apology\n• Just Because\n\nLet me help you choose.",
      chocolates: "Craving or gifting chocolates? 🍫\n\nWould you like:\n• Premium Imports (Ferrero, Toblerone)\n• Local Handcrafted\n• Assorted Gift Boxes\n\nLet me know your preference!",
      clothing: "Searching for clothing? 👕\n\nWho is this for:\n• Men\n• Women\n• Kids\n\nLet's find the perfect fit and style!",
      electronics: "Need some electronics? 🎮\n\nWhat are you looking for:\n• Gaming & Consoles\n• Audio & Headphones\n• Smart Accessories\n\nLet's find the right tech for you!",
      food: "Hungry? 🍔\n\nAre you interested in:\n• Fast Food & Burgers\n• Traditional Sri Lankan\n• Desserts & Treats\n\nI can recommend the tastiest options!",
      grocery: "Stocking up on groceries? 🛒\n\nWhich department:\n• Ceylon Tea & Beverages\n• Pantry Staples\n• Fresh Produce\n\nLet's add these essentials to your list!",
      toys: "Shopping for toys? 🧸\n\nWhat age group:\n• Toddlers (0-3 years)\n• Kids (4-8 years)\n• Teens (9+ years)\n\nLet's find something fun!",
      fashion: "Looking for fashion accessories? 👗\n\nWhat are we styling today:\n• Handbags & Wallets\n• Jewelry & Watches\n• Perfumes & Cosmetics\n\nLet's pick something elegant!",
      fruit_baskets: "Want a healthy fruit basket? 🧺\n\nWho is this surprise for:\n• Get Well Soon\n• Congratulations\n• Family Sharing\n\nLet's select a fresh, premium assortment!",
      gift_packs: "Sending a curated gift pack? 🎁\n\nWhat's the vibe:\n• Luxury Pampering\n• Tea Connoisseur\n• Sweet & Savory Mix\n\nLet's find a pre-packaged box of joy!"
    };

    const replyText = customReplies[categoryKey] || `Looking for ${label}? 🌸 Let me help you find the best options in our catalog!`;

    try {
      const sessionContext = await memoryStore.loadSession('default-session') || manager.createNewContext('default-session');
      sessionContext.activeState = 'PRODUCT_SEARCH';
      sessionContext.extractedEntities = {
        ...sessionContext.extractedEntities,
        category: categoryKey
      };
      await memoryStore.saveSession('default-session', sessionContext);

      let searchWord = categoryKey;
      const categoryQueries = {
        cakes: "cake",
        flowers: "flower",
        chocolates: "chocolate",
        grocery: "tea",
        groceries: "tea",
        electronics: "electronic",
        toys: "toy",
        clothing: "shirt",
        fashion: "handbag",
        food: "food",
        fruit_baskets: "basket",
        gift_packs: "pack"
      };
      searchWord = categoryQueries[categoryKey] || categoryKey;

      const liveProducts = await kaprukaClient.searchProducts(searchWord);
      const displayProducts = liveProducts.slice(0, 6);
      const dynamicBundles = generateDynamicBundles(liveProducts);

      document.querySelectorAll(".sidebar-menu li").forEach(li => {
        li.classList.remove("active");
        if (li.getAttribute("data-category") === categoryKey) {
          li.classList.add("active");
        }
      });

      showTypingIndicator(false);
      addMessageBubble(replyText, "nelum", displayProducts, dynamicBundles);
    } catch (err) {
      showTypingIndicator(false);
      console.error("Error handling category click:", err);
      addMessageBubble(`Let's search for ${label}! 🌸`, "nelum");
    }
  }

  async function handleSecondaryNavClick(actionKey, label) {
    chatHero.style.display = "none";
    chatMessages.style.display = "flex";

    addMessageBubble(label, "user");
    showTypingIndicator(true);

    let replyText = "";
    let searchWord = "cake";
    let isRushOnly = false;
    let isSaleOnly = false;

    document.querySelectorAll(".sec-nav-btn").forEach(btn => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-action") === actionKey) {
        btn.classList.add("active");
      }
    });

    const sessionContext = await memoryStore.loadSession('default-session') || manager.createNewContext('default-session');

    if (actionKey === "shop") {
      replyText = "Ayubowan 👋\n\nWelcome to Nelum's Conversational Shop! Tell me what you're looking for, or browse our standard categories. Here are some of our popular products:";
      searchWord = "cake";
      sessionContext.activeState = 'PRODUCT_SEARCH';
    } else if (actionKey === "rush") {
      replyText = "Ayubowan 👋\n\nNeed something delivered quickly? Here are today's fastest delivery options, verified for Colombo and surrounding areas.";
      searchWord = "flower";
      isRushOnly = true;
      sessionContext.activeState = 'PRODUCT_SEARCH';
      sessionContext.extractedEntities.deliveryMode = 'same-day';
    } else if (actionKey === "sale") {
      replyText = "Ayubowan 👋\n\nLooking for the best deals? Here are today's top discounted items on Kapruka!";
      searchWord = "chocolate";
      isSaleOnly = true;
      sessionContext.activeState = 'PRODUCT_SEARCH';
    } else if (actionKey === "events") {
      replyText = "Ayubowan 👋\n\nPlanning for a special event? Whether it's a Birthday, Anniversary, Mother's Day, or Graduation, I can guide you through the perfect surprise journey.\n\nWhich type of event are you shopping for?";
      searchWord = "cake";
      sessionContext.activeState = 'GIFT_DISCOVERY';
    } else if (actionKey === "brands") {
      replyText = "Ayubowan 👋\n\nWhich type of brands are you interested in today? We have partners in Electronics, Fashion, Food, Beauty, and Lifestyle. Here are some recommended brand items:";
      searchWord = "tea";
      sessionContext.activeState = 'PRODUCT_SEARCH';
    } else if (actionKey === "foryou") {
      replyText = "Ayubowan 👋\n\nWelcome to your personalized space. Based on your profile preferences and upcoming events, I've selected these recommendations:";
      searchWord = "cake";
      sessionContext.activeState = 'BUNDLE_BUILDING';
    }

    await memoryStore.saveSession('default-session', sessionContext);

    try {
      let liveProducts = [];
      if (actionKey === "foryou") {
        const profile = await memoryStore.loadUserProfile('default-user');
        if (profile && profile.purchaseHistory && profile.purchaseHistory.length > 0) {
          const topAffinities = Object.entries(profile.categoryAffinities || {})
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0]);
          const affinityWord = topAffinities[0] === "cakes" ? "cake" : topAffinities[0] === "flowers" ? "flower" : "chocolate";
          liveProducts = await kaprukaClient.searchProducts(affinityWord);
        } else {
          liveProducts = await kaprukaClient.searchProducts("cake");
        }
      } else {
        liveProducts = await kaprukaClient.searchProducts(searchWord);
      }

      if (isRushOnly) {
        liveProducts = liveProducts.filter(p => p.deliveryEstimate.toLowerCase().includes("today") || p.deliveryEstimate.toLowerCase().includes("same day"));
      }

      const displayProducts = liveProducts.slice(0, 6);
      const dynamicBundles = generateDynamicBundles(liveProducts);

      showTypingIndicator(false);
      addMessageBubble(replyText, "nelum", displayProducts, dynamicBundles);
    } catch (err) {
      showTypingIndicator(false);
      console.error("Error executing secondary nav action:", err);
      addMessageBubble(replyText, "nelum");
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    
    // Starter Prompts Click
    startersGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".starter-btn");
      if (!btn) return;
      const context = btn.getAttribute("data-context");
      const label = btn.querySelector("span:last-child").textContent;
      
      if (context.startsWith("schedule-reminder:")) {
        const recipientName = context.split(":")[1];
        handleReminderSchedule(recipientName);
      } else {
        handleStarterClick(label, context);
      }
    });

    // Quick Chips Click
    quickChipsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip-btn");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const label = btn.textContent.trim();
      handleQuickAction(label, action);
    });

    // Send Button and Keyboard text input
    btnSend.addEventListener("click", sendTextMessage);
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendTextMessage();
      }
    });

    // Sidebar Category clicks
    const categoriesSidebar = document.getElementById("categories-sidebar");
    if (categoriesSidebar) {
      categoriesSidebar.addEventListener("click", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        const categoryKey = li.getAttribute("data-category");
        const label = li.textContent.trim();
        handleCategoryClick(categoryKey, label);
        
        // Auto-close on mobile
        if (categoriesSidebar.classList.contains("sidebar-open")) {
          categoriesSidebar.classList.remove("sidebar-open");
        }
      });
    }

    // Secondary Nav clicks
    const secondaryNav = document.getElementById("secondary-nav");
    if (secondaryNav) {
      secondaryNav.addEventListener("click", (e) => {
        const btn = e.target.closest(".sec-nav-btn");
        if (!btn) return;
        const actionKey = btn.getAttribute("data-action");
        const label = btn.textContent.trim();
        handleSecondaryNavClick(actionKey, label);
      });
    }

    // Language switcher click
    const langSwitcher = document.querySelector(".lang-switcher");
    if (langSwitcher) {
      langSwitcher.addEventListener("click", (e) => {
        const btn = e.target.closest(".lang-btn");
        if (!btn) return;
        
        langSwitcher.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const lang = btn.getAttribute("data-lang");
        
        memoryStore.loadSession('default-session').then(context => {
          const activeCtx = context || manager.createNewContext('default-session');
          activeCtx.languageCode = lang;
          memoryStore.saveSession('default-session', activeCtx).then(() => {
            let msg = "";
            if (lang === "en") {
              msg = "Language switched to English. How can I help you today? 🌸";
            } else if (lang === "si") {
              msg = "භාෂාව සිංහලට වෙනස් කරන ලදි. අද මම ඔබට උදව් කරන්නේ කෙසේද? 🌸";
            } else if (lang === "ta") {
              msg = "மொழி தமிழுக்கு மாற்றப்பட்டது. இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? 🌸";
            }
            addMessageBubble(msg, "nelum");
          });
        });
      });
    }

    // Top Nav buttons
    const btnTrackOrdersNav = document.getElementById("btn-track-orders-nav");
    if (btnTrackOrdersNav) {
      btnTrackOrdersNav.addEventListener("click", () => {
        chatHero.style.display = "none";
        chatMessages.style.display = "flex";
        
        if (activeOrder) {
          trackingModal.style.display = "flex";
        } else {
          addMessageBubble("Track my order", "user");
          showTypingIndicator(true);
          setTimeout(() => {
            showTypingIndicator(false);
            addMessageBubble("Let's check your order! 📦 Please enter your Kapruka Order Reference (e.g. #KP-74892) in the chat input below, and I'll fetch the live tracking details for you.", "nelum");
          }, 800);
        }
      });
    }

    const btnUserProfileNav = document.getElementById("btn-user-profile-nav");
    if (btnUserProfileNav) {
      btnUserProfileNav.addEventListener("click", () => {
        chatHero.style.display = "none";
        chatMessages.style.display = "flex";
        
        addMessageBubble("Show my user profile", "user");
        showTypingIndicator(true);
        setTimeout(() => {
          showTypingIndicator(false);
          addMessageBubble("Here is your profile information 👤\n\n• **Name**: Sethika Moraes\n• **Saved Address**: No. 23, Flower Road, Colombo 07\n• **Preferred Delivery City**: Colombo\n• **Frequent Occasions**: Mother's Birthday (June 18)\n\nLet me know if you would like me to update your preferences or find suggestions for upcoming occasions! 🌸", "nelum");
        }, 800);
      });
    }

    // Dynamic Delegation inside Chat Bubble
    chatMessages.addEventListener("click", (e) => {
      // 1. Add to cart button
      const addBtn = e.target.closest(".chat-card-add-btn");
      if (addBtn) {
        e.stopPropagation();
        const productId = addBtn.getAttribute("data-id");
        addToCart(productId, false);
        return;
      }

      // 2. View details button
      const detailsBtn = e.target.closest(".chat-card-details-btn");
      if (detailsBtn) {
        e.stopPropagation();
        const productId = detailsBtn.getAttribute("data-id");
        showProductDetail(productId);
        return;
      }

      // 3. Add bundle button
      const addBundleBtn = e.target.closest(".chat-btn-bundle-add");
      if (addBundleBtn) {
        e.stopPropagation();
        const bundleId = addBundleBtn.getAttribute("data-id");
        addToCart(bundleId, true);
        return;
      }

      // 4. Clicking the card itself
      const productCard = e.target.closest(".chat-product-card");
      if (productCard) {
        const productId = productCard.getAttribute("data-id");
        showProductDetail(productId);
        return;
      }
      
      const bundleCard = e.target.closest(".chat-bundle-card");
      if (bundleCard) {
        const bundleId = bundleCard.getAttribute("data-id");
        showBundleDetail(bundleId);
        return;
      }
    });

    // Scroll hide secondary nav
    let lastScrollTop = 0;
    chatMessages.addEventListener("scroll", () => {
      const st = chatMessages.scrollTop;
      const secondaryNav = document.getElementById("secondary-nav");
      if (!secondaryNav) return;

      if (st > lastScrollTop && st > 30) {
        secondaryNav.classList.add("nav-hidden");
      } else {
        secondaryNav.classList.remove("nav-hidden");
      }
      lastScrollTop = st <= 0 ? 0 : st;
    });

    // Cart Panel Toggles
    btnCartToggle.addEventListener("click", () => toggleCartDrawer(true));
    btnCloseCart.addEventListener("click", () => toggleCartDrawer(false));
    btnCartShop.addEventListener("click", () => toggleCartDrawer(false));
    
    // Close Product Detail Modal
    btnCloseProduct.addEventListener("click", () => {
      productDetailModal.style.display = "none";
    });
    
    // Details Modal Actions
    btnDetailAdd.addEventListener("click", () => {
      const pId = btnDetailAdd.getAttribute("data-id");
      const isBundle = btnDetailAdd.getAttribute("data-is-bundle") === "true";
      addToCart(pId, isBundle);
      productDetailModal.style.display = "none";
    });
    
    btnDetailSave.addEventListener("click", () => {
      showToast("Saved to your favorites!");
    });
    
    // Gallery thumbnails click
    [thumb1, thumb2, thumb3].forEach(thumb => {
      thumb.parentElement.addEventListener("click", () => {
        document.querySelectorAll(".detail-gallery-thumbnails .thumb").forEach(t => t.classList.remove("active"));
        thumb.parentElement.classList.add("active");
        detailImage.src = thumb.src;
      });
    });

    // Cart Items Remove Click
    cartItemsContainer.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".cart-item-remove-btn");
      if (!removeBtn) return;
      const index = parseInt(removeBtn.getAttribute("data-index"));
      removeFromCart(index);
    });

    // Live update greeting card preview on keypress
    giftMessageInput.addEventListener("input", () => {
      const val = giftMessageInput.value.trim();
      previewTextContent.textContent = val ? `"${val}"` : `"Type a gift message in the cart drawer..."`;
      
      // Sync into backend session cache
      memoryStore.loadSession('default-session').then(context => {
        if (context) {
          context.cart.greetingCardMessage = val;
          memoryStore.saveSession('default-session', context);
        }
      });
    });

    // Flow navigation: Cart -> Delivery Details Screen
    btnContinueDelivery.addEventListener("click", () => {
      toggleCartDrawer(false);
      openDeliveryModal();
    });
    
    btnReviewGifts.addEventListener("click", () => {
      toggleCartDrawer(true);
    });

    btnCloseDelivery.addEventListener("click", () => {
      deliveryModal.style.display = "none";
    });

    // Flow navigation: Delivery details -> Order Success & Tracking
    deliveryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      placeOrder();
    });

    btnCloseTracking.addEventListener("click", () => {
      trackingModal.style.display = "none";
      if (trackingInterval) clearInterval(trackingInterval);
    });

    btnTrackChat.addEventListener("click", () => {
      trackingModal.style.display = "none";
      if (trackingInterval) clearInterval(trackingInterval);
      
      addMessageBubble("Can you verify when the delivery driver will arrive at Colombo 07?", "user");
      showTypingIndicator(true);
      
      setTimeout(() => {
        showTypingIndicator(false);
        addMessageBubble("I've checked with our local Colombo courier service. The driver is currently packaging your fresh Black Forest cake and flowers. They will leave the depot at around 8:30 AM and reach Flower Road by 9:15 AM! I'll ping you here as soon as it goes out. 🚗", "nelum");
      }, 1800);
    });

    // Voice button trigger
    btnVoice.addEventListener("click", () => {
      voiceController.handleMicClick();
    });
    btnVoiceCancel.addEventListener("click", () => {
      voiceController.interrupt();
    });

    // Image attachment simulation
    btnAttach.addEventListener("click", () => {
      showToast("Attached inspiration photo! (Nelum will parse your image to recommend gifts)");
      showTypingIndicator(true);
      setTimeout(() => {
        showTypingIndicator(false);
        
        kaprukaClient.searchProducts("flower").then(liveProducts => {
          const displayProducts = liveProducts.slice(0, 4);
          const dynamicBundles = generateDynamicBundles(liveProducts);
          addMessageBubble("Oh! What a lovely room setup. The soft pink pastel aesthetics look wonderful. Based on this, I recommend our 'Eternal Romance Red Rose Bouquet' or a 'White Lilies' arrangement which fits perfectly into this theme. 🌸", "nelum", displayProducts, dynamicBundles);
        }).catch(err => {
          addMessageBubble("Oh! What a lovely room setup. The soft pink pastel aesthetics look wonderful. Based on this, I recommend checking our beautiful roses or lilies! 🌸", "nelum");
        });
      }, 2000);
    });

    // --- Mobile Responsive Navigation Clicks ---
    navChat.addEventListener("click", () => switchMobileTab("chat"));
    navDiscover.addEventListener("click", () => switchMobileTab("discover"));
    navCart.addEventListener("click", () => {
      toggleCartDrawer(true);
      switchMobileTab("chat");
    });
    navOrders.addEventListener("click", () => {
      if (activeOrder) {
        trackingModal.style.display = "flex";
      } else {
        showToast("You have no active orders to track. Send a gift first! 🎁");
      }
    });
  }

  // --- Voice Simulation Engine ---
  function startVoiceSimulation() {
    voiceWave.style.display = "flex";
    
    // Simulate speaking after 3.5 seconds
    voiceTimer = setTimeout(() => {
      voiceWave.style.display = "none";
      const voiceCommand = "I need to send red roses to my mom today";
      chatInput.value = voiceCommand;
      sendTextMessage();
    }, 3500);
  }

  function stopVoiceSimulation() {
    if (voiceTimer) clearTimeout(voiceTimer);
    voiceWave.style.display = "none";
    showToast("Voice input cancelled.");
  }

  // --- Mobile Tab Navigator ---
  function switchMobileTab(tab) {
    document.querySelectorAll(".mobile-nav-item").forEach(item => item.classList.remove("active"));
    
    const chatPane = document.getElementById("chat-section");
    const categoriesSidebar = document.getElementById("categories-sidebar");
    
    if (tab === "chat") {
      navChat.classList.add("active");
      if (categoriesSidebar) categoriesSidebar.classList.remove("sidebar-open");
    } else if (tab === "discover") {
      navDiscover.classList.add("active");
      if (categoriesSidebar) {
        categoriesSidebar.classList.toggle("sidebar-open");
      }
    }
  }

  // --- Cart System Operations ---
  function toggleCartDrawer(open) {
    cartDrawer.style.display = open ? "block" : "none";
  }

  async function addToCart(itemId, isBundle) {
    try {
      let item = null;
      if (isBundle) {
        const currentBundles = window.NELUM_CURRENT_BUNDLES || [];
        item = currentBundles.find(b => b.id === itemId);
      } else {
        item = await kaprukaClient.getProduct(itemId);
      }

      if (!item) return;

      const context = await memoryStore.loadSession('default-session');
      const activeCtx = context || manager.createNewContext('default-session');
      activeCtx.cart = activeCtx.cart || { items: [], subtotal: 0, greetingCardMessage: null };
      
      activeCtx.cart.items.push({
        productId: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        category: item.category || 'cakes',
        qty: 1,
        isBundle: isBundle
      });

      manager.recalculateCartSubtotal(activeCtx);
      await memoryStore.saveSession('default-session', activeCtx);
      
      cart = activeCtx.cart.items;
      updateCartUI();
      showToast(`Added "${item.title}" to your gift bundle!`);
      
      btnCartToggle.style.transform = "scale(1.15)";
      setTimeout(() => btnCartToggle.style.transform = "scale(1)", 200);
    } catch (err) {
      console.error("Error adding to cart:", err);
      showToast("Could not add item to cart.");
    }
  }

  function removeFromCart(index) {
    memoryStore.loadSession('default-session').then(context => {
      if (context && context.cart && context.cart.items) {
        const removedItem = context.cart.items[index];
        context.cart.items.splice(index, 1);
        manager.recalculateCartSubtotal(context);
        memoryStore.saveSession('default-session', context).then(() => {
          cart = context.cart.items;
          updateCartUI();
          showToast(`Removed "${removedItem.title}"`);
        });
      }
    });
  }

  function updateCartUI() {
    const count = cart.length;
    cartCountBadge.textContent = count;
    mobileCartCountBadge.textContent = count;

    if (count === 0) {
      cartEmpty.style.display = "block";
      cartActive.style.display = "none";
    } else {
      cartEmpty.style.display = "none";
      cartActive.style.display = "block";

      // Render cart items
      cartItemsContainer.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
          <img class="cart-item-img" src="${item.image}" alt="${item.title}">
          <div class="cart-item-details">
            <h5 class="cart-item-title">${item.title}</h5>
            <span class="cart-item-price">Rs. ${item.price.toLocaleString()}</span>
          </div>
          <button class="cart-item-remove-btn" data-index="${idx}" aria-label="Remove item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `).join("");

      // Totals
      const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
      cartSubtotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
      cartTotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
    }
  }

  // --- Product & Bundle Detail Modals ---
  async function showProductDetail(productId) {
    try {
      const product = await kaprukaClient.getProduct(productId);
      if (!product) return;

      detailBadge.style.display = product.badge ? "inline-block" : "none";
      if (product.badge) detailBadge.textContent = product.badge;
      
      detailTitle.textContent = product.title;
      detailReviews.textContent = `(${product.reviews} reviews)`;
      detailPrice.textContent = `Rs. ${product.price.toLocaleString()}`;
      detailDesc.textContent = product.description;
      detailDelivery.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>Delivery estimate: <strong>${product.deliveryEstimate}</strong></span>
      `;

      detailSpecs.innerHTML = (product.specs || []).map(spec => `<li>${spec}</li>`).join("");

      detailImage.src = product.image;
      thumb1.src = product.image;
      thumb2.src = product.image;
      thumb3.src = product.image;

      btnDetailAdd.setAttribute("data-id", product.id);
      btnDetailAdd.setAttribute("data-is-bundle", "false");

      productDetailModal.style.display = "flex";
    } catch (err) {
      console.error("Error showing product details:", err);
      showToast("Could not retrieve live product details.");
    }
  }

  function showBundleDetail(bundleId) {
    const currentBundles = window.NELUM_CURRENT_BUNDLES || [];
    const bundle = currentBundles.find(b => b.id === bundleId);
    if (!bundle) return;

    detailBadge.style.display = "inline-block";
    detailBadge.textContent = bundle.badge || "Special Bundle";
    
    detailTitle.textContent = bundle.title;
    detailReviews.textContent = `(Surprise Package)`;
    detailPrice.textContent = `Rs. ${bundle.price.toLocaleString()}`;
    detailDesc.textContent = bundle.description;
    detailDelivery.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>Delivery estimate: <strong>${bundle.deliveryEstimate}</strong></span>
    `;

    detailSpecs.innerHTML = bundle.items.map(item => `<li>${item}</li>`).join("");

    detailImage.src = bundle.image;
    thumb1.src = bundle.image;
    thumb2.src = bundle.image;
    thumb3.src = bundle.image;

    btnDetailAdd.setAttribute("data-id", bundle.id);
    btnDetailAdd.setAttribute("data-is-bundle", "true");

    productDetailModal.style.display = "flex";
  }

  // --- Delivery & Checkout Screens ---
  function openDeliveryModal() {
    if (cart.length === 0) {
      showToast("Your cart is empty! Add gifts first.");
      return;
    }

    deliverySummaryItems.innerHTML = cart.map(item => `
      <div class="summary-item-card">
        <img class="summary-item-img" src="${item.image}" alt="${item.title}">
        <div class="summary-item-info">
          <h5 class="summary-item-title">${item.title}</h5>
          <span class="summary-item-price">Rs. ${item.price.toLocaleString()}</span>
        </div>
      </div>
    `).join("");

    const msg = giftMessageInput.value.trim();
    if (msg) {
      deliveryCardPreview.style.display = "block";
      previewTextContent.textContent = `"${msg}"`;
    } else {
      deliveryCardPreview.style.display = "none";
    }

    deliveryModal.style.display = "flex";
  }

  function placeOrder() {
    const rName = document.getElementById("recipient-name").value.trim();
    const rPhone = document.getElementById("recipient-phone").value.trim();
    const rAddress = document.getElementById("delivery-address").value.trim();
    const dDate = document.getElementById("delivery-date").value;
    const dTime = document.getElementById("delivery-time").value;
    const sName = document.getElementById("sender-name").value.trim();
    
    memoryStore.loadSession('default-session').then(context => {
      if (context) {
        context.delivery = {
          recipientName: rName,
          recipientPhone: rPhone,
          address: rAddress,
          date: dDate,
          timeWindow: dTime,
          senderName: sName
        };
        context.activeState = 'CHECKOUT';

        document.getElementById("track-recipient-name").textContent = rName;
        document.getElementById("track-recipient-address").textContent = rAddress;
        document.getElementById("track-delivery-date").textContent = dDate;
        
        const timeLabels = {
          any: "Anytime (8 AM - 6 PM)",
          morning: "Morning (8 AM - 12 PM)",
          afternoon: "Afternoon (12 PM - 4 PM)",
          evening: "Evening (4 PM - 8 PM)"
        };
        document.getElementById("track-delivery-time").textContent = timeLabels[dTime] || dTime;

        kaprukaClient.createOrder(
          context.cart.items,
          context.delivery,
          { name: sName, email: 'customer@kapruka.com' },
          context.cart.greetingCardMessage,
          dDate
        ).then(result => {
          activeOrder = {
            recipientName: rName,
            recipientPhone: rPhone,
            recipientAddress: rAddress,
            deliveryDate: dDate,
            deliveryTime: dTime,
            senderName: sName,
            items: [...cart],
            message: giftMessageInput.value.trim(),
            orderId: result.orderId
          };

          document.querySelector(".tracking-subtitle strong").textContent = result.orderId;

          // Update category affinities using habitLearningEngine
          memoryStore.loadUserProfile('default-user').then(profile => {
            if (profile) {
              let updatedProfile = { ...profile };
              activeOrder.items.forEach(item => {
                const category = item.category || 'cakes';
                updatedProfile = habitLearningEngine.updateAffinity(updatedProfile, category);
              });
              memoryStore.saveUserProfile('default-user', updatedProfile).then(() => {
                console.log("[Nelum Memory] Category affinities updated upon checkout completion.");
              });
            }
          });

          // Clear cart
          context.cart.items = [];
          context.cart.subtotal = 0;
          context.cart.greetingCardMessage = null;

          memoryStore.saveSession('default-session', context).then(() => {
            cart = [];
            updateCartUI();
            giftMessageInput.value = "";
            deliveryModal.style.display = "none";
            trackingModal.style.display = "flex";

            // Setup card payment box and simulation link
            const payBox = document.getElementById("track-payment-box");
            const payBtn = document.getElementById("btn-pay-now");
            if (payBox && payBtn && result.paymentUrl) {
              payBox.style.display = "block";
              payBtn.href = result.paymentUrl;
              
              activeTrackingStep = 1;
              updateTrackingTimelineUI();
              if (trackingInterval) clearInterval(trackingInterval);
              
              const newPayBtn = payBtn.cloneNode(true);
              payBtn.parentNode.replaceChild(newPayBtn, payBtn);
              
              newPayBtn.addEventListener("click", (evt) => {
                evt.preventDefault();
                showToast("Opening payment gateway tab...");
                window.open(result.paymentUrl, '_blank');
                
                setTimeout(() => {
                  payBox.style.display = "none";
                  showToast("Payment confirmed! Dispatched for baking & florist collection. 🌸");
                  startTrackingSimulation();
                }, 3000);
              });
            } else {
              startTrackingSimulation();
            }
          });
        });
      }
    });
  }

  function startTrackingSimulation() {
    activeTrackingStep = 1;
    updateTrackingTimelineUI();

    if (trackingInterval) clearInterval(trackingInterval);

    trackingInterval = setInterval(() => {
      if (activeTrackingStep < 5) {
        activeTrackingStep++;
        updateTrackingTimelineUI();
        
        let notifyMessage = "";
        if (activeTrackingStep === 2) {
          notifyMessage = "Nelum is preparing your cake & choosing fresh flowers in Colombo! 🎂💐";
        } else if (activeTrackingStep === 3) {
          notifyMessage = "Your custom gift card is handwritten. Dispatching quality inspection. ✨";
        } else if (activeTrackingStep === 4) {
          notifyMessage = "Package has been dispatched! Driver is out for delivery. 🚗";
        } else if (activeTrackingStep === 5) {
          notifyMessage = "Surprise package delivered successfully! Check your photo email confirmation. 🎁";
          clearInterval(trackingInterval);
        }
        showToast(notifyMessage);
      }
    }, 12000);
  }

  function updateTrackingTimelineUI() {
    timelineSteps.forEach((step, idx) => {
      step.classList.remove("active", "completed");
      if (idx + 1 < activeTrackingStep) {
        step.classList.add("completed");
      } else if (idx + 1 === activeTrackingStep) {
        step.classList.add("active");
      }
    });
  }

  // --- Chat Conversation Engine ---
  function handleStarterClick(label, context) {
    chatHero.style.display = "none";
    chatMessages.style.display = "flex";

    addMessageBubble(`I am looking for a ${label}.`, "user");
    showTypingIndicator(true);

    manager.processMessage('default-session', `I am looking for a ${label}`).then(reply => {
      showTypingIndicator(false);
      
      memoryStore.loadSession('default-session').then(sessionContext => {
        if (sessionContext && sessionContext.cart) {
          cart = sessionContext.cart.items;
          updateCartUI();
        }
        fetchAndAddNelumMessage(reply, sessionContext);
      });
    });
  }

  function handleReminderSchedule(recipientName) {
    chatHero.style.display = "none";
    chatMessages.style.display = "flex";
    
    addMessageBubble(`Schedule a birthday surprise for ${recipientName} like last year.`, "user");
    showTypingIndicator(true);
    
    memoryStore.loadUserProfile('default-user').then(profile => {
      const today = '2026-06-17';
      const reminders = preferenceEngine.checkUpcomingOccasions(profile, today);
      const reminder = reminders.find(r => r.recipient === recipientName);
      if (!reminder) {
        showTypingIndicator(false);
        addMessageBubble("Aiyo, I couldn't locate the birthday reminder. Let's find some gifts manually!", "nelum");
        return;
      }
      
      memoryStore.loadSession('default-session').then(context => {
        const activeCtx = context || manager.createNewContext('default-session');
        activeCtx.activeState = 'ORDER_REVIEW';
        activeCtx.extractedEntities = {
          recipient: reminder.relationship,
          occasion: 'birthday',
          city: 'Colombo',
          budget: 10000
        };
        activeCtx.delivery = {
          recipientName: reminder.recipient,
          recipientPhone: '077 123 4567',
          address: reminder.address,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          timeWindow: 'morning',
          senderName: 'Sethika Moraes'
        };
        
        kaprukaClient.getProduct(reminder.suggestedItem).then(item => {
          if (item) {
            activeCtx.cart.items = [{
              productId: item.id,
              title: item.title,
              price: item.price,
              image: item.image,
              qty: 1,
              isBundle: false
            }];
            activeCtx.cart.subtotal = item.price;
            activeCtx.cart.greetingCardMessage = "Happy Birthday! Hamaදාම සතුටින් ඉන්න. 🎂";
          }
          
          manager.recalculateCartSubtotal(activeCtx);
          memoryStore.saveSession('default-session', activeCtx).then(() => {
            cart = activeCtx.cart.items;
            updateCartUI();
            
            document.getElementById("recipient-name").value = activeCtx.delivery.recipientName;
            document.getElementById("recipient-phone").value = activeCtx.delivery.recipientPhone;
            document.getElementById("delivery-address").value = activeCtx.delivery.address;
            document.getElementById("delivery-date").value = activeCtx.delivery.date;
            document.getElementById("delivery-time").value = activeCtx.delivery.timeWindow;
            document.getElementById("sender-name").value = activeCtx.delivery.senderName;
            
            kaprukaClient.searchProducts("cake").then(liveProducts => {
              const displayProducts = liveProducts.slice(0, 4);
              const dynamicBundles = generateDynamicBundles(liveProducts);
              showTypingIndicator(false);
              addMessageBubble(`All set! I've loaded your surprise details for **${reminder.recipient}**. I've added the **${item.title}** (Rs. ${item.price.toLocaleString()}) to your cart and pre-filled the delivery address. You can review your gifts in the drawer and proceed when ready! 🌸`, "nelum", displayProducts, dynamicBundles);
            }).catch(err => {
              showTypingIndicator(false);
              addMessageBubble(`All set! I've loaded your surprise details for **${reminder.recipient}**. I've added the **${item.title}** (Rs. ${item.price.toLocaleString()}) to your cart and pre-filled the delivery address. You can review your gifts in the drawer and proceed when ready! 🌸`, "nelum");
            });
          });
        });
      });
    });
  }

  async function handleQuickAction(label, action) {
    chatHero.style.display = "none";
    chatMessages.style.display = "flex";

    addMessageBubble(label, "user");
    showTypingIndicator(true);

    try {
      const reply = await manager.processMessage('default-session', label);
      showTypingIndicator(false);
      
      const sessionContext = await memoryStore.loadSession('default-session');
      if (sessionContext && sessionContext.cart) {
        cart = sessionContext.cart.items;
        updateCartUI();
      }

      if (action === "price-5000") {
        sessionContext.extractedEntities.budget = 5000;
      } else if (action === "price-10000") {
        sessionContext.extractedEntities.budget = 10000;
      } else if (action === "delivery-sameday") {
        sessionContext.extractedEntities.deliveryMode = 'same-day';
      }

      fetchAndAddNelumMessage(reply, sessionContext);
    } catch (err) {
      showTypingIndicator(false);
      console.error("Error executing quick action:", err);
      addMessageBubble("Aiyo 😅 I ran into a small error. Let's try again! 🌸", "nelum");
    }
  }

  function sendTextMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatHero.style.display = "none";
    chatMessages.style.display = "flex";

    addMessageBubble(text, "user");
    chatInput.value = "";
    chatInput.style.height = "auto";

    showTypingIndicator(true);

    manager.processMessage('default-session', text).then(reply => {
      showTypingIndicator(false);
      
      memoryStore.loadSession('default-session').then(context => {
        if (context && context.cart) {
          cart = context.cart.items;
          updateCartUI();
        }
        fetchAndAddNelumMessage(reply, context);
      });
    }).catch(err => {
      showTypingIndicator(false);
      addMessageBubble("Aiyo 😅 I ran into a small error. Let's try again! 🌸", "nelum");
    });
  }

  function addMessageBubble(text, sender, productsList = null, bundlesList = null) {
    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble", sender);
    
    if (sender === "nelum") {
      voiceController.speak(text);
      const htmlText = text
        .replace(/\n\n/g, "<br><br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        
      let contentHtml = `
        <div class="nelum-rich-content">
          <p>${htmlText}</p>
        </div>
      `;

      if (productsList && productsList.length > 0) {
        contentHtml += `
          <div class="chat-products-grid">
            ${productsList.map(product => `
              <div class="chat-product-card" data-id="${product.id}">
                ${product.badge ? `<span class="card-badge">${product.badge}</span>` : ""}
                <div class="chat-card-image-box">
                  <img class="chat-card-image" src="${product.image}" alt="${product.title}" loading="lazy">
                </div>
                <div class="chat-card-info">
                  <h4 class="chat-card-title">${product.title}</h4>
                  <div class="chat-card-delivery-est">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${product.deliveryEstimate || 'Today'}</span>
                  </div>
                  <div class="chat-card-action-row">
                    <span class="chat-card-price">Rs. ${(product.price || 0).toLocaleString()}</span>
                    <div class="chat-card-buttons">
                      <button class="chat-card-details-btn" data-id="${product.id}">Details</button>
                      <button class="chat-card-add-btn" data-id="${product.id}" aria-label="Add item">Add</button>
                    </div>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }

      if (bundlesList && bundlesList.length > 0) {
        contentHtml += `
          <div class="chat-bundles-title">Recommended Surprise Gift Packages</div>
          <div class="chat-bundles-carousel">
            ${bundlesList.map(bundle => `
              <div class="chat-bundle-card" data-id="${bundle.id}">
                ${bundle.badge ? `<span class="bundle-badge">${bundle.badge}</span>` : ""}
                <div class="chat-bundle-image-box">
                  <img class="chat-bundle-image" src="${bundle.image}" alt="${bundle.title}">
                </div>
                <div class="chat-bundle-info">
                  <h4 class="chat-bundle-title">${bundle.title}</h4>
                  <p class="chat-bundle-desc">${bundle.description}</p>
                  <ul class="chat-bundle-items">
                    ${bundle.items.map(item => `<li>${item}</li>`).join("")}
                  </ul>
                  <div class="chat-bundle-footer">
                    <div class="chat-bundle-price-box">
                      <span class="chat-bundle-original">Rs. ${bundle.originalPrice.toLocaleString()}</span>
                      <span class="chat-bundle-price">Rs. ${bundle.price.toLocaleString()}</span>
                    </div>
                    <button class="chat-btn-bundle-add" data-id="${bundle.id}">Add Bundle</button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }

      bubble.innerHTML = contentHtml;
    } else {
      bubble.textContent = text;
    }

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator(show) {
    typingIndicator.style.display = show ? "flex" : "none";
    if (show) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // --- Utility Functions ---
  function showToast(message) {
    window.showToast = showToast;
    let toast = document.querySelector(".nelum-toast");
    if (toast) toast.remove();

    toast = document.createElement("div");
    toast.className = "nelum-toast";
    toast.textContent = message;
    
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "80px",
      left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      backgroundColor: "rgba(31, 41, 55, 0.9)",
      color: "#FFFFFF",
      padding: "10px 20px",
      borderRadius: "30px",
      fontSize: "12px",
      fontWeight: "700",
      zIndex: "1000",
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      pointerEvents: "none",
      opacity: "0",
      transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    });

    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    }, 50);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  chatInput.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight - 16) + "px";
  });

  const appInitPromise = init();
  runLoadingScreen(appInitPromise);
});
