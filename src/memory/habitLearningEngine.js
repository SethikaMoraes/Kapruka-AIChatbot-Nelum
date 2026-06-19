/**
 * Nelum Habit Learning Engine
 * Updates category affinity weights dynamically upon checkout, decaying old entries.
 */

export class HabitLearningEngine {
  constructor() {
    this.decayFactor = 0.85; // Prioritize recent choices over old habits
  }

  /**
   * Updates user preferred categories list.
   * @param {object} currentPreferences 
   * @param {string} newPurchaseCategory 
   * @returns {object} Updated preferences object
   */
  updateAffinity(currentPreferences, newPurchaseCategory) {
    const preferences = { ...currentPreferences };
    if (!preferences.favoriteCategories) {
      preferences.favoriteCategories = [];
    }

    const currentCategories = preferences.favoriteCategories;
    const categoryWeights = new Map();

    // 1. Load current category preferences and apply decay factor
    currentCategories.forEach((cat, idx) => {
      // Younger items in list get slightly higher starting weights, all decayed by factor
      const baseWeight = (currentCategories.length - idx) * 0.3;
      categoryWeights.set(cat, baseWeight * this.decayFactor);
    });

    // 2. Add weight to the newly purchased category
    const existingWeight = categoryWeights.get(newPurchaseCategory) || 0;
    categoryWeights.set(newPurchaseCategory, existingWeight + 1.0);

    // 3. Keep top 3 categories sorted descending by affinity weight
    const sorted = [...categoryWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    preferences.favoriteCategories = sorted;
    
    console.log(`[HabitLearningEngine] Category affinities updated. Top categories:`, sorted);
    return preferences;
  }
}

export const habitLearningEngine = new HabitLearningEngine();
export default habitLearningEngine;
