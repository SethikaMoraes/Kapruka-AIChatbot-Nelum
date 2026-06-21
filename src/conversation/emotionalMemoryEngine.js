/**
 * Nelum Emotional Memory Engine
 * Tracks userMood, stressLevel, recipientImportance, and sentimentTrend (Rule 2).
 */

export class EmotionalMemoryEngine {
  /**
   * Initializes or gets the emotional memory object within context.
   * @param {object} context 
   * @returns {object}
   */
  init(context) {
    if (!context.emotionalMemory) {
      context.emotionalMemory = {
        userMood: 'Neutral',
        stressLevel: 'LOW',
        recipientImportance: {}, // maps recipient (e.g. mother, wife) -> 'HIGH' / 'NORMAL'
        sentimentTrend: [],
        friendshipScore: 0,
        usedTemplates: [],
        postPurchaseTurns: 0,
        postPurchaseTriggered: false,
        moodPrefixApplied: false,
        importancePrefixApplied: false
      };
    }
    return context.emotionalMemory;
  }

  /**
   * Analyzes user input to update emotional memory state.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} analysis 
   */
  analyze(context, userInput, analysis) {
    const mem = this.init(context);
    const raw = userInput.toLowerCase();

    // 1. Detect user mood / stress levels (Rule 2)
    if (raw.includes('stressed') || raw.includes('anxious') || raw.includes('worried') || raw.includes('stress')) {
      mem.userMood = 'stressed';
      mem.stressLevel = 'HIGH';
      mem.sentimentTrend.push('stressed');
      mem.moodPrefixApplied = false; // Reset prefix so we can address it
    } else if (raw.includes('tired') || raw.includes('exhausted') || raw.includes('sleepy')) {
      mem.userMood = 'tired';
      mem.stressLevel = 'HIGH';
      mem.sentimentTrend.push('tired');
      mem.moodPrefixApplied = false;
    } else if (raw.includes('happy') || raw.includes('excited') || raw.includes('elakiri') || raw.includes('great')) {
      mem.userMood = 'excited';
      mem.stressLevel = 'LOW';
      mem.sentimentTrend.push('positive');
    }

    // 2. Detect recipient importance (Rule 2)
    const recipients = ['mother', 'mom', 'amma', 'father', 'dad', 'thaththa', 'wife', 'husband', 'partner', 'friend', 'child'];
    const currentRecipient = context.conversationMemory?.recipient || analysis.relationship;
    
    if (currentRecipient) {
      const isImportant = raw.includes('important') || raw.includes('special surprise') || raw.includes('means a lot') || raw.includes('special day') || raw.includes('must be perfect');
      if (isImportant) {
        const normalizedRecipient = currentRecipient.toLowerCase();
        mem.recipientImportance[normalizedRecipient] = 'HIGH';
        mem.importancePrefixApplied = false; // Reset prefix so we can address it
      }
    }
  }

  /**
   * Generates a warm, emotionally supportive prefix based on memory (Rule 2).
   * @param {object} context 
   * @returns {string} Empathetic prefix, if applicable.
   */
  getEmpatheticPrefix(context) {
    const mem = this.init(context);
    let prefixes = [];

    // Mood support (Rule 2)
    if (mem.stressLevel === 'HIGH' && !mem.moodPrefixApplied) {
      if (mem.userMood === 'stressed') {
        prefixes.push("Still feeling stressed machan? Hopefully we can make things easier today 😊");
      } else if (mem.userMood === 'tired') {
        prefixes.push("Hope you are feeling a bit more rested now ne. Let's make this simple for you!");
      }
      mem.moodPrefixApplied = true;
    }

    // Recipient importance support (Rule 2)
    const currentRecipient = context.conversationMemory?.recipient;
    if (currentRecipient && !mem.importancePrefixApplied) {
      const normalizedRecipient = currentRecipient.toLowerCase();
      if (mem.recipientImportance[normalizedRecipient] === 'HIGH') {
        prefixes.push(`Since your ${currentRecipient}'s surprise means a lot to you, let's make sure we choose something truly memorable ❤️`);
        mem.importancePrefixApplied = true;
      }
    }

    if (prefixes.length > 0) {
      return prefixes.join("\n\n") + "\n\n";
    }

    return "";
  }
}

export const emotionalMemoryEngine = new EmotionalMemoryEngine();
export default emotionalMemoryEngine;
