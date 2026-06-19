/**
 * Nelum Tamil NLP Parser
 * Extracts relationship mappings, category fits, and intent labels from raw Tamil queries.
 */

export class TamilParser {
  constructor() {
    this.relations = [
      { terms: ['அம்மா', 'அம்மாவின்', 'தாயார்'], normalized: 'mother' },
      { terms: ['அப்பா', 'தந்தை'], normalized: 'father' },
      { terms: ['மனைவி', 'அன்பிற்குரியவள்'], normalized: 'wife' },
      { terms: ['தம்பி', 'அண்ணன்', 'சகோதரன்'], normalized: 'brother' },
      { terms: ['தங்கை', 'அக்கா', 'சகோதரி'], normalized: 'sister' }
    ];

    this.categories = [
      { terms: ['கேக்', 'கேக்குகள்'], category: 'cakes' },
      { terms: ['மலர்க்', 'மலர்கள்', 'பூக்கள்', 'ரோஜா'], category: 'flowers' },
      { terms: ['சாக்லேட்'], category: 'chocolates' },
      { terms: ['தேநீர்', 'பழங்கள்', 'பழ'], category: 'groceries' }
    ];
  }

  /**
   * Parses Tamil raw text to extract entities and intent flags.
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
        break;
      }
    }

    // 2. Category Extraction
    for (const cat of this.categories) {
      if (cat.terms.some(t => query.includes(t))) {
        entities.category = cat.category;
        break;
      }
    }

    // 3. Intent Detection
    if (query.includes('எங்கே') || query.includes('பார்சல்')) {
      intent = 'ORDER_TRACK';
    } else if (query.includes('விபரங்கள்') || query.includes('கொடுங்கள்')) {
      intent = 'CHECKOUT';
    } else if (query.includes('பிறந்தநாள்')) {
      intent = 'GIFT_DISCOVERY';
      entities.occasion = 'birthday';
    } else if (query.includes('அனுப்ப') || query.includes('அன்பு')) {
      intent = 'GIFT_DISCOVERY';
    }

    return { entities, intent };
  }
}

export const tamilParser = new TamilParser();
export default tamilParser;
