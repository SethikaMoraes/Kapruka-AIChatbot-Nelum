/**
 * Nelum Tanglish NLP Parser
 * Translates Tamil-English code-switched phrases into structured semantic shopping contexts.
 */

export class TanglishParser {
  constructor() {
    this.relations = [
      { terms: ['ammaku', 'amma ku', 'amma'], normalized: 'mother' },
      { terms: ['appaku', 'appa ku', 'appa'], normalized: 'father' },
      { terms: ['wifeku', 'wife ku', 'wife'], normalized: 'wife' },
      { terms: ['thambiku', 'thambi ku'], normalized: 'brother' },
      { terms: ['akkaku', 'akka ku'], normalized: 'sister' }
    ];
  }

  /**
   * Parses Tanglish text queries.
   * @param {string} text 
   * @returns {object} { entities: object, intent: string|null }
   */
  parse(text) {
    const query = text.toLowerCase();
    const entities = {};
    let intent = null;

    // 1. Relationship extraction
    for (const rel of this.relations) {
      if (rel.terms.some(t => query.includes(t))) {
        entities.recipient = rel.normalized;
        break;
      }
    }

    // 2. City extraction (e.g. "kandy ku", "colombo ku")
    const cities = ['colombo', 'kandy', 'galle', 'jaffna', 'negombo', 'gampaha', 'kalutara'];
    for (const city of cities) {
      if (query.includes(`${city} ku`) || query.includes(`${city}ku`) || query.includes(city)) {
        entities.city = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    // 3. Intent mapping based on colloquial Tamil/English verbs
    if (query.includes('deliver panna') || query.includes('delivery') || query.includes('evlo') || query.includes('cost')) {
      intent = 'DELIVERY_CHECK';
    } else if (query.includes('send panna') || query.includes('checkout') || query.includes('ready to send')) {
      intent = 'CHECKOUT';
    } else if (query.includes('birthday') || query.includes('gift venum')) {
      entities.occasion = 'birthday';
      intent = 'GIFT_DISCOVERY';
    }

    return { entities, intent };
  }
}

export const tanglishParser = new TanglishParser();
export default tanglishParser;
