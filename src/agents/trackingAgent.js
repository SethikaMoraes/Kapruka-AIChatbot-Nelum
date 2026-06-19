import { kaprukaClient } from '../mcp/kaprukaClient.js';
import { generateResponse } from '../ai/geminiClient.js';

export class TrackingAgent {
  constructor() {
    this.agentName = 'Tracking';
  }

  /**
   * Run tracking query loop.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} intent 
   * @returns {Promise<string>}
   */
  async run(context, userInput, intent) {
    const orderId = context.extractedEntities.orderId || context.trackingReference || 'KP-74892';
    
    console.log(`[TrackingAgent] Retrieving dispatch stats for: ${orderId}`);
    
    try {
      const tracking = await kaprukaClient.trackOrder(orderId);
      
      try {
        const prompt = `The user is tracking order ID: ${orderId}. Kapruka MCP live tracking information is:
Status: ${tracking.activeStatus}
Courier: ${tracking.courierName || 'Kapruka Courier'}
ETA: ${tracking.eta}
Milestones: ${JSON.stringify(tracking.milestones)}

Explain this delivery progress to the user in a warm, reassuring Sri Lankan buddy tone (e.g. using 'machan' or 'elakiri' naturally). Reassure them about the steps. Use the actual facts provided; do not invent details.`;
        return await generateResponse(prompt);
      } catch (err) {
        console.warn("[TrackingAgent] Gemini tracking explanation failed, using fallback", err.message);
        const milestoneText = tracking.milestones
          .map(m => `- [${m.completed ? 'x' : ' '}] ${m.title} (${m.time})`)
          .join('\n');

        return `I've tracked order **${orderId}**! Currently it is in the **${tracking.activeStatus}** stage.\n\n` +
               `Courier Driver: **${tracking.courierName || 'Kapruka Courier'}**\n` +
               `Delivery Estimate: **${tracking.eta}**\n\n` +
               `Milestones:\n${milestoneText}\n\n` +
               `Let me know if you want me to update delivery details! 🚗`;
      }
    } catch (error) {
      try {
        const prompt = `We tried to track order ID: ${orderId} but the tracking lookup failed. Express your regret in a warm Sri Lankan buddy tone (e.g. using "Aiyo") and ask the user to double check the order number.`;
        return await generateResponse(prompt);
      } catch (e) {
        return `Aiyo, tracking database is down. Could not verify reference ${orderId}. Please double check details.`;
      }
    }
  }
}

export const trackingAgent = new TrackingAgent();
export default trackingAgent;
