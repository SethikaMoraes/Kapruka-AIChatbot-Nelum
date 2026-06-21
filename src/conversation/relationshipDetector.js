/**
 * Nelum Relationship Detector
 * Detects the relationship of the recipient: Mother, Father, Partner, Friend, Child, Manager, etc.
 */

export class RelationshipDetector {
  constructor() {
    this.relationshipKeywords = {
      'Mother': ['mother', 'mom', 'amma', 'mummy'],
      'Father': ['father', 'dad', 'thaththa', 'daddy'],
      'Partner': ['wife', 'husband', 'partner', 'girlfriend', 'boyfriend', 'gf', 'bf', 'love'],
      'Friend': ['friend', 'machan', 'yaluwa', 'buddy'],
      'Child': ['child', 'son', 'daughter', 'baby', 'baba', 'putha', 'duwa'],
      'Manager': ['manager', 'boss', 'sir', 'madam', 'colleague'],
      'Brother': ['brother', 'malli', 'aiya'],
      'Sister': ['sister', 'nangi', 'akka']
    };
  }

  /**
   * Detects relationship from text.
   * @param {string} text 
   * @param {object} [context=null] 
   * @param {object} [cachedAnalysis=null] Pre-computed LLM analysis response
   * @returns {string|null} Relationship string or null
   */
  detect(text, context = null, cachedAnalysis = null) {
    if (cachedAnalysis && cachedAnalysis.relationship) {
      const rel = cachedAnalysis.relationship;
      if (rel) {
        return rel.trim();
      }
    }

    const raw = text.toLowerCase();
    for (const [relationship, keywords] of Object.entries(this.relationshipKeywords)) {
      if (keywords.some(kw => raw.includes(kw))) {
        return relationship;
      }
    }

    return null;
  }
}

export const relationshipDetector = new RelationshipDetector();
export default relationshipDetector;
