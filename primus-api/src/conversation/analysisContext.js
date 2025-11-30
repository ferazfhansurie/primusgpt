import database from '../db/database.js';
import logger from '../utils/logger.js';

/**
 * AnalysisContextManager
 * Manages analysis references so AI can discuss specific analysis results with users
 */
class AnalysisContextManager {
  /**
   * Save analysis for user (so AI can reference it later)
   */
  async saveAnalysisForUser(telegramId, analysisId, fullAnalysisResult) {
    try {
      const reference = await database.saveAnalysisReference(
        telegramId,
        analysisId,
        fullAnalysisResult
      );

      logger.info(`Analysis saved for AI context: ${telegramId} -> ${reference.reference_key}`);
      return reference;
    } catch (error) {
      logger.error('Failed to save analysis reference:', error);
      throw error;
    }
  }

  /**
   * Get last analysis for user
   */
  async getLastAnalysisForUser(telegramId) {
    try {
      const reference = await database.getLastAnalysisReference(telegramId);
      
      if (!reference) {
        return null;
      }

      return {
        reference_key: reference.reference_key,
        analysis: reference.full_analysis,
        created_at: reference.created_at
      };
    } catch (error) {
      logger.error('Failed to get last analysis:', error);
      return null;
    }
  }

  /**
   * Get analysis by reference key
   */
  async getAnalysisByKey(referenceKey) {
    try {
      const reference = await database.getAnalysisByReference(referenceKey);
      
      if (!reference) {
        return null;
      }

      return {
        reference_key: reference.reference_key,
        analysis: reference.full_analysis,
        telegram_id: reference.telegram_id,
        created_at: reference.created_at
      };
    } catch (error) {
      logger.error('Failed to get analysis by key:', error);
      return null;
    }
  }

  /**
   * Format analysis for AI prompt (concise summary)
   */
  formatAnalysisForPrompt(analysisData) {
    if (!analysisData || !analysisData.analysis) {
      return 'No recent analysis available.';
    }

    const analysis = analysisData.analysis;
    const result = analysis.result || analysis;

    let formatted = `Analysis Reference: ${analysisData.reference_key}\n`;
    formatted += `Pair: ${result.pair || 'Unknown'}\n`;
    formatted += `Strategy: ${result.strategy || 'Unknown'}\n`;
    formatted += `Signal: ${result.signal || 'N/A'}\n`;
    formatted += `Valid: ${result.valid ? 'YES' : 'NO'}\n`;
    formatted += `Confidence: ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'}\n`;

    // Add trend info
    if (result.trend) {
      formatted += `Trend: ${result.trend}\n`;
    }
    if (result.micro_trend) {
      formatted += `Micro Trend: ${result.micro_trend}\n`;
    }

    // Add pattern
    if (result.pattern) {
      formatted += `Pattern: ${result.pattern}\n`;
    }

    // Add zones
    const zone = result.daily_zone || result.primary_zone || result.entry_zone;
    if (zone && zone.price_low && zone.price_high) {
      formatted += `Zone: ${zone.price_low} - ${zone.price_high}\n`;
    }

    // Add current price if available
    if (result.current_price) {
      formatted += `Current Price: ${result.current_price}\n`;
    }

    // Add reasoning (shortened)
    if (result.reasoning) {
      const reasoning = result.reasoning.substring(0, 300);
      formatted += `\nReasoning (summary): ${reasoning}...\n`;
    }

    return formatted;
  }

  /**
   * Extract key details from analysis for conversational responses
   */
  extractKeyDetails(analysisData) {
    if (!analysisData || !analysisData.analysis) {
      return null;
    }

    const result = analysisData.analysis.result || analysisData.analysis;

    return {
      reference_key: analysisData.reference_key,
      pair: result.pair,
      strategy: result.strategy,
      signal: result.signal,
      valid: result.valid,
      confidence: result.confidence,
      trend: result.trend || result.micro_trend,
      pattern: result.pattern,
      zone: result.daily_zone || result.primary_zone || result.entry_zone,
      current_price: result.current_price,
      entry_price: result.entry_price,
      stop_loss: result.stop_loss,
      take_profit: result.take_profit,
      reasoning: result.reasoning,
      validation: result.validation
    };
  }

  /**
   * Check if analysis is recent (within last 30 minutes)
   */
  isAnalysisRecent(analysisData) {
    if (!analysisData || !analysisData.created_at) {
      return false;
    }

    const analysisTime = new Date(analysisData.created_at);
    const now = new Date();
    const diffMinutes = (now - analysisTime) / 1000 / 60;

    return diffMinutes <= 30;
  }
}

// Export singleton instance
const analysisContextManager = new AnalysisContextManager();
export default analysisContextManager;
