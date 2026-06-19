/**
 * Nelum Delivery Engine
 * Validates delivery destination coverage, computes perishability shipping risk,
 * and sets up express delivery overrides.
 */

export class DeliveryEngine {
  constructor() {
    this.coveredCities = ['colombo', 'kandy', 'galle', 'negombo', 'jaffna', 'gampaha', 'kalutara', 'kurunegala'];
  }

  /**
   * Evaluates delivery parameters.
   * @param {string} city 
   * @param {Array<object>} cartItems 
   * @returns {object} Logistics validation report
   */
  evaluateDelivery(city, cartItems = []) {
    const target = city ? city.toLowerCase().trim() : '';
    const isCovered = this.coveredCities.includes(target);
    
    if (!isCovered) {
      return {
        isAvailable: false,
        cost: 0,
        riskLevel: 'HIGH',
        warningMessage: `Aiyo, we don't see ${city} in our fast-delivery list. Can we deliver to the nearest main city? 🌸`
      };
    }

    // Perishable checks: fresh bakery/flowers sent to distant locations
    const hasPerishable = cartItems.some(i => 
      i.title.toLowerCase().includes('cake') || 
      i.title.toLowerCase().includes('gateau') ||
      i.title.toLowerCase().includes('roses') || 
      i.title.toLowerCase().includes('lilies')
    );

    const isWesternProvince = ['colombo', 'gampaha', 'kalutara'].includes(target);
    const isHighRisk = hasPerishable && !isWesternProvince;

    let warningMessage = null;
    if (isHighRisk) {
      warningMessage = `Aiyo, shipping fresh cakes/flowers to ${city} has high melting or wilting risk. Should we choose an alternative fresh fruit basket instead? 🌸`;
    }

    return {
      isAvailable: true,
      cost: isWesternProvince ? 350 : 800,
      riskLevel: isHighRisk ? 'HIGH' : 'LOW',
      warningMessage
    };
  }
}

export const deliveryEngine = new DeliveryEngine();
export default deliveryEngine;
