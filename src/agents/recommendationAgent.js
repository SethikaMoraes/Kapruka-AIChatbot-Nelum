import { recommendationEngine } from '../recommendations/recommendationEngine.js';
import { bundleEngine } from '../recommendations/bundleEngine.js';
import { kaprukaClient } from '../api/kaprukaClient.js';
import { generateGiftSuggestions } from '../services/geminiClient.js';

export class RecommendationAgent {
  constructor() {
    this.agentName = 'Recommendation';
  }

  /**
   * Generates ranked recommendations or dynamic packages.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} intent 
   * @returns {Promise<string>}
   */
  async run(context, userInput, intent) {
    const occasion = context.extractedEntities.occasion || 'birthday';
    const budget = context.extractedEntities.budget || 10000;
    const recipient = context.extractedEntities.recipient || 'friend';

    console.log(`[RecommendationAgent] Scoring suggestions for ${occasion} surprise under budget: Rs. ${budget}`);

    // Retrieve live products from Kapruka MCP
    const queryKeyword = (occasion === 'birthday' || occasion === 'cake') ? 'cake' : 'flower';
    const allProducts = await kaprukaClient.searchProducts(queryKeyword, null, budget);

    if (allProducts.length === 0) {
      return "Aiyo, I couldn't find any candidate products to make suggestions from in our catalog today. 🌸";
    }

    try {
      console.log(`[RecommendationAgent] Generating recommendations via Gemini...`);
      const response = await generateGiftSuggestions(occasion, budget, recipient, allProducts);
      console.log(`[RecommendationAgent] Gemini suggestions:`, response.suggestions);
      
      // Save suggestions in context for UI access if needed
      context.recommendations = response.suggestions;

      return response.textResponse;
    } catch (e) {
      console.warn("[RecommendationAgent] Gemini recommendations failed, using fallback", e.message);

      // 1. Check if user wants a custom bundle pack
      if (intent.primaryIntent === 'BUNDLE_BUILDING' || occasion === 'birthday' || occasion === 'anniversary' || occasion === 'apology') {
        const bundle = bundleEngine.generateBundle(occasion, budget, allProducts);
        const itemsList = bundle.items.map(i => i.title).join(', ');
        
        let reply = `Based on your request, I've compiled the **${bundle.title}**! It bundles: ${itemsList} for **Rs. ${bundle.price.toLocaleString()}** (including card greeting).`;
        if (bundle.discount > 0) {
          reply += ` I've applied an auto-discount of Rs. ${bundle.discount.toLocaleString()} to stay within your Rs. ${budget.toLocaleString()} budget! 🌸`;
        }
        return reply;
      }

      // 2. Default: Rank individual product candidates
      const ranked = recommendationEngine.rankProducts(allProducts, context);
      if (ranked.length === 0) {
        return "I have filtered some popular Ceylon gifts on the showcase! Take a look on the right.";
      }

      const topFit = ranked[0];
      return `For ${recipient}'s ${occasion}, the top recommended gift is the **${topFit.title}** (Rs. ${topFit.price.toLocaleString()}). ${topFit.rationale}`;
    }
  }
}

export const recommendationAgent = new RecommendationAgent();
export default recommendationAgent;
