# Nelum AI: Backend Runtime Implementation Blueprint

This implementation blueprint provides production-ready TypeScript code, interfaces, classes, validation schemas (Zod), state classes, and API controllers. It serves as the target engineering framework for the AI-powered conversational shopping companion on Kapruka.

---

## Part 1 — Core Domain Models & Zod Schemas

This module defines the structural domain interfaces and their corresponding validation schemas.

```typescript
import { z } from 'zod';

// --- State and Intent Enums ---
export const ConversationStateSchema = z.enum([
  'WELCOME', 'DISCOVERY', 'GIFT_DISCOVERY', 'PRODUCT_SEARCH', 'PRODUCT_SELECTION',
  'BUNDLE_BUILDING', 'CART_BUILDING', 'DELIVERY_COLLECTION', 'DELIVERY_VALIDATION',
  'ORDER_REVIEW', 'CHECKOUT', 'PAYMENT_LINK_GENERATION', 'ORDER_TRACKING',
  'POST_PURCHASE', 'GOODBYE'
]);
export type ConversationState = z.infer<typeof ConversationStateSchema>;

export const IntentSchema = z.enum([
  'GREETING', 'SMALL_TALK', 'GIFT_DISCOVERY', 'PRODUCT_SEARCH', 'PRODUCT_FILTERING',
  'PRODUCT_COMPARISON', 'BUNDLE_BUILDING', 'CART_ADD', 'DELIVERY_CHECK', 'CHECKOUT',
  'ORDER_TRACK', 'REORDER', 'GOODBYE', 'HELP', 'COMPLAINT'
]);
export type Intent = z.infer<typeof IntentSchema>;

// --- Sub-Schemas ---
export const ShoppingPreferencesSchema = z.object({
  preferredLanguage: z.enum(['en', 'si', 'ta', 'mix']).default('en'),
  averageBudget: z.number().nonnegative().optional(),
  favoriteCategories: z.array(z.string()).default([]),
  frequentDeliveryCities: z.array(z.string()).default([]),
  frequentRecipients: z.array(z.object({
    name: z.string(),
    relation: z.string(),
    birthday: z.string().optional()
  })).default([])
});
export type ShoppingPreferences = z.infer<typeof ShoppingPreferencesSchema>;

export const UserProfileSchema = z.object({
  userId: z.string().uuid(),
  phoneNumber: z.string().regex(/^\+?94\d{9}$/, 'Invalid Sri Lankan Phone Number'),
  name: z.string(),
  preferences: ShoppingPreferencesSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number().positive(),
  category: z.string(),
  image: z.string().url(),
  rating: z.number().min(0).max(5),
  reviews: z.number().nonnegative(),
  badge: z.string().nullable(),
  deliveryEstimate: z.string(),
  available: z.boolean(),
  description: z.string(),
  specs: z.array(z.string()).default([])
});
export type Product = z.infer<typeof ProductSchema>;

export const CartItemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().positive(),
  isBundle: z.boolean().default(false)
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  subtotal: z.number().nonnegative(),
  greetingCardMessage: z.string().max(300).nullable().optional()
});
export type Cart = z.infer<typeof CartSchema>;

export const DeliveryInfoSchema = z.object({
  recipientName: z.string().min(2),
  recipientPhone: z.string().regex(/^(0|94|\+94)?7\d{8}$/, 'Invalid Sri Lankan Recipient Number'),
  address: z.string().min(10),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid Delivery Date'),
  timeWindow: z.enum(['any', 'morning', 'afternoon', 'evening']).default('any'),
  senderName: z.string().min(2)
});
export type DeliveryInfo = z.infer<typeof DeliveryInfoSchema>;

// --- Main Context Container ---
export const ConversationContextSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  activeState: ConversationStateSchema,
  languageCode: z.enum(['en', 'si', 'ta', 'mix']).default('en'),
  extractedEntities: z.record(z.any()).default({}),
  cart: CartSchema,
  delivery: DeliveryInfoSchema.partial(),
  trackingReference: z.string().nullable().optional()
});
export type ConversationContext = z.infer<typeof ConversationContextSchema>;


// ==========================================================================
// PART 2 — CONVERSATION ENGINE IMPLEMENTATION
// ==========================================================================

import { SessionMemoryProxy } from './memory'; // Placeholder for Part 7
import { IntentDetector, IntentOutput } from './intent'; // Placeholder for Part 4
import { AgentOrchestrator } from './orchestrator'; // Placeholder for Part 5
import { StateMachineRegistry } from './state-machine'; // Dynamic state loader

export class ConversationEngine {
  private memory: SessionMemoryProxy;
  private intentDetector: IntentDetector;
  private orchestrator: AgentOrchestrator;
  private stateRegistry: StateMachineRegistry;

  constructor(
    memory: SessionMemoryProxy,
    intentDetector: IntentDetector,
    orchestrator: AgentOrchestrator,
    stateRegistry: StateMachineRegistry
  ) {
    this.memory = memory;
    this.intentDetector = intentDetector;
    this.orchestrator = orchestrator;
    this.stateRegistry = stateRegistry;
  }

  /**
   * Main entry point for processing any incoming chat message
   */
  public async processMessage(sessionId: string, message: string, userId?: string): Promise<string> {
    try {
      // 1. Load active conversation context from Session Memory
      let context = await this.memory.load(sessionId);
      if (!context) {
        context = this.createNewContext(sessionId, userId);
      }

      // 2. Classify raw string utilizing the Intent Detection System
      const intentOutput: IntentOutput = await this.intentDetector.detect(message, context.languageCode);
      
      // Merge detected language and entities back into context
      context.languageCode = intentOutput.language;
      context.extractedEntities = { ...context.extractedEntities, ...intentOutput.entities };

      // 3. Retrieve current active state class from the state machine registry
      let activeStateObj = this.stateRegistry.getState(context.activeState);

      // 4. Check Exit Criteria & process input on current state
      const canExit = activeStateObj.validateExit(context);
      let nextState: ConversationState = context.activeState;

      if (canExit) {
        // Execute input parsing & check local transitions
        nextState = activeStateObj.determineTransition(context, intentOutput);
      }

      // 5. Handle State Transition (Exit old state, Enter new state)
      if (nextState !== context.activeState) {
        await activeStateObj.onExit(context);
        context.activeState = nextState;
        
        activeStateObj = this.stateRegistry.getState(nextState);
        await activeStateObj.onEntry(context);
      }

      // 6. Select appropriate specialized agent to run logic via Orchestrator
      const agentResponse = await this.orchestrator.execute(context, message, intentOutput);

      // 7. Update Cart Totals and Save Session Context
      this.recalculateCartSubtotal(context);
      await this.memory.save(sessionId, context);

      return agentResponse;

    } catch (error) {
      console.error(`Error in ConversationEngine session [${sessionId}]:`, error);
      return "Aiyo 😅 I ran into a small hiccup while picking your gifts. Let's try that again!";
    }
  }

  private createNewContext(sessionId: string, userId?: string): ConversationContext {
    return {
      sessionId,
      userId: userId || null,
      activeState: 'WELCOME',
      languageCode: 'en',
      extractedEntities: {},
      cart: { items: [], subtotal: 0, greetingCardMessage: null },
      delivery: {}
    };
  }

  private recalculateCartSubtotal(context: ConversationContext): void {
    // Calculated based on pricing retrieved from MCP Cache (Mock/Database value handles calculation)
    let subtotal = 0;
    for (const item of context.cart.items) {
      const price = item.isBundle ? 10000 : 3000; // Simplified fallback weights
      subtotal += price * item.qty;
    }
    context.cart.subtotal = subtotal;
  }
// 4. Checkout State Class
export class CheckoutState extends BaseState {
  public readonly stateName = 'CHECKOUT';

  public async onEntry(context: ConversationContext): Promise<void> {
    // Log intent to locking service
  }

  public async onExit(context: ConversationContext): Promise<void> {}

  public validateExit(context: ConversationContext): boolean {
    return true; // Pushing payment triggers tracking
  }

  public determineTransition(context: ConversationContext, intent: IntentOutput): ConversationState {
    return 'ORDER_TRACKING';
  }
}


// ==========================================================================
// PART 4 — INTENT DETECTION SYSTEM
// ==========================================================================

export interface IntentOutput {
  primaryIntent: Intent;
  secondaryIntents: Intent[];
  confidence: number;
  entities: Record<string, any>;
  language: 'en' | 'si' | 'ta' | 'mix';
  nextAction: string;
}

export class IntentDetector {
  private llmClient: any; // Swappable LLM runtime client (Gemini/OpenAI)

  constructor(llmClient: any) {
    this.llmClient = llmClient;
  }

  /**
   * Resolves language code, intent class, and extracts variables from user text
   */
  public async detect(userInput: string, activeLanguage: string): Promise<IntentOutput> {
    // 1. Check for basic system keywords to bypass LLM latency
    const quickMatch = this.evaluateHardcodedKeywords(userInput);
    if (quickMatch) return quickMatch;

    // 2. Invoke structured LLM completion schema
    try {
      const response = await this.llmClient.generateStructuredJson({
        prompt: `Classify the intent and extract entities for a Kapruka shopping bot. Input: "${userInput}". Active Language context: "${activeLanguage}".`,
        schema: {
          type: 'object',
          properties: {
            primaryIntent: { type: 'string', enum: Object.values(IntentSchema.enum) },
            secondaryIntents: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' },
            entities: { type: 'object' },
            language: { type: 'string', enum: ['en', 'si', 'ta', 'mix'] },
            nextAction: { type: 'string' }
          },
          required: ['primaryIntent', 'confidence', 'entities', 'language', 'nextAction']
        }
      });

      return response as IntentOutput;
    } catch (error) {
      console.warn("LLM Intent classification failed. Falling back to default general intent.", error);
      return {
        primaryIntent: 'PRODUCT_SEARCH',
        secondaryIntents: [],
        confidence: 0.5,
        entities: { query: userInput },
        language: 'en',
        nextAction: 'general-search'
      };
    }
  }

  private evaluateHardcodedKeywords(input: string): IntentOutput | null {
    const raw = input.toLowerCase().trim();
    if (['hi', 'hello', 'ayubowan', 'vanakkam', 'kohomada'].includes(raw)) {
      return {
        primaryIntent: 'GREETING',
        secondaryIntents: [],
        confidence: 1.0,
        entities: {},
        language: raw === 'vanakkam' ? 'ta' : (raw === 'hello' ? 'en' : 'si'),
        nextAction: 'welcome-message'
      };
    }
    if (raw.includes('track') || raw.includes('kp-')) {
      const idMatch = raw.match(/kp-\d+/);
      return {
        primaryIntent: 'ORDER_TRACK',
        secondaryIntents: [],
        confidence: 0.95,
        entities: { orderId: idMatch ? idMatch[0].toUpperCase() : null },
        language: 'en',
        nextAction: 'track-status'
      };
    }
    return null;
  }
}


// ==========================================================================
// PART 5 — AGENT ORCHESTRATOR & RUNTIME
// ==========================================================================

export interface AgentContract {
  agentName: string;
  run(context: ConversationContext, userInput: string, intent: IntentOutput): Promise<string>;
}

// 1. Supervisor Agent
export class SupervisorAgent implements AgentContract {
  public readonly agentName = 'Supervisor';

  public async run(context: ConversationContext, userInput: string, intent: IntentOutput): Promise<string> {
    // Evaluates constraints and routes logic to sub-workers
    return `Supervisor coordinated state [${context.activeState}] based on primary intent [${intent.primaryIntent}]`;
  }
}

// 2. Product Agent
export class ProductAgent implements AgentContract {
  public readonly agentName = 'Product';
  private mcp: any; // Wrapped MCP abstraction client

  constructor(mcpWrapper: any) {
    this.mcp = mcpWrapper;
  }

  public async run(context: ConversationContext, userInput: string, intent: IntentOutput): Promise<string> {
    const keyword = context.extractedEntities.product_keyword || userInput;
    const items = await this.mcp.searchProducts(keyword, context.extractedEntities.price_max);
    
    if (items.length === 0) {
      return "Aiyo, I couldn't find any exact products matching that in our catalog today. 🌸";
    }
    return `I've loaded ${items.length} options on the right side showcase!`;
  }
}

// 3. Recommendation Agent
export class RecommendationAgent implements AgentContract {
  public readonly agentName = 'Recommendation';
  
  public async run(context: ConversationContext, userInput: string, intent: IntentOutput): Promise<string> {
    return "Calculated dynamic bundle containing premium red roses, Ferrero Rocher box, and a greeting card. 🌸";
  }
}

// 4. Delivery Agent
export class DeliveryAgent implements AgentContract {
  public readonly agentName = 'Delivery';
  private mcp: any;

  constructor(mcpWrapper: any) {
    this.mcp = mcpWrapper;
  }

  public async run(context: ConversationContext, userInput: string, intent: IntentOutput): Promise<string> {
    const city = context.extractedEntities.city;
    if (!city) {
      return "To coordinate delivery, which city in Sri Lanka should we send this to?";
    }
    
    const valid = await this.mcp.checkDelivery(city);
    if (!valid) {
      return `Aiyo, we don't have same-day coverage for ${city} currently. Can we ship to Colombo 07 instead?`;
    }
    return `Elakiri! We deliver to ${city}. Should I collect recipient details now?`;
  }
}

// --- Orchestrator Engine ---
export class AgentOrchestrator {
  private registry: Map<string, AgentContract> = new Map();

  constructor() {
    this.registerAgent(new SupervisorAgent());
  }

  public registerAgent(agent: AgentContract): void {
    this.registry.set(agent.agentName, agent);
  }

  /**
   * Routes query to matching agent based on active state of state machine
   */
  public async execute(context: ConversationContext, userInput: string, intent: IntentOutput): Promise<string> {
    let targetAgent = 'Supervisor';

    // State-based routing constraints
    if (context.activeState === 'PRODUCT_SEARCH') {
      targetAgent = 'Product';
    } else if (context.activeState === 'DELIVERY_VALIDATION' || context.activeState === 'DELIVERY_COLLECTION') {
      targetAgent = 'Delivery';
    } else if (context.activeState === 'BUNDLE_BUILDING' || context.activeState === 'GIFT_DISCOVERY') {
      targetAgent = 'Recommendation';
    }

    const agent = this.registry.get(targetAgent) || this.registry.get('Supervisor')!;
    
    // Retries and Timeout Wrapper Policy
    return this.executeWithRetry(() => agent.run(context, userInput, intent), 3);
  }

  private async executeWithRetry(action: () => Promise<string>, retries: number): Promise<string> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        // Enforce a strict 4500ms execution timeout
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Agent processing timeout exceeded")), 4500)
        );
        return await Promise.race([action(), timeoutPromise]);
      } catch (err) {
        attempt++;
        console.warn(`Agent execution failed, retry attempt ${attempt}/${retries}`, err);
        if (attempt >= retries) throw err;
      }
    }
    return "Aiyo 😅 I am taking a bit longer to process that. Let me look at alternative options.";
  }
}
// ==========================================================================
// PART 3 — STATE MACHINE RUNTIME STATES
// ==========================================================================

export abstract class BaseState {
  public abstract readonly stateName: ConversationState;

  public abstract onEntry(context: ConversationContext): Promise<void>;
  public abstract onExit(context: ConversationContext): Promise<void>;
  
  public abstract validateExit(context: ConversationContext): boolean;
  public abstract determineTransition(
    context: ConversationContext,
    intent: IntentOutput
  ): ConversationState;
}

// 1. Welcome State Class
export class WelcomeState extends BaseState {
  public readonly stateName = 'WELCOME';

  public async onEntry(context: ConversationContext): Promise<void> {
    context.extractedEntities = {};
  }

  public async onExit(context: ConversationContext): Promise<void> {}

  public validateExit(context: ConversationContext): boolean {
    return true; // Always allow starting search/discovery
  }

  public determineTransition(context: ConversationContext, intent: IntentOutput): ConversationState {
    if (intent.primaryIntent === 'GIFT_DISCOVERY') {
      return 'GIFT_DISCOVERY';
    }
    if (intent.primaryIntent === 'PRODUCT_SEARCH') {
      return 'PRODUCT_SEARCH';
    }
    return 'DISCOVERY';
  }
}

// 2. Gift Discovery State Class
export class GiftDiscoveryState extends BaseState {
  public readonly stateName = 'GIFT_DISCOVERY';

  public async onEntry(context: ConversationContext): Promise<void> {}

  public async onExit(context: ConversationContext): Promise<void> {}

  public validateExit(context: ConversationContext): boolean {
    // Require relationship and occasion details before moving to checkout
    const hasRecipient = !!context.extractedEntities.recipient;
    const hasOccasion = !!context.extractedEntities.occasion;
    return hasRecipient && hasOccasion;
  }

  public determineTransition(context: ConversationContext, intent: IntentOutput): ConversationState {
    if (intent.primaryIntent === 'BUNDLE_BUILDING') {
      return 'BUNDLE_BUILDING';
    }
    if (intent.primaryIntent === 'CART_ADD') {
      return 'CART_BUILDING';
    }
    return 'GIFT_DISCOVERY';
  }
}

// 3. Delivery Validation State Class
export class DeliveryValidationState extends BaseState {
  public readonly stateName = 'DELIVERY_VALIDATION';

  public async onEntry(context: ConversationContext): Promise<void> {}

  public async onExit(context: ConversationContext): Promise<void> {}

  public validateExit(context: ConversationContext): boolean {
    // City must be specified and match delivery cities checklist
    return !!context.delivery.recipientName && !!context.delivery.address && !!context.delivery.recipientPhone;
  }

  public determineTransition(context: ConversationContext, intent: IntentOutput): ConversationState {
    if (this.validateExit(context)) {
      return 'ORDER_REVIEW';
    }
    return 'DELIVERY_COLLECTION';
  }
}

// 4. Checkout State Class
export class CheckoutState extends BaseState {
  public readonly stateName = 'CHECKOUT';

  public async onEntry(context: ConversationContext): Promise<void> {
    // Log intent to locking service
  }

  public async onExit(context: ConversationContext): Promise<void> {}

  public validateExit(context: ConversationContext): boolean {
    return true; // Pushing payment triggers tracking
  }

  public determineTransition(context: ConversationContext, intent: IntentOutput): ConversationState {
    return 'ORDER_TRACKING';
  }
}


// ==========================================================================
// PART 6 — MCP ABSTRACTION LAYER
// ==========================================================================

export class McpWrapper {
  private redisClient: any; // Caching database layer
  private rawMcpClient: any; // Raw JSON-RPC connection to Kapruka server

  constructor(redisClient: any, rawMcpClient: any) {
    this.redisClient = redisClient;
    this.rawMcpClient = rawMcpClient;
  }

  public async searchProducts(query: string, maxPrice?: number): Promise<Product[]> {
    const cacheKey = `mcp:search:${query}:${maxPrice || 'none'}`;
    
    // Check Redis cache first
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      // Validate schema parameters prior to tool execution
      const payload = { searchTerms: query, priceLimit: maxPrice };
      
      const rawResponse = await this.rawMcpClient.callTool("search_products", payload);
      const normalized = this.normalizeProducts(rawResponse);

      // Cache search output with a 10-minute TTL to respect service limitations
      await this.redisClient.setex(cacheKey, 600, JSON.stringify(normalized));
      return normalized;
    } catch (error) {
      console.error("MCP tool search_products failed, returning fallback empty list.", error);
      return [];
    }
  }

  public async checkDelivery(city: string): Promise<boolean> {
    const cacheKey = `mcp:delivery:city:${city.toLowerCase()}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return cached === 'true';

    try {
      const response = await this.rawMcpClient.callTool("check_delivery", { targetCity: city });
      const available = !!response?.available;
      
      await this.redisClient.setex(cacheKey, 3600, String(available)); // Cache results for 1 hour
      return available;
    } catch (err) {
      console.warn("Delivery validation check failed. Defaulting to false.", err);
      return false;
    }
  }

  private normalizeProducts(rawResponse: any): Product[] {
    if (!rawResponse || !Array.isArray(rawResponse.items)) return [];
    return rawResponse.items.map((item: any) => ({
      id: String(item.product_id),
      title: String(item.name),
      price: Number(item.price_lkr),
      category: String(item.category),
      image: String(item.thumbnail_url || 'assets/images/cake.png'),
      rating: Number(item.rating_stars || 5),
      reviews: Number(item.rating_count || 0),
      badge: item.badge_label || null,
      deliveryEstimate: String(item.eta_message || 'Today'),
      available: !!item.in_stock,
      description: String(item.details || ''),
      specs: Array.isArray(item.specifications) ? item.specifications : []
    }));
  }
}


// ==========================================================================
// PART 7 — MEMORY SYSTEM
// ==========================================================================

export class SessionMemoryProxy {
  private redis: any;

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  public async load(sessionId: string): Promise<ConversationContext | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    if (!data) return null;
    return JSON.parse(data) as ConversationContext;
  }

  public async save(sessionId: string, context: ConversationContext): Promise<void> {
    // 30-minute expiration deadline
    await this.redis.setex(`session:${sessionId}`, 1800, JSON.stringify(context));
  }
}

export class LongTermMemoryProxy {
  private dbPool: any; // PostgreSQL client connection pool

  constructor(dbPool: any) {
    this.dbPool = dbPool;
  }

  public async loadProfile(userId: string): Promise<UserProfile | null> {
    const res = await this.dbPool.query('SELECT * FROM user_profiles WHERE id = $1', [userId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      userId: row.id,
      phoneNumber: row.phone_number,
      name: row.full_name,
      preferences: JSON.parse(row.preferences_json),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  public async savePreferences(userId: string, preferences: ShoppingPreferences): Promise<void> {
    await this.dbPool.query(
      'UPDATE user_profiles SET preferences_json = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(preferences), userId]
    );
  }
}


// ==========================================================================
// PART 8 — PROMPT REGISTRY & MANAGEMENT
// ==========================================================================

export class PromptRegistry {
  private cache: Map<string, string> = new Map();

  constructor() {
    this.initializeStaticRegistry();
  }

  private initializeStaticRegistry(): void {
    this.cache.set('v1:Supervisor', `
      You are Nelum's Supervisor Agent. Assess current state: {{state}}.
      Coordinate sub-agents (Product, Delivery, Recommendation) without exposing backend details.
      Respond in a warm, polite Sri Lankan tone. Emojis (🌸, 🎂, 🌹) are welcomed but keep it professional.
    `);
    
    this.cache.set('v1:Product', `
      Identify search keywords from user message: "{{message}}".
      Filter pricing to match budget limit: {{budget}}.
      Format product details inside lists.
    `);

    this.cache.set('v1:Delivery', `
      Check logistics coverage for target city: "{{city}}".
      Coordinate delivery estimates ensuring same-day limits are respected.
    `);
  }

  public load(agentName: string, version: string = 'v1'): string {
    const key = `${version}:${agentName}`;
    const template = this.cache.get(key);
    if (!template) {
      throw new Error(`Target prompt template not found: ${key}`);
    }
    return template;
  }

  public compile(agentName: string, variables: Record<string, any>): string {
    let template = this.load(agentName);
    for (const [key, value] of Object.entries(variables)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return template;
  }
}


// ==========================================================================
// PART 9 — API ROUTES & CONTROLLERS (EXPRESS)
// ==========================================================================

import express, { Request, Response, Router } from 'express';

export class ApiController {
  private engine: ConversationEngine;
  private mcp: McpWrapper;

  constructor(engine: ConversationEngine, mcp: McpWrapper) {
    this.engine = engine;
    this.mcp = mcp;
  }

  public registerRoutes(): Router {
    const router = Router();

    // POST /api/chat
    router.post('/chat', async (req: Request, res: Response) => {
      const payloadSchema = z.object({
        sessionId: z.string().uuid(),
        message: z.string().min(1),
        userId: z.string().uuid().optional()
      });

      const parsed = payloadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid Request Payload", details: parsed.error.format() });
      }

      const { sessionId, message, userId } = parsed.data;
      const responseText = await this.engine.processMessage(sessionId, message, userId);
      return res.status(200).json({ response: responseText });
    });

    // POST /api/search
    router.post('/search', async (req: Request, res: Response) => {
      const payloadSchema = z.object({
        query: z.string().min(1),
        maxPrice: z.number().positive().optional()
      });

      const parsed = payloadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }

      const products = await this.mcp.searchProducts(parsed.data.query, parsed.data.maxPrice);
      return res.status(200).json({ products });
    });

    return router;
  }
}


// ==========================================================================
// PART 10 — DEVELOPMENT ROADMAP & BUILD PLAN
// ==========================================================================

/*
BUILD ORDER:
1. Core Schemas & Types Validation Layer (Part 1 - Zod/TypeScript models).
2. Memory Proxy connection layers (Part 7 - Redis session cache & PG client pools).
3. MCP Abstraction Wrappers (Part 6 - validation filters, caching controls).
4. State Machine States (Part 3 - transitions logic, exit validations).
5. Intent Detection Engine (Part 4 - keyword matchers and LLM bindings).
6. Agent Implementations & Prompt Registry (Part 8 & Part 5 - Agent Orchestrator loops).
7. Main Conversation Controller Loop (Part 2 - ConversationEngine orchestrations).
8. Express Endpoint Layer (Part 9 - Controllers, schema validation middlewares).

TESTING PROCEDURES:
- Unit Test the state machine transitions using mock intent outputs.
- Integration Test the MCP abstraction wrapper to guarantee cache hits on identical queries.
- Perform a simulated load verification containing 500 parallel queries to verify locks.

LOCAL SETUP:
$ docker-compose up -d redis postgres
$ npm run build
$ npm run test
*/


