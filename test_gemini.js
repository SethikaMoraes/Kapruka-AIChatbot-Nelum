import 'dotenv/config';
import { 
  generateResponse, 
  generateShoppingAdvice, 
  generateGiftSuggestions, 
  generateUpsellSuggestions, 
  summarizeCart, 
  detectIntentWithLLM 
} from './src/ai/geminiClient.js';

async function runTests() {
  console.log('=== STARTING NELUM AI GEMINI INTEGRATION TESTS ===');
  
  // Test 1: Env Loading & Node Ctx Check
  console.log('\n[Test 1] Environment Context:');
  console.log('- process.env.PORT:', process.env.PORT);
  console.log('- process.env.NODE_ENV:', process.env.NODE_ENV);
  console.log('- process.env.GEMINI_API_KEY is configured:', !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_KEY_HERE');

  // Test 2: Fallback behavior on invalid key
  console.log('\n[Test 2] Testing generateResponse (expecting key error or execution):');
  try {
    const text = await generateResponse('Hi Nelum! How are you?');
    console.log('SUCCESS:', text);
  } catch (err) {
    console.log('EXPECTED FAILURE/FALLBACK:', err.message);
  }

  // Test 3: Shopping advice fallback test
  console.log('\n[Test 3] Testing generateShoppingAdvice:');
  try {
    const advice = await generateShoppingAdvice('I want a cake', [
      { id: 'cake1', title: 'Black Forest Cake', price: 4500 }
    ]);
    console.log('SUCCESS:', advice);
  } catch (err) {
    console.log('EXPECTED FAILURE/FALLBACK:', err.message);
  }

  // Test 4: Gift suggestions fallback test
  console.log('\n[Test 4] Testing generateGiftSuggestions:');
  try {
    const suggestions = await generateGiftSuggestions('birthday', 10000, 'mother', [
      { id: 'cake1', title: 'Black Forest Cake', price: 4500 }
    ]);
    console.log('SUCCESS:', suggestions);
  } catch (err) {
    console.log('EXPECTED FAILURE/FALLBACK:', err.message);
  }

  console.log('\n=== INTEGRATION TESTS COMPLETED ===');
}

runTests().catch(err => {
  console.error('Test Execution Crashed:', err);
});
