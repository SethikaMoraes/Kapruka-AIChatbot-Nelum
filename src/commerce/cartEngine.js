/**
 * Nelum Cart Intelligence Engine
 * Computes Cart Quality Index (CQI) to evaluate gift completeness and queries pairing upsells.
 */

import { kaprukaClient } from '../mcp/kaprukaClient.js';

export class CartEngine {
  /**
   * Scores the user's shopping basket matching occasion expectations.
   * @param {object} cart 
   * @param {string} occasion 
   * @returns {object} Cart quality evaluation results
   */
  evaluateCart(cart, occasion = 'birthday') {
    const items = cart?.items || [];
    const hasCard = !!cart?.greetingCardMessage;
    
    // Core and Accessory checks
    const hasCake = items.some(i => i.title.toLowerCase().includes('cake') || i.title.toLowerCase().includes('gateau'));
    const hasFlowers = items.some(i => i.title.toLowerCase().includes('roses') || i.title.toLowerCase().includes('lilies'));
    const hasTeddy = items.some(i => i.title.toLowerCase().includes('teddy'));
    const hasChocolates = items.some(i => i.title.toLowerCase().includes('chocolate'));

    let completeness = 0.3;
    const suggested = [];

    const occ = occasion ? occasion.toLowerCase() : 'birthday';

    if (occ === 'birthday') {
      if (hasCake) completeness += 0.4;
      else suggested.push('Signature Black Forest Gateau');
      
      if (hasCard) completeness += 0.2;
      else suggested.push('Personal Greeting Card');

      if (hasTeddy || hasFlowers) completeness += 0.1;
      else suggested.push('Kids Deluxe Teddy Bear');
    } else if (occ === 'anniversary') {
      if (hasFlowers) completeness += 0.4;
      else suggested.push('Eternal Romance Red Rose Bouquet');

      if (hasCard) completeness += 0.2;
      else suggested.push('Personal Greeting Card');

      if (hasChocolates) completeness += 0.1;
      else suggested.push('Chocolates & Joy Luxury Gift Box');
    } else {
      // General gifts
      if (items.length > 0) completeness += 0.5;
      if (hasCard) completeness += 0.2;
    }

    return {
      completenessRatio: Math.min(completeness, 1.0),
      hasGreetingCard: hasCard,
      hasCoreItem: hasCake || hasFlowers,
      hasAccessoryItem: hasTeddy || hasChocolates,
      suggestedAdditions: suggested
    };
  }

  /**
   * Calculates up-sell recommendation constraints.
   * Upsell item price must not exceed 25% of target budget.
   * @param {object} cart 
   * @param {number} budget 
   * @returns {object|null} Suggested product metadata, or null if no headroom exists.
   */
  async getUpsellRecommendation(cart, budget) {
    const currentTotal = cart?.subtotal || 0;
    const headroom = budget - currentTotal;
    
    if (headroom <= 0) return null;

    const upsellMaxPrice = budget * 0.25;
    return await this.findBestPairingProduct(cart.items || [], upsellMaxPrice);
  }

  /**
   * Identifies best pairing item from mock/real catalog within pricing rules.
   * @param {Array<object>} items 
   * @param {number} maxPrice 
   * @returns {Promise<object|null>}
   */
  async findBestPairingProduct(items, maxPrice) {
    const containsCakes = items.some(i => i.title.toLowerCase().includes('cake'));
    const searchWord = containsCakes ? 'toy' : 'chocolate';
    const targetCategory = containsCakes ? 'toys' : 'chocolates';
    
    try {
      const allProducts = await kaprukaClient.searchProducts(searchWord, null, maxPrice);
      
      const candidates = allProducts.filter(p => 
        p.category === targetCategory && 
        p.price <= maxPrice && 
        p.available
      );

      if (candidates.length > 0) {
        return candidates.sort((a, b) => b.price - a.price)[0]; // return highest price item matching limit
      }

      // Fallback: search across all categories within bounds
      const fallbackCandidates = allProducts.filter(p => p.price <= maxPrice && p.available);
      if (fallbackCandidates.length > 0) {
        return fallbackCandidates.sort((a, b) => b.price - a.price)[0];
      }
    } catch (e) {
      console.error('[CartEngine] Live pairing products lookup failed:', e.message);
    }

    return null;
  }
}

export const cartEngine = new CartEngine();
export default cartEngine;
