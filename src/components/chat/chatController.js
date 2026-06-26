/**
 * Nelum AI Chat Component Controller
 */
import { appState } from '../../state/appState.js';
import { uiController } from '../common/uiController.js';
import { voiceController } from '../../voice/voiceController.js';
import { kaprukaClient } from '../../api/kaprukaClient.js';
import { memoryStore } from '../../memory/memoryStore.js';
import { preferenceEngine } from '../../memory/preferenceEngine.js';
import { productsController } from '../products/productsController.js';
import { eventBus } from '../../utils/eventBus.js';
import { EVENTS } from '../../constants/event.constants.js';

export const chatController = {
  /**
   * Appends a message bubble (with products or bundles if provided) to the chat.
   */
  addMessageBubble(text, sender, productsList = null, bundlesList = null) {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

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
  },

  /**
   * Sends the text input value to the active state session.
   */
  sendTextMessage() {
    const chatInput = document.getElementById("chatInput");
    const chatHero = document.getElementById("chat-hero");
    const chatMessages = document.getElementById("chat-messages");
    if (!chatInput || !chatHero || !chatMessages) return;

    const text = chatInput.value.trim();
    if (!text) return;

    chatHero.style.display = "none";
    chatMessages.style.display = "flex";

    this.addMessageBubble(text, "user");
    chatInput.value = "";
    chatInput.style.height = "auto";

    uiController.showTypingIndicator(true);

    // Emit event: MESSAGE_SENT
    eventBus.emit(EVENTS.MESSAGE_SENT, { text });

    const manager = appState.getManager();
    manager.processMessage('default-session', text).then(reply => {
      uiController.showTypingIndicator(false);
      
      memoryStore.loadSession('default-session').then(context => {
        if (context && context.cart) {
          appState.setCart(context.cart.items);
          // Trigger custom event or sync UI in event bindings
          const syncCartEvent = new CustomEvent("sync-cart-ui");
          document.dispatchEvent(syncCartEvent);
        }
        this.fetchAndAddNelumMessage(reply, context);
      });
    }).catch(err => {
      uiController.showTypingIndicator(false);
      this.addMessageBubble("Aiyo 😅 I ran into a small error. Let's try again! 🌸", "nelum");
    });
  },

  /**
   * Helper that checks response state and fetches catalog details inline if necessary.
   */
  async fetchAndAddNelumMessage(replyText, context) {
    const showProducts = ['RECOMMENDATION', 'COMPARISON', 'PRODUCT_SEARCH'].includes(context?.activeState);
    if (!showProducts) {
      this.addMessageBubble(replyText, "nelum");
      return;
    }

    if (context?.recommendedProducts && context.recommendedProducts.length > 0) {
      const displayProducts = context.recommendedProducts.slice(0, 6);
      const dynamicBundles = productsController.generateDynamicBundles(displayProducts);
      this.addMessageBubble(replyText, "nelum", displayProducts, dynamicBundles);
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
      const dynamicBundles = productsController.generateDynamicBundles(liveProducts);

      this.addMessageBubble(replyText, "nelum", displayProducts, dynamicBundles);
    } catch (err) {
      console.error("Error loading inline products:", err);
      this.addMessageBubble(replyText, "nelum");
    }
  },

  /**
   * Handles user interaction triggers via conversation starters.
   */
  handleStarterClick(label, context) {
    const chatHero = document.getElementById("chat-hero");
    const chatMessages = document.getElementById("chat-messages");
    if (chatHero) chatHero.style.display = "none";
    if (chatMessages) chatMessages.style.display = "flex";

    this.addMessageBubble(`I am looking for a ${label}.`, "user");
    uiController.showTypingIndicator(true);

    const manager = appState.getManager();
    manager.processMessage('default-session', `I am looking for a ${label}`).then(reply => {
      uiController.showTypingIndicator(false);
      
      memoryStore.loadSession('default-session').then(sessionContext => {
        if (sessionContext && sessionContext.cart) {
          appState.setCart(sessionContext.cart.items);
          const syncCartEvent = new CustomEvent("sync-cart-ui");
          document.dispatchEvent(syncCartEvent);
        }
        this.fetchAndAddNelumMessage(reply, sessionContext);
      });
    });
  },

  /**
   * Schedules a reminder recommendation surprise.
   */
  handleReminderSchedule(recipientName) {
    const chatHero = document.getElementById("chat-hero");
    const chatMessages = document.getElementById("chat-messages");
    if (chatHero) chatHero.style.display = "none";
    if (chatMessages) chatMessages.style.display = "flex";
    
    this.addMessageBubble(`Schedule a birthday surprise for ${recipientName} like last year.`, "user");
    uiController.showTypingIndicator(true);
    
    memoryStore.loadUserProfile('default-user').then(profile => {
      const today = '2026-06-17';
      const reminders = preferenceEngine.checkUpcomingOccasions(profile, today);
      const reminder = reminders.find(r => r.recipient === recipientName);
      if (!reminder) {
        uiController.showTypingIndicator(false);
        this.addMessageBubble("Aiyo, I couldn't locate the birthday reminder. Let's find some gifts manually!", "nelum");
        return;
      }
      
      const manager = appState.getManager();
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
            appState.setCart(activeCtx.cart.items);
            
            // Sync values to form
            document.getElementById("recipient-name").value = activeCtx.delivery.recipientName;
            document.getElementById("recipient-phone").value = activeCtx.delivery.recipientPhone;
            document.getElementById("delivery-address").value = activeCtx.delivery.address;
            document.getElementById("delivery-date").value = activeCtx.delivery.date;
            document.getElementById("delivery-time").value = activeCtx.delivery.timeWindow;
            document.getElementById("sender-name").value = activeCtx.delivery.senderName;
            
            const syncCartEvent = new CustomEvent("sync-cart-ui");
            document.dispatchEvent(syncCartEvent);
            
            kaprukaClient.searchProducts("cake").then(liveProducts => {
              const displayProducts = liveProducts.slice(0, 4);
              const dynamicBundles = productsController.generateDynamicBundles(liveProducts);
              uiController.showTypingIndicator(false);
              this.addMessageBubble(`All set! I've loaded your surprise details for **${reminder.recipient}**. I've added the **${item.title}** (Rs. ${item.price.toLocaleString()}) to your cart and pre-filled the delivery address. You can review your gifts in the drawer and proceed when ready! 🌸`, "nelum", displayProducts, dynamicBundles);
            }).catch(err => {
              uiController.showTypingIndicator(false);
              this.addMessageBubble(`All set! I've loaded your surprise details for **${reminder.recipient}**. I've added the **${item.title}** (Rs. ${item.price.toLocaleString()}) to your cart and pre-filled the delivery address. You can review your gifts in the drawer and proceed when ready! 🌸`, "nelum");
            });
          });
        });
      });
    });
  },

  /**
   * Triggers a fast quick action prompt selection.
   */
  async handleQuickAction(label, action) {
    const chatHero = document.getElementById("chat-hero");
    const chatMessages = document.getElementById("chat-messages");
    if (chatHero) chatHero.style.display = "none";
    if (chatMessages) chatMessages.style.display = "flex";

    this.addMessageBubble(label, "user");
    uiController.showTypingIndicator(true);

    try {
      const manager = appState.getManager();
      const reply = await manager.processMessage('default-session', label);
      uiController.showTypingIndicator(false);
      
      const sessionContext = await memoryStore.loadSession('default-session');
      if (sessionContext && sessionContext.cart) {
        appState.setCart(sessionContext.cart.items);
        const syncCartEvent = new CustomEvent("sync-cart-ui");
        document.dispatchEvent(syncCartEvent);
      }

      if (action === "price-5000") {
        sessionContext.extractedEntities.budget = 5000;
      } else if (action === "price-10000") {
        sessionContext.extractedEntities.budget = 10000;
      } else if (action === "delivery-sameday") {
        sessionContext.extractedEntities.deliveryMode = 'same-day';
      }

      this.fetchAndAddNelumMessage(reply, sessionContext);
    } catch (err) {
      uiController.showTypingIndicator(false);
      console.error("Error executing quick action:", err);
      this.addMessageBubble("Aiyo 😅 I ran into a small error. Let's try again! 🌸", "nelum");
    }
  }
};

export default chatController;
