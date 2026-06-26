/**
 * Nelum AI Cart Component Controller
 */
import { appState } from '../../state/appState.js';
import { uiController } from '../common/uiController.js';
import { kaprukaClient } from '../../api/kaprukaClient.js';
import { memoryStore } from '../../memory/memoryStore.js';
import { habitLearningEngine } from '../../memory/habitLearningEngine.js';
import { eventBus } from '../../utils/eventBus.js';
import { EVENTS } from '../../constants/event.constants.js';

export const cartController = {
  /**
   * Toggles cart visibility drawer.
   */
  toggleCartDrawer(open) {
    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) {
      cartDrawer.style.display = open ? "block" : "none";
    }
  },

  /**
   * Adds an item to the shopping cart.
   */
  async addToCart(itemId, isBundle) {
    try {
      let item = null;
      if (isBundle) {
        const currentBundles = appState.getCurrentBundles();
        item = currentBundles.find(b => b.id === itemId);
      } else {
        item = await kaprukaClient.getProduct(itemId);
      }

      if (!item) return;

      const manager = appState.getManager();
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
      
      appState.setCart(activeCtx.cart.items);
      this.updateCartUI();
      uiController.showToast(`Added "${item.title}" to your gift bundle!`);
      
      const btnCartToggle = document.getElementById("btn-cart-toggle");
      if (btnCartToggle) {
        btnCartToggle.style.transform = "scale(1.15)";
        setTimeout(() => btnCartToggle.style.transform = "scale(1)", 200);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      uiController.showToast("Could not add item to cart.");
    }
  },

  /**
   * Removes an item from the shopping cart.
   */
  removeFromCart(index) {
    const manager = appState.getManager();
    memoryStore.loadSession('default-session').then(context => {
      if (context && context.cart && context.cart.items) {
        const removedItem = context.cart.items[index];
        context.cart.items.splice(index, 1);
        manager.recalculateCartSubtotal(context);
        memoryStore.saveSession('default-session', context).then(() => {
          appState.setCart(context.cart.items);
          this.updateCartUI();
          uiController.showToast(`Removed "${removedItem.title}"`);
        });
      }
    });
  },

  /**
   * Refreshes the cart UI elements and values.
   */
  updateCartUI() {
    const cart = appState.getCart();
    const count = cart.length;
    
    const cartCountBadge = document.getElementById("cart-count");
    const mobileCartCountBadge = document.getElementById("mobile-cart-count");
    const cartEmpty = document.getElementById("cart-empty");
    const cartActive = document.getElementById("cart-active");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartSubtotal = document.getElementById("cart-subtotal");
    const cartTotal = document.getElementById("cart-total");

    if (cartCountBadge) cartCountBadge.textContent = count;
    if (mobileCartCountBadge) mobileCartCountBadge.textContent = count;

    if (!cartItemsContainer || !cartEmpty || !cartActive) return;

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
      if (cartSubtotal) cartSubtotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
      if (cartTotal) cartTotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
    }
  },

  /**
   * Opens the delivery options details collection popup modal.
   */
  openDeliveryModal() {
    const cart = appState.getCart();
    if (cart.length === 0) {
      uiController.showToast("Your cart is empty! Add gifts first.");
      return;
    }

    const deliverySummaryItems = document.getElementById("delivery-summary-items");
    const giftMessageInput = document.getElementById("gift-message");
    const deliveryCardPreview = document.getElementById("delivery-card-preview");
    const previewTextContent = document.getElementById("preview-text-content");
    const deliveryModal = document.getElementById("delivery-modal");

    if (deliverySummaryItems) {
      deliverySummaryItems.innerHTML = cart.map(item => `
        <div class="summary-item-card">
          <img class="summary-item-img" src="${item.image}" alt="${item.title}">
          <div class="summary-item-info">
            <h5 class="summary-item-title">${item.title}</h5>
            <span class="summary-item-price">Rs. ${item.price.toLocaleString()}</span>
          </div>
        </div>
      `).join("");
    }

    const msg = giftMessageInput ? giftMessageInput.value.trim() : "";
    if (msg) {
      if (deliveryCardPreview) deliveryCardPreview.style.display = "block";
      if (previewTextContent) previewTextContent.textContent = `"${msg}"`;
    } else {
      if (deliveryCardPreview) deliveryCardPreview.style.display = "none";
    }

    if (deliveryModal) deliveryModal.style.display = "flex";
  },

  /**
   * Submits checkout form details, hits create order proxy, triggers billing flow.
   */
  placeOrder() {
    const rName = document.getElementById("recipient-name").value.trim();
    const rPhone = document.getElementById("recipient-phone").value.trim();
    const rAddress = document.getElementById("delivery-address").value.trim();
    const dDate = document.getElementById("delivery-date").value;
    const dTime = document.getElementById("delivery-time").value;
    const sName = document.getElementById("sender-name").value.trim();
    const giftMessageInput = document.getElementById("gift-message");
    const deliveryModal = document.getElementById("delivery-modal");
    const trackingModal = document.getElementById("tracking-modal");
    const cart = appState.getCart();

    const manager = appState.getManager();
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
          const activeOrder = {
            recipientName: rName,
            recipientPhone: rPhone,
            recipientAddress: rAddress,
            deliveryDate: dDate,
            deliveryTime: dTime,
            senderName: sName,
            items: [...cart],
            message: giftMessageInput ? giftMessageInput.value.trim() : "",
            orderId: result.orderId
          };

          appState.setActiveOrder(activeOrder);

          // Emit event: ORDER_CREATED
          eventBus.emit(EVENTS.ORDER_CREATED, activeOrder);

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
            appState.setCart([]);
            this.updateCartUI();
            if (giftMessageInput) giftMessageInput.value = "";
            if (deliveryModal) deliveryModal.style.display = "none";
            if (trackingModal) trackingModal.style.display = "flex";

            // Setup card payment box and simulation link
            const payBox = document.getElementById("track-payment-box");
            const payBtn = document.getElementById("btn-pay-now");
            if (payBox && payBtn && result.paymentUrl) {
              payBox.style.display = "block";
              payBtn.href = result.paymentUrl;
              
              appState.setActiveTrackingStep(1);
              this.updateTrackingTimelineUI();
              appState.clearTrackingInterval();
              
              const newPayBtn = payBtn.cloneNode(true);
              payBtn.parentNode.replaceChild(newPayBtn, payBtn);
              
              newPayBtn.addEventListener("click", (evt) => {
                evt.preventDefault();
                uiController.showToast("Opening payment gateway tab...");
                window.open(result.paymentUrl, '_blank');
                
                setTimeout(() => {
                  payBox.style.display = "none";
                  uiController.showToast("Payment confirmed! Dispatched for baking & florist collection. 🌸");
                  this.startTrackingSimulation();
                }, 3000);
              });
            } else {
              this.startTrackingSimulation();
            }
          });
        });
      }
    });
  },

  /**
   * Simulates tracking milestones status loops.
   */
  startTrackingSimulation() {
    appState.setActiveTrackingStep(1);
    this.updateTrackingTimelineUI();

    appState.clearTrackingInterval();

    const interval = setInterval(() => {
      let currentStep = appState.getActiveTrackingStep();
      if (currentStep < 5) {
        currentStep++;
        appState.setActiveTrackingStep(currentStep);
        this.updateTrackingTimelineUI();
        
        let notifyMessage = "";
        if (currentStep === 2) {
          notifyMessage = "Nelum is preparing your cake & choosing fresh flowers in Colombo! 🎂💐";
        } else if (currentStep === 3) {
          notifyMessage = "Your custom gift card is handwritten. Dispatching quality inspection. ✨";
        } else if (currentStep === 4) {
          notifyMessage = "Package has been dispatched! Driver is out for delivery. 🚗";
        } else if (currentStep === 5) {
          notifyMessage = "Surprise package delivered successfully! Check your photo email confirmation. 🎁";
          appState.clearTrackingInterval();
        }
        uiController.showToast(notifyMessage);
      }
    }, 12000);

    appState.setTrackingInterval(interval);
  },

  /**
   * Refreshes the color state highlights in tracking timeline dots.
   */
  updateTrackingTimelineUI() {
    const timelineSteps = document.querySelectorAll(".timeline-step");
    const activeTrackingStep = appState.getActiveTrackingStep();
    timelineSteps.forEach((step, idx) => {
      step.classList.remove("active", "completed");
      if (idx + 1 < activeTrackingStep) {
        step.classList.add("completed");
      } else if (idx + 1 === activeTrackingStep) {
        step.classList.add("active");
      }
    });
  }
};

export default cartController;
