/**
 * Delivery requests parameters validator
 */
export const deliveryValidator = {
  validateCheck(req, res, next) {
    const { city, delivery_date, product_id } = req.body;
    if (!city || !delivery_date || !product_id) {
      return res.status(400).json({ error: 'Missing mandatory fields: city, delivery_date, product_id' });
    }
    next();
  }
};

export default deliveryValidator;
