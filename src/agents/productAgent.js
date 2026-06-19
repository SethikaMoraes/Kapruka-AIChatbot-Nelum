/**
 * Nelum Product Discovery Worker Agent
 * Interfaces with the Kapruka catalog tool to extract search matches and format results showcase.
 */

import { kaprukaClient } from '../mcp/kaprukaClient.js';
import { generateShoppingAdvice, generateResponse } from '../ai/geminiClient.js';

export class ProductAgent {
  constructor() {
    this.agentName = 'Product';
  }

  /**
   * Run query lookup
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} intent 
   * @returns {Promise<string>} Natural text summary response
   */
  async run(context, userInput, intent) {
    const keyword = context.extractedEntities.category || userInput;
    const priceLimit = context.extractedEntities.budget || null;
    
    console.log(`[ProductAgent] Querying catalog for: "${keyword}", max price: ${priceLimit}`);
    
    const items = await kaprukaClient.searchProducts(keyword, null, priceLimit);
    
    if (items.length === 0) {
      try {
        const prompt = `The user searched for "${userInput}" but the catalog returned 0 results. Express your regret in a warm Sri Lankan buddy tone and suggest checking our popular categories like birthday cakes or roses instead.`;
        return await generateResponse(prompt);
      } catch (err) {
        return "Aiyo, I couldn't find any exact products matching that in our catalog today. 🌸 Would you like to check some of our popular birthday cakes or roses instead?";
      }
    }

    try {
      console.log(`[ProductAgent] Generating personalized shopping advice via Gemini...`);
      return await generateShoppingAdvice(userInput, items);
    } catch (e) {
      console.warn("[ProductAgent] Gemini failed to generate shopping advice, using fallback", e.message);
      // Return search summary context.
      const productTitles = items.slice(0, 3).map(i => `**${i.title}** (Rs. ${i.price.toLocaleString()})`).join(', ');
      return `I've loaded ${items.length} matching options on the right side showcase! Including ${productTitles}. Shall I put one in your cart? 🌸`;
    }
  }
}

export const productAgent = new ProductAgent();
export default productAgent;
