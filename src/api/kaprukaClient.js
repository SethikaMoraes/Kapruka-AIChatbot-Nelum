/**
 * Kapruka Backend Proxy Client
 * Renders the frontend completely free of direct external MCP calls.
 * All operations are delegated to /api Express endpoints, ensuring compliance with CORS restrictions.
 */

import { NetworkError, McpError } from '../utils/errorHandler.js';

export class KaprukaClient {
  constructor() {
    console.log('[KaprukaClient] Refactored client loaded. All MCP requests now routed through backend proxy.');
  }

  _getUrl(path) {
    if (typeof window === 'undefined') {
      const port = process.env.PORT || 8000;
      return `http://localhost:${port}${path}`;
    }
    return path;
  }

  /**
   * 1. Search products in the catalog
   */
  async searchProducts(searchTerms, categoryLimit = null, priceLimit = null) {
    if (typeof searchTerms !== 'string') {
      throw new Error('Invalid parameter: searchTerms must be a string');
    }

    try {
      const res = await fetch(this._getUrl('/api/products/search'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: searchTerms,
          category: categoryLimit,
          max_price: priceLimit
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new McpError(errorData.error || `HTTP ${res.status} error during search`);
      }

      return await res.json();
    } catch (e) {
      console.error(`[KaprukaClient] Search failed for: "${searchTerms}"`, e);
      if (e instanceof McpError) throw e;
      throw new NetworkError(e.message);
    }
  }

  /**
   * 2. Retrieve detailed specifications for a single product ID
   */
  async getProduct(productId) {
    if (typeof productId !== 'string') {
      throw new Error('Invalid parameter: productId must be a string');
    }

    try {
      const res = await fetch(this._getUrl('/api/products/details'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new McpError(errorData.error || `HTTP ${res.status} error fetching product details`);
      }

      return await res.json();
    } catch (e) {
      console.error(`[KaprukaClient] Get product failed for ID: ${productId}`, e);
      if (e instanceof McpError) throw e;
      throw new NetworkError(e.message);
    }
  }

  /**
   * 3. List available categories
   */
  async listCategories() {
    try {
      const res = await fetch(this._getUrl('/api/categories'));
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new McpError(errorData.error || `HTTP ${res.status} error listing categories`);
      }
      return await res.json();
    } catch (e) {
      console.error('[KaprukaClient] List categories failed', e);
      if (e instanceof McpError) throw e;
      throw new NetworkError(e.message);
    }
  }

  /**
   * 4. List all supported delivery cities
   */
  async listDeliveryCities(query = 'colombo') {
    try {
      const res = await fetch(this._getUrl(`/api/delivery/cities?q=${encodeURIComponent(query)}`));
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new McpError(errorData.error || `HTTP ${res.status} error listing cities`);
      }
      return await res.json();
    } catch (e) {
      console.error(`[KaprukaClient] List delivery cities failed for query: "${query}"`, e);
      if (e instanceof McpError) throw e;
      throw new NetworkError(e.message);
    }
  }

  /**
   * 5. Check if a delivery is feasible and get estimation
   */
  async checkDelivery(city, deliveryDate, productId) {
    try {
      const res = await fetch(this._getUrl('/api/delivery/check'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          city,
          delivery_date: deliveryDate,
          product_id: productId
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new McpError(errorData.error || `HTTP ${res.status} error checking delivery feasibility`);
      }

      return await res.json();
    } catch (e) {
      console.error(`[KaprukaClient] Check delivery failed for city: "${city}"`, e);
      if (e instanceof McpError) throw e;
      throw new NetworkError(e.message);
    }
  }

  /**
   * 6. Create order and fetch payment gateway page URL
   */
  async createOrder(items, recipient, sender, cardMessage, deliveryDate) {
    try {
      const cart = items.map(item => {
        const pid = item.productId || item.id;
        return { product_id: pid };
      });

      const mappedRecipient = {
        name: recipient.name || 'Recipient',
        phone: recipient.phone || '0771234567'
      };

      const mappedDelivery = {
        city: recipient.city || recipient.address?.split(',').pop()?.trim() || 'Colombo 03',
        date: deliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        address: recipient.address || 'No. 23, Flower Road, Colombo 03'
      };

      const mappedSender = {
        name: sender.name || 'Sender Name'
      };

      const res = await fetch(this._getUrl('/api/orders/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart,
          recipient: mappedRecipient,
          delivery: mappedDelivery,
          sender: mappedSender,
          gift_message: cardMessage || 'Gift message from Nelum AI',
          currency: 'LKR'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new McpError(errorData.error || `HTTP ${res.status} error creating order`);
      }

      return await res.json();
    } catch (e) {
      console.error('[KaprukaClient] Create order failed', e);
      if (e instanceof McpError) throw e;
      throw new NetworkError(e.message);
    }
  }

  /**
   * 7. Track delivery state milestones of a purchased order reference
   */
  async trackOrder(orderId) {
    try {
      const res = await fetch(this._getUrl('/api/orders/track'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_number: orderId
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new McpError(errorData.error || `HTTP ${res.status} error tracking order`);
      }

      return await res.json();
    } catch (e) {
      console.error(`[KaprukaClient] Track order failed for: ${orderId}`, e);
      if (e instanceof McpError) throw e;
      throw new NetworkError(e.message);
    }
  }
}

export const kaprukaClient = new KaprukaClient();
export default kaprukaClient;
