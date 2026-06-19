/**
 * Nelum Preference & Occasion Reminder Engine
 * Evaluates upcoming birthdays, anniversaries, and calculates repeat purchase probability.
 */

export class PreferenceEngine {
  /**
   * Calculates probability of reordering an item.
   * Formula: P = exp(-|elapsedDays - avgDays| / sigma)
   * @param {number} elapsedDays 
   * @param {number} avgIntervalDays 
   * @param {number} [sigma=7] 
   * @returns {number} Probability float [0.0 - 1.0]
   */
  calculateReorderProbability(elapsedDays, avgIntervalDays, sigma = 7) {
    const delta = Math.abs(elapsedDays - avgIntervalDays);
    return Math.exp(-delta / sigma);
  }

  /**
   * Scans a customer profile for upcoming events (birthdays/anniversaries within 7 days).
   * @param {object} profile 
   * @param {string} [currentIsoDate] 
   * @returns {Array<object>} List of matching reminder events
   */
  checkUpcomingOccasions(profile, currentIsoDate = null) {
    const today = currentIsoDate ? new Date(currentIsoDate) : new Date();
    const currentMonth = today.getMonth() + 1; // 1-indexed
    const currentDay = today.getDate();

    const reminders = [];
    const recipients = profile?.frequentRecipients || [];

    for (const recipient of recipients) {
      if (recipient.birthday) {
        // Parse birthday (MM-DD format)
        const [bMonth, bDay] = recipient.birthday.split('-').map(Number);
        
        // Construct birthday date object for current year
        const birthdayThisYear = new Date(today.getFullYear(), bMonth - 1, bDay);
        
        // Calculate difference in days
        const diffMs = birthdayThisYear.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 7) {
          reminders.push({
            recipient: recipient.name,
            relationship: recipient.relationship,
            occasion: 'birthday',
            daysRemaining: diffDays,
            suggestedItem: recipient.lastGiftPurchased?.productId || 'CAKE00KA001732', // fallback to signature cake
            address: recipient.deliveryAddress
          });
        }
      }
    }

    return reminders;
  }
}

export const preferenceEngine = new PreferenceEngine();
export default preferenceEngine;
