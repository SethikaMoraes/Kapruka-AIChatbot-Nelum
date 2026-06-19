/**
 * Nelum Agent Orchestrator & Worker Registry
 * Routes user queries to specialized sub-agents based on conversation state bounds,
 * wrapping invocations in timeout constraints (4.5s) and execution retries.
 */

import { supervisorAgent } from './supervisorAgent.js';
import { productAgent } from './productAgent.js';
import { deliveryAgent } from './deliveryAgent.js';
import { recommendationAgent } from './recommendationAgent.js';
import { checkoutAgent } from './checkoutAgent.js';
import { trackingAgent } from './trackingAgent.js';
import { AgentTimeoutError } from '../utils/errorHandler.js';

export class AgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.agents.set('Supervisor', supervisorAgent);
    this.agents.set('Product', productAgent);
    this.agents.set('Delivery', deliveryAgent);
    this.agents.set('Recommendation', recommendationAgent);
    this.agents.set('Checkout', checkoutAgent);
    this.agents.set('Tracking', trackingAgent);
  }

  /**
   * Routes message execution to specialized workers under strict 4500ms timeout deadlines.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} intent 
   * @returns {Promise<string>}
   */
  async execute(context, userInput, intent) {
    let targetAgentName = 'Supervisor';

    // State-based routing constraints
    const state = context.activeState;
    if (state === 'PRODUCT_SEARCH' || state === 'PRODUCT_SELECTION') {
      targetAgentName = 'Product';
    } else if (state === 'DELIVERY_VALIDATION' || state === 'DELIVERY_COLLECTION') {
      targetAgentName = 'Delivery';
    } else if (state === 'BUNDLE_BUILDING' || state === 'GIFT_DISCOVERY') {
      targetAgentName = 'Recommendation';
    } else if (state === 'CHECKOUT' || state === 'ORDER_REVIEW') {
      targetAgentName = 'Checkout';
    } else if (state === 'ORDER_TRACKING') {
      targetAgentName = 'Tracking';
    }

    const agent = this.agents.get(targetAgentName) || this.agents.get('Supervisor');
    console.log(`[AgentOrchestrator] Selected worker agent: ${agent.agentName} for state: ${state}`);

    // Run execution wrapping in retries & 4.5 second race timeouts
    return this._executeWithTimeout(() => agent.run(context, userInput, intent), 4500);
  }

  async _executeWithTimeout(action, timeoutMs = 4500) {
    let attempts = 0;
    const maxRetries = 2;
    
    while (attempts < maxRetries) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new AgentTimeoutError('Agent processing timeout exceeded')), timeoutMs)
        );
        return await Promise.race([action(), timeoutPromise]);
      } catch (e) {
        attempts++;
        console.warn(`[AgentOrchestrator] Execution attempt ${attempts} failed. Warning:`, e.message);
        if (attempts >= maxRetries) {
          if (e.name === 'AgentTimeoutError' || e.message?.includes('timeout exceeded')) {
            throw new AgentTimeoutError('Agent processing timeout exceeded');
          }
          throw e;
        }
      }
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
export default agentOrchestrator;
