/**
 * Nelum Multilingual Language Processor
 * Detects Sinhala, Tamil, Singlish, Tanglish, and English inputs and coordinates localized parsing.
 */

import { sinhalaParser } from './sinhalaParser.js';
import { tamilParser } from './tamilParser.js';
import { singlishParser } from './singlishParser.js';
import { tanglishParser } from './tanglishParser.js';

export class LanguageProcessor {
  constructor() {
    this.greetingsRegistry = {
      si_formal: 'ආයුබෝවන් 🌸 අද මම ඔබට උදව් කරන්නේ කෙසේද?',
      si_informal: 'Kohomada 😄 අද අපි කාටද surprise එකක් කරන්නේ?',
      ta_respectful: 'வணக்கம்! 🌸 இன்று யாருக்கு பரிசு அனுப்ப வேண்டும்?',
      singlish_buddy: 'Kohomada machan! 😄 Ready to find some patta gifts today?',
      en_formal: 'Hi, I\'m Nelum 🌸 Who are we shopping for today?'
    };
  }

  /**
   * Identifies the query language category.
   * @param {string} text 
   * @returns {string} 'si' | 'ta' | 'mix' | 'en'
   */
  detectLanguage(text) {
    const raw = text.toLowerCase();
    
    // 1. Unicode checks for Sinhala/Tamil script
    if (/[\u0D80-\u0DFF]/.test(text)) {
      return 'si';
    }
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return 'ta';
    }

    // 2. Vocabulary checks for Singlish
    const singlishKeywords = ['machan', 'ammata', 'malli', 'nangi', 'puluwanda', 'aiyo', 'kohomada', 'elakiri', 'patta', 'tharahawela', 'samawenna'];
    if (singlishKeywords.some(kw => raw.includes(kw))) {
      return 'mix'; // Singlish
    }

    // 3. Vocabulary checks for Tanglish
    const tanglishKeywords = ['venum', 'panna', 'mudiyuma', 'evlo', 'ku ', 'annan', 'thambi'];
    if (tanglishKeywords.some(kw => raw.includes(kw))) {
      return 'mix'; // Tanglish
    }

    return 'en';
  }

  /**
   * Parses the text by delegating to the target language parser.
   * @param {string} text 
   * @returns {object} { entities: object, intent: string|null, language: string }
   */
  parseQuery(text) {
    const lang = this.detectLanguage(text);
    let result = { entities: {}, intent: null };

    if (lang === 'si') {
      result = sinhalaParser.parse(text);
    } else if (lang === 'ta') {
      result = tamilParser.parse(text);
    } else {
      // For romanized text, check Singlish & Tanglish patterns
      const raw = text.toLowerCase();
      const isTanglish = ['venum', 'panna', 'mudiyuma', 'evlo', 'ku '].some(kw => raw.includes(kw));
      
      if (isTanglish) {
        result = tanglishParser.parse(text);
      } else {
        result = singlishParser.parse(text);
      }
    }

    return {
      entities: result.entities,
      intent: result.intent,
      language: lang
    };
  }

  /**
   * Retrieves a warm greeting matching the detected language and relationship tone preference.
   * @param {string} languageCode 
   * @param {string} [tonePreference] 
   * @returns {string} Greeting text
   */
  getGreeting(languageCode, tonePreference = 'FORMAL') {
    if (languageCode === 'si') {
      return this.greetingsRegistry.si_formal;
    }
    if (languageCode === 'ta') {
      return this.greetingsRegistry.ta_respectful;
    }
    if (languageCode === 'mix') {
      return tonePreference === 'BUDDY' ? this.greetingsRegistry.singlish_buddy : this.greetingsRegistry.si_informal;
    }
    return this.greetingsRegistry.en_formal;
  }
}

export const languageProcessor = new LanguageProcessor();
export default languageProcessor;
