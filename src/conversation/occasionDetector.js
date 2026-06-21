/**
 * Nelum Occasion Detector
 * Detects standard gifting occasions and Sri Lankan national/religious events.
 */

export class OccasionDetector {
  constructor() {
    this.occasionKeywords = {
      'Birthday': ['birthday', 'hupan', 'upandinaya', 'bday'],
      'Anniversary': ['anniversary', 'wedding day', 'samarumya'],
      'Mother\'s Day': ['mother\'s day', 'mothers day', 'moms day'],
      'Father\'s Day': ['father\'s day', 'fathers day', 'dads day'],
      'Valentine\'s': ['valentine', 'valantine', 'lovers day'],
      'Wedding': ['wedding', 'marriage', 'wiwaha'],
      'Graduation': ['graduation', 'graduate', 'upadhiya'],
      'New Baby': ['baby', 'newborn', 'baba'],
      'Apology': ['sorry', 'apologize', 'apology', 'samawenna', 'tharahawela'],
      'Thank You': ['thank you', 'thanks', 'sthuthi'],
      'Congratulations': ['congrats', 'congratulations', 'subha pathum'],
      'Avurudu': ['avurudu', 'aurudu', 'new year', 'aluth awurudda'],
      'Christmas': ['christmas', 'xmas', 'nattal'],
      'Thai Pongal': ['thai pongal', 'pongal'],
      'Vesak': ['vesak', 'wesak'],
      'Deepavali': ['deepavali', 'diwali'],
      'Ramadan': ['ramadan', 'ramazan', 'eid']
    };
  }

  /**
   * Detects the occasion.
   * @param {string} text 
   * @param {object} [context=null] 
   * @param {object} [cachedAnalysis=null] Pre-computed LLM analysis response
   * @returns {string|null} Occasion name or null
   */
  detect(text, context = null, cachedAnalysis = null) {
    if (cachedAnalysis && cachedAnalysis.occasion) {
      // Normalize casing
      const occ = cachedAnalysis.occasion;
      if (occ) {
        return occ.trim();
      }
    }

    const raw = text.toLowerCase();
    for (const [occasion, keywords] of Object.entries(this.occasionKeywords)) {
      if (keywords.some(kw => raw.includes(kw))) {
        return occasion;
      }
    }

    return null;
  }
}

export const occasionDetector = new OccasionDetector();
export default occasionDetector;
