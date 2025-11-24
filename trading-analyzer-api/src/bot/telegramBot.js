#!/usr/bin/env node

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import StrategyOrchestrator from '../core/orchestrator.js';
import config from '../utils/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Ensure BOT_TOKEN exists
const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
if (!token) {
  logger.failure('TELEGRAM_BOT_TOKEN or BOT_TOKEN missing in environment (.env). Please set TELEGRAM_BOT_TOKEN=...');
  process.exit(1);
}

// Create bot (use polling for simplicity)
const bot = new TelegramBot(token, { polling: true });
const orchestrator = new StrategyOrchestrator();

logger.success('Telegram bot started (API version). Waiting for commands...');

// In-memory state per chat
const chatState = new Map();

function resetState(chatId) {
  chatState.set(chatId, { step: 'market', pair: null, strategy: null, market: null, processing: false });
}

function getMarketCategories() {
  return [
    { name: 'Forex', key: 'forex' },
    { name: 'Gold', key: 'gold' }
  ];
}

function getInstruments(category) {
  if (category === 'gold') {
    return ['XAU/USD'];
  }
  if (!config.instruments || !config.instruments[category]) {
    // Fallback to old behavior
    return config.tradingPairs;
  }
  return config.instruments[category];
}

function marketCategoryKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Forex', callback_data: 'market:forex' },
          { text: 'Gold', callback_data: 'market:gold' }
        ],
        [ { text: 'Cancel', callback_data: 'cancel' } ]
      ]
    }
  };
}

function strategyKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [ { text: 'Swing', callback_data: 'strategy:swing' }, { text: 'Scalping', callback_data: 'strategy:scalping' } ],
        [ { text: 'Cancel', callback_data: 'cancel' } ]
      ]
    }
  };
}

function instrumentsKeyboard(category) {
  const instruments = getInstruments(category);
  const rows = [];
  
  for (let i = 0; i < instruments.length; i += 2) {
    rows.push([
      { text: instruments[i], callback_data: `pair:${instruments[i]}` },
      instruments[i+1] ? { text: instruments[i+1], callback_data: `pair:${instruments[i+1]}` } : undefined
    ].filter(Boolean));
  }
  
  rows.push([
    { text: 'Back', callback_data: 'back:market' },
    { text: 'Cancel', callback_data: 'cancel' }
  ]);
  
  return { reply_markup: { inline_keyboard: rows } };
}

// Help message
const helpMsg = `
PRIMUS GPT - AI Trading Analyzer
========================================

Supported Markets:
- Forex: Major currency pairs
- Gold: XAU/USD spot price

Features:
- Real-time market data
- AI-powered analysis
- Professional charts
- Detailed validation

Command:
/start - Start analysis
`;

bot.onText(/^\/start$/, async (msg) => {
  resetState(msg.chat.id);
  await bot.sendMessage(msg.chat.id, helpMsg);
  await bot.sendMessage(msg.chat.id, 'Select market type:', marketCategoryKeyboard());
});

// Inline button flow
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data || '';
  const state = chatState.get(chatId) || { step: 'pair' };
  logger.info(`Callback received: ${data} (step=${state.step}, pair=${state.pair || '-'})`);

  // Retry analysis
  if (data.startsWith('retry_')) {
    const parts = data.split('_');
    const pair = parts[1];
    const strategy = parts[2];
    await bot.answerCallbackQuery(query.id, { text: 'Retrying analysis...' });
    state.pair = pair;
    state.strategy = strategy;
    state.step = 'strategy';
    chatState.set(chatId, state);
    // Trigger strategy callback
    query.data = `strategy:${strategy}`;
  }

  // Back to menu
  if (data === 'back_to_menu') {
    resetState(chatId);
    await bot.answerCallbackQuery(query.id, { text: 'Back to menu' });
    await bot.sendMessage(chatId, 'Select market type:', marketCategoryKeyboard());
    return;
  }

  // Cancel
  if (data === 'cancel') {
    resetState(chatId);
    await bot.answerCallbackQuery(query.id, { text: 'Cancelled' });
    await bot.sendMessage(chatId, 'Cancelled. Select market type:', marketCategoryKeyboard());
    return;
  }

  // Back to market categories
  if (data === 'back:market') {
    state.step = 'market';
    state.pair = null;
    state.market = null;
    chatState.set(chatId, state);
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(chatId, 'Select market type:', marketCategoryKeyboard());
    return;
  }

  // Market category selection
  if (data.startsWith('market:')) {
    const market = data.split(':')[1];
    state.market = market;
    
    // If gold, skip pair selection and go straight to strategy
    if (market === 'gold') {
      state.pair = 'XAU/USD';
      state.step = 'strategy';
      chatState.set(chatId, state);
      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, 'Gold (XAU/USD) - Choose strategy:', strategyKeyboard());
      return;
    }
    
    // For forex, show pair selection
    state.step = 'pair';
    chatState.set(chatId, state);
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(chatId, 'Select Forex pair:', instrumentsKeyboard(market));
    return;
  }

  // Forex pair selection
  if (data.startsWith('pair:')) {
    const pair = data.split(':')[1];
    state.pair = pair;
    state.step = 'strategy';
    chatState.set(chatId, state);
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(chatId, 'Choose strategy:', strategyKeyboard());
    return;
  }

  // Strategy selection and run
  if (data.startsWith('strategy:')) {
    const strategy = data.split(':')[1];
    if (!state.pair) {
      await bot.answerCallbackQuery(query.id, { text: 'Pick a pair first' });
      await bot.sendMessage(chatId, 'Please select a pair:', marketKeyboard());
      return;
    }
    if (state.processing) {
      await bot.answerCallbackQuery(query.id, { text: 'Analysis already in progress…' });
      return;
    }

    state.processing = true;
    state.strategy = strategy;
    chatState.set(chatId, state);
    await bot.answerCallbackQuery(query.id);

    const statusMessage = await bot.sendMessage(
      chatId, 
      `PRIMUS GPT - ${strategy.toUpperCase()} Analysis\n${state.pair}\n\nInitializing...`
    );
    const statusId = statusMessage.message_id;

    // Start typing indicator loop
    const typingInterval = setInterval(() => {
      bot.sendChatAction(chatId, 'typing').catch(() => {});
    }, 4000);

    logger.info(`Starting API analysis: pair=${state.pair}, strategy=${strategy}`);

    // Helper function to update status
    const updateStatus = async (message) => {
      await bot.editMessageText(
        `PRIMUS GPT - ${strategy.toUpperCase()} Analysis\n${state.pair}\n\n${message}`,
        { chat_id: chatId, message_id: statusId }
      ).catch(() => {});
    };

    try {
      // Step 1: Validate API keys
      await updateStatus('[1/6] Validating API keys...');
      await orchestrator.validateKeys();
      await updateStatus('[2/6] Fetching market data...');

      // Step 2: Get strategy and timeframes
      const strategyObj = orchestrator.strategies[strategy];
      if (!strategyObj) {
        throw new Error(`Unknown strategy: ${strategy}`);
      }
      const timeframes = strategyObj.getRequiredTimeframes();

      // Step 3: Fetch market data with progress
      await updateStatus(`[2/6] Fetching ${timeframes[0].interval} data...`);
      const tf1Data = await orchestrator.apiClient.getTimeSeries(state.pair, timeframes[0].interval, timeframes[0].bars);
      const tf1Formatted = orchestrator.dataFormatter.formatForAI(tf1Data, state.pair, timeframes[0].interval);
      
      await updateStatus(`[3/6] Fetching ${timeframes[1].interval} data...`);
      const tf2Data = await orchestrator.apiClient.getTimeSeries(state.pair, timeframes[1].interval, timeframes[1].bars);
      const tf2Formatted = orchestrator.dataFormatter.formatForAI(tf2Data, state.pair, timeframes[1].interval);

      // Step 4: AI Analysis
      await updateStatus(`[4/6] Analyzing ${timeframes[0].interval} timeframe...`);
      
      let prompt1;
      if (strategy === 'swing') {
        prompt1 = strategyObj.buildDailyPrompt(state.pair);
      } else {
        prompt1 = strategyObj.build15MinPrompt(state.pair);
      }
      const analysis1 = await orchestrator.gptAnalyzer.analyze(prompt1, tf1Formatted);

      await updateStatus(`[4/6] Analyzing ${timeframes[1].interval} timeframe...`);
      
      let prompt2;
      if (strategy === 'swing') {
        prompt2 = strategyObj.buildM30Prompt(state.pair, analysis1);
      } else {
        prompt2 = strategyObj.build5MinPrompt(state.pair, analysis1);
      }
      const analysis2 = await orchestrator.gptAnalyzer.analyze(prompt2, tf2Formatted);

      // Step 5: Combine analyses
      await updateStatus('[5/6] Validating setup...');
      
      const analyses = [
        { timeframe: timeframes[0].interval, analysis: analysis1 },
        { timeframe: timeframes[1].interval, analysis: analysis2 }
      ];
      const combinedAnalysis = orchestrator.combineAnalyses(strategyObj, analyses);

      // Step 6: Generate chart (always generate, even if invalid)
      await updateStatus('[6/6] Generating chart...');
      
      const marketData = {
        [timeframes[0].interval]: { ohlcv: tf1Data, formatted: tf1Formatted },
        [timeframes[1].interval]: { ohlcv: tf2Data, formatted: tf2Formatted }
      };
      combinedAnalysis.charts = await orchestrator.generateCharts(state.pair, strategy, combinedAnalysis, marketData);

      // Final status
      await updateStatus('[6/6] Analysis complete');

      // Clear typing indicator
      clearInterval(typingInterval);

      // Delete status message after a brief pause
      await new Promise(resolve => setTimeout(resolve, 1000));
      await bot.deleteMessage(chatId, statusId).catch(() => {});

      const result = combinedAnalysis;

      // Build caption
      const statusLabel = result.signal.toUpperCase();
      const confidence = (result.confidence * 100).toFixed(1);
      const validStatus = result.valid ? 'VALID' : 'INVALID';

      let caption = `PRIMUS GPT Analysis\n`;
      caption += `${state.pair} | ${strategy.toUpperCase()}\n`;
      caption += `Status: ${validStatus}\n`;
      caption += `Signal: ${statusLabel}\n`;
      caption += `Confidence: ${confidence}%\n`;

      // Add trend/pattern info
      if (result.trend) caption += `Trend: ${result.trend}\n`;
      if (result.micro_trend) caption += `Micro trend: ${result.micro_trend}\n`;
      if (result.pattern) caption += `Pattern: ${result.pattern.replace('_', ' ')}\n`;

      // Add zone info
      const zone = result.daily_zone || result.primary_zone;
      if (zone && zone.price_low && zone.price_high) {
        const zoneType = zone.type || (result.signal === 'buy' ? 'support' : 'resistance');
        caption += `\nZone (${zoneType}):\n`;
        caption += `${zone.price_low} - ${zone.price_high}\n`;
      }

      // Add reasoning
      const reasoning = extractReasoning(result);
      if (reasoning) {
        caption += `\nAnalysis: ${reasoning}`;
      }

      // Always send the bottom chart (M30 for swing, 5min for scalping)
      if (result.charts && result.charts.length > 0) {
        // Get the last chart (bottom timeframe)
        const bottomChart = result.charts[result.charts.length - 1];
        if (fs.existsSync(bottomChart.path)) {
          const tfCaption = `${caption}\n\nTimeframe: ${bottomChart.timeframe}`;
          await bot.sendPhoto(chatId, bottomChart.path, { 
            caption: tfCaption.substring(0, 1024) // Telegram caption limit
          });
        }
      }
      
      // If invalid, send additional explanation
      if (!result.valid) {
        const explanation = buildInvalidExplanation(result, strategy);
        await bot.sendMessage(chatId, explanation);
      }

      // Send retry options
      await bot.sendMessage(chatId, 'What would you like to do next?', retryKeyboard(state.pair, strategy));

      state.processing = false;
      chatState.set(chatId, state);

    } catch (error) {
      clearInterval(typingInterval);
      logger.error('Bot analysis failed:', error);
      
      await bot.sendMessage(
        chatId, 
        `Analysis failed: ${error.message}\n\nPlease try again or choose a different instrument.`
      );

      await bot.sendMessage(chatId, 'What would you like to do?', retryKeyboard(state.pair, strategy));

      state.processing = false;
      chatState.set(chatId, state);
    }
    return;
  }
});

// Fallback for unknown commands
bot.on('message', async (msg) => {
  if (!/^\//.test(msg.text || '')) return;
  if (/^\/(start)/.test(msg.text)) return;
  await bot.sendMessage(msg.chat.id, 'Tap /start to begin analysis.');
});

// Helper functions
function extractReasoning(result) {
  // Get reasoning from analysis
  const daily = result.daily_analysis || {};
  const entry = result.m30_analysis || result.entry_analysis || {};
  
  if (entry.reasoning) return entry.reasoning;
  if (daily.reasoning) return daily.reasoning;
  
  return '';
}

function buildInvalidExplanation(result, strategy) {
  const lines = ['VALIDATION ISSUES:\n'];
  
  const v = result.validation || {};
  
  // Daily/Primary errors and warnings
  if (v.daily || v.primary) {
    const d = v.daily || v.primary;
    if (d.errors && d.errors.length > 0) {
      lines.push('Primary timeframe issues:');
      d.errors.forEach(e => lines.push(`  - ${e}`));
    }
    if (d.warnings && d.warnings.length > 0) {
      lines.push('Primary timeframe notes:');
      d.warnings.forEach(w => lines.push(`  - ${w}`));
    }
  }
  
  // Entry errors and warnings
  if (v.m30 || v.entry) {
    const e = v.m30 || v.entry;
    if (e.errors && e.errors.length > 0) {
      lines.push('\nEntry timeframe issues:');
      e.errors.forEach(err => lines.push(`  - ${err}`));
    }
    if (e.warnings && e.warnings.length > 0) {
      lines.push('Entry timeframe notes:');
      e.warnings.forEach(w => lines.push(`  - ${w}`));
    }
  }

  // Add explanation
  lines.push('\nNOTE:');
  if (strategy === 'swing') {
    lines.push('For optimal swing setups, M30 patterns close to Daily zones work best.');
    lines.push('Current setup may still be tradeable with proper risk management.');
  } else {
    lines.push('For optimal scalping setups, 5-min patterns close to 15-min zones work best.');
    lines.push('Current setup may still be tradeable with tighter stops.');
  }

  lines.push('\nYou can retry for a different analysis or try another instrument.');

  return lines.join('\n');
}

function retryKeyboard(pair, strategy) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Retry Analysis', callback_data: `retry_${pair}_${strategy}` },
          { text: 'Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    }
  };
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Bot shutting down...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Bot shutting down...');
  bot.stopPolling();
  process.exit(0);
});
