import database from '../db/database.js';
import logger from '../utils/logger.js';

/**
 * AdminGuidelinesManager
 * Manages AI behavior guidelines configured by admins
 */
class AdminGuidelinesManager {
  constructor() {
    this.cachedGuidelines = null;
    this.cacheExpiry = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all active guidelines (with caching)
   */
  async getActiveGuidelines(type = null) {
    try {
      // Check cache
      if (this.cachedGuidelines && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        if (type) {
          return this.cachedGuidelines.filter(g => g.guideline_type === type);
        }
        return this.cachedGuidelines;
      }

      // Fetch from database
      const guidelines = await database.getActiveGuidelines(type);
      
      // Update cache
      if (!type) {
        this.cachedGuidelines = guidelines;
        this.cacheExpiry = Date.now() + this.cacheDuration;
      }

      return guidelines;
    } catch (error) {
      logger.error('Failed to get active guidelines:', error);
      return [];
    }
  }

  /**
   * Build system prompt from admin guidelines
   */
  async buildSystemPrompt() {
    try {
      const systemGuidelines = await this.getActiveGuidelines('system');
      const behaviorGuidelines = await this.getActiveGuidelines('behavior');

      let prompt = '';

      // Add system prompts (base personality)
      systemGuidelines.forEach(guideline => {
        prompt += guideline.content + '\n\n';
      });

      // Add behavior guidelines
      if (behaviorGuidelines.length > 0) {
        prompt += 'BEHAVIORAL GUIDELINES:\n';
        behaviorGuidelines.forEach(guideline => {
          prompt += '- ' + guideline.content + '\n';
        });
      }

      return prompt.trim();
    } catch (error) {
      logger.error('Failed to build system prompt:', error);
      // Return default prompt
      return this.getDefaultSystemPrompt();
    }
  }

  /**
   * Get response template by key
   */
  async getResponseTemplate(key) {
    try {
      const guideline = await database.getGuideline(key);
      return guideline ? guideline.content : null;
    } catch (error) {
      logger.error(`Failed to get response template ${key}:`, error);
      return null;
    }
  }

  /**
   * Get all response templates
   */
  async getResponseTemplates() {
    try {
      return await this.getActiveGuidelines('response_template');
    } catch (error) {
      logger.error('Failed to get response templates:', error);
      return [];
    }
  }

  /**
   * Update guideline (admin action)
   */
  async updateGuideline(key, type, content, priority = 0, adminId = null) {
    try {
      const result = await database.upsertGuideline(key, type, content, priority, adminId);
      
      // Clear cache
      this.clearCache();
      
      logger.info(`Guideline updated: ${key}`);
      return result;
    } catch (error) {
      logger.error('Failed to update guideline:', error);
      throw error;
    }
  }

  /**
   * Toggle guideline active status
   */
  async toggleGuideline(key, isActive) {
    try {
      const result = await database.toggleGuideline(key, isActive);
      
      // Clear cache
      this.clearCache();
      
      logger.info(`Guideline toggled: ${key} -> ${isActive}`);
      return result;
    } catch (error) {
      logger.error('Failed to toggle guideline:', error);
      throw error;
    }
  }

  /**
   * Get specific guideline by key
   */
  async getGuideline(key) {
    try {
      return await database.getGuideline(key);
    } catch (error) {
      logger.error(`Failed to get guideline ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear guidelines cache
   */
  clearCache() {
    this.cachedGuidelines = null;
    this.cacheExpiry = null;
  }

  /**
   * Get default system prompt (fallback)
   */
  getDefaultSystemPrompt() {
    return `You are PRIMUS GPT, an AI trading assistant specializing in forex and gold analysis.

Core Personality:
- Professional yet approachable
- Patient and educational
- Risk-aware and cautious
- Honest about limitations

Key Behaviors:
- Always prioritize user's risk management
- Explain technical concepts clearly
- Reference specific analysis results when discussing them
- Guide users to make informed decisions (never force trades)
- Stay focused on trading topics
- When uncertain, admit it and offer to analyze data

Rules:
- Never guarantee profits or predict exact price movements
- Always mention risk warnings when discussing trades
- Encourage users to do their own research
- Be concise but thorough
- Use emojis sparingly for readability`;
  }

  /**
   * Get risk warning
   */
  async getRiskWarning() {
    const template = await this.getResponseTemplate('risk_warning');
    return template || '⚠️ Trading involves significant risk. Never risk more than you can afford to lose. This analysis is for educational purposes and should not be considered financial advice.';
  }

  /**
   * Get greeting template
   */
  async getGreeting() {
    const template = await this.getResponseTemplate('greeting');
    return template || `Welcome back! 👋 Ready to analyze the markets?

You can:
• Use the buttons to start a new analysis
• Ask me questions about trading
• Type /profile to see your stats

How can I help you today?`;
  }
}

// Export singleton instance
const adminGuidelinesManager = new AdminGuidelinesManager();
export default adminGuidelinesManager;
