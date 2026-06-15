// ==========================================================================
// NELUM BY KAPRUKA - INTERACTIVE APPLICATION CONTROLLER
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
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
  const productGrid = document.getElementById("product-grid");
  const bundlesCarousel = document.getElementById("bundles-carousel");
  
  const chatHero = document.getElementById("chat-hero");
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const btnSend = document.getElementById("btn-send");
  const btnVoice = document.getElementById("btn-voice");
  const btnVoiceCancel = document.getElementById("btn-voice-cancel");
  const voiceWave = document.getElementById("voice-wave");
  const btnAttach = document.getElementById("btn-attach");
  const typingIndicator = document.getElementById("typing-indicator");
  
  const showcaseTitle = document.getElementById("showcase-title");
  const showcaseTag = document.getElementById("showcase-tag");
  
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

  // --- Initializers ---
  function init() {
    renderStarters();
    renderQuickChips();
    renderProducts(NELUM_PRODUCTS);
    renderBundles(NELUM_BUNDLES);
    setupEventListeners();
    
    // Set default date in delivery form to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("delivery-date").value = tomorrow.toISOString().split("T")[0];
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

  function renderQuickChips() {
    quickChipsContainer.innerHTML = QUICK_ACTIONS.map(chip => `
      <button class="chip-btn" data-action="${chip.action}">
        ${chip.text}
      </button>
    `).join("");
  }

  function renderProducts(productsList) {
    if (productsList.length === 0) {
      productGrid.innerHTML = `
        <div class="empty-products-grid" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-gray);">
          🌸 Nelum found no matching individual items. Try another query or chip!
        </div>
      `;
      return;
    }
    
    productGrid.innerHTML = productsList.map(product => {
      const isSaved = false; // Mock state
      return `
        <div class="product-card" data-id="${product.id}">
          ${product.badge ? `<span class="card-badge">${product.badge}</span>` : ""}
          <button class="card-save-btn ${isSaved ? 'active' : ''}" aria-label="Save for later" data-id="${product.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <div class="card-image-box">
            <img class="card-image" src="${product.image}" alt="${product.title}" loading="lazy">
          </div>
          <div class="card-info">
            <div class="card-rating-row">
              <span class="card-rating-stars">★★★★★</span>
              <span>(${product.reviews})</span>
            </div>
            <h4 class="card-title">${product.title}</h4>
            <div class="card-delivery-est">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${product.deliveryEstimate}</span>
            </div>
            <div class="card-action-row">
              <span class="card-price">Rs. ${product.price.toLocaleString()}</span>
              <button class="card-add-btn" aria-label="Add item" data-id="${product.id}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderBundles(bundlesList) {
    const bundlesArea = document.getElementById("bundles-area");
    if (bundlesList.length === 0) {
      bundlesArea.style.display = "none";
      return;
    }
    bundlesArea.style.display = "block";

    bundlesCarousel.innerHTML = bundlesList.map(bundle => `
      <div class="bundle-card" data-id="${bundle.id}">
        <div class="bundle-image-box">
          <img class="bundle-image" src="${bundle.image}" alt="${bundle.title}">
        </div>
        ${bundle.badge ? `<span class="bundle-badge">${bundle.badge}</span>` : ""}
        <h4 class="bundle-title">${bundle.title}</h4>
        <p class="bundle-desc">${bundle.description}</p>
        <ul class="bundle-items-list">
          ${bundle.items.map(item => `<li>${item}</li>`).join("")}
        </ul>
        <div class="bundle-footer">
          <div class="bundle-price-box">
            <span class="bundle-original-price">Rs. ${bundle.originalPrice.toLocaleString()}</span>
            <span class="bundle-price">Rs. ${bundle.price.toLocaleString()}</span>
          </div>
          <button class="btn-bundle-add" data-id="${bundle.id}">Add Bundle</button>
        </div>
      </div>
    `).join("");
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    
    // Starter Prompts Click
    startersGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".starter-btn");
      if (!btn) return;
      const context = btn.getAttribute("data-context");
      const label = btn.querySelector("span:last-child").textContent;
      handleStarterClick(label, context);
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

    // Product Grid Clicks (Detail & Add to Cart)
    productGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".product-card");
      if (!card) return;
      
      const productId = card.getAttribute("data-id");
      
      // Save heart button click
      const saveBtn = e.target.closest(".card-save-btn");
      if (saveBtn) {
        e.stopPropagation();
        saveBtn.classList.toggle("active");
        showToast(saveBtn.classList.contains("active") ? "Saved to your inspiration list!" : "Removed from saved.");
        return;
      }
      
      // Add to bundle button click
      const addBtn = e.target.closest(".card-add-btn");
      if (addBtn) {
        e.stopPropagation();
        addToCart(productId, false);
        return;
      }
      
      // Default: show product detail modal
      showProductDetail(productId);
    });

    // Bundle Grid Clicks
    bundlesCarousel.addEventListener("click", (e) => {
      const card = e.target.closest(".bundle-card");
      if (!card) return;
      
      const bundleId = card.getAttribute("data-id");
      const addBtn = e.target.closest(".btn-bundle-add");
      
      if (addBtn) {
        e.stopPropagation();
        addToCart(bundleId, true);
        return;
      }
      
      // Standard click: show bundle detail
      showBundleDetail(bundleId);
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
      
      // Add simulated user question
      addMessageBubble("Can you verify when the delivery driver will arrive at Colombo 07?", "user");
      showTypingIndicator(true);
      
      setTimeout(() => {
        showTypingIndicator(false);
        addMessageBubble("I've checked with our local Colombo courier service. The driver is currently packaging your fresh Black Forest cake and flowers. They will leave the depot at around 8:30 AM and reach Flower Road by 9:15 AM! I'll ping you here as soon as it goes out. 🚗", "nelum");
      }, 1800);
    });

    // Voice button trigger
    btnVoice.addEventListener("click", startVoiceSimulation);
    btnVoiceCancel.addEventListener("click", stopVoiceSimulation);

    // Image attachment simulation
    btnAttach.addEventListener("click", () => {
      showToast("Attached inspiration photo! (Nelum will parse your image to recommend gifts)");
      showTypingIndicator(true);
      setTimeout(() => {
        showTypingIndicator(false);
        addMessageBubble("Oh! What a lovely room setup. The soft pink pastel aesthetics look wonderful. Based on this, I recommend our 'Eternal Romance Red Rose Bouquet' or a 'White Lilies' arrangement which fits perfectly into this theme. 🌸", "nelum");
        filterShowcase("flowers");
      }, 2000);
    });

    // --- Mobile Responsive Navigation Clicks ---
    navChat.addEventListener("click", () => switchMobileTab("chat"));
    navDiscover.addEventListener("click", () => switchMobileTab("discover"));
    navCart.addEventListener("click", () => {
      toggleCartDrawer(true);
      switchMobileTab("chat"); // Keep background safe
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
    const showcasePane = document.getElementById("showcase-section");
    
    if (tab === "chat") {
      navChat.classList.add("active");
      chatPane.style.display = "flex";
      showcasePane.style.display = "none";
    } else if (tab === "discover") {
      navDiscover.classList.add("active");
      chatPane.style.display = "none";
      showcasePane.style.display = "flex";
    }
  }

  // --- Cart System Operations ---

  function toggleCartDrawer(open) {
    cartDrawer.style.display = open ? "block" : "none";
  }

  function addToCart(itemId, isBundle) {
    let item = null;
    if (isBundle) {
      item = NELUM_BUNDLES.find(b => b.id === itemId);
    } else {
      item = NELUM_PRODUCTS.find(p => p.id === itemId);
    }

    if (!item) return;

    cart.push({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      isBundle: isBundle
    });

    updateCartUI();
    showToast(`Added "${item.title}" to your gift bundle!`);
    
    // Animated bounce on cart icons
    btnCartToggle.style.transform = "scale(1.15)";
    setTimeout(() => btnCartToggle.style.transform = "scale(1)", 200);
  }

  function removeFromCart(index) {
    const removedItem = cart[index];
    cart.splice(index, 1);
    updateCartUI();
    showToast(`Removed "${removedItem.title}"`);
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

  function showProductDetail(productId) {
    const product = NELUM_PRODUCTS.find(p => p.id === productId);
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

    // Specs list
    detailSpecs.innerHTML = product.specs.map(spec => `<li>${spec}</li>`).join("");

    // Setup gallery images
    detailImage.src = product.image;
    thumb1.src = product.image;
    
    // Styled fallbacks for multi-photo gallery
    thumb2.src = product.image;
    thumb3.src = product.image;

    btnDetailAdd.setAttribute("data-id", product.id);
    btnDetailAdd.setAttribute("data-is-bundle", "false");

    productDetailModal.style.display = "flex";
  }

  function showBundleDetail(bundleId) {
    const bundle = NELUM_BUNDLES.find(b => b.id === bundleId);
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

    // Items included
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

    // Populate surprise package items in delivery summary
    deliverySummaryItems.innerHTML = cart.map(item => `
      <div class="summary-item-card">
        <img class="summary-item-img" src="${item.image}" alt="${item.title}">
        <div class="summary-item-info">
          <h5 class="summary-item-title">${item.title}</h5>
          <span class="summary-item-price">Rs. ${item.price.toLocaleString()}</span>
        </div>
      </div>
    `).join("");

    // Greeting card card message
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
    
    // Save order data
    activeOrder = {
      recipientName: rName,
      recipientPhone: rPhone,
      recipientAddress: rAddress,
      deliveryDate: dDate,
      deliveryTime: dTime,
      senderName: sName,
      items: [...cart],
      message: giftMessageInput.value.trim()
    };

    // Populate Tracking Screen details
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

    // Clear cart
    cart = [];
    updateCartUI();
    giftMessageInput.value = "";

    // Close checkout modals
    deliveryModal.style.display = "none";
    
    // Show tracking modal
    trackingModal.style.display = "flex";
    
    // Start timeline simulation
    startTrackingSimulation();
  }

  function startTrackingSimulation() {
    activeTrackingStep = 1;
    updateTrackingTimelineUI();

    if (trackingInterval) clearInterval(trackingInterval);

    // Increment steps every 12 seconds to mock live logistics dispatch
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
    // Hide Hero landing and show messages
    chatHero.style.display = "none";
    chatMessages.style.display = "flex";

    addMessageBubble(`I am looking for a ${label}.`, "user");
    
    showTypingIndicator(true);

    setTimeout(() => {
      showTypingIndicator(false);
      let nelumResponse = "";
      
      if (context === "birthday") {
        nelumResponse = "Birthdays are special! 🎂 I've loaded our absolute best celebration cakes, fresh bouquets, and toy gifts in the showcase. For an ultimate setup, check out the **Birthday Delight Surprise Bundle** on the right! It bundles a Black Forest gateau, fresh red roses, a teddy bear, and a premium greeting card.\n\nShould we narrow it down by price range, or did something catch your eye?";
        filterShowcase("birthday");
      } else if (context === "sorry") {
        nelumResponse = "A heartfelt apology bundle speaks volumes. 🌹 I have filtered for premium lilies, rose bouquets, and gourmet chocolates on the right. Our **Sincere Apologies Sympathy Set** includes a handwritten card with same-day delivery. \n\nLet me know if you would like to type a personal note for the greeting card!";
        filterShowcase("sorry");
      } else if (context === "anniversary") {
        nelumResponse = "Happy Anniversary! 💝 I have loaded the romantic red rose bouquet, tea box assortments, and luxury chocolates. I highly recommend the **Golden Anniversary Celebration Bundle** to make it memorable. \n\nWould you like me to coordinate a specific morning delivery time?";
        filterShowcase("anniversary");
      } else {
        nelumResponse = `I've opened the **${label}** showcase panel on the right. You'll see local Kapruka favorites ready for same-day delivery. Take a look and tap any card to customize or add to your bundle! 🌸`;
        filterShowcase(context);
      }

      addMessageBubble(nelumResponse, "nelum");
    }, 1500);
  }

  function handleQuickAction(label, action) {
    chatHero.style.display = "none";
    chatMessages.style.display = "flex";

    addMessageBubble(label, "user");
    showTypingIndicator(true);

    setTimeout(() => {
      showTypingIndicator(false);
      let reply = "";
      
      if (action === "price-5000") {
        const filtered = NELUM_PRODUCTS.filter(p => p.price < 5000);
        renderProducts(filtered);
        renderBundles([]);
        showcaseTitle.textContent = "Gifts Under Rs. 5,000";
        showcaseTag.textContent = "Budget-Friendly";
        reply = "Here are our high-quality gifts under Rs. 5,000. I've filtered out cakes, chocolates, and cute teddy bears that fit perfectly within this range. 🌸";
      } else if (action === "price-10000") {
        const filtered = NELUM_PRODUCTS.filter(p => p.price < 10000);
        const bundlesFiltered = NELUM_BUNDLES.filter(b => b.price < 10000);
        renderProducts(filtered);
        renderBundles(bundlesFiltered);
        showcaseTitle.textContent = "Gifts Under Rs. 10,000";
        showcaseTag.textContent = "Under Rs. 10K";
        reply = "Filtered to show products and bundles under Rs. 10,000. Take a look at the fresh rose bouquet and chocolate gift boxes on the right! 🌸";
      } else if (action === "delivery-sameday") {
        const filtered = NELUM_PRODUCTS.filter(p => p.deliveryEstimate.toLowerCase().includes("today") || p.deliveryEstimate.toLowerCase().includes("hour"));
        const bundlesFiltered = NELUM_BUNDLES.filter(b => b.deliveryEstimate.toLowerCase().includes("today"));
        renderProducts(filtered);
        renderBundles(bundlesFiltered);
        showcaseTitle.textContent = "Same-Day Delivery Gifts";
        showcaseTag.textContent = "Fast Track";
        reply = "I've filtered to show items and bundles that can be prepared and delivered today (same-day delivery) to Colombo. What time should we schedule the surprise? 🚗";
      } else if (action === "filter-bestseller") {
        const filtered = NELUM_PRODUCTS.filter(p => p.badge && p.badge.toLowerCase().includes("bestseller"));
        renderProducts(filtered);
        renderBundles(NELUM_BUNDLES);
        showcaseTitle.textContent = "Kapruka Best Sellers";
        showcaseTag.textContent = "Trending";
        reply = "These are our absolute best sellers! The Signature Black Forest Gateau and Rose Bouquet are top customer favorites for special surprises. 🌸";
      } else {
        reply = `I have loaded search parameters for "${label}" on the right! Let me know if you want to add customized packaging or cards. 🌸`;
        filterShowcase("all");
      }

      addMessageBubble(reply, "nelum");
    }, 1400);
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

    // Keyword detection
    setTimeout(() => {
      showTypingIndicator(false);
      const query = text.toLowerCase();
      let reply = "";
      
      if (query.includes("cake") || query.includes("gateau") || query.includes("bake")) {
        filterShowcase("cakes");
        reply = "Mmm, cakes! 🎂 I've loaded our fresh cakes on the right. The Signature Black Forest Gateau (Rs. 4,800) is prepared daily in our sterile Kapruka baking kitchens. We can add custom text on top of the cake for free! Would you like me to add it to your gift bundle?";
      } else if (query.includes("flower") || query.includes("rose") || query.includes("lily") || query.includes("bouquet")) {
        filterShowcase("flowers");
        reply = "Flowers are perfect for conveying emotion! 💐 I've shown our fresh rose bouquets and serene white lilies on the right. They are sourced directly from Nuwara Eliya flower farms. Shall I add a bouquet to your selection?";
      } else if (query.includes("chocolate") || query.includes("ferrero") || query.includes("lindt")) {
        filterShowcase("chocolates");
        reply = "Indulge in sweet surprises! 🍫 I have loaded our premium imported chocolate boxes and presentation hampers on the right. Perfect for anniversaries or birthdays. Let me know if you would like to pair it with flowers!";
      } else if (query.includes("grocery") || query.includes("tea") || query.includes("fruit")) {
        filterShowcase("groceries");
        reply = "Groceries and organic products are wonderful practical gifts! 🛒 I have filtered for Ceylon Premium Tea, Organic Tropical Fruit Baskets, and general hampers on the right. These are highly appreciated for family visits.";
      } else if (query.includes("electronics") || query.includes("playstation") || query.includes("ps5") || query.includes("console")) {
        filterShowcase("electronics");
        reply = "High-tech surprises! 🎮 I've displayed the Sony PlayStation 5 Slim console (Rs. 185,000) in the showcase. It comes with a full 1-year Kapruka warranty and free courier delivery across Sri Lanka. Would you like to check the specs?";
      } else if (query.includes("toy") || query.includes("teddy") || query.includes("kids")) {
        filterShowcase("toys");
        reply = "So adorable! 🧸 I have brought up our plush Deluxe Teddy Bear on the right. Soft, hypoallergenic, and wearing the cute red satin bow. It fits beautifully into a kid's birthday surprise pack!";
      } else if (query.includes("birthday")) {
        filterShowcase("birthday");
        reply = "Let's plan a birthday surprise! 🎂 I have loaded celebration cakes, rose bouquets, teddies, and our bestseller **Birthday Delight Surprise Bundle** on the right. Shall we write a greeting card card message?";
      } else if (query.includes("sorry") || query.includes("apolog")) {
        filterShowcase("sorry");
        reply = "Apologies are best sent with peaceful thoughts. 🌹 I have filtered white lilies and comforting chocolates on the right. The **Sincere Apologies Sympathy Set** includes a customized handwritten apology card. Do you want to type the message?";
      } else if (query.includes("anniversary") || query.includes("love")) {
        filterShowcase("anniversary");
        reply = "Milestones of love! 💝 I have loaded the romantic red roses, Ceylon tea, and chocolates. The **Golden Anniversary Celebration Bundle** is highly recommended. Shall we add same-day delivery to Colombo?";
      } else if (query.includes("delivery") || query.includes("same day") || query.includes("today")) {
        const filtered = NELUM_PRODUCTS.filter(p => p.deliveryEstimate.toLowerCase().includes("today") || p.deliveryEstimate.toLowerCase().includes("hour"));
        renderProducts(filtered);
        renderBundles(NELUM_BUNDLES.filter(b => b.deliveryEstimate.toLowerCase().includes("today")));
        showcaseTitle.textContent = "Same-Day Surprises";
        showcaseTag.textContent = "Fast Courier";
        reply = "I've filtered the product list to show items that support same-day dispatch and delivery to Colombo. If you order now, Nelum will have it delivered in under 3 hours! 🚗";
      } else if (query.includes("price") || query.includes("cheap") || query.includes("cost") || query.includes("budget")) {
        const filtered = NELUM_PRODUCTS.filter(p => p.price < 5000);
        renderProducts(filtered);
        renderBundles([]);
        showcaseTitle.textContent = "Budget Gift Surprises";
        showcaseTag.textContent = "Under Rs. 5,000";
        reply = "I've filtered our catalog to show gifts under Rs. 5,000. These include premium chocolate hampers, teddy bears, and fresh Ceylon tea box options. 🌸";
      } else {
        filterShowcase("all");
        reply = "I'd love to help you find the perfect gift! 🌸 Tell me who you are shopping for (e.g. For Mom, For Dad, Gifts for Wife) or the item type you want (e.g. cakes, fresh flowers, PS5 console, chocolates).";
      }

      addMessageBubble(reply, "nelum");
    }, 1500);
  }

  function filterShowcase(category) {
    currentCategory = category;
    
    if (category === "all") {
      renderProducts(NELUM_PRODUCTS);
      renderBundles(NELUM_BUNDLES);
      showcaseTitle.textContent = "Recommended Gifts";
      showcaseTag.textContent = "General Store";
    } else if (category === "birthday") {
      const filtered = NELUM_PRODUCTS.filter(p => ["cakes", "flowers", "toys"].includes(p.category));
      const bundles = NELUM_BUNDLES.filter(b => b.category === "birthday");
      renderProducts(filtered);
      renderBundles(bundles);
      showcaseTitle.textContent = "Birthday Surprises";
      showcaseTag.textContent = "Celebration";
    } else if (category === "sorry") {
      const filtered = NELUM_PRODUCTS.filter(p => ["flowers", "chocolates"].includes(p.category));
      const bundles = NELUM_BUNDLES.filter(b => b.category === "sorry");
      renderProducts(filtered);
      renderBundles(bundles);
      showcaseTitle.textContent = "Apology & Sympathy Gifts";
      showcaseTag.textContent = "Empathetic";
    } else if (category === "anniversary") {
      const filtered = NELUM_PRODUCTS.filter(p => ["flowers", "chocolates", "groceries"].includes(p.category));
      const bundles = NELUM_BUNDLES.filter(b => b.category === "anniversary");
      renderProducts(filtered);
      renderBundles(bundles);
      showcaseTitle.textContent = "Anniversary Celebrations";
      showcaseTag.textContent = "Love & Milestones";
    } else if (category === "mom") {
      const filtered = NELUM_PRODUCTS.filter(p => ["flowers", "chocolates", "groceries"].includes(p.category));
      renderProducts(filtered);
      renderBundles(NELUM_BUNDLES.slice(1));
      showcaseTitle.textContent = "Gifts for Mom";
      showcaseTag.textContent = "Amma";
    } else if (category === "dad") {
      const filtered = NELUM_PRODUCTS.filter(p => ["groceries", "electronics"].includes(p.category));
      renderProducts(filtered);
      renderBundles([]);
      showcaseTitle.textContent = "Gifts for Dad";
      showcaseTag.textContent = "Thaththa";
    } else {
      // Direct category filter
      const filtered = NELUM_PRODUCTS.filter(p => p.category === category);
      const bundles = NELUM_BUNDLES.filter(b => b.category === category);
      renderProducts(filtered);
      renderBundles(bundles);
      
      const categoryNames = {
        cakes: "Freshly Baked Cakes",
        flowers: "Fresh Flower Bouquets",
        chocolates: "Luxury Chocolates",
        groceries: "Premium Ceylon Tea & Groceries",
        electronics: "Electronics & Gaming consoles",
        toys: "Toys & Cuddly Plushies"
      };
      
      showcaseTitle.textContent = categoryNames[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} Gifts`;
      showcaseTag.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    }

    // Scroll right column to top
    document.getElementById("showcase-section").scrollTop = 0;
  }

  function addMessageBubble(text, sender) {
    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble", sender);
    
    if (sender === "nelum") {
      // Support for clean lists and rich bold text references in Nelum replies
      const htmlText = text
        .replace(/\n\n/g, "<br><br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        
      bubble.innerHTML = `
        <div class="nelum-rich-content">
          <p>${htmlText}</p>
        </div>
      `;
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
    // Check if toast already exists
    let toast = document.querySelector(".nelum-toast");
    if (toast) toast.remove();

    toast = document.createElement("div");
    toast.className = "nelum-toast";
    toast.textContent = message;
    
    // Quick inline styling for the premium toast feedback
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
    
    // Trigger animation
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    }, 50);

    // Remove toast
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Auto-grow chat textarea input
  chatInput.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight - 16) + "px";
  });

  // Launch initial execution
  init();
});
