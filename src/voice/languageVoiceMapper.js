/**
 * Nelum Language Voice Mapper
 * Maps the conversation's active language code to the best matching
 * Gemini prebuilt voice or standard Web Speech browser fallback voice.
 */

// Gemini API prebuilt voices map
const GEMINI_VOICES = {
  en: 'Aoede',  // Breezy, natural female voice
  si: 'Aoede',  // Sinhala fallback voice (Aoede has great tone clarity for bilingual content)
  ta: 'Kore',   // Tamil fallback voice (Kore is firm, clear, and handles South Asian pronunciation well)
  singlish: 'Aoede',
  tanglish: 'Kore'
};

class LanguageVoiceMapper {
  /**
   * Get the preferred Gemini voice name for a given language code
   * @param {string} langCode - 'en', 'si', 'ta', 'singlish', 'tanglish', 'mix'
   */
  getGeminiVoice(langCode) {
    const code = (langCode || 'en').toLowerCase().trim();
    if (code === 'en') return GEMINI_VOICES.en;
    if (code === 'si') return GEMINI_VOICES.si;
    if (code === 'ta') return GEMINI_VOICES.ta;
    if (code.includes('sing')) return GEMINI_VOICES.singlish;
    if (code.includes('tang')) return GEMINI_VOICES.tanglish;
    
    // Default to English female
    return GEMINI_VOICES.en;
  }

  /**
   * Resolves the best matching native browser voice for SpeechSynthesis fallback
   * @param {string} langCode - 'en', 'si', 'ta', etc.
   * @returns {SpeechSynthesisVoice|null}
   */
  getBrowserVoice(langCode) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      return null;
    }

    const code = (langCode || 'en').toLowerCase().trim();
    
    // Helper to find a female-sounding voice by name keyword
    const isFemaleVoice = (voice) => {
      const name = voice.name.toLowerCase();
      return name.includes('female') || name.includes('zira') || name.includes('samantha') || 
             name.includes('hazel') || name.includes('susan') || name.includes('karen') || 
             name.includes('veena') || name.includes('heera') || name.includes('moira') ||
             name.includes('tessa') || name.includes('tera') || name.includes('google uk english female') ||
             name.includes('google us english') || name.includes('natural'); // many natural voices are female
    };

    // 1. TAMIL
    if (code === 'ta' || code.includes('tang')) {
      // Look for Tamil (India/Sri Lanka)
      const taVoice = voices.find(v => v.lang.startsWith('ta') && isFemaleVoice(v)) ||
                      voices.find(v => v.lang.startsWith('ta')) ||
                      // Fallback to Hindi or Indian English if no Tamil is found
                      voices.find(v => v.lang.startsWith('en-IN') && isFemaleVoice(v)) ||
                      voices.find(v => v.lang.startsWith('en-IN'));
      if (taVoice) return taVoice;
    }

    // 2. SINHALA
    if (code === 'si') {
      // Look for Sinhala (rarely pre-installed on standard OS)
      const siVoice = voices.find(v => v.lang.startsWith('si')) ||
                      // Fallback to Indian English (Veena/Heera) which matches South Asian pronunciation well
                      voices.find(v => v.lang.startsWith('en-IN') && isFemaleVoice(v)) ||
                      voices.find(v => v.lang.startsWith('en-IN')) ||
                      // General English female fallback
                      voices.find(v => v.lang.startsWith('en') && isFemaleVoice(v));
      if (siVoice) return siVoice;
    }

    // 3. ENGLISH / SINGLISH / DEFAULT
    const targetLang = code === 'si' ? 'en' : (code === 'ta' ? 'ta' : 'en');
    const enVoices = voices.filter(v => v.lang.startsWith(targetLang));
    
    // Try to find a female voice first
    const femaleEnVoice = enVoices.find(v => isFemaleVoice(v));
    if (femaleEnVoice) return femaleEnVoice;

    // Try any voice matching the language
    if (enVoices.length > 0) return enVoices[0];

    // Extreme fallback: find any female voice
    const femaleVoice = voices.find(v => isFemaleVoice(v));
    if (femaleVoice) return femaleVoice;

    // Ultimate fallback: system default voice
    return voices.find(v => v.default) || voices[0] || null;
  }
}

export const languageVoiceMapper = new LanguageVoiceMapper();
export default languageVoiceMapper;
