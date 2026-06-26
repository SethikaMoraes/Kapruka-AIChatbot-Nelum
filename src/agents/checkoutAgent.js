import { kaprukaClient } from '../api/kaprukaClient.js';
import { checkoutEngine } from '../commerce/checkoutEngine.js';
import { summarizeCart, generateResponse } from '../services/geminiClient.js';

export class CheckoutAgent {
  constructor() {
    this.agentName = 'Checkout';
  }

  /**
   * Run checkout processing loop.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} intent 
   * @returns {Promise<string>}
   */
  async run(context, userInput, intent) {
    const items = context.cart?.items || [];
    if (items.length === 0) {
      return "Your cart is empty! Let's add some sweet cakes or fresh flowers first before checking out. 🌸";
    }

    const recipient = {
      name: context.delivery?.recipientName || 'Recipient',
      phone: context.delivery?.recipientPhone || '077 123 4567',
      address: context.delivery?.address || 'No. 23, Flower Road, Colombo 07'
    };

    const sender = {
      name: context.delivery?.senderName || 'Sender Name',
      email: 'customer@kapruka.com'
    };

    const cardMessage = context.cart?.greetingCardMessage || checkoutEngine.generateCardMessage(
      context.extractedEntities?.occasion || 'birthday',
      context.languageCode || 'en'
    );

    const deliveryDate = context.delivery?.date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

    console.log(`[CheckoutAgent] Executing checkout order reference generation.`);
    const result = await kaprukaClient.createOrder(items, recipient, sender, cardMessage, deliveryDate);

    context.trackingReference = result.orderId;

    try {
      console.log(`[CheckoutAgent] Summarizing cart and styling confirmation via Gemini...`);
      const summary = await summarizeCart(items);
      const prompt = `We have created an order with ID: ${result.orderId} and payment link: ${result.paymentUrl}. The cart summary is: "${summary}". Inform the user that the surprise is ready and they can pay now. Provide the link: [Confirm & Pay](${result.paymentUrl}) in a warm, welcoming Sri Lankan buddy tone.`;
      return await generateResponse(prompt);
    } catch (e) {
      console.warn("[CheckoutAgent] Gemini confirmation failed, using fallback", e.message);
      return `Almost done! I've secured your surprise package details. Order reference: **${result.orderId}**. Tap here to proceed with secure card payment: [Confirm & Pay](${result.paymentUrl}) ➔ 🌸`;
    }
  }
}

export const checkoutAgent = new CheckoutAgent();
export default checkoutAgent;
