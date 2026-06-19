/**
 * Nelum Singlish NLP Parser
 * Extracts local Sri Lankan idioms, relationship tags, and date constraints from phonetically written Singlish.
 */

export class SinglishParser {
  constructor() {
    this.relations = [
      { terms: ['ammata', 'amma ta', 'amma'], normalized: 'mother' },
      { terms: ['thaththata', 'thaththa ta', 'thaththa'], normalized: 'father' },
      { terms: ['machan', 'mchn'], normalized: 'friend' },
      { terms: ['mallita', 'malli ta', 'malli'], normalized: 'brother' },
      { terms: ['nangita', 'nangi ta', 'nangi'], normalized: 'sister' },
      { terms: ['wifeta', 'wife ta', 'wife'], normalized: 'wife' }
    ];

    this.dates = [
      { terms: ['adama', 'ada re', 'ada'], value: 'today' },
      { terms: ['heta', 'heta udema'], value: 'tomorrow' }
    ];
  }

  /**
   * Parses Singlish queries.
   * @param {string} text 
   * @returns {object} { entities: object, intent: string|null }
   */
  parse(text) {
    const query = text.toLowerCase();
    const entities = {};
    let intent = null;

    // 1. Relationship Extraction
    for (const rel of this.relations) {
      if (rel.terms.some(t => query.includes(t))) {
        entities.recipient = rel.normalized;
        if (rel.normalized === 'friend') {
          entities.tonePreference = 'BUDDY';
        }
        break;
      }
    }

    // 2. Dates Extraction
    for (const date of this.dates) {
      if (date.terms.some(t => query.includes(t))) {
        entities.delivery_date = date.value;
        break;
      }
    }

    // 3. Capability / Delivery validation
    if (query.includes('puluwanda') || query.includes('puluwan da')) {
      intent = 'DELIVERY_CHECK';
    }

    // 4. Emotional Dismay Trigger
    if (query.includes('aiyo')) {
      entities.emotionalContext = 'dismay';
    }

    // 5. General shopping terms
    if (query.includes('cake') || query.includes('gateau')) {
      entities.category = 'cakes';
    } else if (query.includes('flower') || query.includes('rose') || query.includes('lily')) {
      entities.category = 'flowers';
    } else if (query.includes('choc') || query.includes('ferrero')) {
      entities.category = 'chocolates';
    }

    // Occasions
    if (query.includes('birthday') || query.includes('upandinaya')) {
      entities.occasion = 'birthday';
      intent = 'GIFT_DISCOVERY';
    }

    return { entities, intent };
  }
}

export const singlishParser = new SinglishParser();
export default singlishParser;
