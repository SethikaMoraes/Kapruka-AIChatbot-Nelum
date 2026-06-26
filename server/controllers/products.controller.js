/**
 * Products controller
 */
import { kaprukaService } from '../services/kapruka.service.js';
import { memoryCache } from '../cache/memoryCache.js';
import { SERVER_CONFIG } from '../config/server.config.js';

export const productsController = {
  async search(req, res, next) {
    const { q, category, max_price } = req.body;
    const cacheKey = `search:${q.trim().toLowerCase()}:${category || ''}:${max_price || ''}`;
    
    const cached = memoryCache.getCached(cacheKey);
    if (cached) {
      console.log(`[Backend Cache] HIT for key: "${cacheKey}"`);
      return res.json(cached);
    }

    try {
      const results = await kaprukaService.searchProducts(q, category, max_price);
      memoryCache.setCached(cacheKey, results, SERVER_CONFIG.CACHE_TTLS.SEARCH);
      res.json(results);
    } catch (err) {
      next(err);
    }
  },

  async details(req, res, next) {
    const { product_id } = req.body;
    const cacheKey = `product:${product_id}`;

    const cached = memoryCache.getCached(cacheKey);
    if (cached) {
      console.log(`[Backend Cache] HIT for key: "${cacheKey}"`);
      return res.json(cached);
    }

    try {
      const product = await kaprukaService.getProductDetails(product_id);
      memoryCache.setCached(cacheKey, product, SERVER_CONFIG.CACHE_TTLS.DEFAULT);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async categories(req, res, next) {
    const cacheKey = 'categories';
    const cached = memoryCache.getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    try {
      const categories = await kaprukaService.listCategories();
      memoryCache.setCached(cacheKey, categories, SERVER_CONFIG.CACHE_TTLS.DEFAULT);
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }
};

export default productsController;
