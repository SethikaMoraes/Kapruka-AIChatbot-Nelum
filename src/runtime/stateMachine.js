/**
 * Nelum Conversation State Machine System
 * Implements the State Pattern to coordinate user transitions between discovery, checkout, and tracking.
 */

export class BaseState {
  constructor(stateName) {
    this.stateName = stateName;
  }

  async onEntry(context) {
    console.log(`[StateMachine] Entering state: ${this.stateName} for session: ${context.sessionId}`);
  }

  async onExit(context) {
    console.log(`[StateMachine] Exiting state: ${this.stateName} for session: ${context.sessionId}`);
  }

  validateExit(context) {
    return true;
  }

  determineTransition(context, intentOutput) {
    return this.stateName;
  }
}

// 1. WELCOME
export class WelcomeState extends BaseState {
  constructor() {
    super('WELCOME');
  }

  async onEntry(context) {
    await super.onEntry(context);
    context.extractedEntities = {};
  }

  validateExit(context) {
    return true;
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'ORDER_TRACK') return 'ORDER_TRACKING';
    if (primary === 'GIFT_DISCOVERY') return 'GIFT_DISCOVERY';
    if (primary === 'PRODUCT_SEARCH') return 'PRODUCT_SEARCH';
    if (primary === 'BUNDLE_BUILDING') return 'BUNDLE_BUILDING';
    return 'DISCOVERY';
  }
}

// 2. DISCOVERY
export class DiscoveryState extends BaseState {
  constructor() {
    super('DISCOVERY');
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'ORDER_TRACK') return 'ORDER_TRACKING';
    if (primary === 'GIFT_DISCOVERY') return 'GIFT_DISCOVERY';
    if (primary === 'PRODUCT_SEARCH') return 'PRODUCT_SEARCH';
    if (primary === 'BUNDLE_BUILDING') return 'BUNDLE_BUILDING';
    if (primary === 'CART_ADD') return 'CART_BUILDING';
    return 'DISCOVERY';
  }
}

// 3. GIFT_DISCOVERY
export class GiftDiscoveryState extends BaseState {
  constructor() {
    super('GIFT_DISCOVERY');
  }

  validateExit(context) {
    // Require recipient and occasion before moving forward to cart or delivery
    const hasRecipient = !!context.extractedEntities?.recipient;
    const hasOccasion = !!context.extractedEntities?.occasion;
    return hasRecipient && hasOccasion;
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'ORDER_TRACK') return 'ORDER_TRACKING';
    if (primary === 'BUNDLE_BUILDING') return 'BUNDLE_BUILDING';
    if (primary === 'PRODUCT_SEARCH') return 'PRODUCT_SEARCH';
    if (primary === 'CART_ADD') return 'CART_BUILDING';
    return 'GIFT_DISCOVERY';
  }
}

// 4. PRODUCT_SEARCH
export class ProductSearchState extends BaseState {
  constructor() {
    super('PRODUCT_SEARCH');
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'ORDER_TRACK') return 'ORDER_TRACKING';
    if (primary === 'PRODUCT_FILTERING') return 'PRODUCT_SEARCH'; // stay in search, refining
    if (primary === 'PRODUCT_COMPARISON') return 'PRODUCT_SEARCH';
    if (primary === 'CART_ADD') return 'CART_BUILDING';
    return 'PRODUCT_SEARCH';
  }
}

// 5. PRODUCT_SELECTION
export class ProductSelectionState extends BaseState {
  constructor() {
    super('PRODUCT_SELECTION');
  }

  determineTransition(context, intentOutput) {
    if (intentOutput.primaryIntent === 'CART_ADD') {
      return 'CART_BUILDING';
    }
    return 'PRODUCT_SELECTION';
  }
}

// 6. BUNDLE_BUILDING
export class BundleBuildingState extends BaseState {
  constructor() {
    super('BUNDLE_BUILDING');
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'CART_ADD') return 'CART_BUILDING';
    if (primary === 'PRODUCT_SEARCH') return 'PRODUCT_SEARCH';
    return 'BUNDLE_BUILDING';
  }
}

// 7. CART_BUILDING
export class CartBuildingState extends BaseState {
  constructor() {
    super('CART_BUILDING');
  }

  validateExit(context) {
    // Require at least one item in the cart to check out
    return context.cart?.items && context.cart.items.length > 0;
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'ORDER_TRACK') return 'ORDER_TRACKING';
    if (primary === 'CHECKOUT') {
      return 'DELIVERY_COLLECTION';
    }
    if (primary === 'PRODUCT_SEARCH') return 'PRODUCT_SEARCH';
    if (primary === 'GIFT_DISCOVERY') return 'GIFT_DISCOVERY';
    return 'CART_BUILDING';
  }
}

// 8. DELIVERY_COLLECTION
export class DeliveryCollectionState extends BaseState {
  constructor() {
    super('DELIVERY_COLLECTION');
  }

  validateExit(context) {
    // Collect destination details
    return !!context.delivery?.address && !!context.delivery?.recipientName;
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'ORDER_TRACK') return 'ORDER_TRACKING';
    if (this.validateExit(context)) {
      return 'DELIVERY_VALIDATION';
    }
    return 'DELIVERY_COLLECTION';
  }
}

// 9. DELIVERY_VALIDATION
export class DeliveryValidationState extends BaseState {
  constructor() {
    super('DELIVERY_VALIDATION');
  }

  validateExit(context) {
    // Recipient name, phone, address, and date must be populated and valid
    const dev = context.delivery || {};
    return !!dev.recipientName && !!dev.recipientPhone && !!dev.address && !!dev.date;
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'ORDER_TRACK') return 'ORDER_TRACKING';
    if (this.validateExit(context)) {
      return 'ORDER_REVIEW';
    }
    return 'DELIVERY_COLLECTION'; // Go back to collect details if validation fails
  }
}

// 10. ORDER_REVIEW
export class OrderReviewState extends BaseState {
  constructor() {
    super('ORDER_REVIEW');
  }

  validateExit(context) {
    const dev = context.delivery || {};
    return !!(context.cart?.items?.length > 0 && dev.recipientName && dev.recipientPhone && dev.address && dev.date);
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'ORDER_TRACK') return 'ORDER_TRACKING';
    if (primary === 'CHECKOUT' && this.validateExit(context)) {
      return 'CHECKOUT';
    }
    return 'ORDER_REVIEW';
  }
}

// 11. CHECKOUT
export class CheckoutState extends BaseState {
  constructor() {
    super('CHECKOUT');
  }

  validateExit(context) {
    return !!context.trackingReference;
  }

  determineTransition(context, intentOutput) {
    if (this.validateExit(context)) {
      return 'ORDER_TRACKING';
    }
    return 'CHECKOUT';
  }
}

// 12. PAYMENT_LINK_GENERATION
export class PaymentLinkGenerationState extends BaseState {
  constructor() {
    super('PAYMENT_LINK_GENERATION');
  }

  determineTransition(context, intentOutput) {
    return 'ORDER_TRACKING';
  }
}

// 13. ORDER_TRACKING
export class OrderTrackingState extends BaseState {
  constructor() {
    super('ORDER_TRACKING');
  }

  determineTransition(context, intentOutput) {
    const primary = intentOutput.primaryIntent;
    if (primary === 'GOODBYE') {
      return 'GOODBYE';
    }
    if (primary === 'GREETING') {
      return 'WELCOME';
    }
    if (primary === 'GIFT_DISCOVERY') {
      return 'GIFT_DISCOVERY';
    }
    if (primary === 'PRODUCT_SEARCH') {
      return 'PRODUCT_SEARCH';
    }
    if (primary === 'BUNDLE_BUILDING') {
      return 'BUNDLE_BUILDING';
    }
    if (primary === 'CART_ADD') {
      return 'CART_BUILDING';
    }
    return 'ORDER_TRACKING';
  }
}

// 14. POST_PURCHASE
export class PostPurchaseState extends BaseState {
  constructor() {
    super('POST_PURCHASE');
  }

  determineTransition(context, intentOutput) {
    if (intentOutput.primaryIntent === 'GREETING') return 'WELCOME';
    return 'POST_PURCHASE';
  }
}

// 15. GOODBYE
export class GoodbyeState extends BaseState {
  constructor() {
    super('GOODBYE');
  }

  determineTransition(context, intentOutput) {
    if (intentOutput.primaryIntent === 'GREETING') return 'WELCOME';
    return 'GOODBYE';
  }
}

// New Companion Engine States
export class GreetingState extends BaseState {
  constructor() {
    super('GREETING');
  }
}

export class RelationshipDiscoveryState extends BaseState {
  constructor() {
    super('RELATIONSHIP_DISCOVERY');
  }
}

export class OccasionDiscoveryState extends BaseState {
  constructor() {
    super('OCCASION_DISCOVERY');
  }
}

export class BudgetDiscoveryState extends BaseState {
  constructor() {
    super('BUDGET_DISCOVERY');
  }
}

export class PreferenceDiscoveryState extends BaseState {
  constructor() {
    super('PREFERENCE_DISCOVERY');
  }
}

export class RecommendationState extends BaseState {
  constructor() {
    super('RECOMMENDATION');
  }
}

export class ComparisonState extends BaseState {
  constructor() {
    super('COMPARISON');
  }
}

export class DeliveryState extends BaseState {
  constructor() {
    super('DELIVERY');
  }
}

export class TrackingState extends BaseState {
  constructor() {
    super('TRACKING');
  }
}

/**
 * Registry of all available States in the system
 */
export class StateMachineRegistry {
  constructor() {
    this.states = new Map();
    this.registerState(new WelcomeState());
    this.states.set('DISCOVERY', new DiscoveryState());
    this.states.set('GIFT_DISCOVERY', new GiftDiscoveryState());
    this.states.set('PRODUCT_SEARCH', new ProductSearchState());
    this.states.set('PRODUCT_SELECTION', new ProductSelectionState());
    this.states.set('BUNDLE_BUILDING', new BundleBuildingState());
    this.states.set('CART_BUILDING', new CartBuildingState());
    this.states.set('DELIVERY_COLLECTION', new DeliveryCollectionState());
    this.states.set('DELIVERY_VALIDATION', new DeliveryValidationState());
    this.states.set('ORDER_REVIEW', new OrderReviewState());
    this.states.set('CHECKOUT', new CheckoutState());
    this.states.set('PAYMENT_LINK_GENERATION', new PaymentLinkGenerationState());
    this.states.set('ORDER_TRACKING', new OrderTrackingState());
    this.states.set('POST_PURCHASE', new PostPurchaseState());
    this.states.set('GOODBYE', new GoodbyeState());

    // Register companion states
    this.states.set('GREETING', new GreetingState());
    this.states.set('RELATIONSHIP_DISCOVERY', new RelationshipDiscoveryState());
    this.states.set('OCCASION_DISCOVERY', new OccasionDiscoveryState());
    this.states.set('BUDGET_DISCOVERY', new BudgetDiscoveryState());
    this.states.set('PREFERENCE_DISCOVERY', new PreferenceDiscoveryState());
    this.states.set('RECOMMENDATION', new RecommendationState());
    this.states.set('COMPARISON', new ComparisonState());
    this.states.set('DELIVERY', new DeliveryState());
    this.states.set('TRACKING', new TrackingState());
  }

  registerState(stateInstance) {
    this.states.set(stateInstance.stateName, stateInstance);
  }

  /**
   * Retrieves a state instance by its name tag.
   * @param {string} stateName 
   * @returns {BaseState}
   */
  getState(stateName) {
    const stateObj = this.states.get(stateName);
    if (!stateObj) {
      console.warn(`[StateMachine] Warning: state "${stateName}" not registered, falling back to WELCOME`);
      return this.states.get('WELCOME');
    }
    return stateObj;
  }
}
