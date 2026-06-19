/**
 * Nelum Sinhala NLP Parser
 * Extracts semantic shopping intents and local relationship mappings from formal/informal Sinhala queries.
 */

export class SinhalaParser {
  constructor() {
    this.relations = [
      { terms: ['අම්මට', 'අම්මා', 'මව'], normalized: 'mother' },
      { terms: ['තාත්තට', 'තාත්තා', 'පියා'], normalized: 'father' },
      { terms: ['නංගිට', 'නංගි'], normalized: 'sister' },
      { terms: ['මල්ලිට', 'මල්ලි'], normalized: 'brother' },
      { terms: ['අක්කට', 'අක්කා'], normalized: 'sister' },
      { terms: ['අයියට', 'අයියා', 'අයියට'], normalized: 'brother' },
      { terms: ['බිරිඳට', 'නෝනට', 'මගේ ආදරණීය'], normalized: 'wife' }
    ];

    this.categories = [
      { terms: ['කේක්', 'ගේටෝ', 'sweet'], category: 'cakes' },
      { terms: ['මල්', 'රෝස', 'මල් කළඹ', 'ලිලී'], category: 'flowers' },
      { terms: ['චොකලට්', 'පැණිරස'], category: 'chocolates' },
      { terms: ['තේ', 'පළතුරු', 'එළවළු', 'බඩු'], category: 'groceries' }
    ];
  }

  /**
   * Parses Sinhala raw text to extract entities and intent flags.
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

    // 3. Intent Detection overrides
    if (query.includes('බෙදාහැරීමේ') || query.includes('කොහේද') || query.includes('පාර්සලය')) {
      intent = 'ORDER_TRACK';
    } else if (query.includes('ලියන්න') || query.includes('කාඩ්')) {
      intent = 'CART_ADD';
    } else if (query.includes('තහවුරු කරන්න') || query.includes('විස්තර')) {
      intent = 'CHECKOUT';
    } else if (query.includes('උපන්දිනය') || query.includes('තෑග්ගක්')) {
      intent = 'GIFT_DISCOVERY';
      entities.occasion = 'birthday';
    }

    return { entities, intent };
  }
}

export const sinhalaParser = new SinhalaParser();
export default sinhalaParser;
