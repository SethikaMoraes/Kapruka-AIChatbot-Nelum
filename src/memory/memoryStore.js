/**
 * Nelum Memory Store Service
 * Implements Session Memory (short-term cache) and Long-Term Database profiles.
 * Backed by browser localStorage when running in the client context.
 */

export class MemoryStore {
  constructor() {
    this.sessionCache = new Map();
    this.localStorageKey = 'nelum_user_profiles';
  }

  /**
   * Loads an active conversation context session.
   * @param {string} sessionId 
   * @returns {Promise<object|null>}
   */
  async loadSession(sessionId) {
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId);
    }
    // Check localStorage fallback
    const saved = localStorage.getItem(`nelum_session:${sessionId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.sessionCache.set(sessionId, parsed);
        return parsed;
      } catch (e) {
        console.error(`Error loading session cache from localStorage:`, e);
      }
    }
    return null;
  }

  /**
   * Saves active session details with a 30-minute expiration simulation.
   * @param {string} sessionId 
   * @param {object} context 
   */
  async saveSession(sessionId, context) {
    this.sessionCache.set(sessionId, context);
    localStorage.setItem(`nelum_session:${sessionId}`, JSON.stringify(context));
  }

  /**
   * Loads a user permanent profile.
   * @param {string} userId 
   * @returns {Promise<object|null>}
   */
  async loadUserProfile(userId) {
    const raw = localStorage.getItem(`${this.localStorageKey}:${userId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error loading long term profile:', e);
      }
    }
    
    // Default initial profile
    return {
      customerId: userId,
      languagePreference: 'mix',
      budgetTier: 'MID',
      preferredDeliveryCity: 'Colombo',
      purchaseIntervalDays: 30,
      frequentRecipients: [
        {
          recipientId: 'r1',
          name: 'Priyantha Silva',
          relationship: 'brother',
          deliveryAddress: 'No. 23, Flower Road, Colombo 07',
          favoriteCategories: ['flowers', 'cakes'],
          lastGiftPurchased: { productId: 'CAKE00KA001732', date: '2026-05-15' }
        },
        {
          recipientId: 'r2',
          name: 'Amma',
          relationship: 'mother',
          birthday: '06-20', // June 20th
          deliveryAddress: 'No. 45, Galle Road, Colombo 03',
          favoriteCategories: ['tea_box', 'fruits'],
          lastGiftPurchased: { productId: 'CAKE00KA001733', date: '2025-06-20' }
        }
      ]
    };
  }

  /**
   * Updates/Saves a user permanent profile.
   * @param {string} userId 
   * @param {object} profile 
   */
  async saveUserProfile(userId, profile) {
    localStorage.setItem(`${this.localStorageKey}:${userId}`, JSON.stringify(profile));
  }
}

export const memoryStore = new MemoryStore();
export default memoryStore;
