/**
 * Voice requests parameters validator
 */
export const voiceValidator = {
  validateSynthesize(req, res, next) {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text must be a non-empty string' });
    }
    next();
  }
};

export default voiceValidator;
