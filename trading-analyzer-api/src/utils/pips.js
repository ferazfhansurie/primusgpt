/**
 * Pip Calculation Utilities
 */

const pipValues = {
  // Forex pairs
  'EUR/USD': 0.0001,
  'GBP/USD': 0.0001,
  'AUD/USD': 0.0001,
  'NZD/USD': 0.0001,
  'USD/CAD': 0.0001,
  'USD/JPY': 0.01,
  
  // Commodities - Precious Metals
  'XAU/USD': 0.1,     // Gold
  'XAUUSD': 0.1,      // Gold (alternative format)
  'GOLD': 0.1,        // Gold (alternative format)
  'XAG/USD': 0.01,    // Silver
  'XAGUSD': 0.01,     // Silver (alternative format)
  'SILVER': 0.01,     // Silver (alternative format)
  
  // Commodities - Energy
  'BRENT': 0.01,      // Brent Crude Oil
  'WTI': 0.01,        // WTI Crude Oil
  'CL': 0.01,         // Crude Oil
  'NG': 0.001,        // Natural Gas
};

/**
 * Calculate pip difference between two prices
 * @param {string} pair - Trading pair
 * @param {number} price1 - First price
 * @param {number} price2 - Second price
 * @returns {number} Pip difference
 */
export function calculatePips(pair, price1, price2) {
  const pipValue = pipValues[pair] || 0.0001;
  return Math.abs(price1 - price2) / pipValue;
}

/**
 * Validate zone size in pips
 * @param {string} pair - Trading pair
 * @param {number} priceHigh - Upper price
 * @param {number} priceLow - Lower price
 * @param {number} minPips - Minimum pips
 * @param {number} maxPips - Maximum pips
 * @returns {Object} Validation result
 */
export function validateZoneSize(pair, priceHigh, priceLow, minPips, maxPips) {
  const actualPips = calculatePips(pair, priceHigh, priceLow);
  
  if (actualPips < minPips) {
    return {
      valid: false,
      actualPips,
      error: `Zone too small: ${actualPips.toFixed(1)} pips (min: ${minPips})`
    };
  }
  
  if (actualPips > maxPips) {
    return {
      valid: false,
      actualPips,
      error: `Zone too large: ${actualPips.toFixed(1)} pips (max: ${maxPips})`
    };
  }
  
  return {
    valid: true,
    actualPips
  };
}

/**
 * Format price with proper decimal places
 * @param {string} pair - Trading pair
 * @param {number} price - Price to format
 * @returns {string} Formatted price
 */
export function formatPrice(pair, price) {
  // JPY pairs use 3 decimals
  if (pair.includes('JPY')) {
    return price.toFixed(3);
  }
  
  // Precious metals use 2 decimals
  if (pair.includes('XAU') || pair.includes('GOLD') || 
      pair.includes('XAG') || pair.includes('SILVER')) {
    return price.toFixed(2);
  }
  
  // Energy commodities use 2 decimals
  if (pair === 'BRENT' || pair === 'WTI' || pair === 'CL' || pair === 'NG') {
    return price.toFixed(2);
  }
  
  // Forex pairs use 5 decimals
  return price.toFixed(5);
}
