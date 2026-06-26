/**
 * Product requests parameters validator
 */
export const productsValidator = {
  validateSearch(req, res, next) {
    const { q } = req.body;
    if (typeof q !== 'string') {
      return res.status(400).json({ error: 'q must be a string' });
    }
    next();
  },

  validateDetails(req, res, next) {
    const { product_id } = req.body;
    if (typeof product_id !== 'string') {
      return res.status(400).json({ error: 'product_id must be a string' });
    }
    next();
  }
};

export default productsValidator;
