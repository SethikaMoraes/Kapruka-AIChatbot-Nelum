import { kaprukaClient } from '../api/kaprukaClient.js';
import { generateResponse } from '../services/geminiClient.js';

export class DeliveryAgent {
  constructor() {
    this.agentName = 'Delivery';
  }

  /**
   * Evaluates delivery context.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} intent 
   * @returns {Promise<string>}
   */
  async run(context, userInput, intent) {
    const city = context.extractedEntities.city || intent.entities.city;
    if (!city) {
      return "To coordinate delivery, which city in Sri Lanka should we send this to? 🚗";
    }

    const items = context.cart?.items || [];
    const productId = items.length > 0 ? items[0].productId : 'FLOWERS00T1603';
    const deliveryDate = context.delivery?.date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

    console.log(`[DeliveryAgent] Querying live MCP delivery check for: "${city}" on "${deliveryDate}" for product: "${productId}"`);
    
    let report;
    try {
      report = await kaprukaClient.checkDelivery(city, deliveryDate, productId);
    } catch (err) {
      console.warn("[DeliveryAgent] MCP delivery check failed, using local fallback.", err.message);
      // Fallback
      const isWesternProvince = ['colombo', 'gampaha', 'kalutara'].includes(city.toLowerCase().trim());
      report = {
        deliverable: isWesternProvince || !productId.toLowerCase().includes('cake'),
        deliveryFee: isWesternProvince ? 350 : 800,
        riskLevel: (!isWesternProvince && productId.toLowerCase().includes('cake')) ? 'HIGH' : 'LOW'
      };
    }

    if (!report.deliverable) {
      try {
        const prompt = `We checked delivery to "${city}" but Kapruka reports it is NOT deliverable for this item. Explain this to the user in a warm, polite Sri Lankan buddy tone (using "Aiyo" naturally if appropriate) and ask if there is an alternative main city near them we can deliver to.`;
        return await generateResponse(prompt);
      } catch (err) {
        return `Aiyo, we don't see ${city} in our fast-delivery list for this product. Can we deliver to the nearest main city? 🌸`;
      }
    }

    // Save details to context
    context.delivery = context.delivery || {};
    context.delivery.city = city;

    if (report.riskLevel === 'HIGH') {
      try {
        const prompt = `We checked delivery to "${city}" and Kapruka reports it is deliverable, but has HIGH perishable risk (e.g. melting cakes or wilting flowers). Explain this concern to the user in a warm, helpful Sri Lankan buddy tone and suggest choosing a fresh fruit basket or dry gift basket instead.`;
        return await generateResponse(prompt);
      } catch (err) {
        return `Aiyo, shipping fresh cakes/flowers to ${city} has high melting or wilting risk. Should we choose an alternative fresh fruit basket instead? 🌸`;
      }
    }

    try {
      const prompt = `We checked delivery to "${city}". Kapruka reports it is deliverable! The delivery fee is Rs. ${report.deliveryFee}. Share this great news with the user in an enthusiastic Sri Lankan buddy tone (e.g. using 'Elakiri' or 'Hari hari' naturally if appropriate) and ask if they are ready to proceed to checkout.`;
      return await generateResponse(prompt);
    } catch (err) {
      return `Elakiri! We deliver to ${city}. The shipping charge will be Rs. ${report.deliveryFee}. Shall we continue to checkout? 🚗`;
    }
  }
}

export const deliveryAgent = new DeliveryAgent();
export default deliveryAgent;
