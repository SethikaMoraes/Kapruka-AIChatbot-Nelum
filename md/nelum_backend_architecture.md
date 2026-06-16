# Nelum: Backend Foundation & AI Runtime Architecture

This engineering document serves as the implementation specification for the Nelum Backend Engine, running a state-driven multi-agent orchestration pattern for conversational commerce. It details project directory organization, API contracts, prompt templating patterns, scoring logic, caching boundaries, and recovery policies.

---

## Part 1 — Project Structure

The project follows a modular, clean architectural pattern separating logic layers, domain workflows, and external systems integration.

```
nelum-backend/
├── app/                      # Main application entry point
├── api/                      # Routing handlers, middleware, request validators
├── lib/                      # Base abstractions (MCP wrappers, HTTP clients)
├── agents/                   # Agent cognitive loops, worker definitions
├── conversation/             # State tracking, session lifecycle manager
├── memory/                   # DB connectors, profile storage layers
├── mcp/                      # Raw MCP client connection pool
├── recommendation/           # Scoring calculations, bundle assemblies
├── prompts/                  # Template loaders, prompt version registries
├── services/                 # Kapruka API layer wrappers (stock, payment)
├── state-machine/            # State machine state logic
├── types/                    # Shared TypeScript schemas / interface definitions
├── config/                   # Global env configurations, security policies
├── cache/                    # Redis caching strategies, TTL controls
└── analytics/                # Telemetry logger, error trackers
```

### Folder Interaction Rules:
- **`api/`** depends on **`conversation/`** and **`config/`**. It cannot import directly from **`mcp/`** or **`agents/`**.
- **`agents/`** workers can import from **`lib/`** and **`prompts/`**. They must call tools exclusively via **`lib/mcp-wrapper`** and never interact with direct database models.
- **`state-machine/`** governs transition paths. It only alters **`SessionContext`** and executes checks.
- **`lib/`** contains core abstractions; it must not import from **`agents/`** or **`api/`**.

---

## Part 2 — Conversation Engine

The Conversation Engine coordinates session lifecycles, aggregates contexts, and drives the conversation pipeline.

### TypeScript Context Schemas:

```typescript
export interface SessionContext {
  sessionId: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  languageCode: 'en' | 'si' | 'ta' | 'mix';
  activeState: ConversationState;
}

export interface StateContext {
  currentState: ConversationState;
  stateHistory: ConversationState[];
  missingEntities: string[];
  lastTransitionTimestamp: string;
}

export interface IntentContext {
  detectedIntent: string;
  confidenceScore: number;
  extractedEntities: Record<string, any>;
  rawQuery: string;
}

export interface GoalContext {
  primaryGoal: 'GIFT_PURCHASE' | 'ELECTRONICS_SEARCH' | 'GROCERY_REORDER' | 'ORDER_TRACK' | 'HELP';
  isCompleted: boolean;
  targetRecipient: string | null;
  targetBudget: number | null;
  targetCity: string | null;
}

export interface ConversationContext {
  session: SessionContext;
  state: StateContext;
  intent: IntentContext;
  goal: GoalContext;
  cart: {
    items: Array<{ id: string; qty: number; isBundle: boolean }>;
    subtotal: number;
    greetingCardMessage: string | null;
  };
  delivery: {
    recipientName: string | null;
    recipientPhone: string | null;
    address: string | null;
    date: string | null;
    timeWindow: string | null;
    senderName: string | null;
  };
}
```

---

## Part 3 — State Machine Runtime Config

```
 WELCOME ➔ DISCOVERY ➔ GIFT_DISCOVERY ➔ BUNDLE_BUILDING ➔ CART_BUILDING ➔ CHECKOUT
```

### State Matrix Configuration:

| State | Entry Criteria | Exit Criteria | Required Data | Worker Agents | MCP Tools |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`WELCOME`** | Session initialization. | Input query received. | `sessionId` | `Language`, `Intent` | None |
| **`GIFT_DISCOVERY`**| Match `GIFT_DISCOVERY` intent. | `recipient` and `occasion` extracted. | `recipient`, `occasion` | `Product`, `Recs` | `search_products`, `list_categories` |
| **`PRODUCT_SEARCH`**| Keyword detected. | Product array returned. | `product_keyword` | `Product` | `search_products` |
| **`BUNDLE_BUILDING`**| Bundle keyword / starter click. | Bundle selection confirmed. | `category`, `budget` | `Recs`, `Product` | `search_products`, `get_product` |
| **`DELIVERY_VALIDATION`**| Checkout request matching. | Delivery destination approved. | `city`, `delivery_date` | `Delivery` | `list_delivery_cities`, `check_delivery` |
| **`CHECKOUT`** | All delivery and billing verified. | Order creation status success. | `cart_items`, `recipient_phone`, `address` | `Checkout` | `create_order` |
| **`TRACKING`** | Match `ORDER_TRACK` intent. | Session timeout / close click. | `order_reference` | `Tracking` | `track_order` |

---

## Part 4 — Intent Detection Layer

The Intent Engine classifies raw inputs into structured goals. It supports **multi-intent categorization** (e.g., apologizing and ordering roses in one sentence) and detects ambiguity.

```typescript
export interface IntentOutput {
  primaryIntent: string;
  secondaryIntents: string[];
  confidence: number;
  ambiguityDetected: boolean;
  entities: {
    recipient?: string;
    occasion?: string;
    budget?: number;
    city?: string;
    date?: string;
    products?: string[];
  };
  requiredFollowUps: string[];
}
```

### Ambiguity Resolver Workflow:
1. If `confidence < 0.65` or inputs match multiple conflicting categories, set `ambiguityDetected = true`.
2. Push state to `PRODUCT_SEARCH` or `DISCOVERY` fallback.
3. Supervisor selects disambiguation prompt template to query user for target parameters (e.g., *"Did you want to check delivery parameters or browse hampers?"*).

---

## Part 5 — Memory Infrastructure

Memory is split into three storage buckets to manage high throughput:

```
                  ┌────────────────────────────────────────┐
                  │          USER TRANSACTION              │
                  └───────────────────┬────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
    [Session Memory]          [Short-Term Memory]     [Long-Term Memory]
  ┌───────────────────┐      ┌───────────────────┐   ┌───────────────────┐
  │ Cache: Redis      │      │ Cache: Redis      │   │ Database: PG      │
  │ TTL: 30 Minutes   │      │ TTL: 30 Days      │   │ TTL: Permanent    │
  └───────────────────┘      └───────────────────┘   └───────────────────┘
```

### Schemas & Keys:
- **Session Keys**: `session:{sessionId}`. Cache mapping of current context buffer.
- **Short-Term Keys**: `st:user:{userId}`. Holds last selected delivery addresses, recipient numbers, and active tracking numbers.
- **Long-Term Database Schema**:
  - `user_profiles`: Customer ID, favorite categories list, average order values, custom relationship calendar (e.g. Wife birthday: June 20).
  - `gifting_history`: Historic recipient mappings, order success dates, customized card text logs.

---

## Part 6 — Agent Runtime Contracts

Workers run strict prompt contracts wrapping LLM schemas.

### Example Prompt Contract: Recommendation Agent

```markdown
# Role
You are the Nelum Recommendation Agent. You rank Kapruka items based on a customer's specific contextual constraints.

# Input JSON
{
  "recipient": "{{recipient}}",
  "occasion": "{{occasion}}",
  "budget": {{budget}},
  "city": "{{city}}",
  "candidates": {{candidate_list}}
}

# Output format
Return ONLY a valid JSON payload matching this structure:
{
  "recommendations": [
    { "id": "p1", "score": 0.95, "rationale": "High-quality cakes are popular for birthdays in Colombo." }
  ],
  "bundleMatches": []
}
```

---

## Part 7 — Agent Orchestrator Routing

The Orchestrator processes user requests, evaluates intent routing, schedules execution, and normalizes final agent payloads.

```
User Input ➔ Intent Detection ➔ Supervisor Evaluate State ➔ Route to Agent ➔ Call MCP Tool ➔ Compile Response ➔ Commit Memory
```

### Selection Policies:
- **Lock-out policy**: While in `DELIVERY_COLLECTION`, all queries are routed directly to the `DeliveryAgent` to prevent subject deviation.
- **Timeouts**: All worker agents are bounded by a 4500ms timeout limit. If exceeded, the orchestrator triggers a fallback state using cache candidates.

---

## Part 8 — MCP Abstraction Layer

Agents never communicate directly with raw MCP servers. Instead, they interact with the **MCP Tool Abstraction Wrapper** which manages schemas, caching, validation, and circuit breaking:

```
Agent Worker ➔ Abstraction Wrapper ➔ Schema Validation ➔ Redis Cache Check ➔ Circuit Breaker ➔ Raw MCP Call
```

- **Caching Layer**: Caches product list outputs with a short TTL (10 mins) to prevent resource limits.
- **Circuit Breaker**: If `create_order` or `search_products` returns gateway errors 3 times consecutively, the wrapper trips and diverts requests to backup mock catalog queues.

---

## Part 9 — Recommendation Scoring & Ranking Engine

The engine computes a total suitability index for catalog searches using target weighting:

$$Score = (w_{relationship} \times R_i) + (w_{budget} \times B_i) + (w_{delivery} \times D_i) + (w_{popularity} \times P_i)$$

```typescript
export function calculateRecommendationScore(product: Product, context: ConversationContext): number {
  const wRel = 0.35;
  const wBdg = 0.30;
  const wDel = 0.20;
  const wPop = 0.15;

  let rScore = calculateVectorSimilarity(product.category, context.goal.targetRecipient);
  let bScore = product.price <= (context.goal.targetBudget || 1000000) ? 1.0 : Math.exp(-(product.price - context.goal.targetBudget!) / 5000);
  let dScore = product.deliveryEstimate.includes("Today") ? 1.0 : 0.6;
  let pScore = product.rating / 5.0;

  return (wRel * rScore) + (wBdg * bScore) + (wDel * dScore) + (wPop * pScore);
}
```

---

## Part 10 — Prompt Management System

Prompts are stored as independent, versioned markdown files loaded from a secure registry `/prompts/registry/`.

### Templates:
- `/prompts/registry/v1.0/supervisor.md`
- `/prompts/registry/v1.0/product_worker.md`
- `/prompts/registry/v1.0/delivery_worker.md`

### Safety rules:
- **Prompt Injection Filter**: All user queries are sanitized prior to context injection. Any query containing commands like *"ignore prior instructions"* or *"system developer"* automatically routes to an immediate security warning bubble response.

---

## Part 11 — API Endpoints Design

### Endpoint: `POST /api/chat`
* **Request Payload**:
```json
{
  "sessionId": "session-87493",
  "message": "Send roses to my wife tomorrow",
  "userId": "user-4892"
}
```
* **Response Payload**:
```json
{
  "message": "I've found gorgeous red roses for her! 🌹 I can deliver them tomorrow to Colombo. Shall we proceed to details?",
  "state": "GIFT_DISCOVERY",
  "cartCount": 0
}
```

---

## Part 12 — Caching Strategy (Redis Architecture)

Redis is deployed as the primary caching and session tier.

```
┌─────────────────────────────────┬─────────────────┬──────────────────────────────────┐
│ CACHE CATEGORY                  │ TTL             │ CACHE KEY SCHEMA                 │
├─────────────────────────────────┼─────────────────┼──────────────────────────────────┤
│ Session context store           │ 30 Minutes      │ `session:{sessionId}`            │
│ Product specifications          │ 24 Hours        │ `product:detail:{productId}`      │
│ Delivery cities index           │ 7 Days          │ `logistics:cities`               │
│ Order tracking history          │ 1 Hour          │ `tracking:status:{orderId}`      │
└─────────────────────────────────┴─────────────────┴──────────────────────────────────┘
```

- **Invalidation Strategy**: Product details invalidation occurs when an administrative update webhook is received from Kapruka inventory channels.

---

## Part 13 — Observability & Telemetry Metrics

Nelum implements tracing telemetry via **OpenTelemetry**:
- **Traces**: Logs individual transaction paths (User Query ➔ Intent Classification ➔ MCP Call ➔ Compose Response) to trace latency bottlenecks.
- **Metrics**: Tracks aggregate error frequencies, LLM token usages, intent classification distributions, and checkout conversion rates.
- **Logging Level**: Bounded to standard stdout format utilizing Winston.

---

## Part 14 — Failure Recovery Protocols

- **State Corruption Recovery**: If the session JSON context fails to validate against schema rules due to execution interruptions, the system auto-resets the state to `DISCOVERY` while saving item details in a temporary cart cache.
- **MCP Timeout Fallback**: If an MCP query times out after 4500ms, the system pulls cached trending products from the corresponding category and issues a warning toast to the user.

---

## Part 15 — Implementation Roadmap

```
Phase 1: Setup & Types (Week 1) ➔ Phase 2: Engine & States (Week 2) ➔ Phase 3: Agents & MCP (Week 3) ➔ Phase 4: Verification (Week 4)
```

1. **Phase 1: Repository & Type Setup**: Define all typescript schema structures, directory layouts, and mock datasets.
2. **Phase 2: Conversation Engine**: Build state machine pipelines and local context trackers.
3. **Phase 3: Agent loops & MCP integration**: Connect OpenAI/Gemini bindings, construct prompt files, link MCP wrappers.
4. **Phase 4: Optimization**: Set up Redis caching rules, telemetry trace systems, and test scripts.
5. **Local Setup**: Run `docker-compose up` to initialize Postgres and Redis locally, then execute `npm run dev`.
