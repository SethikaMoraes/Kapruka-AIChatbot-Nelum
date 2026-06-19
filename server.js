import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'url';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { 
  generateResponse, 
  generateShoppingAdvice, 
  generateGiftSuggestions, 
  generateUpsellSuggestions, 
  summarizeCart, 
  detectIntentWithLLM 
} from './src/ai/geminiClient.js';

const __filename = fileURLToPath(import.meta.url);
// Since path from 'url' was imported by accident or we can just use standard path
import pathModule from 'path';
const __dirname = pathModule.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and parse JSON request bodies
app.use(cors());
app.use(express.json());

// Serve static frontend files from root directory
app.use(express.static('.'));

// --- MCP Stateful Client Connection Logic ---
const MCP_ENDPOINT = 'https://mcp.kapruka.com/mcp';
let mcpClient = null;
let mcpTransport = null;

async function getMcpClient() {
  if (mcpClient) {
    return mcpClient;
  }

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  mcpTransport = new StreamableHTTPClientTransport(new URL(MCP_ENDPOINT), {
    requestInit: {
      headers: {
        'User-Agent': userAgent
      }
    }
  });

  const client = new Client(
    { name: 'nelum-server', version: '1.0.0' },
    { capabilities: {} }
  );

  console.log(`[Backend MCP] Connecting to Kapruka MCP using official SDK client...`);
  await client.connect(mcpTransport);
  console.log(`[Backend MCP] Stateful session established.`);
  mcpClient = client;
  return mcpClient;
}

async function callTool(toolName, params) {
  let client = await getMcpClient();
  try {
    const response = await client.callTool({
      name: toolName,
      arguments: {
        params: params
      }
    });

    if (response.isError) {
      const errMsg = response.content && response.content[0] ? response.content[0].text : 'Unknown tool error';
      throw new Error(errMsg);
    }

    return response.content && response.content[0] ? response.content[0].text : '';
  } catch (error) {
    console.warn(`[Backend MCP] Error calling tool "${toolName}": ${error.message}. Reconnecting...`);
    mcpClient = null;
    try {
      if (client) {
        await client.close().catch(() => {});
      }
    } catch (_) {}

    // Retry once
    client = await getMcpClient();
    const response = await client.callTool({
      name: toolName,
      arguments: {
        params: params
      }
    });

    if (response.isError) {
      const errMsg = response.content && response.content[0] ? response.content[0].text : 'Unknown tool error';
      throw new Error(errMsg);
    }

    return response.content && response.content[0] ? response.content[0].text : '';
  }
}

// --- Caching Layer ---
const cache = new Map();

function getCached(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  return cached.value;
}

function setCached(key, value, ttlSeconds) {
  cache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
}

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

// --- Express API Routes ---

// 1. Search Products
app.post('/api/products/search', async (req, res) => {
  const { q, category, max_price } = req.body;
  if (typeof q !== 'string') {
    return res.status(400).json({ error: 'q must be a string' });
  }

  const cacheKey = `search:${q.trim().toLowerCase()}:${category || ''}:${max_price || ''}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[Backend Cache] HIT for key: "${cacheKey}"`);
    return res.json(cached);
  }

  try {
    const params = { q };
    if (category) params.category = category;
    if (max_price) params.max_price = Number(max_price);

    console.log(`[Backend Proxy] Calling search: q="${q}"`);
    const md = await callTool('kapruka_search_products', params);
    const parsed = parseSearchMarkdown(md, category || 'general');

    // Resolve detailed products in parallel to get their real images
    const detailedProducts = await Promise.all(parsed.map(async (p) => {
      try {
        const detailCacheKey = `product:${p.id}`;
        const cachedDetail = getCached(detailCacheKey);
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
        const detailMd = await callTool('kapruka_get_product', { product_id: p.id });
        const detailParsed = parseGetProductMarkdown(detailMd, p.id);
        if (detailParsed) {
          setCached(detailCacheKey, detailParsed, 86400); // 24 hr cache
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

    setCached(cacheKey, detailedProducts, 600); // 10 min cache
    res.json(detailedProducts);
  } catch (err) {
    console.error(`[Backend API] search error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Product Details
app.post('/api/products/details', async (req, res) => {
  const { product_id } = req.body;
  if (typeof product_id !== 'string') {
    return res.status(400).json({ error: 'product_id must be a string' });
  }

  const cacheKey = `product:${product_id}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[Backend Cache] HIT for key: "${cacheKey}"`);
    return res.json(cached);
  }

  try {
    console.log(`[Backend Proxy] Calling get_product: id="${product_id}"`);
    const md = await callTool('kapruka_get_product', { product_id });
    const parsed = parseGetProductMarkdown(md, product_id);
    setCached(cacheKey, parsed, 86400); // 24 hr cache
    res.json(parsed);
  } catch (err) {
    console.error(`[Backend API] getProduct error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Categories
app.get('/api/categories', async (req, res) => {
  const cacheKey = 'categories';
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    console.log(`[Backend Proxy] Calling list_categories`);
    const md = await callTool('kapruka_list_categories', { depth: 1 });
    const parsed = parseCategoriesMarkdown(md);
    setCached(cacheKey, parsed, 86400); // 24 hr cache
    res.json(parsed);
  } catch (err) {
    console.error(`[Backend API] categories error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Delivery Cities
app.get('/api/delivery/cities', async (req, res) => {
  const query = req.query.q || 'colombo';
  const cacheKey = `cities:${query}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    console.log(`[Backend Proxy] Calling list_delivery_cities query="${query}"`);
    const md = await callTool('kapruka_list_delivery_cities', { query, limit: 50 });
    const parsed = parseCitiesMarkdown(md);
    setCached(cacheKey, parsed, 86400); // 24 hr cache
    res.json(parsed);
  } catch (err) {
    console.error(`[Backend API] cities error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Check Delivery Feasibility
app.post('/api/delivery/check', async (req, res) => {
  const { city, delivery_date, product_id } = req.body;
  if (!city || !delivery_date || !product_id) {
    return res.status(400).json({ error: 'Missing mandatory fields: city, delivery_date, product_id' });
  }

  const cacheKey = `delivery:${city.trim().toLowerCase()}:${delivery_date}:${product_id}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    console.log(`[Backend Proxy] Calling check_delivery: city="${city}"`);
    const md = await callTool('kapruka_check_delivery', { city, delivery_date, product_id });
    const parsed = parseCheckDeliveryMarkdown(md, city, delivery_date);
    setCached(cacheKey, parsed, 3600); // 1 hr cache
    res.json(parsed);
  } catch (err) {
    console.error(`[Backend API] checkDelivery error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. Create Order
app.post('/api/orders/create', async (req, res) => {
  const { cart, recipient, delivery, sender, gift_message, currency } = req.body;
  if (!cart || !recipient || !delivery || !sender) {
    return res.status(400).json({ error: 'Missing order structures: cart, recipient, delivery, sender' });
  }

  try {
    console.log(`[Backend Proxy] Calling create_order`);
    const md = await callTool('kapruka_create_order', {
      cart,
      recipient,
      delivery,
      sender,
      gift_message,
      currency: currency || 'LKR'
    });

    const refMatch = md.match(/ORD-[\w-]+/i);
    const orderId = refMatch ? refMatch[0] : `ORD-${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const payMatch = md.match(/\[Open checkout to pay\]\(([^)]+)\)/i);
    const paymentUrl = payMatch ? payMatch[1].trim() : `https://www.kapruka.com/tools/continue_order.jsp?id=${orderId}`;

    res.json({ orderId, paymentUrl });
  } catch (err) {
    console.error(`[Backend API] createOrder error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7. Track Order
app.post('/api/orders/track', async (req, res) => {
  const { order_number } = req.body;
  if (!order_number) {
    return res.status(400).json({ error: 'order_number must be specified' });
  }

  try {
    console.log(`[Backend Proxy] Calling track_order number="${order_number}"`);
    const md = await callTool('kapruka_track_order', { order_number });
    const parsed = parseTrackOrderMarkdown(md, order_number);
    res.json(parsed);
  } catch (err) {
    console.error(`[Backend API] trackOrder error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Gemini AI Proxy Routes ---

// 1. General Response
app.post('/api/ai/generate-response', async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  try {
    const response = await generateResponse(prompt, systemInstruction);
    res.json({ response });
  } catch (err) {
    console.error(`[AI Proxy] generateResponse error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Shopping Advice
app.post('/api/ai/shopping-advice', async (req, res) => {
  const { query, products } = req.body;
  try {
    const response = await generateShoppingAdvice(query, products);
    res.json({ response });
  } catch (err) {
    console.error(`[AI Proxy] generateShoppingAdvice error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Gift Suggestions
app.post('/api/ai/gift-suggestions', async (req, res) => {
  const { occasion, budget, recipient, products } = req.body;
  try {
    const response = await generateGiftSuggestions(occasion, budget, recipient, products);
    res.json({ response });
  } catch (err) {
    console.error(`[AI Proxy] generateGiftSuggestions error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Upsell Suggestions
app.post('/api/ai/upsell-suggestions', async (req, res) => {
  const { cartItems, products } = req.body;
  try {
    const response = await generateUpsellSuggestions(cartItems, products);
    res.json({ response });
  } catch (err) {
    console.error(`[AI Proxy] generateUpsellSuggestions error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Summarize Cart
app.post('/api/ai/summarize-cart', async (req, res) => {
  const { cartItems } = req.body;
  try {
    const response = await summarizeCart(cartItems);
    res.json({ response });
  } catch (err) {
    console.error(`[AI Proxy] summarizeCart error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. Detect Intent with LLM
app.post('/api/ai/detect-intent', async (req, res) => {
  const { userInput, context } = req.body;
  try {
    const response = await detectIntentWithLLM(userInput, context);
    res.json({ response });
  } catch (err) {
    console.error(`[AI Proxy] detectIntentWithLLM error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start listening on port 8000
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`NELUM PROXY SERVER STARTED SUCCESSFULLY`);
  console.log(`Serving static files and API endpoints on PORT: ${PORT}`);
  console.log(`==================================================`);
});
