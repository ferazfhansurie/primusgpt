import OpenAI from 'openai';
import config from '../utils/config.js';
import logger from '../utils/logger.js';
import conversationManager from './conversationManager.js';
import analysisContextManager from './analysisContext.js';
import adminGuidelinesManager from '../admin/adminGuidelines.js';

/**
 * AIResponder
 * Generates intelligent, context-aware responses to user text messages
 */
class AIResponder {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    this.model = config.openai.model || 'gpt-4o-mini';
  }

  /**
   * Main method: Generate response to user message
   */
  async respondToMessage(telegramId, userMessage) {
    try {
      logger.info(`Generating AI response for ${telegramId}: "${userMessage}"`);

      // 1. Load context
      const currentState = await conversationManager.getCurrentState(telegramId);
      const lastAnalysis = await analysisContextManager.getLastAnalysisForUser(telegramId);
      const recentHistory = await conversationManager.getRecentHistory(telegramId, 5);
      const systemPrompt = await adminGuidelinesManager.buildSystemPrompt();

      logger.info(`Context loaded - State: ${currentState || 'none'}, Analysis: ${lastAnalysis ? 'yes' : 'no'}, History: ${recentHistory?.length || 0} messages`);

      // 2. Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(
        systemPrompt,
        currentState,
        lastAnalysis,
        recentHistory,
        userMessage
      );

      logger.info(`Context prompt built - Length: ${contextPrompt.length} characters`);

      // 3. Get AI response
      const response = await this.getAIResponse(contextPrompt, userMessage);

      logger.success('AI response generated successfully');
      return response;

    } catch (error) {
      logger.error('AI response generation failed:', error);
      
      // Fallback response
      return this.getFallbackResponse();
    }
  }

  /**
   * Build context-aware prompt for OpenAI
   */
  buildContextPrompt(systemPrompt, currentState, lastAnalysis, recentHistory, userMessage) {
    let prompt = systemPrompt + '\n\n';

    // Add current context
    prompt += '===== CURRENT CONTEXT =====\n';
    
    // Button state
    if (currentState) {
      prompt += `Button Flow State: User is at "${currentState}" step (selecting ${currentState})\n`;
      prompt += `Guidance: User can click buttons to continue, or you can guide them.\n`;
    } else {
      prompt += `Button Flow State: User is not in active button flow\n`;
      prompt += `Guidance: User can click buttons above to start new analysis\n`;
    }
    prompt += '\n';

    // Last analysis
    if (lastAnalysis) {
      const isRecent = analysisContextManager.isAnalysisRecent(lastAnalysis);
      prompt += `===== LAST ANALYSIS (${isRecent ? 'RECENT' : 'OLDER'}) =====\n`;
      prompt += analysisContextManager.formatAnalysisForPrompt(lastAnalysis);
      prompt += '\n';
      
      if (isRecent) {
        prompt += 'Note: This analysis is very recent. User may be asking about it.\n\n';
      }
    } else {
      prompt += `===== LAST ANALYSIS =====\nNo recent analysis available.\n\n`;
    }

    // Recent conversation
    if (recentHistory && recentHistory.length > 0) {
      prompt += '===== RECENT CONVERSATION =====\n';
      prompt += conversationManager.formatHistoryForPrompt(recentHistory);
      prompt += '\n\n';
    }

    // Instructions
    prompt += '===== YOUR TASK =====\n';
    prompt += `The user just sent: "${userMessage}"\n\n`;
    prompt += 'Respond naturally and helpfully based on the context above.\n\n';
    prompt += '⚠️ IMPORTANT: After your response, the system will AUTOMATICALLY resend the LAST buttons shown to the user.\n';
    prompt += `Current button state: ${currentState || 'Market selection (Forex/Gold buttons)'}\n`;
    prompt += 'This means you should reference these buttons naturally in your response.\n\n';
    prompt += 'Guidelines:\n';
    prompt += '- If user asks about the last analysis, reference specific details from it\n';
    prompt += '- Reference the buttons that will appear below your message appropriately\n';
    prompt += '- If user is at market selection, say "Click Forex or Gold below"\n';
    prompt += '- If user is at pair selection, say "Choose a pair from the buttons below"\n';
    prompt += '- If user is at strategy selection, say "Select Swing or Scalping below"\n';
    prompt += '- Keep responses concise (2-4 short paragraphs max)\n';
    prompt += '- Use emojis sparingly (1-2 max)\n';
    prompt += '- If discussing trades, include risk warning\n';
    prompt += '- If unsure, admit it and offer to help differently\n';
    prompt += '- End with a call-to-action that references the buttons appearing below\n';

    return prompt;
  }

  /**
   * Get AI response from OpenAI
   */
  async getAIResponse(contextPrompt, userMessage) {
    try {
      logger.info(`Sending request to OpenAI model: ${this.model}`);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: contextPrompt },
          { role: 'user', content: userMessage }
        ],
        max_completion_tokens: 1000
      });

      // Log response details for debugging
      logger.info(`OpenAI response received. Choices: ${response.choices?.length || 0}`);
      
      if (!response.choices || response.choices.length === 0) {
        logger.error('No choices in OpenAI response');
        throw new Error('No choices returned from OpenAI');
      }

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        logger.error('Empty content in OpenAI response:', JSON.stringify(response.choices[0]));
        throw new Error('Empty response from OpenAI');
      }

      const trimmedContent = content.trim();
      
      if (!trimmedContent) {
        logger.error('Content is only whitespace');
        throw new Error('Empty response from OpenAI (whitespace only)');
      }

      logger.info(`AI response length: ${trimmedContent.length} characters`);
      return trimmedContent;

    } catch (error) {
      logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  /**
   * Explain analysis to user (detailed)
   */
  async explainAnalysis(telegramId, userQuestion = null) {
    try {
      const lastAnalysis = await analysisContextManager.getLastAnalysisForUser(telegramId);
      
      if (!lastAnalysis) {
        return "I don't have a recent analysis to explain. Would you like to start a new analysis? Click the buttons above!";
      }

      const details = analysisContextManager.extractKeyDetails(lastAnalysis);
      const systemPrompt = await adminGuidelinesManager.buildSystemPrompt();
      const explanationGuideline = await adminGuidelinesManager.getGuideline('analysis_explanation');

      let prompt = systemPrompt + '\n\n';
      prompt += 'You are explaining a trading analysis to the user.\n\n';
      
      if (explanationGuideline) {
        prompt += 'EXPLANATION GUIDELINES:\n' + explanationGuideline.content + '\n\n';
      }

      prompt += 'ANALYSIS DETAILS:\n';
      prompt += `Reference: ${details.reference_key}\n`;
      prompt += `Pair: ${details.pair}\n`;
      prompt += `Strategy: ${details.strategy}\n`;
      prompt += `Signal: ${details.signal}\n`;
      prompt += `Valid: ${details.valid ? 'YES' : 'NO'}\n`;
      prompt += `Confidence: ${details.confidence ? (details.confidence * 100).toFixed(1) + '%' : 'N/A'}\n`;
      
      if (details.trend) prompt += `Trend: ${details.trend}\n`;
      if (details.pattern) prompt += `Pattern: ${details.pattern}\n`;
      if (details.zone) prompt += `Zone: ${details.zone.price_low} - ${details.zone.price_high}\n`;
      if (details.entry_price) prompt += `Entry: ${details.entry_price}\n`;
      if (details.stop_loss) prompt += `Stop Loss: ${details.stop_loss}\n`;
      if (details.take_profit) prompt += `Take Profit: ${details.take_profit}\n`;
      
      prompt += '\n';

      const question = userQuestion || 'Please explain this analysis in detail.';
      prompt += `USER QUESTION: "${question}"\n\n`;
      prompt += 'Provide a clear, educational explanation. Include risk warnings for trade-related info.';

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: question }
        ],
        max_completion_tokens: 1000
      });

      return response.choices[0].message.content.trim();

    } catch (error) {
      logger.error('Analysis explanation failed:', error);
      return 'I had trouble explaining that analysis. Please try asking more specifically, or start a new analysis!';
    }
  }

  /**
   * Get fallback response (when AI fails)
   */
  getFallbackResponse() {
    return `I had trouble understanding that. Here's what you can do:

• Use the buttons above to start a trading analysis
• Type /profile to see your statistics
• Type /help for more information

I'm here to help with trading analysis and questions!`;
  }

  /**
   * Generate greeting response
   */
  async generateGreeting(telegramId) {
    try {
      const greeting = await adminGuidelinesManager.getGreeting();
      return greeting;
    } catch (error) {
      logger.error('Greeting generation failed:', error);
      return await adminGuidelinesManager.getGreeting(); // Uses default
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey() {
    try {
      await this.openai.models.list();
      logger.success('✓ AI Responder: OpenAI API key is valid');
      return true;
    } catch (error) {
      logger.error('AI Responder: Invalid OpenAI API key:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const aiResponder = new AIResponder();
export default aiResponder;
