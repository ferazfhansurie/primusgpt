# Commodities Trading Support

This document describes the commodities trading features added to the Trading Analyzer API.

## Overview

The trading analyzer now supports **commodities trading** in addition to forex pairs. This includes precious metals (Gold, Silver), energy commodities (Oil), and more.

### Prerequisites

- **TwelveData Premium Subscription**: Commodities data requires a premium TwelveData account
- The free tier only supports major forex pairs

## Supported Commodities

### Precious Metals
- **XAU/USD** - Gold Spot Price
- **XAG/USD** - Silver Spot Price

### Energy
- **BRENT** - Brent Crude Oil
- **WTI** - WTI Crude Oil

## Configuration

### Adding Commodities

Edit `src/utils/config.js`:

```javascript
commodities: [
  'XAU/USD',  // Gold
  'XAG/USD',  // Silver
  'BRENT',    // Brent Crude Oil
  'WTI',      // WTI Crude Oil
],

instruments: {
  forex: [
    'EUR/USD',
    'GBP/USD',
    // ... other forex pairs
  ],
  commodities: [
    'XAU/USD',
    'XAG/USD',
    'BRENT',
    'WTI',
  ]
}
```

### Pip Values

Pip values are automatically configured for commodities:

- **Gold (XAU/USD)**: 0.1 (10 cents per pip)
- **Silver (XAG/USD)**: 0.01 (1 cent per pip)
- **Oil (BRENT/WTI)**: 0.01 (1 cent per pip)

## API Features

### Get Available Commodities

```javascript
import TwelveDataClient from './api/twelveDataClient.js';

const client = new TwelveDataClient();

// Get all commodities
const commodities = await client.getCommodities();

// Filter by category
const preciousMetals = await client.getCommodities('Precious Metal');
```

### Fetch Commodity Data

```javascript
// Get Gold quote
const goldQuote = await client.getQuote('XAU/USD');
console.log(`Current Gold: $${goldQuote.price}`);

// Get historical data
const goldData = await client.getTimeSeries('XAU/USD', '1day', 100);
```

### Price Formatting

```javascript
import { formatPrice, calculatePips } from './utils/pips.js';

// Format prices correctly
const price = 2050.75;
const formatted = formatPrice('XAU/USD', price);
// Output: "2050.75"

// Calculate pip difference
const pips = calculatePips('XAU/USD', 2000.00, 2010.50);
// Output: 105.0 pips
```

## Using the Telegram Bot

### Step-by-Step

1. Start the bot: `/start`
2. Select **"Commodities"** from the market menu
3. Choose your commodity (e.g., Gold - XAU/USD)
4. Select strategy (Swing or Scalping)
5. Bot analyzes and sends chart with zones

### Example Flow

```
User: /start
Bot: 💱 Forex | 🥇 Commodities

User: [Clicks Commodities]
Bot: XAU/USD | XAG/USD | BRENT | WTI

User: [Clicks XAU/USD]
Bot: Swing | Scalping

User: [Clicks Swing]
Bot: 
📊 SWING analysis for XAU/USD
✅ Valid
Signal: BUY
Confidence: 85.0%
Zone (support): 2045.00 - 2048.50
```

## Testing

Run the commodities test script:

```bash
node src/test-commodities.js
```

This will:
1. ✓ Validate API key
2. ✓ Fetch available commodities
3. ✓ Test pip calculations for Gold
4. ✓ Fetch real-time Gold quote
5. ✓ Fetch historical Gold data
6. ✓ Verify configuration

## Analysis Differences

### Gold vs Forex

| Aspect | Forex | Gold (XAU/USD) |
|--------|-------|----------------|
| Pip Value | 0.0001 | 0.1 |
| Price Format | 5 decimals | 2 decimals |
| Typical Zone Size | 10-50 pips | 50-200 pips |
| Volatility | Lower | Higher |
| Session Dependence | High | Medium |

### Strategy Adjustments

**Swing Trading:**
- Gold trends are typically stronger and longer
- Daily zones are wider (50-200 pips vs 20-80 pips)
- M30 patterns may take longer to form

**Scalping:**
- Gold moves faster than forex
- Tighter stops recommended (10-20 pips)
- London/NY sessions most active
- News events create significant volatility

## Zone Configuration

Adjust zone parameters for commodities in `config.js`:

```javascript
zones: {
  minPips: 5,    // Minimum zone size
  maxPips: 80,   // Maximum zone size (increase for Gold)
  buyColor: '#00FF00',
  sellColor: '#FF0000',
}
```

For Gold, you may want to increase `maxPips` to 150-200.

## Troubleshooting

### "Commodities require premium TwelveData subscription"

**Solution**: Upgrade your TwelveData account to a premium plan that includes commodities data.

### Gold data not loading

**Possible causes**:
1. API key doesn't have commodities access
2. Rate limit exceeded (check logs)
3. Symbol format incorrect (use `XAU/USD` not `GOLD`)

**Solution**: 
- Verify subscription at https://twelvedata.com/pricing
- Check API usage dashboard
- Use correct symbol format

### Invalid pip calculations

**Solution**: Ensure pip values are configured correctly in `src/utils/pips.js`:

```javascript
const pipValues = {
  'XAU/USD': 0.1,
  'XAUUSD': 0.1,
  'GOLD': 0.1,
  // ...
};
```

## API Rate Limits

**Premium Tier:**
- Higher API call limits
- Access to commodities endpoint
- Real-time data

**Important**: Commodities data counts toward your daily API quota.

## Best Practices

1. **Monitor News**: Gold is highly sensitive to economic news
2. **Wider Stops**: Gold moves faster, use appropriate stop-loss
3. **Session Awareness**: Most active during London/NY overlap
4. **Volatility Management**: Gold can move 50+ pips quickly
5. **Zone Sizes**: Expect larger zones than forex (50-200 pips)

## Example Analysis

```javascript
import StrategyOrchestrator from './core/orchestrator.js';

const orchestrator = new StrategyOrchestrator();

// Analyze Gold with Swing strategy
const result = await orchestrator.analyzePair('XAU/USD', 'swing');

console.log(`Signal: ${result.signal}`);
console.log(`Confidence: ${result.confidence * 100}%`);
console.log(`Zone: ${result.daily_zone.price_low} - ${result.daily_zone.price_high}`);
```

## Future Enhancements

Potential additions:
- More commodities (Copper, Natural Gas, Agricultural)
- Commodity-specific SOP rules
- Correlation analysis with USD index
- Sector rotation indicators

## Support

For issues or questions:
1. Check TwelveData API status
2. Review logs in `console`
3. Verify subscription includes commodities
4. Test with `test-commodities.js` script

## Resources

- [TwelveData Commodities API](https://twelvedata.com/docs#commodities-list)
- [TwelveData Pricing](https://twelvedata.com/pricing)
- [Gold Trading Guide](https://www.investopedia.com/articles/basics/08/trade-gold.asp)
