/**
 * Nelum Dynamic Bundle Generation Engine
 * Compiles specific items into cohesive gift packages aligning budget thresholds,
 * logistics shipping bounds, and occasion-specific templates.
 */

export class BundleEngine {
  constructor() {
    this.templates = [
      {
        name: 'Birthday Delight Surprise Bundle',
        occasion: 'birthday',
        coreCategories: ['cakes', 'flowers', 'toys'],
        requiredItems: ['Signature Black Forest Gateau', 'Roses', 'Teddy Bear'],
        cardMessageTemplate: 'Happy Birthday! Wishing you a wonderful year ahead. 🌸'
      },
      {
        name: 'Sincere Apologies Sympathy Set',
        occasion: 'apology',
        coreCategories: ['flowers', 'chocolates'],
        requiredItems: ['White Lilies', 'Luxury Chocolate Box'],
        cardMessageTemplate: 'Mage waradata samawenna. Sending peaceful thoughts. 🌹'
      },
      {
        name: 'Golden Anniversary Celebration Bundle',
        occasion: 'anniversary',
        coreCategories: ['flowers', 'chocolates', 'groceries'],
        requiredItems: ['Roses', 'Luxury Chocolate Box', 'Ceylon Premium Tea Selection Box'],
        cardMessageTemplate: 'To my love, every year with you is a blessing. Happy Anniversary! 💝'
      }
    ];
  }

  /**
   * Compiles custom packages using target occasion, budget bounds, and available catalog.
   * @param {string} occasion 
   * @param {number} budgetTarget 
   * @param {Array<object>} catalog 
   * @returns {object} Compiled bundle with optimized pricing, constituent items, and same-day status.
   */
  generateBundle(occasion, budgetTarget, catalog) {
    const template = this.templates.find(t => t.occasion === occasion.toLowerCase()) || this.templates[0];
    
    const selectedItems = [];
    let cumulativeSum = 0;
    
    // Attempt to pull the best item match from each core category
    for (const category of template.coreCategories) {
      // Find cheapest available item in catalog for this category
      const candidates = catalog
        .filter(p => p.category === category && p.available)
        .sort((a, b) => a.price - b.price);
        
      if (candidates.length > 0) {
        const item = candidates[0];
        selectedItems.push(item);
        cumulativeSum += item.price;
      }
    }

    // Apply Budget Optimization
    let finalPrice = cumulativeSum;
    let discountApplied = 0;
    
    const excessPercentage = (cumulativeSum - budgetTarget) / budgetTarget;

    if (cumulativeSum > budgetTarget) {
      if (excessPercentage < 0.15) {
        // Apply package discount to fit within target budget
        finalPrice = budgetTarget;
        discountApplied = cumulativeSum - budgetTarget;
      } else {
        // Exceeds too much: prune the least critical category
        if (selectedItems.length > 1) {
          const removed = selectedItems.pop();
          cumulativeSum -= removed.price;
          finalPrice = cumulativeSum;
        }
      }
    }

    // Verify same-day logistics availability across bundle items
    const supportsSameDay = selectedItems.every(i => 
      i.deliveryEstimate.toLowerCase().includes('today') || 
      i.deliveryEstimate.toLowerCase().includes('hour')
    );

    return {
      title: template.name,
      occasion: template.occasion,
      items: selectedItems,
      originalPrice: cumulativeSum,
      price: finalPrice,
      discount: discountApplied,
      deliveryEstimate: supportsSameDay ? 'Today (Within 3 Hours)' : 'Tomorrow (Next Day)',
      description: `Surprise bundle compiled dynamically for your ${template.occasion} surprise. Includes card greeting. 🌸`,
      badge: discountApplied > 0 ? 'Package Discount' : 'Nelum Selection'
    };
  }
}

export const bundleEngine = new BundleEngine();
export default bundleEngine;
