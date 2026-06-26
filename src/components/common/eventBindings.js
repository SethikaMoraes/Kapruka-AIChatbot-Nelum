/**
 * Nelum AI Event Bindings Configuration
 */
import { appState } from '../../state/appState.js';
import { uiController } from './uiController.js';
import { chatController } from '../chat/chatController.js';
import { cartController } from '../cart/cartController.js';
import { productsController } from '../products/productsController.js';
import { navigationController } from '../navigation/navigationController.js';
import { voiceController } from '../../voice/voiceController.js';
import { kaprukaClient } from '../../api/kaprukaClient.js';
import { memoryStore } from '../../memory/memoryStore.js';
import { preferenceEngine } from '../../memory/preferenceEngine.js';
import { eventBus } from '../../utils/eventBus.js';
import { EVENTS } from '../../constants/event.constants.js';

export const eventBindings = {
  /**
   * Initializes all event bindings on page load.
   */
  setup() {
    const startersGrid = document.getElementById("starters-grid");
    const quickChipsContainer = document.getElementById("quick-chips");
    const chatInput = document.getElementById("chatInput");
    const btnSend = document.getElementById("sendBtn");
    const btnVoice = document.getElementById("btn-voice");
    const btnVoiceCancel = document.getElementById("btn-voice-cancel");
    const btnAttach = document.getElementById("btn-attach");
    const btnCartToggle = document.getElementById("btn-cart-toggle");
    const btnCloseCart = document.getElementById("btn-close-cart");
    const btnCartShop = document.getElementById("btn-cart-shop");
    const btnCloseProduct = document.getElementById("btn-close-product");
    const btnDetailAdd = document.getElementById("btn-detail-add");
    const btnDetailSave = document.getElementById("btn-detail-save");
    const thumb1 = document.getElementById("thumb-1");
    const thumb2 = document.getElementById("thumb-2");
    const thumb3 = document.getElementById("thumb-3");
    const cartItemsContainer = document.getElementById("cart-items");
    const giftMessageInput = document.getElementById("gift-message");
    const btnContinueDelivery = document.getElementById("btn-continue-delivery");
    const btnReviewGifts = document.getElementById("btn-review-gifts");
    const btnCloseDelivery = document.getElementById("btn-close-delivery");
    const deliveryForm = document.getElementById("delivery-form");
    const btnCloseTracking = document.getElementById("btn-close-tracking");
    const btnTrackChat = document.getElementById("btn-track-chat");
    const navChat = document.getElementById("nav-chat");
    const navDiscover = document.getElementById("nav-discover");
    const navCart = document.getElementById("nav-cart");
    const navOrders = document.getElementById("nav-orders");
    const chatMessages = document.getElementById("chat-messages");

    // Starter Prompts Click
    if (startersGrid) {
      startersGrid.addEventListener("click", (e) => {
        const btn = e.target.closest(".starter-btn");
        if (!btn) return;
        const context = btn.getAttribute("data-context");
        const label = btn.querySelector("span:last-child").textContent;
        
        if (context.startsWith("schedule-reminder:")) {
          const recipientName = context.split(":")[1];
          chatController.handleReminderSchedule(recipientName);
        } else {
          chatController.handleStarterClick(label, context);
        }
      });
    }

    // Quick Chips Click
    if (quickChipsContainer) {
      quickChipsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".chip-btn");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const label = btn.textContent.trim();
        chatController.handleQuickAction(label, action);
      });
    }

    // Send Button and Keyboard text input
    if (btnSend) {
      btnSend.addEventListener("click", () => chatController.sendTextMessage());
    }
    if (chatInput) {
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          chatController.sendTextMessage();
        }
      });
    }

    // Sidebar Category clicks
    const categoriesSidebar = document.getElementById("categories-sidebar");
    if (categoriesSidebar) {
      categoriesSidebar.addEventListener("click", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        const categoryKey = li.getAttribute("data-category");
        const label = li.textContent.trim();
        navigationController.handleCategoryClick(categoryKey, label);
        
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
        navigationController.handleSecondaryNavClick(actionKey, label);
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
          const manager = appState.getManager();
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
            chatController.addMessageBubble(msg, "nelum");
          });
        });
      });
    }

    // Top Nav buttons
    const btnTrackOrdersNav = document.getElementById("btn-track-orders-nav");
    if (btnTrackOrdersNav) {
      btnTrackOrdersNav.addEventListener("click", () => {
        const chatHero = document.getElementById("chat-hero");
        const chatMessagesEl = document.getElementById("chat-messages");
        const trackingModal = document.getElementById("tracking-modal");
        
        if (chatHero) chatHero.style.display = "none";
        if (chatMessagesEl) chatMessagesEl.style.display = "flex";
        
        const activeOrder = appState.getActiveOrder();
        if (activeOrder) {
          if (trackingModal) trackingModal.style.display = "flex";
        } else {
          chatController.addMessageBubble("Track my order", "user");
          uiController.showTypingIndicator(true);
          setTimeout(() => {
            uiController.showTypingIndicator(false);
            chatController.addMessageBubble("Let's check your order! 📦 Please enter your Kapruka Order Reference (e.g. #KP-74892) in the chat input below, and I'll fetch the live tracking details for you.", "nelum");
          }, 800);
        }
      });
    }

    const btnUserProfileNav = document.getElementById("btn-user-profile-nav");
    if (btnUserProfileNav) {
      btnUserProfileNav.addEventListener("click", () => {
        const chatHero = document.getElementById("chat-hero");
        const chatMessagesEl = document.getElementById("chat-messages");
        if (chatHero) chatHero.style.display = "none";
        if (chatMessagesEl) chatMessagesEl.style.display = "flex";
        
        chatController.addMessageBubble("Show my user profile", "user");
        uiController.showTypingIndicator(true);
        setTimeout(() => {
          uiController.showTypingIndicator(false);
          chatController.addMessageBubble("Here is your profile information 👤\n\n• **Name**: Sethika Moraes\n• **Saved Address**: No. 23, Flower Road, Colombo 07\n• **Preferred Delivery City**: Colombo\n• **Frequent Occasions**: Mother's Birthday (June 18)\n\nLet me know if you would like me to update your preferences or find suggestions for upcoming occasions! 🌸", "nelum");
        }, 800);
      });
    }

    // Dynamic Delegation inside Chat Bubble
    if (chatMessages) {
      chatMessages.addEventListener("click", (e) => {
        // 1. Add to cart button
        const addBtn = e.target.closest(".chat-card-add-btn");
        if (addBtn) {
          e.stopPropagation();
          const productId = addBtn.getAttribute("data-id");
          cartController.addToCart(productId, false);
          return;
        }

        // 2. View details button
        const detailsBtn = e.target.closest(".chat-card-details-btn");
        if (detailsBtn) {
          e.stopPropagation();
          const productId = detailsBtn.getAttribute("data-id");
          productsController.showProductDetail(productId);
          return;
        }

        // 3. Add bundle button
        const addBundleBtn = e.target.closest(".chat-btn-bundle-add");
        if (addBundleBtn) {
          e.stopPropagation();
          const bundleId = addBundleBtn.getAttribute("data-id");
          cartController.addToCart(bundleId, true);
          return;
        }

        // 4. Clicking the card itself
        const productCard = e.target.closest(".chat-product-card");
        if (productCard) {
          const productId = productCard.getAttribute("data-id");
          productsController.showProductDetail(productId);
          return;
        }
        
        const bundleCard = e.target.closest(".chat-bundle-card");
        if (bundleCard) {
          const bundleId = bundleCard.getAttribute("data-id");
          productsController.showBundleDetail(bundleId);
          return;
        }
      });

      // Scroll hide secondary nav
      let lastScrollTop = 0;
      chatMessages.addEventListener("scroll", () => {
        const st = chatMessages.scrollTop;
        if (!secondaryNav) return;

        if (st > lastScrollTop && st > 30) {
          secondaryNav.classList.add("nav-hidden");
        } else {
          secondaryNav.classList.remove("nav-hidden");
        }
        lastScrollTop = st <= 0 ? 0 : st;
      });
    }

    // Cart Panel Toggles
    if (btnCartToggle) btnCartToggle.addEventListener("click", () => cartController.toggleCartDrawer(true));
    if (btnCloseCart) btnCloseCart.addEventListener("click", () => cartController.toggleCartDrawer(false));
    if (btnCartShop) btnCartShop.addEventListener("click", () => cartController.toggleCartDrawer(false));
    
    // Close Product Detail Modal
    if (btnCloseProduct) {
      btnCloseProduct.addEventListener("click", () => {
        const productDetailModal = document.getElementById("product-detail-modal");
        if (productDetailModal) productDetailModal.style.display = "none";
      });
    }
    
    // Details Modal Actions
    if (btnDetailAdd) {
      btnDetailAdd.addEventListener("click", () => {
        const pId = btnDetailAdd.getAttribute("data-id");
        const isBundle = btnDetailAdd.getAttribute("data-is-bundle") === "true";
        cartController.addToCart(pId, isBundle);
        const productDetailModal = document.getElementById("product-detail-modal");
        if (productDetailModal) productDetailModal.style.display = "none";
      });
    }
    
    if (btnDetailSave) {
      btnDetailSave.addEventListener("click", () => {
        uiController.showToast("Saved to your favorites!");
      });
    }
    
    // Gallery thumbnails click
    [thumb1, thumb2, thumb3].forEach(thumb => {
      if (thumb) {
        thumb.parentElement.addEventListener("click", () => {
          document.querySelectorAll(".detail-gallery-thumbnails .thumb").forEach(t => t.classList.remove("active"));
          thumb.parentElement.classList.add("active");
          const detailImage = document.getElementById("detail-image");
          if (detailImage) detailImage.src = thumb.src;
        });
      }
    });

    // Cart Items Remove Click
    if (cartItemsContainer) {
      cartItemsContainer.addEventListener("click", (e) => {
        const removeBtn = e.target.closest(".cart-item-remove-btn");
        if (!removeBtn) return;
        const index = parseInt(removeBtn.getAttribute("data-index"));
        cartController.removeFromCart(index);
      });
    }

    // Live update greeting card preview on keypress
    if (giftMessageInput) {
      giftMessageInput.addEventListener("input", () => {
        const val = giftMessageInput.value.trim();
        const previewTextContent = document.getElementById("preview-text-content");
        if (previewTextContent) {
          previewTextContent.textContent = val ? `"${val}"` : `"Type a gift message in the cart drawer..."`;
        }
        
        // Sync into backend session cache
        memoryStore.loadSession('default-session').then(context => {
          if (context) {
            context.cart.greetingCardMessage = val;
            memoryStore.saveSession('default-session', context);
          }
        });
      });
    }

    // Flow navigation: Cart -> Delivery Details Screen
    if (btnContinueDelivery) {
      btnContinueDelivery.addEventListener("click", () => {
        cartController.toggleCartDrawer(false);
        cartController.openDeliveryModal();
      });
    }
    
    if (btnReviewGifts) {
      btnReviewGifts.addEventListener("click", () => {
        cartController.toggleCartDrawer(true);
      });
    }

    if (btnCloseDelivery) {
      btnCloseDelivery.addEventListener("click", () => {
        const deliveryModal = document.getElementById("delivery-modal");
        if (deliveryModal) deliveryModal.style.display = "none";
      });
    }

    // Flow navigation: Delivery details -> Order Success & Tracking
    if (deliveryForm) {
      deliveryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        cartController.placeOrder();
      });
    }

    if (btnCloseTracking) {
      btnCloseTracking.addEventListener("click", () => {
        const trackingModal = document.getElementById("tracking-modal");
        if (trackingModal) trackingModal.style.display = "none";
        appState.clearTrackingInterval();
      });
    }

    if (btnTrackChat) {
      btnTrackChat.addEventListener("click", () => {
        const trackingModal = document.getElementById("tracking-modal");
        if (trackingModal) trackingModal.style.display = "none";
        appState.clearTrackingInterval();
        
        chatController.addMessageBubble("Can you verify when the delivery driver will arrive at Colombo 07?", "user");
        uiController.showTypingIndicator(true);
        
        setTimeout(() => {
          uiController.showTypingIndicator(false);
          chatController.addMessageBubble("I've checked with our local Colombo courier service. The driver is currently packaging your fresh Black Forest cake and flowers. They will leave the depot at around 8:30 AM and reach Flower Road by 9:15 AM! I'll ping you here as soon as it goes out. 🚗", "nelum");
        }, 1800);
      });
    }

    // Voice button trigger
    if (btnVoice) {
      btnVoice.addEventListener("click", () => {
        voiceController.handleMicClick();
      });
    }
    if (btnVoiceCancel) {
      btnVoiceCancel.addEventListener("click", () => {
        voiceController.interrupt();
      });
    }

    // Image attachment simulation
    if (btnAttach) {
      btnAttach.addEventListener("click", () => {
        uiController.showToast("Attached inspiration photo! (Nelum will parse your image to recommend gifts)");
        uiController.showTypingIndicator(true);
        setTimeout(() => {
          uiController.showTypingIndicator(false);
          
          kaprukaClient.searchProducts("flower").then(liveProducts => {
            const displayProducts = liveProducts.slice(0, 4);
            const dynamicBundles = productsController.generateDynamicBundles(liveProducts);
            chatController.addMessageBubble("Oh! What a lovely room setup. The soft pink pastel aesthetics look wonderful. Based on this, I recommend our 'Eternal Romance Red Rose Bouquet' or a 'White Lilies' arrangement which fits perfectly into this theme. 🌸", "nelum", displayProducts, dynamicBundles);
          }).catch(err => {
            chatController.addMessageBubble("Oh! What a lovely room setup. The soft pink pastel aesthetics look wonderful. Based on this, I recommend checking our beautiful roses or lilies! 🌸", "nelum");
          });
        }, 2000);
      });
    }

    // --- Mobile Responsive Navigation Clicks ---
    if (navChat) {
      navChat.addEventListener("click", () => navigationController.switchMobileTab("chat"));
    }
    if (navDiscover) {
      navDiscover.addEventListener("click", () => navigationController.switchMobileTab("discover"));
    }
    if (navCart) {
      navCart.addEventListener("click", () => {
        cartController.toggleCartDrawer(true);
        navigationController.switchMobileTab("chat");
      });
    }
    if (navOrders) {
      navOrders.addEventListener("click", () => {
        const activeOrder = appState.getActiveOrder();
        const trackingModal = document.getElementById("tracking-modal");
        if (activeOrder) {
          if (trackingModal) trackingModal.style.display = "flex";
        } else {
          uiController.showToast("You have no active orders to track. Send a gift first! 🎁");
        }
      });
    }

    // Custom sync-cart-ui listener for cross-module integration
    document.addEventListener("sync-cart-ui", () => {
      cartController.updateCartUI();
    });
  }
};

export default eventBindings;
