# Telegram Bot User Flow - With Commodities Support

## Bot Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                    /start                          │
│                                                     │
│  🤖 AI Trading Analyzer Bot (API Version)         │
│  ========================================          │
│  Uses TwelveData API + AI Analysis                │
│                                                     │
│  Supported Markets:                                │
│  💱 Forex - Major currency pairs                   │
│  🥇 Commodities - Gold, Silver, Oil (Premium)     │
│                                                     │
│  Command: /start - Start analysis                  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│           Select market type:                       │
│                                                     │
│  ┌───────────────┐  ┌──────────────────┐          │
│  │  💱 Forex     │  │  🥇 Commodities  │          │
│  └───────────────┘  └──────────────────┘          │
│                                                     │
│  ┌──────────────────────────────────────┐          │
│  │           Cancel                     │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
         ↓                            ↓
         ↓                            ↓
    [FOREX PATH]              [COMMODITIES PATH]
         ↓                            ↓
┌────────────────────┐      ┌────────────────────┐
│  Select Forex pair │      │ Select Commodity   │
│                    │      │                    │
│  EUR/USD  GBP/USD  │      │  XAU/USD  XAG/USD  │
│  USD/JPY  AUD/USD  │      │  BRENT    WTI      │
│  USD/CAD  NZD/USD  │      │                    │
│                    │      │                    │
│  ⬅️ Back   Cancel  │      │  ⬅️ Back   Cancel  │
└────────────────────┘      └────────────────────┘
         ↓                            ↓
         └────────────────┬───────────┘
                          ↓
          ┌───────────────────────────────┐
          │    Choose strategy:           │
          │                               │
          │  ┌────────┐    ┌──────────┐  │
          │  │ Swing  │    │ Scalping │  │
          │  └────────┘    └──────────┘  │
          │                               │
          │  ┌────────────────────────┐  │
          │  │       Cancel           │  │
          │  └────────────────────────┘  │
          └───────────────────────────────┘
                          ↓
          ┌───────────────────────────────┐
          │  📊 SWING analysis for XAU/USD│
          │                               │
          │  ⏳ Initializing...            │
          │  ✅ API keys validated         │
          │  ⏳ Fetching market data...    │
          │  ✅ 1day data fetched          │
          │  ✅ 30min data fetched         │
          │  ⏳ Running AI analysis...     │
          │  ✅ 1day analyzed              │
          │  ✅ 30min analyzed             │
          │  ✅ Setup validated            │
          │  ⏳ Generating chart...        │
          │  ✅ Analysis complete          │
          └───────────────────────────────┘
                          ↓
          ┌───────────────────────────────┐
          │  📸 [CHART IMAGE]             │
          │                               │
          │  XAU/USD • SWING              │
          │  ✅ Valid                      │
          │  Signal: BUY                  │
          │  Confidence: 85.0%            │
          │  Trend: Bullish               │
          │  Pattern: bullish engulfing   │
          │                               │
          │  Zone (support):              │
          │  2045.00 - 2048.50            │
          │                               │
          │  📝 Strong bullish engulfing  │
          │  pattern formed at key        │
          │  support level...             │
          │                               │
          │  Timeframe: 30min             │
          └───────────────────────────────┘
                          ↓
          ┌───────────────────────────────┐
          │  What would you like to do?   │
          │                               │
          │  ┌────────────────────────┐   │
          │  │  🔄 Retry Analysis     │   │
          │  └────────────────────────┘   │
          │                               │
          │  ┌────────────────────────┐   │
          │  │  🏠 Back to Menu       │   │
          │  └────────────────────────┘   │
          └───────────────────────────────┘
```

## Example Conversations

### Example 1: Trading Gold (Swing)

```
User: /start

Bot: [Shows help message and market selection]
     💱 Forex | 🥇 Commodities

User: [Clicks Commodities]

Bot: Select Commodity:
     XAU/USD | XAG/USD
     BRENT   | WTI
     ⬅️ Back | Cancel

User: [Clicks XAU/USD]

Bot: Choose strategy:
     Swing | Scalping
     Cancel

User: [Clicks Swing]

Bot: 📊 SWING analysis for XAU/USD
     
     ⏳ Initializing...
     ✅ API keys validated
     ✅ 1day data fetched
     ✅ 30min data fetched
     ✅ 1day analyzed
     ✅ 30min analyzed
     ✅ Setup validated
     ✅ Analysis complete

Bot: [Sends chart image]
     
     XAU/USD • SWING
     ✅ Valid
     Signal: BUY
     Confidence: 85.0%
     Trend: Bullish
     
     Zone (support):
     2045.00 - 2048.50
     
     📝 Strong bullish engulfing at support
     
     Timeframe: 30min

Bot: What would you like to do?
     🔄 Retry Analysis
     🏠 Back to Menu

User: [Clicks Back to Menu]

Bot: Select market type:
     💱 Forex | 🥇 Commodities
```

### Example 2: Trading EUR/USD (Forex)

```
User: /start

Bot: [Shows help message and market selection]

User: [Clicks Forex]

Bot: Select Forex pair:
     EUR/USD | GBP/USD
     USD/JPY | AUD/USD
     USD/CAD | NZD/USD
     ⬅️ Back | Cancel

User: [Clicks EUR/USD]

Bot: Choose strategy:
     Swing | Scalping

User: [Clicks Scalping]

Bot: [Analysis progress...]
     [Sends chart and results]
```

### Example 3: Navigation - Going Back

```
User: /start → Forex → [Clicks Back]

Bot: Select market type:
     💱 Forex | 🥇 Commodities

User: [Now can choose Commodities instead]
```

## State Transitions

```javascript
{
  step: 'market',    // Initial state after /start
  market: null,      // 'forex' or 'commodities' after selection
  pair: null,        // Selected instrument
  strategy: null,    // 'swing' or 'scalping'
  processing: false  // True during analysis
}
```

### State Flow:

1. **market** → User selects forex/commodities → **pair**
2. **pair** → User selects instrument → **strategy**
3. **strategy** → User selects strategy → **processing** = true
4. Analysis completes → **processing** = false → Show retry options
5. User can:
   - Retry same pair/strategy
   - Go back to menu (resets to **market**)

## Callback Data Structure

```javascript
// Market selection
'market:forex'        → Select forex market
'market:commodities'  → Select commodities market

// Instrument selection
'pair:EUR/USD'        → Select EUR/USD
'pair:XAU/USD'        → Select Gold
'pair:BRENT'          → Select Brent Oil

// Strategy selection
'strategy:swing'      → Select swing strategy
'strategy:scalping'   → Select scalping strategy

// Navigation
'back:market'         → Go back to market selection
'back_to_menu'        → Reset and go to market selection
'cancel'              → Cancel and restart

// Retry
'retry_XAU/USD_swing' → Retry analysis with same params
```

## Error Handling

### Invalid Setup (Validation Failed)

```
Bot: [Sends chart anyway]
     
     XAU/USD • SWING
     ⚠️ Invalid
     Signal: BUY
     Confidence: 65.0%
     
     Zone (support):
     2045.00 - 2048.50

Bot: ⚠️ Analysis has validation issues:
     
     ❌ Primary timeframe issues:
       • Trend-signal mismatch
     
     ⚠️ Entry timeframe notes:
       • Pattern far from zone
     
     💡 What this means:
       • Setup may still be tradeable with proper risk
     
     🔄 You can retry or try another pair.

Bot: What would you like to do?
     🔄 Retry Analysis
     🏠 Back to Menu
```

### Premium Subscription Required

```
Bot: ❌ Analysis failed: Commodities require premium 
     TwelveData subscription
     
     Please try again or choose a different pair.

Bot: What would you like to do?
     🏠 Back to Menu
```

## Key Features

1. **Two-tier navigation**: Market → Instrument → Strategy
2. **Back button**: Can go back without cancelling
3. **Progress updates**: Real-time analysis status
4. **Always shows chart**: Even if invalid setup
5. **Clear error messages**: Helpful troubleshooting
6. **Retry option**: Quick retry without re-selecting
7. **Unified interface**: Same flow for forex and commodities

## Benefits

- ✅ Intuitive market categorization
- ✅ Easy to add more markets (crypto, indices, etc.)
- ✅ Clear visual feedback
- ✅ Flexible navigation
- ✅ Professional progress indicators
- ✅ Helpful error messages
- ✅ Quick retry functionality
