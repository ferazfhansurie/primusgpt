#!/usr/bin/env node

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import StrategyOrchestrator from '../core/orchestrator.js';
import config from '../utils/config.js';
import authService from '../auth/authService.js';
import database from '../db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import conversation modules
import conversationManager from '../conversation/conversationManager.js';
import analysisContextManager from '../conversation/analysisContext.js';
import aiResponder from '../conversation/aiResponder.js';

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

// Initialize auth service and database
await authService.initialize();

logger.success('Telegram bot started (API version). Waiting for commands...');

// In-memory state per chat
const chatState = new Map();

function resetState(chatId) {
  chatState.set(chatId, { 
    step: 'market', 
    pair: null, 
    strategy: null, 
    market: null, 
    processing: false,
    lastButtons: null,
    lastButtonsMessage: 'Choose:'
  });
}

function getMarketCategories() {
  return [
    { name: 'Forex', key: 'forex' },
    { name: 'Gold', key: 'gold' }
  ];
}

// Helper function to send buttons and track them
async function sendButtonsAndTrack(chatId, message, keyboard) {
  const state = chatState.get(chatId) || {};
  state.lastButtons = keyboard;
  state.lastButtonsMessage = message;
  chatState.set(chatId, state);
  return await bot.sendMessage(chatId, message, keyboard);
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



`;

// Middleware to check authentication
async function requireAuth(chatId, callback) {
  const isAuth = await authService.isAuthenticated(chatId);
  
  if (!isAuth) {
    const registrationUrl = process.env.WEB_REGISTRATION_URL || 'https://primusgpt-ai.vercel.app/register';
    await bot.sendMessage(
      chatId,
      `ACCESS DENIED\n\nYou need to register first to use this service.\n\nAfter registration, use the Login button below to connect your Telegram account.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Register Now', url: registrationUrl }],
            [{ text: 'Login', callback_data: 'start_login' }]
          ]
        }
      }
    );
    return false;
  }
  
  return true;
}

bot.onText(/^\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramUser = msg.from;
  const text = msg.text || '';

  try {
    // Save command to conversation
    await conversationManager.saveMessage(chatId, 'user', text, { command: true });

    // Check for email/phone in the message
    const emailMatch = text.match(/Email:\s*([^\s\n]+@[^\s\n]+)/i);
    const phoneMatch = text.match(/Phone:\s*(\+?\d[\d\s\-\(\)]+)/i);

    // If credentials provided, try login with them
    if (emailMatch || phoneMatch) {
      try {
        let user = null;

        if (phoneMatch) {
          // Try phone login first
          let phoneNumber = phoneMatch[1].trim().replace(/[\s\-\(\)]/g, '');
          if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
          }
          user = await database.getUserByPhone(phoneNumber);
        }

        if (!user && emailMatch) {
          // Try email login
          const email = emailMatch[1].trim().toLowerCase();
          user = await database.getUserByEmail(email);
        }

        if (user) {
          // Link telegram account and login
          await database.updateUserTelegramIdById(user.id, chatId);
          await authService.loginUser(chatId, {
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name
          });

          const welcomeStickerPath = path.join(__dirname, '../../stickers/WELCOME.webm');
          if (fs.existsSync(welcomeStickerPath)) {
            await bot.sendSticker(chatId, welcomeStickerPath);
          }

          resetState(chatId);
            //  await bot.sendMessage(chatId, `LOGIN SUCCESSFUL\n\nWelcome back, ${user.first_name || 'Trader'}.\n\n` + helpMsg);
          await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
          await database.logLoginAttempt(chatId, true, 'credentials_login');
          return;
        } else {
          // Credentials provided but no user found
          const registrationUrl = process.env.WEB_REGISTRATION_URL || 'https://primusgpt-ai.vercel.app/register';
          await bot.sendMessage(
            chatId,
            'ACCOUNT NOT FOUND\n\nNo account found with the provided credentials.\n\nPlease verify your email/phone or register first.',
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Register Now', url: registrationUrl }],
                  [{ text: 'Login', callback_data: 'start_login' }]
                ]
              }
            }
          );
          return;
        }
      } catch (error) {
        logger.error('Credentials login failed:', error);
        await bot.sendMessage(chatId, 'LOGIN FAILED\n\nPlease try again.');
        return;
      }
    }

    // Check if user is already authenticated
    const isAuth = await authService.isAuthenticated(chatId);
    
    if (isAuth) {
      // User is already logged in, proceed to market selection
      resetState(chatId);
      await conversationManager.updateState(chatId, 'market');
      
      // Send welcome sticker, then replace with market selection
      let stickerMessageId = null;
      const welcomeStickerPath = path.join(__dirname, '../../stickers/WELCOME.webm');
      if (fs.existsSync(welcomeStickerPath)) {
        const welcomeMsg = await bot.sendSticker(chatId, welcomeStickerPath);
        stickerMessageId = welcomeMsg.message_id;
        // Wait a moment before switching
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Delete welcome sticker and send market selection sticker
      if (stickerMessageId) {
        await bot.deleteMessage(chatId, stickerMessageId).catch(() => {});
      }
      
      const marketStickerPath = path.join(__dirname, '../../stickers/SelectMarketType.webm');
      if (fs.existsSync(marketStickerPath)) {
        await bot.sendSticker(chatId, marketStickerPath);
      }
      
      await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
      
      // Save bot response
      await conversationManager.saveMessage(chatId, 'bot', 'Welcome back! Select market type.');
      return;
    }

    // Check if user exists in database (registered via web)
    // User needs to have registered via web first
    let user = await database.getUserByTelegramId(chatId);
    
    if (!user) {
        // User doesn't exist or hasn't been linked yet - prompt for registration
        const registrationUrl = process.env.WEB_REGISTRATION_URL || 'https://primusgpt-ai.vercel.app/register';
        
        const welcomeStickerPath = path.join(__dirname, '../../stickers/WELCOME.webm');
        if (fs.existsSync(welcomeStickerPath)) {
          await bot.sendSticker(chatId, welcomeStickerPath);
        }      await bot.sendMessage(
        chatId,
        `Welcome to PRIMUS GPT\n\nACCOUNT NOT FOUND\n\nYou need to register on our website first, then return here to login.\n\nAfter registration, use the Login button below to connect your Telegram account.`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Register Now', url: registrationUrl }],
              [{ text: 'Login', callback_data: 'start_login' }]
            ]
          }
        }
      );
      
      await database.logLoginAttempt(chatId, false, 'unregistered_user');
      return;
    }

    // User exists - create session and login
    const loginResult = await authService.loginUser(chatId, {
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name
    });

    const welcomeStickerPath = path.join(__dirname, '../../stickers/WELCOME.webm');
    if (fs.existsSync(welcomeStickerPath)) {
      await bot.sendSticker(chatId, welcomeStickerPath);
    }

    // Login successful - proceed to market selection
    resetState(chatId);
    //await bot.sendMessage(chatId, `Welcome back, ${user.telegram_first_name || user.first_name || 'Trader'}.\n\n` + helpMsg);
    await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());

  } catch (error) {
    logger.error('Start command failed:', error);
    await bot.sendMessage(
      chatId,
      'LOGIN FAILED\n\nPlease try again later or contact support.'
    );
  }
});

// Login command
bot.onText(/^\/login$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Check if already authenticated
    const isAuth = await authService.isAuthenticated(chatId);
    
    if (isAuth) {
      const marketStickerPath = path.join(__dirname, '../../stickers/SelectMarketType.webm');
      if (fs.existsSync(marketStickerPath)) {
        await bot.sendSticker(chatId, marketStickerPath);
      }
      await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
      return;
    }

    // Save command to conversation
    await conversationManager.saveMessage(chatId, 'user', '/login', { command: true });

    // Request phone number (just text input, no incompatible button)
    await bot.sendMessage(
      chatId,
      '*Login with Phone Number*\n\nPlease enter your registered phone number.\n\n*Accepted formats:*\n• +971501234567\n• 971501234567\n• 0501234567\n\n_Note: Including your country code (+971 for UAE) ensures accurate verification._\n\nType /start to cancel.',
      {
        parse_mode: 'Markdown'
      }
    );

    // Set state to waiting for phone number
    const state = chatState.get(chatId) || {};
    state.waitingForPhone = true;
    chatState.set(chatId, state);

  } catch (error) {
    logger.error('Login command failed:', error);
    await bot.sendMessage(chatId, 'LOGIN FAILED\n\nPlease try again later.');
  }
});

// Profile command
bot.onText(/^\/profile$/, async (msg) => {
  const chatId = msg.chat.id;

  if (!(await requireAuth(chatId))) return;

  try {
    const profile = await authService.getUserProfile(chatId);
    const user = profile.user;
    const stats = profile.stats;

    let profileMsg = `YOUR PROFILE\n`;
    profileMsg += `\nName: ${user.telegram_first_name || user.first_name || 'N/A'}`;
    profileMsg += `\nEmail: ${user.email || 'N/A'}`;
    profileMsg += `\nPhone: ${user.phone || 'N/A'}`;
    profileMsg += `\n\nSTATISTICS`;
    profileMsg += `\nTotal Analyses: ${stats.total_analyses || 0}`;
    profileMsg += `\nValid Setups: ${stats.valid_setups || 0}`;
    profileMsg += `\nBuy Signals: ${stats.buy_signals || 0}`;
    profileMsg += `\nSell Signals: ${stats.sell_signals || 0}`;
    
    if (stats.avg_confidence) {
      profileMsg += `\nAvg Confidence: ${parseFloat(stats.avg_confidence).toFixed(1)}%`;
    }
    
    if (stats.last_analysis) {
      const lastAnalysis = new Date(stats.last_analysis);
      profileMsg += `\nLast Analysis: ${lastAnalysis.toLocaleDateString()}`;
    }
    
    profileMsg += `\n\nMember Since: ${new Date(user.created_at).toLocaleDateString()}`;
    profileMsg += `\nLast Login: ${new Date(user.last_login).toLocaleDateString()}`;

    await bot.sendMessage(chatId, profileMsg);
  } catch (error) {
    logger.error('Profile command failed:', error);
    await bot.sendMessage(chatId, 'Failed to load profile. Please try again.');
  }
});

// Logout command
bot.onText(/^\/logout$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Save command to conversation
    await conversationManager.saveMessage(chatId, 'user', '/logout', { command: true });
    
    // Check if user is authenticated
    const isAuth = await authService.isAuthenticated(chatId);
    
    if (!isAuth) {
      await bot.sendMessage(chatId, 'You are already logged out.\n\nUse /start to login.');
      return;
    }

    // Logout user
    await authService.logoutUser(chatId);
    
    await bot.sendMessage(
      chatId,
      'You have been logged out successfully.\n\nUse /start to login again.'
    );
    
    resetState(chatId);
    
    logger.info(`User ${chatId} logged out successfully`);
  } catch (error) {
    logger.error('Logout command failed:', error);
    await bot.sendMessage(chatId, 'Logout failed. Please try again.');
  }
});

// Inline button flow
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  let data = query.data || '';
  const state = chatState.get(chatId) || { step: 'pair' };
  logger.info(`Callback received: ${data} (step=${state.step}, pair=${state.pair || '-'})`);

  // Check authentication for all callback queries except cancel and start_login
  if (data !== 'cancel' && data !== 'start_login') {
    if (!(await requireAuth(chatId))) {
      await bot.answerCallbackQuery(query.id, { text: 'Please login first with /start' });
      return;
    }
  }

  // Show detailed analysis
  if (data === 'show_detailed') {
    await bot.answerCallbackQuery(query.id);
    const lastAnalysis = state.lastAnalysis;
    if (lastAnalysis && lastAnalysis.fullAnalysis) {
      const detailedStickerPath = path.join(__dirname, '../../stickers/DetailedAnalysis.webm');
      if (fs.existsSync(detailedStickerPath)) {
        await bot.sendSticker(chatId, detailedStickerPath);
      }
      
      const detailedMsg = `${lastAnalysis.pair} | ${lastAnalysis.strategy.toUpperCase()}\n\n${lastAnalysis.fullAnalysis}`;
      await bot.sendMessage(chatId, detailedMsg);
      // Send the same action buttons after detailed analysis
      await bot.sendMessage(chatId, 'What would you like to do next?', retryKeyboard(state.pair, state.strategy, false));
    } else {
      await bot.sendMessage(chatId, 'No detailed analysis available.');
    }
    return;
  }

  // Retry analysis
  if (data.startsWith('retry_')) {
    const parts = data.split('_');
    const pair = parts[1];
    const strategy = parts[2];
    // Don't answer callback here - let it be answered by strategy handler
    state.pair = pair;
    state.strategy = strategy;
    state.step = 'strategy';
    chatState.set(chatId, state);
    // Change data to strategy to trigger analysis below
    data = `strategy:${strategy}`;
  }

  // Back to menu
  if (data === 'back_to_menu') {
    resetState(chatId);
    await bot.answerCallbackQuery(query.id, { text: 'Back to menu' });
    
    const marketStickerPath = path.join(__dirname, '../../stickers/SelectMarketType.webm');
    if (fs.existsSync(marketStickerPath)) {
      await bot.sendSticker(chatId, marketStickerPath);
    }
    
    await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
    return;
  }

  // Cancel
  if (data === 'cancel') {
    resetState(chatId);
    await bot.answerCallbackQuery(query.id, { text: 'Cancelled' });
    
    const marketStickerPath = path.join(__dirname, '../../stickers/SelectMarketType.webm');
    if (fs.existsSync(marketStickerPath)) {
      await bot.sendSticker(chatId, marketStickerPath);
    }
    
    await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
    return;
  }

  // Start login flow
  if (data === 'start_login') {
    await bot.answerCallbackQuery(query.id);
    
    // Check if already authenticated
    const isAuth = await authService.isAuthenticated(chatId);
    
    if (isAuth) {
      const marketStickerPath = path.join(__dirname, '../../stickers/SelectMarketType.webm');
      if (fs.existsSync(marketStickerPath)) {
        await bot.sendSticker(chatId, marketStickerPath);
      }
      await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
      return;
    }
    
    // Request phone number (same as /login command)
    await bot.sendMessage(
      chatId,
      '*Login with Phone Number*\n\nPlease enter your registered phone number.\n\n*Accepted formats:*\n• +971501234567\n• 971501234567\n• 0501234567\n\n_Note: Including your country code (+971 for UAE) ensures accurate verification._\n\nType /start to cancel.',
      { parse_mode: 'Markdown' }
    );
    
    // Set state to waiting for phone number
    const state = chatState.get(chatId) || {};
    state.waitingForPhone = true;
    chatState.set(chatId, state);
    return;
  }

  // Back to market categories
  if (data === 'back:market') {
    state.step = 'market';
    state.pair = null;
    state.market = null;
    chatState.set(chatId, state);
    await bot.answerCallbackQuery(query.id);
    
    const marketStickerPath = path.join(__dirname, '../../stickers/SelectMarketType.webm');
    if (fs.existsSync(marketStickerPath)) {
      await bot.sendSticker(chatId, marketStickerPath);
    }
    
    await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
    return;
  }

  // Market category selection
  if (data.startsWith('market:')) {
    const market = data.split(':')[1];
    state.market = market;
    
    // Update conversation state
    await conversationManager.updateState(chatId, 'pair');
    
    // If gold, skip pair selection and go straight to strategy
    if (market === 'gold') {
      state.pair = 'XAU/USD';
      state.step = 'strategy';
      chatState.set(chatId, state);
      await conversationManager.updateState(chatId, 'strategy');
      await bot.answerCallbackQuery(query.id);
      
      const strategyStickerPath = path.join(__dirname, '../../stickers/StrategyGold.webm');
      if (fs.existsSync(strategyStickerPath)) {
        await bot.sendSticker(chatId, strategyStickerPath);
      }
      
      await sendButtonsAndTrack(chatId, 'Choose:', strategyKeyboard());
      return;
    }
    
    // For forex, show pair selection
    state.step = 'pair';
    chatState.set(chatId, state);
    await bot.answerCallbackQuery(query.id);
    
    const pairStickerPath = path.join(__dirname, '../../stickers/ChoosePairForex.webm');
    if (fs.existsSync(pairStickerPath)) {
      await bot.sendSticker(chatId, pairStickerPath);
    }
    
    await sendButtonsAndTrack(chatId, 'Choose:', instrumentsKeyboard(market));
    return;
  }

  // Forex pair selection
  if (data.startsWith('pair:')) {
    const pair = data.split(':')[1];
    state.pair = pair;
    state.step = 'strategy';
    chatState.set(chatId, state);
    await conversationManager.updateState(chatId, 'strategy');
    await bot.answerCallbackQuery(query.id);
    
    const strategyForexStickerPath = path.join(__dirname, '../../stickers/StrategyForex.webm');
    if (fs.existsSync(strategyForexStickerPath)) {
      await bot.sendSticker(chatId, strategyForexStickerPath);
    }
    
    await sendButtonsAndTrack(chatId, 'Choose:', strategyKeyboard());
    return;
  }

  // Strategy selection and run
  if (data.startsWith('strategy:')) {
    const strategy = data.split(':')[1];
    if (!state.pair) {
      await bot.answerCallbackQuery(query.id, { text: 'Pick a pair first' }).catch(() => {});
      await bot.sendMessage(chatId, 'Please select a pair:', marketKeyboard());
      return;
    }
    if (state.processing) {
      await bot.answerCallbackQuery(query.id, { text: 'Analysis already in progress…' }).catch(() => {});
      return;
    }

    state.processing = true;
    state.strategy = strategy;
    chatState.set(chatId, state);
    // Try to answer callback, but don't fail if it's too old
    await bot.answerCallbackQuery(query.id).catch(() => {});

    const statusMessage = await bot.sendMessage(
      chatId, 
      `PRIMUS GPT - ${strategy.toUpperCase()} ${state.pair}`
    );
    const statusId = statusMessage.message_id;

    // Start typing indicator loop
    const typingInterval = setInterval(() => {
      bot.sendChatAction(chatId, 'typing').catch(() => {});
    }, 4000);

    logger.info(`Starting API analysis: pair=${state.pair}, strategy=${strategy}`);

    try {
      // Send initial sticker and track message ID for editing
      let stickerMessageId = null;
      
      // Step 1: Validate API keys
      const validatingStickerPath = path.join(__dirname, '../../stickers/ValidatingAPIKeys.webm');
      if (fs.existsSync(validatingStickerPath)) {
        const stickerMsg = await bot.sendSticker(chatId, validatingStickerPath);
        stickerMessageId = stickerMsg.message_id;
      }
      
      await orchestrator.validateKeys();
      
      // Step 2: Update sticker to Fetching Data
      const fetchingStickerPath = path.join(__dirname, '../../stickers/FetchingData.webm');
      if (stickerMessageId && fs.existsSync(fetchingStickerPath)) {
        await bot.deleteMessage(chatId, stickerMessageId).catch(() => {});
        const newSticker = await bot.sendSticker(chatId, fetchingStickerPath);
        stickerMessageId = newSticker.message_id;
      }

      // Step 2: Get strategy and timeframes
      const strategyObj = orchestrator.strategies[strategy];
      if (!strategyObj) {
        throw new Error(`Unknown strategy: ${strategy}`);
      }
      const timeframes = strategyObj.getRequiredTimeframes();

      // Step 3: Fetch market data with progress
      const tf1Data = await orchestrator.apiClient.getTimeSeries(state.pair, timeframes[0].interval, timeframes[0].bars);
      const tf1Formatted = orchestrator.dataFormatter.formatForAI(tf1Data, state.pair, timeframes[0].interval);
      
      const tf2Data = await orchestrator.apiClient.getTimeSeries(state.pair, timeframes[1].interval, timeframes[1].bars);
      const tf2Formatted = orchestrator.dataFormatter.formatForAI(tf2Data, state.pair, timeframes[1].interval);

      // Step 4: Update sticker to Analyzing
      const analyzingStickerPath = path.join(__dirname, '../../stickers/Analyzing.webm');
      if (stickerMessageId && fs.existsSync(analyzingStickerPath)) {
        await bot.deleteMessage(chatId, stickerMessageId).catch(() => {});
        const newSticker = await bot.sendSticker(chatId, analyzingStickerPath);
        stickerMessageId = newSticker.message_id;
      }
      
      let prompt1;
      if (strategy === 'swing') {
        prompt1 = strategyObj.buildDailyPrompt(state.pair);
      } else {
        prompt1 = strategyObj.build15MinPrompt(state.pair);
      }
      const analysis1 = await orchestrator.gptAnalyzer.analyze(prompt1, tf1Formatted);

      let prompt2;
      if (strategy === 'swing') {
        prompt2 = strategyObj.buildM30Prompt(state.pair, analysis1);
      } else {
        prompt2 = strategyObj.build5MinPrompt(state.pair, analysis1);
      }
      const analysis2 = await orchestrator.gptAnalyzer.analyze(prompt2, tf2Formatted);

      // Step 5: Update sticker to Validating Setup
      const validatingSetupStickerPath = path.join(__dirname, '../../stickers/ValidatingSetup.webm');
      if (stickerMessageId && fs.existsSync(validatingSetupStickerPath)) {
        await bot.deleteMessage(chatId, stickerMessageId).catch(() => {});
        const newSticker = await bot.sendSticker(chatId, validatingSetupStickerPath);
        stickerMessageId = newSticker.message_id;
      }
      
      const analyses = [
        { timeframe: timeframes[0].interval, analysis: analysis1 },
        { timeframe: timeframes[1].interval, analysis: analysis2 }
      ];
      const combinedAnalysis = orchestrator.combineAnalyses(strategyObj, analyses);

      // Step 6: Generate chart (always generate, even if invalid)
      const marketData = {
        [timeframes[0].interval]: { ohlcv: tf1Data, formatted: tf1Formatted },
        [timeframes[1].interval]: { ohlcv: tf2Data, formatted: tf2Formatted }
      };
      combinedAnalysis.charts = await orchestrator.generateCharts(state.pair, strategy, combinedAnalysis, marketData);

      // Generate short summary
      const fullAnalysisText = extractReasoning(combinedAnalysis);
      const shortSummary = await generateShortSummary(orchestrator.gptAnalyzer, fullAnalysisText);
      combinedAnalysis.shortSummary = shortSummary;

      // Final - delete status message
      await bot.deleteMessage(chatId, statusId).catch(() => {});

      // Clear typing indicator
      clearInterval(typingInterval);
      
      // Delete sticker after a brief pause
      await new Promise(resolve => setTimeout(resolve, 500));
      if (stickerMessageId) {
        await bot.deleteMessage(chatId, stickerMessageId).catch(() => {});
      }

      const result = combinedAnalysis;

      // Log analysis to database
      try {
        const zone = result.daily_zone || result.primary_zone || {};
        const analysisRecord = await database.logAnalysis(chatId, {
          pair: state.pair,
          strategy: strategy,
          market_category: state.market,
          signal: result.signal,
          confidence: result.confidence ? result.confidence * 100 : null,
          is_valid: result.valid,
          trend: result.trend || result.micro_trend,
          pattern: result.pattern,
          zone_low: zone.price_low,
          zone_high: zone.price_high
        });
        logger.info(`Analysis logged for user ${chatId}`);

        // Save analysis reference for AI context
        if (analysisRecord && analysisRecord.id) {
          await analysisContextManager.saveAnalysisForUser(
            chatId,
            analysisRecord.id,
            {
              pair: state.pair,
              strategy: strategy,
              result: result,
              timestamp: new Date().toISOString()
            }
          );
          logger.info(`Analysis context saved for AI`);
        }
      } catch (dbError) {
        logger.error('Failed to log analysis:', dbError);
        // Continue anyway - don't fail the analysis because of logging
      }

      // Build caption in the new format with emojis
      const statusLabel = result.signal.toUpperCase();
      const confidence = (result.confidence * 100).toFixed(1);
      const validStatus = result.valid ? 'VALID' : 'INVALID';

      let caption = `📊 PRIMUS GPT Analysis\n`;
      caption += `${state.pair} | ${strategy.toUpperCase()}\n`;
      caption += `Status: ${validStatus}\n`;
      caption += `Signal: ${statusLabel}\n`;
      caption += `Confidence: ${confidence}%\n`;

      // Add zone info with emojis
      const zone = result.daily_zone || result.primary_zone;
      if (zone && zone.price_low && zone.price_high) {
        caption += `\n🔴 Sell Zone:\n`;
        caption += `${zone.price_low} - ${zone.price_high}\n`;
        
        caption += `\n🟢 Buy Zone:\n`;
        caption += `${zone.price_low} - ${zone.price_high}\n`;
      }

      // Add SL and TP levels with emojis - show actual prices
      if (result.stop_loss) {
        caption += `\n🛑 SL : ${result.stop_loss.toFixed(2)}\n`;
      }
      if (result.take_profit_1) {
        caption += `✅ TP1 : ${result.take_profit_1.toFixed(2)}\n`;
      }
      if (result.take_profit_2) {
        caption += `✅ TP2 : ${result.take_profit_2.toFixed(2)}\n`;
      }

      // Add timeframe at the end
      const strategyTimeframes = orchestrator.strategies[strategy].getRequiredTimeframes();
      if (strategyTimeframes && strategyTimeframes.length > 0) {
        caption += `\nTimeframe: ${strategyTimeframes[strategyTimeframes.length - 1].interval}`;
      }

      // Store full analysis for detailed view
      const fullAnalysis = extractReasoning(result);
      state.lastAnalysis = { result, pair: state.pair, strategy, fullAnalysis };
      chatState.set(chatId, state);

      // Always send the bottom chart (M30 for swing, 5min for scalping)
      if (result.charts && result.charts.length > 0) {
        // Get the last chart (bottom timeframe)
        const bottomChart = result.charts[result.charts.length - 1];
        if (fs.existsSync(bottomChart.path)) {
          await bot.sendPhoto(chatId, bottomChart.path, { 
            caption: caption.substring(0, 1024) // Telegram caption limit
          });
        }
      }
      
      // If invalid, send additional explanation
      if (!result.valid) {
        const explanation = buildInvalidExplanation(result, strategy);
        await bot.sendMessage(chatId, explanation);
      }

      // Send retry options with detailed analysis
      await bot.sendMessage(chatId, 'What would you like to do next?', retryKeyboard(state.pair, strategy, fullAnalysis));

      state.processing = false;
      chatState.set(chatId, state);

    } catch (error) {
      clearInterval(typingInterval);
      logger.error('Bot analysis failed:', error);
      
      await bot.sendMessage(
        chatId, 
        `Analysis failed: ${error.message}\n\nPlease try again or choose a different instrument.`
      );

      await bot.sendMessage(chatId, 'What would you like to do?', retryKeyboard(state.pair, strategy, false));

      state.processing = false;
      chatState.set(chatId, state);
    }
    return;
  }
});

// Fallback for any message - AI response or auto-start if not authenticated
bot.on('message', async (msg) => {
  const text = msg.text || '';
  const chatId = msg.chat.id;
  
  // Ignore if it's a command we already handle
  if (/^\/(start|profile|logout|login)/.test(text)) return;
  
  // Ignore callback queries
  if (msg.chat.type === 'private' && !text) return;

  // Check if waiting for phone number input
  const state = chatState.get(chatId) || {};
  if (state.waitingForPhone && text) {
    try {
      // Clean phone number (remove spaces, dashes, etc.)
      let phoneNumber = text.trim().replace(/[\s\-\(\)]/g, '');
      
      // Add + if not present
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }

      // Find user by phone number
      const user = await database.getUserByPhone(phoneNumber);
      
      if (!user) {
        const registrationUrl = process.env.WEB_REGISTRATION_URL || 'https://primusgpt-ai.vercel.app/register';
        await bot.sendMessage(
          chatId,
          'ACCOUNT NOT FOUND\n\nNo account found with this phone number.\n\nPlease verify your number and try again, or register first.',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Register Now', url: registrationUrl }],
                [{ text: 'Login', callback_data: 'start_login' }]
              ]
            }
          }
        );
        state.waitingForPhone = false;
        chatState.set(chatId, state);
        return;
      }

      // Update user's telegram_id
      await database.updateUserTelegramIdById(user.id, chatId);

      // Login user
      await authService.loginUser(chatId, {
        username: msg.from.username,
        first_name: msg.from.first_name,
        last_name: msg.from.last_name
      });

      // Clear waiting state
      state.waitingForPhone = false;
      chatState.set(chatId, state);
      resetState(chatId);

      // Send welcome sticker
      const welcomeToStickerPath = path.join(__dirname, '../../stickers/WELCOME.webm');
      if (fs.existsSync(welcomeToStickerPath)) {
        await bot.sendSticker(chatId, welcomeToStickerPath);
      }

      // Send market selection sticker
      const marketStickerPath = path.join(__dirname, '../../stickers/SelectMarketType.webm');
      if (fs.existsSync(marketStickerPath)) {
        await bot.sendSticker(chatId, marketStickerPath);
      }

      await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
      
      await database.logLoginAttempt(chatId, true, 'phone_login');
      return;

    } catch (error) {
      logger.error('Phone login failed:', error);
      await bot.sendMessage(chatId, 'LOGIN FAILED\n\nPlease try again with /login');
      state.waitingForPhone = false;
      chatState.set(chatId, state);
      return;
    }
  }
  
  // Check if user is authenticated
  const isAuth = await authService.isAuthenticated(chatId);
  
  if (!isAuth) {
    // Auto-trigger start flow for any message (existing logic)
    const telegramUser = msg.from;
    
    try {
      // Check if user exists in database
      let user = await database.getUserByTelegramId(chatId);
      
      if (!user) {
        // User doesn't exist - prompt for registration
        const registrationUrl = process.env.WEB_REGISTRATION_URL || 'https://primusgpt-ai.vercel.app/register';
        
        const welcomeStickerPath = path.join(__dirname, '../../stickers/WELCOME.webm');
        if (fs.existsSync(welcomeStickerPath)) {
          await bot.sendSticker(chatId, welcomeStickerPath);
        }
        
        await bot.sendMessage(
          chatId,
          `Welcome to PRIMUS GPT\n\nACCOUNT NOT FOUND\n\nYou need to register on our website first, then return here to login.\n\nAfter registration, use the Login button below to connect your Telegram account.`,
          { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Register Now', url: registrationUrl }],
                [{ text: 'Login', callback_data: 'start_login' }]
              ]
            }
          }
        );
        
        await database.logLoginAttempt(chatId, false, 'unregistered_user');
        return;
      }

      // User exists - create session and auto-login
      await authService.loginUser(chatId, {
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name
      });

      const welcomeStickerPath = path.join(__dirname, '../../stickers/WELCOME TO.webm');
      if (fs.existsSync(welcomeStickerPath)) {
        await bot.sendSticker(chatId, welcomeStickerPath);
      }

      // Auto-login successful - show menu
      resetState(chatId);
      
      // Send market selection sticker
      const marketStickerPath = path.join(__dirname, '../../stickers/SelectMarketType.webm');
      if (fs.existsSync(marketStickerPath)) {
        await bot.sendSticker(chatId, marketStickerPath);
      }
      
      await sendButtonsAndTrack(chatId, 'Choose:', marketCategoryKeyboard());
      
    } catch (error) {
      logger.error('Auto-start failed:', error);
      await bot.sendMessage(
        chatId,
        'An error occurred. Please try sending /start'
      );
    }
  } else {
    // ===== NEW: AI-POWERED TEXT MESSAGE HANDLER =====
    // User is authenticated and sent a text message (not a command or button)
    
    try {
      // Double-check user still exists in database (in case they were deleted)
      const user = await database.getUserByTelegramId(chatId);
      
      if (!user) {
        // User was deleted from database - log them out and show registration
        await authService.logoutUser(chatId);
        
        const registrationUrl = process.env.WEB_REGISTRATION_URL || 'https://primusgpt-ai.vercel.app/register';
        await bot.sendMessage(
          chatId,
          `Welcome to PRIMUS GPT\n\nACCOUNT NOT FOUND\n\nYou need to register on our website first, then return here to login.\n\nAfter registration, use the Login button below to connect your Telegram account.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Register Now', url: registrationUrl }],
                [{ text: 'Login', callback_data: 'start_login' }]
              ]
            }
          }
        );
        return;
      }
      
      // Save user message to conversation history
      await conversationManager.saveMessage(chatId, 'user', text);
      
      // Show typing indicator
      await bot.sendChatAction(chatId, 'typing');
      
      // Generate AI response with full context
      const aiResponse = await aiResponder.respondToMessage(chatId, text);
      
      // Send AI response
      await bot.sendMessage(chatId, aiResponse);
      
      // Save bot response to conversation history
      await conversationManager.saveMessage(chatId, 'bot', aiResponse);
      
      logger.info(`AI response sent to ${chatId}`);
      
      // Send the last buttons that were shown (or default to market selection)
      const state = chatState.get(chatId) || {};
      const buttonsToSend = state.lastButtons || marketCategoryKeyboard();
      const buttonMessage = state.lastButtonsMessage || 'Choose:';
      await bot.sendMessage(chatId, buttonMessage, buttonsToSend);
      
    } catch (error) {
      logger.error('AI response failed:', error);
      
      // Fallback: guide to buttons and show last buttons
      await bot.sendMessage(
        chatId,
        `I had trouble understanding that. Here's what you can do:

• Use the buttons below to start a trading analysis
• Type /profile to see your statistics
• Ask me questions about trading

How can I help you?`
      );
      
      // Send last buttons even on error (or default to market selection)
      const state = chatState.get(chatId) || {};
      const buttonsToSend = state.lastButtons || marketCategoryKeyboard();
      const buttonMessage = state.lastButtonsMessage || 'Choose:';
      await bot.sendMessage(chatId, buttonMessage, buttonsToSend);
    }
  }
});

// Helper functions
async function generateShortSummary(gptAnalyzer, fullAnalysis) {
  if (!fullAnalysis) return '';
  
  try {
    const prompt = `You are a trading assistant. Convert the following detailed analysis into exactly 3 concise bullet points. Each bullet point should be one short sentence (max 15 words). Focus on the most critical information only.

Analysis:
${fullAnalysis}

Respond with ONLY the 3 bullet points in this exact format:
• [point 1]
• [point 2]
• [point 3]`;

    // Call OpenAI directly for summary generation
    const response = await gptAnalyzer.openai.chat.completions.create({
      model: gptAnalyzer.model,
      messages: [
        { role: 'system', content: 'You are a concise trading analysis assistant.' },
        { role: 'user', content: prompt }
      ],
    
    });

    const summary = response.choices[0].message.content.trim();
    
    // Clean up and validate format
    const lines = summary.split('\n').filter(l => l.trim().startsWith('•'));
    if (lines.length >= 3) {
      return '\nAnalysis:\n' + lines.slice(0, 3).join('\n');
    }
    
    // Fallback to simple extraction if format is wrong
    return extractShortAnalysis({ reasoning: fullAnalysis });
  } catch (error) {
    logger.error('Failed to generate short summary:', error);
    return extractShortAnalysis({ reasoning: fullAnalysis });
  }
}

function extractShortAnalysis(result) {
  // Fallback: Get full reasoning and convert to short points
  const reasoning = result.reasoning || extractReasoning(result);
  if (!reasoning) return '';
  
  // Split into sentences and take first 2-3 key points
  const sentences = reasoning
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200); // Filter out very short/long sentences
  
  const points = sentences.slice(0, 3).map(s => `\u2022 ${s}`);
  
  if (points.length === 0) return '';
  return '\nAnalysis:\n' + points.join('\n');
}

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

function retryKeyboard(pair, strategy, hasDetailedAnalysis) {
  const buttons = [
    [
      { text: 'Retry Analysis', callback_data: `retry_${pair}_${strategy}` },
      { text: 'Back to Menu', callback_data: 'back_to_menu' }
    ]
  ];
  
  // Add detailed analysis button if available
  if (hasDetailedAnalysis) {
    buttons.unshift([
      { text: 'Show Detailed Analysis', callback_data: 'show_detailed' }
    ]);
  }
  
  return {
    reply_markup: {
      inline_keyboard: buttons
    }
  };
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Bot shutting down...');
  bot.stopPolling();
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Bot shutting down...');
  bot.stopPolling();
  await database.close();
  process.exit(0);
});
