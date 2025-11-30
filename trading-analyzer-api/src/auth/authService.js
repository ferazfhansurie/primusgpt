import crypto from 'crypto';
import database from '../db/database.js';
import logger from '../utils/logger.js';

class AuthService {
  constructor() {
    this.sessionDurationDays = 30;
  }

  /**
   * Initialize the auth service (ensures database is ready)
   */
  async initialize() {
    try {
      await database.initialize();
      logger.success('Auth service initialized');
    } catch (error) {
      logger.error('Auth service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate a session token
   */
  generateSessionToken(telegramId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(32).toString('hex');
    return crypto
      .createHash('sha256')
      .update(`${telegramId}-${timestamp}-${random}`)
      .digest('hex');
  }

  /**
   * Check if user is authenticated (has valid session)
   */
  async isAuthenticated(telegramId) {
    try {
      const session = await database.getSession(telegramId);
      
      if (session) {
        // Update activity timestamp
        await database.updateSessionActivity(telegramId);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Auth check failed:', error);
      return false;
    }
  }

  /**
   * Register a new user or login existing user
   */
  async loginUser(telegramId, telegramUserData = {}) {
    try {
      // Check if user already has a valid session
      const existingSession = await database.getSession(telegramId);
      if (existingSession) {
        await database.updateLastLogin(telegramId);
        await database.updateSessionActivity(telegramId);
        await database.logLoginAttempt(telegramId, true, 'existing_session');
        
        const user = await database.getUserByTelegramId(telegramId);
        logger.info(`User ${telegramId} logged in with existing session`);
        return { user, isNewUser: false, session: existingSession };
      }

      // Check if user exists
      let user = await database.getUserByTelegramId(telegramId);
      const isNewUser = !user;

      // Create or update user
      user = await database.upsertUser(telegramId, {
        username: telegramUserData.username,
        first_name: telegramUserData.first_name,
        last_name: telegramUserData.last_name,
        email: telegramUserData.email,
        phone: telegramUserData.phone
      });

      // Create session
      const sessionToken = this.generateSessionToken(telegramId);
      const session = await database.createSession(
        telegramId, 
        sessionToken, 
        this.sessionDurationDays
      );

      // Log successful login
      await database.logLoginAttempt(telegramId, true, isNewUser ? 'registration' : 'login');

      logger.success(`User ${telegramId} logged in successfully (new: ${isNewUser})`);
      
      return { user, isNewUser, session };
    } catch (error) {
      logger.error('Login failed:', error);
      await database.logLoginAttempt(telegramId, false, 'login_error');
      throw error;
    }
  }

  /**
   * Complete user registration with additional details
   */
  async completeRegistration(telegramId, email, phone) {
    try {
      const user = await database.upsertUser(telegramId, { email, phone });
      logger.success(`User ${telegramId} completed registration`);
      return user;
    } catch (error) {
      logger.error('Registration completion failed:', error);
      throw error;
    }
  }

  /**
   * Logout user (delete session)
   */
  async logoutUser(telegramId) {
    try {
      await database.deleteSession(telegramId);
      await database.logLoginAttempt(telegramId, true, 'logout');
      logger.info(`User ${telegramId} logged out`);
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(telegramId) {
    try {
      const user = await database.getUserByTelegramId(telegramId);
      const stats = await database.getUserStats(telegramId);
      
      return {
        user,
        stats
      };
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (basic validation)
   */
  validatePhone(phone) {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    // Check if it's a valid international format (+ followed by 7-15 digits)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Check if user needs to complete registration
   */
  async needsRegistrationDetails(telegramId) {
    try {
      const user = await database.getUserByTelegramId(telegramId);
      if (!user) return true;
      
      // Check if email and phone are provided
      return !user.email || !user.phone;
    } catch (error) {
      logger.error('Failed to check registration status:', error);
      return true;
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
