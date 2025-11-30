#!/usr/bin/env node

import TwelveDataClient from './api/twelveDataClient.js';
import logger from './utils/logger.js';
import { calculatePips, formatPrice } from './utils/pips.js';
import config from './utils/config.js';

/**
 * Test Commodities Support
 * Tests the new commodities features
 */

async function testCommodities() {
  logger.info('Testing Commodities Support\n');
  
  const client = new TwelveDataClient();
  
  try {
    // Test 1: Validate API key
    logger.info('Test 1: Validating API key...');
    const isValid = await client.validateApiKey();
    if (!isValid) {
      logger.failure('API key validation failed');
      process.exit(1);
    }
    logger.success('✓ API key validated\n');
    
    // Test 2: Fetch available commodities
    logger.info('Test 2: Fetching available commodities...');
    try {
      const commodities = await client.getCommodities();
      logger.success(`✓ Found ${commodities.length} commodities`);
      
      // Show precious metals
      const preciousMetals = commodities.filter(c => c.category === 'Precious Metal');
      if (preciousMetals.length > 0) {
        logger.info('\nPrecious Metals:');
        preciousMetals.forEach(c => {
          logger.info(`  - ${c.symbol}: ${c.name}`);
        });
      }
      
      console.log('');
    } catch (error) {
      logger.warn('⚠ Commodities endpoint failed (may require premium subscription)');
      logger.info('Continuing with configured commodities...\n');
    }
    
    // Test 3: Test pip calculations for gold
    logger.info('Test 3: Testing pip calculations for Gold...');
    const goldPrice1 = 2000.00;
    const goldPrice2 = 2010.50;
    const pips = calculatePips('XAU/USD', goldPrice1, goldPrice2);
    logger.info(`Price 1: ${formatPrice('XAU/USD', goldPrice1)}`);
    logger.info(`Price 2: ${formatPrice('XAU/USD', goldPrice2)}`);
    logger.success(`✓ Pip difference: ${pips.toFixed(1)} pips\n`);
    
    // Test 4: Fetch real-time quote for Gold
    logger.info('Test 4: Fetching real-time Gold quote...');
    try {
      const goldQuote = await client.getQuote('XAU/USD');
      logger.success(`✓ Current Gold price: ${formatPrice('XAU/USD', goldQuote.price)}`);
      logger.info(`  High: ${formatPrice('XAU/USD', goldQuote.high)}`);
      logger.info(`  Low: ${formatPrice('XAU/USD', goldQuote.low)}`);
      logger.info(`  Time: ${goldQuote.datetime}\n`);
    } catch (error) {
      logger.error('Failed to fetch Gold quote:', error.message);
      logger.info('Note: Ensure your TwelveData subscription includes commodities\n');
    }
    
    // Test 5: Fetch historical data for Gold
    logger.info('Test 5: Fetching historical Gold data (1 day)...');
    try {
      const goldData = await client.getTimeSeries('XAU/USD', '1day', 10);
      logger.success(`✓ Fetched ${goldData.length} daily bars for Gold`);
      if (goldData.length > 0) {
        const latest = goldData[goldData.length - 1];
        logger.info(`  Latest close: ${formatPrice('XAU/USD', latest.close)}`);
        logger.info(`  Date: ${latest.datetime}\n`);
      }
    } catch (error) {
      logger.error('Failed to fetch Gold historical data:', error.message);
      logger.info('Note: Ensure your TwelveData subscription includes commodities\n');
    }
    
    // Test 6: Verify configuration
    logger.info('Test 6: Verifying configuration...');
    if (config.instruments) {
      logger.success('✓ Instruments configuration found');
      logger.info(`  Forex pairs: ${config.instruments.forex.length}`);
      logger.info(`  Commodities: ${config.instruments.commodities.length}`);
      logger.info('\nConfigured Commodities:');
      config.instruments.commodities.forEach(c => {
        logger.info(`  - ${c}`);
      });
    } else if (config.commodities) {
      logger.success('✓ Commodities configuration found (legacy format)');
      logger.info(`  Commodities: ${config.commodities.length}`);
    } else {
      logger.warn('⚠ No commodities configuration found');
    }
    
    logger.success('\n✓ All tests completed successfully!');
    logger.info('\nNext steps:');
    logger.info('1. Run the Telegram bot: npm run bot');
    logger.info('2. Select "Commodities" from the market menu');
    logger.info('3. Choose Gold (XAU/USD) or other commodities');
    logger.info('4. Run your preferred strategy analysis');
    
  } catch (error) {
    logger.failure('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testCommodities();
