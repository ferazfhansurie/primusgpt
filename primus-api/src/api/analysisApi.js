import express from 'express';
import database from '../db/database.js';
import logger from '../utils/logger.js';
import config from '../utils/config.js';
import { requireWebAuth } from './webAuthApi.js';

const router = express.Router();

// Lazy load orchestrator to handle missing canvas gracefully
let orchestrator = null;
let orchestratorError = null;

async function getOrchestrator() {
  if (orchestratorError) {
    throw orchestratorError;
  }
  if (!orchestrator) {
    try {
      const { default: StrategyOrchestrator } = await import('../core/orchestrator.js');
      orchestrator = new StrategyOrchestrator();
    } catch (error) {
      orchestratorError = error;
      logger.error('Failed to load orchestrator:', error.message);
      throw new Error('Analysis service temporarily unavailable. Please use the Telegram bot.');
    }
  }
  return orchestrator;
}

// Initialize orchestrator
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    const orch = await getOrchestrator();
    await orch.validateKeys();
    isInitialized = true;
  }
}

/**
 * Get available markets and instruments
 * GET /api/analysis/instruments
 */
router.get('/instruments', (req, res) => {
  res.json({
    success: true,
    markets: [
      { key: 'forex', name: 'Forex', instruments: config.instruments.forex },
      { key: 'gold', name: 'Gold', instruments: ['XAU/USD'] }
    ],
    strategies: config.activeStrategies
  });
});

/**
 * Run analysis
 * POST /api/analysis/run
 * Body: { pair, strategy, market }
 * Header: Authorization: Bearer <token>
 */
router.post('/run', requireWebAuth, async (req, res) => {
  const { pair, strategy, market } = req.body;
  const user = req.user;

  // Validate inputs
  if (!pair || !strategy) {
    return res.status(400).json({
      success: false,
      error: 'Pair and strategy are required'
    });
  }

  if (!config.activeStrategies.includes(strategy)) {
    return res.status(400).json({
      success: false,
      error: `Invalid strategy. Available: ${config.activeStrategies.join(', ')}`
    });
  }

  // Validate pair
  const allPairs = [...config.instruments.forex, 'XAU/USD'];
  if (!allPairs.includes(pair)) {
    return res.status(400).json({
      success: false,
      error: `Invalid pair. Available: ${allPairs.join(', ')}`
    });
  }

  try {
    await ensureInitialized();
    const orch = await getOrchestrator();

    logger.info(`Web analysis started: ${pair} ${strategy} by user ${user.email}`);

    // Get strategy and timeframes
    const strategyObj = orch.strategies[strategy];
    if (!strategyObj) {
      throw new Error(`Unknown strategy: ${strategy}`);
    }

    const timeframes = strategyObj.getRequiredTimeframes();

    // Fetch market data
    const tf1Data = await orch.apiClient.getTimeSeries(pair, timeframes[0].interval, timeframes[0].bars);
    const tf1Formatted = orch.dataFormatter.formatForAI(tf1Data, pair, timeframes[0].interval);

    const tf2Data = await orch.apiClient.getTimeSeries(pair, timeframes[1].interval, timeframes[1].bars);
    const tf2Formatted = orch.dataFormatter.formatForAI(tf2Data, pair, timeframes[1].interval);

    // Run AI analysis
    let prompt1;
    if (strategy === 'swing') {
      prompt1 = strategyObj.buildDailyPrompt(pair);
    } else {
      prompt1 = strategyObj.build15MinPrompt(pair);
    }
    const analysis1 = await orch.gptAnalyzer.analyze(prompt1, tf1Formatted);

    let prompt2;
    if (strategy === 'swing') {
      prompt2 = strategyObj.buildM30Prompt(pair, analysis1);
    } else {
      prompt2 = strategyObj.build5MinPrompt(pair, analysis1);
    }
    const analysis2 = await orch.gptAnalyzer.analyze(prompt2, tf2Formatted);

    // Combine analyses
    const analyses = [
      { timeframe: timeframes[0].interval, analysis: analysis1 },
      { timeframe: timeframes[1].interval, analysis: analysis2 }
    ];
    const combinedAnalysis = orch.combineAnalyses(strategyObj, analyses);

    // Generate charts (optional - may fail if canvas not available)
    const marketData = {
      [timeframes[0].interval]: { ohlcv: tf1Data, formatted: tf1Formatted },
      [timeframes[1].interval]: { ohlcv: tf2Data, formatted: tf2Formatted }
    };
    try {
      combinedAnalysis.charts = await orch.generateCharts(pair, strategy, combinedAnalysis, marketData);
    } catch (chartError) {
      logger.warn('Chart generation failed:', chartError.message);
      combinedAnalysis.charts = [];
    }

    // Convert chart paths to base64 for web delivery
    const fs = await import('fs');
    if (combinedAnalysis.charts && combinedAnalysis.charts.length > 0) {
      combinedAnalysis.chartImages = combinedAnalysis.charts.map(chart => {
        if (fs.existsSync(chart.path)) {
          const imageBuffer = fs.readFileSync(chart.path);
          return {
            timeframe: chart.timeframe,
            image: `data:image/png;base64,${imageBuffer.toString('base64')}`
          };
        }
        return null;
      }).filter(Boolean);
    }

    // Log analysis to database
    try {
      const zone = combinedAnalysis.daily_zone || combinedAnalysis.primary_zone || {};
      await database.logAnalysis(user.telegram_id || user.id, {
        pair,
        strategy,
        market_category: market || (pair === 'XAU/USD' ? 'gold' : 'forex'),
        signal: combinedAnalysis.signal,
        confidence: combinedAnalysis.confidence ? combinedAnalysis.confidence * 100 : null,
        is_valid: combinedAnalysis.valid,
        trend: combinedAnalysis.trend || combinedAnalysis.micro_trend,
        pattern: combinedAnalysis.pattern,
        zone_low: zone.price_low,
        zone_high: zone.price_high
      });
      logger.info(`Analysis logged for user ${user.email}`);
    } catch (dbError) {
      logger.error('Failed to log analysis:', dbError);
    }

    // Build response
    const result = {
      pair,
      strategy,
      signal: combinedAnalysis.signal,
      confidence: combinedAnalysis.confidence,
      valid: combinedAnalysis.valid,
      trend: combinedAnalysis.trend || combinedAnalysis.micro_trend || combinedAnalysis.daily_trend,

      // Zone info
      zone: combinedAnalysis.entry_zone || combinedAnalysis.m30_zone || combinedAnalysis.daily_zone || combinedAnalysis.primary_zone,

      // Trade levels
      stopLoss: combinedAnalysis.stop_loss,
      takeProfit1: combinedAnalysis.take_profit_1,
      takeProfit2: combinedAnalysis.take_profit_2,

      // Charts as base64
      charts: combinedAnalysis.chartImages || [],

      // OHLCV data for client-side charting
      ohlcvData: {
        [timeframes[0].interval]: tf1Data.map(v => ({
          time: v.datetime,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: v.volume ? parseFloat(v.volume) : 0
        })),
        [timeframes[1].interval]: tf2Data.map(v => ({
          time: v.datetime,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: v.volume ? parseFloat(v.volume) : 0
        }))
      },

      // Timeframe info
      timeframes: timeframes.map(tf => tf.interval),

      // Reasoning
      reasoning: extractReasoning(combinedAnalysis),

      // Validation info
      validation: combinedAnalysis.validation,

      // Timestamp
      timestamp: new Date().toISOString()
    };

    logger.success(`Web analysis completed: ${pair} ${strategy}`);

    res.json({
      success: true,
      analysis: result
    });

  } catch (error) {
    logger.error('Analysis API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed. Please try again.'
    });
  }
});

/**
 * Get user's analysis history
 * GET /api/analysis/history
 * Header: Authorization: Bearer <token>
 */
router.get('/history', requireWebAuth, async (req, res) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit) || 20;

    const query = `
      SELECT * FROM analysis_history
      WHERE telegram_id = $1 OR telegram_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await database.query(query, [user.telegram_id || 0, user.id, limit]);

    res.json({
      success: true,
      history: result.rows
    });

  } catch (error) {
    logger.error('History API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

/**
 * Get user's stats
 * GET /api/analysis/stats
 * Header: Authorization: Bearer <token>
 */
router.get('/stats', requireWebAuth, async (req, res) => {
  try {
    const user = req.user;
    const stats = await database.getUserStats(user.telegram_id || user.id);

    res.json({
      success: true,
      stats: {
        totalAnalyses: parseInt(stats.total_analyses) || 0,
        validSetups: parseInt(stats.valid_setups) || 0,
        buySignals: parseInt(stats.buy_signals) || 0,
        sellSignals: parseInt(stats.sell_signals) || 0,
        avgConfidence: parseFloat(stats.avg_confidence) || 0,
        firstAnalysis: stats.first_analysis,
        lastAnalysis: stats.last_analysis
      }
    });

  } catch (error) {
    logger.error('Stats API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

/**
 * Extract reasoning from analysis result
 */
function extractReasoning(result) {
  const daily = result.daily_analysis || {};
  const entry = result.m30_analysis || result.entry_analysis || {};

  if (entry.reasoning) return entry.reasoning;
  if (daily.reasoning) return daily.reasoning;

  return '';
}

export default router;
