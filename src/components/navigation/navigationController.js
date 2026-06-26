/**
 * Nelum AI Navigation Component Controller
 */
import { appState } from '../../state/appState.js';
import { uiController } from '../common/uiController.js';
import { chatController } from '../chat/chatController.js';
import { productsController } from '../products/productsController.js';
import { kaprukaClient } from '../../api/kaprukaClient.js';
import { memoryStore } from '../../memory/memoryStore.js';
import { CATEGORY_REPLIES, CATEGORY_QUERIES } from '../../constants/ui.constants.js';

export const navigationController = {
  /**
   * Sidebar Category click logic.
   */
  async handleCategoryClick(categoryKey, label) {
    const chatHero = document.getElementById("chat-hero");
    const chatMessages = document.getElementById("chat-messages");
    if (chatHero) chatHero.style.display = "none";
    if (chatMessages) chatMessages.style.display = "flex";

    chatController.addMessageBubble(`I want to explore ${label}`, "user");
    uiController.showTypingIndicator(true);

    const replyText = CATEGORY_REPLIES[categoryKey] || `Looking for ${label}? 🌸 Let me help you find the best options in our catalog!`;

    try {
      const manager = appState.getManager();
      const sessionContext = await memoryStore.loadSession('default-session') || manager.createNewContext('default-session');
      sessionContext.activeState = 'PRODUCT_SEARCH';
      sessionContext.extractedEntities = {
        ...sessionContext.extractedEntities,
        category: categoryKey
      };
      await memoryStore.saveSession('default-session', sessionContext);

      const searchWord = CATEGORY_QUERIES[categoryKey] || categoryKey;
      const liveProducts = await kaprukaClient.searchProducts(searchWord);
      const displayProducts = liveProducts.slice(0, 6);
      const dynamicBundles = productsController.generateDynamicBundles(liveProducts);

      document.querySelectorAll(".sidebar-menu li").forEach(li => {
        li.classList.remove("active");
        if (li.getAttribute("data-category") === categoryKey) {
          li.classList.add("active");
        }
      });

      uiController.showTypingIndicator(false);
      chatController.addMessageBubble(replyText, "nelum", displayProducts, dynamicBundles);
    } catch (err) {
      uiController.showTypingIndicator(false);
      console.error("Error handling category click:", err);
      chatController.addMessageBubble(`Let's search for ${label}! 🌸`, "nelum");
    }
  },

  /**
   * Action triggers from secondary sub-navigation tabs (Shop, Rush, Sale, Events, For You, etc.).
   */
  async handleSecondaryNavClick(actionKey, label) {
    const chatHero = document.getElementById("chat-hero");
    const chatMessages = document.getElementById("chat-messages");
    if (chatHero) chatHero.style.display = "none";
    if (chatMessages) chatMessages.style.display = "flex";

    chatController.addMessageBubble(label, "user");
    uiController.showTypingIndicator(true);

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

    const manager = appState.getManager();
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
      const dynamicBundles = productsController.generateDynamicBundles(liveProducts);

      uiController.showTypingIndicator(false);
      chatController.addMessageBubble(replyText, "nelum", displayProducts, dynamicBundles);
    } catch (err) {
      uiController.showTypingIndicator(false);
      console.error("Error executing secondary nav action:", err);
      chatController.addMessageBubble(replyText, "nelum");
    }
  },

  /**
   * Switches mobile views (tabs layout).
   */
  switchMobileTab(tab) {
    const navChat = document.getElementById("nav-chat");
    const navDiscover = document.getElementById("nav-discover");
    const categoriesSidebar = document.getElementById("categories-sidebar");

    document.querySelectorAll(".mobile-nav-item").forEach(item => item.classList.remove("active"));
    
    if (tab === "chat") {
      if (navChat) navChat.classList.add("active");
      if (categoriesSidebar) categoriesSidebar.classList.remove("sidebar-open");
    } else if (tab === "discover") {
      if (navDiscover) navDiscover.classList.add("active");
      if (categoriesSidebar) {
        categoriesSidebar.classList.toggle("sidebar-open");
      }
    }
  }
};

export default navigationController;
