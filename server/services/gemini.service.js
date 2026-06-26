/**
 * Nelum Express Gemini AI Integration Service
 */
import { 
  generateResponse, 
  generateShoppingAdvice, 
  generateGiftSuggestions, 
  generateUpsellSuggestions, 
  summarizeCart, 
  detectIntentWithLLM,
  analyzeConversationTurn,
  generateVoice
} from '../../src/services/geminiClient.js';

export const geminiService = {
  generateResponse, 
  generateShoppingAdvice, 
  generateGiftSuggestions, 
  generateUpsellSuggestions, 
  summarizeCart, 
  detectIntentWithLLM,
  analyzeConversationTurn,
  generateVoice
};

export default geminiService;
