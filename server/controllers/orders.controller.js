/**
 * Orders controller
 */
import { kaprukaService } from '../services/kapruka.service.js';

export const ordersController = {
  async create(req, res, next) {
    const { cart, recipient, delivery, sender, gift_message, currency } = req.body;
    try {
      const order = await kaprukaService.createOrder({
        cart,
        recipient,
        delivery,
        sender,
        giftMessage: gift_message,
        currency
      });
      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  async track(req, res, next) {
    const { order_number } = req.body;
    try {
      const tracking = await kaprukaService.trackOrder(order_number);
      res.json(tracking);
    } catch (err) {
      next(err);
    }
  }
};

export default ordersController;
