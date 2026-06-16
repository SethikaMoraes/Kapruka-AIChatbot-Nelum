# Nelum: MCP Integration & Commerce Execution Layer

This document details the systems design, TypeScript wrappers, validation schemas, caching architectures, and recovery paths required to link Nelum (🌸) to Kapruka's live Model Context Protocol (MCP) commerce registry.

---

## 1. System Context & Data Flow Path

Nelum isolates worker agents from raw tool execution by nesting calls inside an **Abstraction Wrapper Layer**.

```
[Agent Workers] ➔ [Service Layer] ➔ [Tool Wrapper Abstractions] ➔ [MCP SDK Client] ➔ [Kapruka Server API]
```

---

## Part 1 — MCP Client SDK

The SDK provides the lowest level transport, connection pooling, parameter validation, and rate-limiting blocks.

```typescript
import { z } from 'zod';

export class MCPClient {
  private endpoint: string;
  private token: string;

  constructor(endpoint: string, token: string) {
    this.endpoint = endpoint;
    this.token = token;
  }

  public async callTool<I, O>(toolName: string, params: I, validator: z.Schema<I>): Promise<O> {
    // 1. Enforce strict parameter validation before network hit
    const parsed = validator.safeParse(params);
    if (!parsed.success) {
      throw new Error(`MCP parameters validation failed for tool [${toolName}]: ${parsed.error.message}`);
    }

    // 2. Transport Execution (JSON-RPC 2.0 schema)
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: `tools/${toolName}`,
        params: parsed.data,
        id: Math.floor(Math.random() * 1000000)
      })
    });

    if (!response.ok) {
      throw new Error(`MCP connection error. HTTP Status: ${response.status}`);
    }

    const payload = await response.json();
    if (payload.error) {
      throw new Error(`MCP execution error [${payload.error.code}]: ${payload.error.message}`);
    }

    return payload.result as O;
  }
}
```

---

## Part 2 — Product Discovery Service

This service wraps product search, details lookup, and category filtering.

```typescript
export interface ProductSearchPayload {
  searchTerms: string;
  categoryLimit?: string;
  priceLimit?: number;
}

export class ProductDiscoveryService {
  private mcp: MCPClient;
  private cache: any; // Redis Cache Proxy

  constructor(mcp: MCPClient, cache: any) {
    this.mcp = mcp;
    this.cache = cache;
  }

  public async search(criteria: ProductSearchPayload): Promise<NormalizedProduct[]> {
    const cacheKey = `mcp:search:${criteria.searchTerms}:${criteria.priceLimit || 'max'}`;
    
    // Check Cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const rawResponse = await this.mcp.callTool<any, any>(
      "kapruka_search_products",
      criteria,
      z.object({
        searchTerms: z.string(),
        categoryLimit: z.string().optional(),
        priceLimit: z.number().optional()
      })
    );

    const normalized = this.normalizeSearch(rawResponse);
    
    // Cache for 10 minutes (600s)
    await this.cache.setex(cacheKey, 600, JSON.stringify(normalized));
    return normalized;
  }

  private normalizeSearch(raw: any): NormalizedProduct[] {
    if (!raw || !Array.isArray(raw.items)) return [];
    return raw.items.map((i: any) => ({
      id: String(i.id),
      title: String(i.name),
      price: Number(i.price_lkr),
      image: String(i.thumbnail_url),
      rating: Number(i.rating || 5),
      available: !!i.in_stock,
      deliveryEstimate: String(i.delivery_eta || 'Today'),
      category: String(i.category)
    }));
  }
}
```

---

## Part 3 — Delivery Intelligence Service

Manages shipping checkpoints, verifies Sri Lankan regions, calculates shipping rates, and checks delivery constraints.

```typescript
export interface DeliveryCheckPayload {
  city: string;
  items: Array<{ productId: string; qty: number }>;
}

export interface DeliveryValidationResult {
  isAvailable: boolean;
  cost: number;
  deliveryDate: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  perishableWarning: boolean;
}

export class DeliveryService {
  private mcp: MCPClient;

  constructor(mcp: MCPClient) {
    this.mcp = mcp;
  }

  public async validateDelivery(payload: DeliveryCheckPayload): Promise<DeliveryValidationResult> {
    const rawResult: any = await this.mcp.callTool(
      "kapruka_check_delivery",
      payload,
      z.object({
        city: z.string(),
        items: z.array(z.object({ productId: z.string(), qty: z.number() }))
      })
    );

    // Risk and perishables valuation
    const containsPerishable = rawResult.contains_bakery || rawResult.contains_fresh_flowers;
    const isDistant = !['colombo', 'gampaha', 'kalutara'].includes(payload.city.toLowerCase());

    return {
      isAvailable: !!rawResult.deliverable,
      cost: Number(rawResult.delivery_fee_lkr || 0),
      deliveryDate: String(rawResult.earliest_delivery_date),
      riskLevel: (containsPerishable && isDistant) ? 'HIGH' : 'LOW',
      perishableWarning: containsPerishable
    };
  }
}
```

---

## Part 4 — Checkout Execution Service

Prepares invoice requests and fetches secure payment URL gates.

```typescript
export interface OrderPayload {
  items: Array<{ id: string; qty: number }>;
  recipient: { name: string; phone: string; address: string };
  sender: { name: string; email: string };
  cardMessage: string | null;
  deliveryDate: string;
}

export class CheckoutService {
  private mcp: MCPClient;

  constructor(mcp: MCPClient) {
    this.mcp = mcp;
  }

  public async executeCheckout(payload: OrderPayload): Promise<{ orderId: string; paymentUrl: string }> {
    const rawResult: any = await this.mcp.callTool(
      "kapruka_create_order",
      payload,
      z.object({
        items: z.array(z.object({ id: z.string(), qty: z.number() })),
        recipient: z.object({ name: z.string(), phone: z.string(), address: z.string() }),
        sender: z.object({ name: z.string(), email: z.string() }),
        cardMessage: z.string().nullable(),
        deliveryDate: z.string()
      })
    );

    return {
      orderId: String(rawResult.order_reference),
      paymentUrl: String(rawResult.payment_gateway_url)
    };
  }
}
```

---

## Part 5 — Order Tracking Service

Converts raw courier coordinates into Sri Lankan milestone details.

```typescript
export interface NormalizedTrackingResult {
  orderId: string;
  activeStatus: 'ACCEPTED' | 'PREPARING' | 'DISPATCHED' | 'DELIVERED';
  courierName: string | null;
  eta: string;
  milestones: Array<{ title: string; time: string; completed: boolean }>;
}

export class TrackingService {
  private mcp: MCPClient;

  constructor(mcp: MCPClient) {
    this.mcp = mcp;
  }

  public async track(orderId: string): Promise<NormalizedTrackingResult> {
    const rawResult: any = await this.mcp.callTool("kapruka_track_order", { orderId }, z.object({ orderId: z.string() }));

    const statusMap: Record<string, NormalizedTrackingResult['activeStatus']> = {
      'pending': 'ACCEPTED',
      'baking': 'PREPARING',
      'courier_assigned': 'DISPATCHED',
      'delivered': 'DELIVERED'
    };

    return {
      orderId,
      activeStatus: statusMap[rawResult.logistics_state] || 'ACCEPTED',
      courierName: rawResult.driver_name || null,
      eta: rawResult.delivery_eta_message || 'Today',
      milestones: (rawResult.milestones || []).map((m: any) => ({
        title: String(m.label),
        time: String(m.timestamp),
        completed: !!m.is_passed
      }))
    };
  }
}
```

---

## Part 6 — Caching Strategy (Redis System Parameters)

Caching prevents API overload and rate limits on the Kapruka server.

- **Search Cache**: Key `mcp:search:{terms}:{price}`; TTL: **10 minutes** (`600s`).
- **Product Details Cache**: Key `mcp:product:detail:{id}`; TTL: **24 hours** (`86400s`).
- **Logistics Cities Cache**: Key `mcp:cities:list`; TTL: **7 days** (`604800s`).
- **Delivery Availability Cache**: Key `mcp:delivery:check:{city}:{itemsHash}`; TTL: **1 hour** (`3600s`).

---

## Part 7 — Resiliency & Failure Recovery Matrix

- **Rate Limiting**: Exceeded queries are paused and queued using an exponential backoff retry manager (`factor: 1.5`, `maxAttempts: 3`).
- **Perishable Risk**: If delivery validation returns a `HIGH` risk level (e.g. cake shipped to Kandy), the Delivery Service forces Nelum to append a warning: *"Aiyo, shipping fresh cakes to Kandy has high melting risk. Should we select an alternative fresh fruit basket instead?"*

---

## Part 8 — Observability

Nelum prints structured telemetry to stdout for logging aggregation:

```json
{
  "timestamp": "2026-06-16T12:00:00Z",
  "level": "INFO",
  "traceId": "trace-482937-29",
  "component": "McpWrapper",
  "event": "TOOL_CALL",
  "data": {
    "toolName": "kapruka_check_delivery",
    "latencyMs": 142,
    "status": "SUCCESS"
  }
}
```

---

## Part 9 — End-to-End Sequence Flows

```
[User Message] ➔ [ProductAgent] ➔ [ProductDiscoveryService] ➔ [McpWrapper] ➔ [MCP: kapruka_search_products]
```

---

## Part 10 — Implementation roadmap

```
Phase 1: SDK Connections ➔ Phase 2: Tool Wrappers ➔ Phase 3: Service Classes ➔ Phase 4: Redis Rules Caching ➔ Phase 5: Telemetry Trace logs
```
