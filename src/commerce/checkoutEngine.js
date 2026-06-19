/**
 * Nelum Checkout Acceleration Engine
 * Auto-fills historical recipient settings and manages multilingual greeting cards.
 */

export class CheckoutEngine {
  constructor() {
    this.greetingCards = {
      anniversary: {
        en: 'To my love, every year with you is a blessing. Happy Anniversary! 💝',
        si: 'මගේ ආදරණීය බිරිඳට, ඔබ මා ලැබූ උතුම්ම තෑග්ගයි. සුභ සංවත්සරයක් වේවා! 🌸',
        ta: 'என் அன்பிற்குரியவளுக்கு, இனிய திருமண நாள் வாழ்த்துக்கள்! 🌸',
        mix: 'Mage athin una waradata samawenna. Happy anniversary my love. Hope this makes you smile! 💝'
      },
      apology: {
        en: "I'm sorry. Hope this message brings a smile to your face. 🌹",
        si: 'මගේ අතින් වුනු වැරැද්දට සමාවෙන්න. මම ඔයාට ආදරෙයි. 🌸',
        ta: 'என்னை மன்னித்து விடுங்கள். இந்த மலர்கள் உங்களை மகிழ்விக்கட்டும். 🌸',
        mix: 'Mage athin una waradata samawenna. I\'m sorry my love. Hope these flowers make you smile. 🌹'
      },
      birthday: {
        en: 'Happy Birthday! Wishing you a beautiful and blessed day ahead. 🎂',
        si: 'උපන්දිනයට හදවතින්ම සුභ පතනවා! හැමදාම සතුටින් ඉන්න. 🎂',
        ta: 'இனிய பிறந்தநாள் வாழ்த்துக்கள்! என்றும் மகிழ்ச்சியாக இருக்கட்டும். 🎂',
        mix: 'Happy Birthday! Hamaදාම සතුටින් ඉන්න. 🎂'
      }
    };
  }

  /**
   * Recalls recipient settings from permanent user profiles if available to speed up checkout.
   * @param {object} profile 
   * @param {string} recipientName 
   * @returns {object|null} Match details, or null
   */
  recallRecipientAddress(profile, recipientName) {
    if (!profile || !profile.frequentRecipients) return null;
    
    const term = recipientName.toLowerCase().trim();
    const match = profile.frequentRecipients.find(r => 
      r.name.toLowerCase().includes(term) || 
      r.relationship.toLowerCase() === term
    );
    
    return match || null;
  }

  /**
   * Generates occasion-specific card texts.
   * @param {string} occasion 
   * @param {string} languageCode 'en' | 'si' | 'ta' | 'mix'
   * @returns {string} Card text template
   */
  generateCardMessage(occasion, languageCode = 'en') {
    const occ = occasion ? occasion.toLowerCase() : 'birthday';
    const lang = languageCode || 'en';

    const cardGroup = this.greetingCards[occ] || this.greetingCards.birthday;
    return cardGroup[lang] || cardGroup.en;
  }
}

export const checkoutEngine = new CheckoutEngine();
export default checkoutEngine;
