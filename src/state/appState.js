/**
 * Nelum AI Frontend Application State Store
 */
export class AppState {
  constructor() {
    this.cart = [];
    this.currentCategory = "all";
    this.activeOrder = null;
    this.voiceTimer = null;
    this.trackingInterval = null;
    this.activeTrackingStep = 1;
    this.manager = null;
    this.currentBundles = [];
  }

  setManager(manager) {
    this.manager = manager;
  }

  getManager() {
    return this.manager;
  }

  setCart(items) {
    this.cart = items;
  }

  getCart() {
    return this.cart;
  }

  setCurrentCategory(category) {
    this.currentCategory = category;
  }

  getCurrentCategory() {
    return this.currentCategory;
  }

  setActiveOrder(order) {
    this.activeOrder = order;
  }

  getActiveOrder() {
    return this.activeOrder;
  }

  setVoiceTimer(timer) {
    this.voiceTimer = timer;
  }

  getVoiceTimer() {
    return this.voiceTimer;
  }

  clearVoiceTimer() {
    if (this.voiceTimer) {
      clearTimeout(this.voiceTimer);
      this.voiceTimer = null;
    }
  }

  setTrackingInterval(interval) {
    this.trackingInterval = interval;
  }

  getTrackingInterval() {
    return this.trackingInterval;
  }

  clearTrackingInterval() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  setActiveTrackingStep(step) {
    this.activeTrackingStep = step;
  }

  getActiveTrackingStep() {
    return this.activeTrackingStep;
  }

  setCurrentBundles(bundles) {
    this.currentBundles = bundles;
    window.NELUM_CURRENT_BUNDLES = bundles; // Keep global reference for compatibility
  }

  getCurrentBundles() {
    return this.currentBundles;
  }
}

export const appState = new AppState();
export default appState;
