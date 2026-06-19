/**
 * Nelum Recommendation Engine
 * Calculates the contextual compatibility scores for products based on recipient relationship, occasion fit,
 * budget limits, item popularity, and delivery requirements.
 */

export class RecommendationEngine {
  /**
   * Evaluates a single product and returns a normalized compatibility score [0.0 - 1.0].
   * Formula: Score = (wOcc * Occ_i) + (wRel * Rel_i) + (wBdg * Bdg_i) + (wPop * Pop_i) + (wDel * Del_i)
   * @param {object} product 
   * @param {object} context 
   * @returns {number}
   */
  calculateScore(product, context) {
    const activeState = context.activeState || 'GIFT_DISCOVERY';
    
    // 1. Determine Weights based on current State
    const weights = this._getWeightsForState(activeState);

    // 2. Compute individual score components
    const occScore = this._evaluateOccasionFit(product, context.extractedEntities?.occasion);
    const relScore = this._evaluateRelationshipFit(product, context.extractedEntities?.recipient);
    const bdgScore = this._evaluateBudgetFit(product.price, context.extractedEntities?.budget || 1000000);
    const popScore = (product.rating || 5.0) / 5.0; // rating is normalized out of 5
    
    // Delivery check
    const isPerishable = ['cakes', 'flowers'].includes(product.category);
    const targetCity = context.delivery?.city || context.extractedEntities?.city || 'colombo';
    const isDistant = !['colombo', 'gampaha', 'kalutara'].includes(targetCity.toLowerCase().trim());
    const delScore = (isPerishable && isDistant) ? 0.3 : 1.0; // lower score if shipping fresh cakes to remote cities

    // 3. Sum weights
    const finalScore = (weights.wOcc * occScore) +
                       (weights.wRel * relScore) +
                       (weights.wBdg * bdgScore) +
                       (weights.wPop * popScore) +
                       (weights.wDel * delScore);

    return parseFloat(finalScore.toFixed(3));
  }

  /**
   * Sort products by recommendation compatibility scores.
   * @param {Array<object>} products 
   * @param {object} context 
   * @returns {Array<object>} Ranked products with an added `recommendationScore` and `rationale`
   */
  rankProducts(products, context) {
    return products
      .map(product => {
        const score = this.calculateScore(product, context);
        return {
          ...product,
          recommendationScore: score,
          rationale: this.generateRationale(product, context, score)
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Generate natural Sri Lankan styled explanations for product matches
   * @param {object} product 
   * @param {object} context 
   * @param {number} score 
   * @returns {string} Explanation string
   */
  generateRationale(product, context, score) {
    const budget = context.extractedEntities?.budget;
    const recipient = context.extractedEntities?.recipient || 'your recipient';
    
    if (budget && product.price > budget) {
      return `This is slightly over your budget, but represents high quality for ${recipient}.`;
    }
    
    if (score > 0.8) {
      return `Highly recommended! Excellent fit for ${recipient} and can reach Colombo today. 🌸`;
    }
    
    return `Fits your budget and matches typical preferences for ${recipient}.`;
  }

  _getWeightsForState(state) {
    const stateWeights = {
      GIFT_DISCOVERY: { wOcc: 0.35, wRel: 0.25, wBdg: 0.25, wPop: 0.15, wDel: 0.00 },
      DELIVERY_VALIDATION: { wOcc: 0.10, wRel: 0.10, wBdg: 0.20, wPop: 0.10, wDel: 0.50 }
    };
    return stateWeights[state] || stateWeights.GIFT_DISCOVERY;
  }

  _evaluateOccasionFit(product, occasion) {
    if (!occasion) return 0.5; // Neutral
    
    const lowerOcc = occasion.toLowerCase();
    const cat = product.category.toLowerCase();
    
    if (lowerOcc === 'birthday') {
      if (['cakes', 'toys', 'flowers'].includes(cat)) return 1.0;
    } else if (lowerOcc === 'anniversary') {
      if (['flowers', 'chocolates'].includes(cat)) return 1.0;
    } else if (lowerOcc === 'apology') {
      if (cat === 'flowers' && product.title.toLowerCase().includes('lily')) return 1.0;
      if (cat === 'flowers' || cat === 'chocolates') return 0.8;
    } else if (lowerOcc === 'vesak' || lowerOcc === 'poson') {
      if (cat === 'groceries' && product.title.toLowerCase().includes('tea')) return 1.0;
      if (cat === 'groceries') return 0.8;
      if (['cakes', 'toys', 'chocolates'].includes(cat)) return 0.1; // avoid sweet/party foods in Vesak
    } else if (lowerOcc === 'new year' || lowerOcc === 'avurudu') {
      if (cat === 'groceries' || cat === 'cakes') return 1.0;
    }
    
    return 0.4; // Low fit
  }

  _evaluateRelationshipFit(product, recipient) {
    if (!recipient) return 0.5;

    const lowerRec = recipient.toLowerCase();
    const cat = product.category.toLowerCase();
    
    if (['wife', 'husband', 'love', 'girlfriend', 'boyfriend'].includes(lowerRec)) {
      if (cat === 'flowers' && product.title.toLowerCase().includes('rose')) return 1.0;
      if (['flowers', 'chocolates', 'cakes'].includes(cat)) return 0.9;
      return 0.3; // non-traditional romantic gifts
    } else if (['mother', 'amma', 'father', 'thaththa', 'parents'].includes(lowerRec)) {
      if (cat === 'groceries' || cat === 'flowers') return 1.0;
      return 0.5;
    } else if (['manager', 'boss', 'corporate'].includes(lowerRec)) {
      if (cat === 'groceries' && product.title.toLowerCase().includes('tea')) return 1.0;
      if (['cakes', 'toys'].includes(cat)) return 0.2; // inappropriate
    }
    
    return 0.5;
  }

  _evaluateBudgetFit(price, budget) {
    if (price <= budget) {
      return 1.0;
    }
    // Exponential decay score for pricing above budget target
    const excess = price - budget;
    const decayFactor = 5000; // Rs. 5000 decay parameter
    return Math.exp(-excess / decayFactor);
  }
}

export const recommendationEngine = new RecommendationEngine();
export default recommendationEngine;
