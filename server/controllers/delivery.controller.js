/**
 * Delivery controller
 */
import { kaprukaService } from '../services/kapruka.service.js';
import { memoryCache } from '../cache/memoryCache.js';
import { SERVER_CONFIG } from '../config/server.config.js';

export const deliveryController = {
  async listCities(req, res, next) {
    const query = req.query.q || 'colombo';
    const cacheKey = `cities:${query}`;
    
    const cached = memoryCache.getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    try {
      const cities = await kaprukaService.listDeliveryCities(query);
      memoryCache.setCached(cacheKey, cities, SERVER_CONFIG.CACHE_TTLS.DEFAULT);
      res.json(cities);
    } catch (err) {
      next(err);
    }
  },

  async check(req, res, next) {
    const { city, delivery_date, product_id } = req.body;
    const cacheKey = `delivery:${city.trim().toLowerCase()}:${delivery_date}:${product_id}`;

    const cached = memoryCache.getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    try {
      const result = await kaprukaService.checkDeliveryFeasibility(city, delivery_date, product_id);
      memoryCache.setCached(cacheKey, result, SERVER_CONFIG.CACHE_TTLS.DELIVERY);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

export default deliveryController;
