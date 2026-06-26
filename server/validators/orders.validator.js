/**
 * Orders requests parameters validator
 */
export const ordersValidator = {
  validateCreate(req, res, next) {
    const { cart, recipient, delivery, sender } = req.body;
    if (!cart || !recipient || !delivery || !sender) {
      return res.status(400).json({ error: 'Missing order structures: cart, recipient, delivery, sender' });
    }
    next();
  },

  validateTrack(req, res, next) {
    const { order_number } = req.body;
    if (!order_number) {
      return res.status(400).json({ error: 'order_number must be specified' });
    }
    next();
  }
};

export default ordersValidator;
