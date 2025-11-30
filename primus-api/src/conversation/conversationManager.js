import database from '../db/database.js';
import logger from '../utils/logger.js';

/**
 * ConversationManager
 * Handles conversation history tracking and session state management
 */
class ConversationManager {
  /**
   * Save a message to conversation history
   */
  async saveMessage(telegramId, messageType, content, metadata = {}) {
    try {
      const message = await database.saveConversationMessage(
        telegramId,
        messageType,
        content,
        metadata
      );

      // Update session message count
      const session = await this.getSession(telegramId);
      await database.updateConversationSession(telegramId, {
        message_count: (session.message_count || 0) + 1
      });

      logger.info(`Message saved: ${telegramId} (${messageType})`);
      return message;
    } catch (error) {
      logger.error('Failed to save message:', error);
      throw error;
    }
  }

  /**
   * Get recent conversation history
   */
  async getRecentHistory(telegramId, limit = 10) {
    try {
      const history = await database.getConversationHistory(telegramId, limit);
      return history;
    } catch (error) {
      logger.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Get or create user session
   */
  async getSession(telegramId) {
    try {
      const session = await database.getConversationSession(telegramId);
      return session;
    } catch (error) {
      logger.error('Failed to get session:', error);
      throw error;
    }
  }

  /**
   * Get current state (which button step user is on)
   */
  async getCurrentState(telegramId) {
    try {
      const session = await this.getSession(telegramId);
      return session.current_state || null;
    } catch (error) {
      logger.error('Failed to get current state:', error);
      return null;
    }
  }

  /**
   * Update session state
   */
  async updateState(telegramId, state) {
    try {
      await database.updateConversationSession(telegramId, {
        current_state: state
      });
      logger.info(`State updated: ${telegramId} -> ${state}`);
    } catch (error) {
      logger.error('Failed to update state:', error);
    }
  }

  /**
   * Update session context (arbitrary data storage)
   */
  async updateContext(telegramId, contextUpdate) {
    try {
      const session = await this.getSession(telegramId);
      const currentContext = session.context || {};
      const newContext = { ...currentContext, ...contextUpdate };

      await database.updateConversationSession(telegramId, {
        context: newContext
      });

      logger.info(`Context updated: ${telegramId}`);
    } catch (error) {
      logger.error('Failed to update context:', error);
    }
  }

  /**
   * Get session context
   */
  async getContext(telegramId) {
    try {
      const session = await this.getSession(telegramId);
      return session.context || {};
    } catch (error) {
      logger.error('Failed to get context:', error);
      return {};
    }
  }

  /**
   * Format conversation history for AI prompt
   */
  formatHistoryForPrompt(history) {
    if (!history || history.length === 0) {
      return 'No recent conversation.';
    }

    return history
      .map(msg => {
        const type = msg.message_type === 'user' ? 'User' : 'Bot';
        return `${type}: ${msg.content}`;
      })
      .join('\n');
  }

  /**
   * Get all conversations (for admin dashboard)
   */
  async getAllConversations(limit = 100, offset = 0) {
    try {
      return await database.getAllConversations(limit, offset);
    } catch (error) {
      logger.error('Failed to get all conversations:', error);
      return [];
    }
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(telegramId) {
    try {
      const history = await database.getConversationHistory(telegramId, 1000);
      const session = await this.getSession(telegramId);

      return {
        total_messages: history.length,
        user_messages: history.filter(m => m.message_type === 'user').length,
        bot_messages: history.filter(m => m.message_type === 'bot').length,
        session_start: session.session_start,
        last_activity: session.last_activity
      };
    } catch (error) {
      logger.error('Failed to get conversation stats:', error);
      return null;
    }
  }
}

// Export singleton instance
const conversationManager = new ConversationManager();
export default conversationManager;
