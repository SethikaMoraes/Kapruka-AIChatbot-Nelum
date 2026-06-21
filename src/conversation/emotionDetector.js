/**
 * Nelum Emotion Detector
 * Detects user emotions: Caring, Excited, Unsure, Grateful, Frustrated, Apologetic, Neutral.
 */

export class EmotionDetector {
  constructor() {
    this.rules = [
      { emotion: 'Apologetic', keywords: ['sorry', 'apologize', 'apology', 'samawenna', 'tharahawela', 'tharahada'] },
      { emotion: 'Grateful', keywords: ['thanks', 'thank you', 'elakiri', 'patta', 'super', 'awesome', 'sthuthi', 'nandri'] },
      { emotion: 'Excited', keywords: ['happy', 'excited', 'wow', 'elakiri', 'great', 'awesome', 'supiri'] },
      { emotion: 'Frustrated', keywords: ['error', 'not working', 'aiyo', 'fail', 'bad', 'slow'] },
      { emotion: 'Unsure', keywords: ['don\'t know', 'not sure', 'unsure', 'help', 'confused', 'choose for me', 'suggest'] },
      { emotion: 'Caring', keywords: ['mom', 'mother', 'amma', 'dad', 'father', 'thaththa', 'wife', 'husband', 'love', 'baby', 'special'] }
    ];
  }

  /**
   * Detects the user's emotion.
   * @param {string} text 
   * @param {object} [context=null] 
   * @param {object} [cachedAnalysis=null] Pre-computed LLM analysis response
   * @returns {string} Emotion string
   */
  detect(text, context = null, cachedAnalysis = null) {
    if (cachedAnalysis && cachedAnalysis.emotion) {
      return cachedAnalysis.emotion;
    }

    const raw = text.toLowerCase();
    
    // Evaluate rule-based keywords
    for (const rule of this.rules) {
      if (rule.keywords.some(kw => raw.includes(kw))) {
        return rule.emotion;
      }
    }

    return 'Neutral';
  }
}

export const emotionDetector = new EmotionDetector();
export default emotionDetector;
