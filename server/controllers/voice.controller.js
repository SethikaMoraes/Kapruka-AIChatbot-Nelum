/**
 * Voice controller
 */
import { geminiService } from '../services/gemini.service.js';

export const voiceController = {
  async synthesize(req, res, next) {
    const { text, voice } = req.body;
    try {
      const result = await geminiService.generateVoice(text, voice || 'Aoede');
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

export default voiceController;
