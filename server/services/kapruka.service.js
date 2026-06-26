/**
 * Nelum Express Gifting & Gifting Integration Service for Kapruka MCP
 */
import { mcpClientWrapper } from '../mcp/mcpClient.js';
import { memoryCache } from '../cache/memoryCache.js';
import { SERVER_CONFIG } from '../config/server.config.js';

// --- Regex-Based Markdown Parsers ---

function parseSearchMarkdown(md, queryCategory) {
  if (!md) return [];
  const products = [];
  const blocks = md.split(/\n\s*\n\s*\*\*/);
  
  for (let i = 0; i < blocks.length; i++) {
    let block = blocks[i];
    if (i === 0 && block.includes('**')) {
      const parts = block.split(/\*\*/);
      if (parts.length > 1) {
        block = parts.slice(1).join('**');
      } else {
        continue;
      }
    }
    
    const titleMatch = block.match(/^\d+\.\s+(.*?)\*\*/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    
    const idMatch = block.match(/ID:\s*`([^`]+)`/i);
    const id = idMatch ? idMatch[1].trim() : `item-${Math.floor(Math.random() * 100000)}`;
    
    const priceMatch = block.match(/LKR\s*([\d,]+)/i);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
    
    const available = !block.toLowerCase().includes('out of stock');
    const linkMatch = block.match(/\[View product\]\(([^)]+)\)/i);
    const viewUrl = linkMatch ? linkMatch[1].trim() : '';
    
    let category = queryCategory;
    const idLower = id.toLowerCase();
    if (idLower.includes('flower') || idLower.startsWith('fl')) {
      category = 'flowers';
    } else if (idLower.includes('cake') || idLower.startsWith('ck')) {
      category = 'cakes';
    } else if (idLower.includes('choc') || idLower.startsWith('ch')) {
      category = 'chocolates';
    } else if (idLower.includes('groc') || idLower.startsWith('gr')) {
      category = 'groceries';
    } else if (idLower.includes('toy') || idLower.startsWith('ty')) {
      category = 'toys';
    } else if (idLower.includes('elec') || idLower.startsWith('el')) {
      category = 'electronics';
    }
    
    const image = "";
    
    products.push({
      id,
      title,
      price,
      category,
      image,
      rating: 4.8,
      reviews: Math.floor(10 + Math.random() * 90),
      badge: price > 20000 ? "Premium" : (price < 5000 ? "Value Choice" : "Bestseller"),
      deliveryEstimate: block.toLowerCase().includes('same day') || block.toLowerCase().includes('today') ? "Today (Same Day)" : "Tomorrow (Next Day)",
      available,
      description: block.replace(/\n\s*/g, ' ').trim(),
      specs: [`ID: ${id}`, `Category: ${category}`, `View: ${viewUrl}`]
    });
  }
  return products;
}

function parseGetProductMarkdown(md, productId) {
  if (!md) return null;
  const lines = md.split('\n');
  let title = '';
  let price = 0;
  let category = 'cakes';
  let available = true;
  let image = '';
  let description = '';
  let specs = [];
  
  const titleLine = lines.find(l => l.startsWith('##'));
  if (titleLine) {
    title = titleLine.replace(/^##\s*/, '').trim();
  }
  
  const idMatch = md.match(/\*\*ID\*\*:\s*`([^`]+)`/i);
  const id = idMatch ? idMatch[1].trim() : productId;
  
  const priceMatch = md.match(/\*\*Price\*\*:\s*LKR\s*([\d,]+)/i);
  if (priceMatch) {
    price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
  }
  
  const stockMatch = md.match(/\*\*Stock\*\*:\s*(.*)/i);
  if (stockMatch) {
    available = !stockMatch[1].toLowerCase().includes('out of stock');
  }
  
  const catMatch = md.match(/\*\*Category\*\*:\s*(.*)/i);
  if (catMatch) {
    category = catMatch[1].trim().toLowerCase();
  }
  
  const imageMatch = md.match(/\*\*Image\*\*:\s*(https?:\/\/[^\s\n]+)/i);
  if (imageMatch) {
    image = imageMatch[1].trim();
  }
  
  const descStartIndex = lines.findIndex(l => !l.startsWith('##') && !l.startsWith('**') && l.trim() !== '');
  if (descStartIndex !== -1) {
    description = lines.slice(descStartIndex).join('\n').split('**Image**')[0].trim();
  }
  
  lines.forEach(l => {
    if (l.startsWith('**') && !l.startsWith('**Image**')) {
      specs.push(l.replace(/\*\*/g, '').trim());
    }
  });
  
  return {
    id,
    title,
    price,
    category,
    image,
    rating: 4.8,
    reviews: 42,
    badge: price > 20000 ? "Premium" : "Bestseller",
    deliveryEstimate: "Today (Same Day)",
    available,
    description,
    specs
  };
}

function parseCategoriesMarkdown(md) {
  if (!md) return [];
  const categories = [];
  const regex = /-\s+\[([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(md)) !== null) {
    categories.push(match[1].trim().toLowerCase());
  }
  return categories.length > 0 ? categories : ['cakes', 'flowers', 'chocolates', 'groceries', 'electronics', 'toys'];
}

function parseCitiesMarkdown(md) {
  if (!md) return [];
  const cities = [];
  const regex = /-\s+\*\*([^*]+)\*\*/g;
  let match;
  while ((match = regex.exec(md)) !== null) {
    cities.push(match[1].trim());
  }
  return cities;
}

function parseCheckDeliveryMarkdown(md, city, deliveryDate) {
  if (!md) return { deliverable: false, deliveryFee: 800, earliestDeliveryDate: deliveryDate, riskLevel: 'LOW' };
  
  const deliverable = md.toLowerCase().includes('available');
  
  const feeMatch = md.match(/LKR\s*([\d,]+)/i);
  const deliveryFee = feeMatch ? parseInt(feeMatch[1].replace(/,/g, ''), 10) : 800;
  
  const hasPerishableWarning = md.toLowerCase().includes('perishable') || md.toLowerCase().includes('warning') || md.toLowerCase().includes('melt') || md.toLowerCase().includes('wilt') || md.toLowerCase().includes('flower') || md.toLowerCase().includes('cake');
  const isDistant = !['colombo', 'gampaha', 'kalutara'].includes(city.toLowerCase());
  
  return {
    deliverable,
    deliveryFee,
    earliestDeliveryDate: deliveryDate,
    riskLevel: (hasPerishableWarning && isDistant) ? 'HIGH' : 'LOW'
  };
}

function parseTrackOrderMarkdown(md, orderId) {
  if (!md) {
    return {
      orderId,
      activeStatus: 'ACCEPTED',
      courierName: null,
      eta: 'Today',
      milestones: []
    };
  }
  
  if (md.toLowerCase().includes('error') || md.toLowerCase().includes('not exists') || md.toLowerCase().includes('not found')) {
    throw new Error(md);
  }
  
  const lines = md.split('\n');
  let activeStatus = 'ACCEPTED';
  let courierName = null;
  let eta = 'Today';
  const milestones = [];
  
  const statusMatch = md.match(/\*\*Status\*\*:\s*(\w+)/i);
  if (statusMatch) {
    activeStatus = statusMatch[1].trim().toUpperCase();
  }
  
  const courierMatch = md.match(/\*\*Courier\*\*:\s*([^\n]+)/i);
  if (courierMatch) {
    courierName = courierMatch[1].trim();
  }
  
  const etaMatch = md.match(/\*\*ETA\*\*:\s*([^\n]+)/i);
  if (etaMatch) {
    eta = etaMatch[1].trim();
  }
  
  const milestoneRegex = /-\s+\[([ x])\]\s+([^(]+)\s*(?:\(([^)]+)\))?/g;
  let match;
  while ((match = milestoneRegex.exec(md)) !== null) {
    milestones.push({
      title: match[2].trim(),
      time: match[3] ? match[3].trim() : 'Pending',
      completed: match[1].toLowerCase() === 'x'
    });
  }
  
  return {
    orderId,
    activeStatus,
    courierName,
    eta,
    milestones
  };
}

// --- Service Core Exports ---

export const kaprukaService = {
  async searchProducts(q, category, maxPrice) {
    console.log(`[Backend Proxy] Calling search: q="${q}"`);
    const md = await mcpClientWrapper.callTool('kapruka_search_products', { q });
    const parsed = parseSearchMarkdown(md, category || 'general');

    // Resolve detailed products in parallel to get their real images
    const detailedProducts = await Promise.all(parsed.map(async (p) => {
      try {
        const detailCacheKey = `product:${p.id}`;
        const cachedDetail = memoryCache.getCached(detailCacheKey);
        if (cachedDetail) {
          return {
            ...p,
            image: cachedDetail.image || p.image,
            description: cachedDetail.description || p.description,
            specs: cachedDetail.specs || p.specs,
            available: cachedDetail.available !== undefined ? cachedDetail.available : p.available
          };
        }

        console.log(`[Backend Proxy] Search post-resolving detail for: ${p.id}`);
        const detailMd = await mcpClientWrapper.callTool('kapruka_get_product', { product_id: p.id });
        const detailParsed = parseGetProductMarkdown(detailMd, p.id);
        if (detailParsed) {
          memoryCache.setCached(detailCacheKey, detailParsed, SERVER_CONFIG.CACHE_TTLS.DEFAULT);
          return {
            ...p,
            image: detailParsed.image || p.image,
            description: detailParsed.description || p.description,
            specs: detailParsed.specs || p.specs,
            available: detailParsed.available !== undefined ? detailParsed.available : p.available
          };
        }
      } catch (err) {
        console.warn(`[Backend Proxy] Failed to resolve details for product ${p.id}:`, err.message);
      }
      return p;
    }));

    return detailedProducts;
  },

  async getProductDetails(productId) {
    console.log(`[Backend Proxy] Calling get_product: id="${productId}"`);
    const md = await mcpClientWrapper.callTool('kapruka_get_product', { product_id: productId });
    return parseGetProductMarkdown(md, productId);
  },

  async listCategories() {
    console.log(`[Backend Proxy] Calling list_categories`);
    const md = await mcpClientWrapper.callTool('kapruka_list_categories', { depth: 1 });
    return parseCategoriesMarkdown(md);
  },

  async listDeliveryCities(query) {
    console.log(`[Backend Proxy] Calling list_delivery_cities query="${query}"`);
    const md = await mcpClientWrapper.callTool('kapruka_list_delivery_cities', { query, limit: 50 });
    return parseCitiesMarkdown(md);
  },

  async checkDeliveryFeasibility(city, deliveryDate, productId) {
    console.log(`[Backend Proxy] Calling check_delivery: city="${city}"`);
    const md = await mcpClientWrapper.callTool('kapruka_check_delivery', { city, delivery_date: deliveryDate, product_id: productId });
    return parseCheckDeliveryMarkdown(md, city, deliveryDate);
  },

  async createOrder({ cart, recipient, delivery, sender, giftMessage, currency }) {
    console.log(`[Backend Proxy] Calling create_order`);
    const md = await mcpClientWrapper.callTool('kapruka_create_order', {
      cart,
      recipient,
      delivery,
      sender,
      gift_message: giftMessage,
      currency: currency || 'LKR'
    });

    const refMatch = md.match(/ORD-[\w-]+/i);
    const orderId = refMatch ? refMatch[0] : `ORD-${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const payMatch = md.match(/\[Open checkout to pay\]\(([^)]+)\)/i);
    const paymentUrl = payMatch ? payMatch[1].trim() : `https://www.kapruka.com/tools/continue_order.jsp?id=${orderId}`;

    return { orderId, paymentUrl };
  },

  async trackOrder(orderNumber) {
    console.log(`[Backend Proxy] Calling track_order number="${orderNumber}"`);
    const md = await mcpClientWrapper.callTool('kapruka_track_order', { order_number: orderNumber });
    return parseTrackOrderMarkdown(md, orderNumber);
  }
};

export default kaprukaService;
