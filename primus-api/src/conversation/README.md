# Conversation Module

This module handles AI-powered text message responses for the Telegram bot.

## Components

### 1. conversationManager.js
- Tracks all messages between users and bot
- Manages session state (which button step user is on)
- Stores arbitrary context data
- Provides conversation history for AI context

### 2. analysisContext.js
- Links users to their analysis results
- Allows AI to reference specific analyses
- Formats analysis data for AI prompts
- Tracks recent analyses (last 30 mins)

### 3. aiResponder.js
- Main AI response generator
- Builds context-aware prompts for OpenAI
- Integrates conversation history, analysis context, and admin guidelines
- Generates natural, helpful responses

## Usage

```javascript
import conversationManager from './conversation/conversationManager.js';
import analysisContextManager from './conversation/analysisContext.js';
import aiResponder from './conversation/aiResponder.js';

// Save user message
await conversationManager.saveMessage(telegramId, 'user', userText);

// Generate AI response
const response = await aiResponder.respondToMessage(telegramId, userText);

// Save bot response
await conversationManager.saveMessage(telegramId, 'bot', response);

// Update state when button clicked
await conversationManager.updateState(telegramId, 'strategy');

// Save analysis for AI context
await analysisContextManager.saveAnalysisForUser(
  telegramId, 
  analysisId, 
  fullAnalysisResult
);
```

## Key Features

- **Context Awareness**: AI knows what analysis it sent, which button step user is on
- **Admin Guidelines**: AI behavior controlled by admin-configured prompts
- **Conversation History**: Recent messages provide context for responses
- **Fallback Handling**: Graceful degradation if AI fails
- **Performance**: Guidelines cached for 5 minutes

## Data Flow

```
User sends text message
    ↓
Load context (state, last analysis, history, guidelines)
    ↓
Build context-aware prompt
    ↓
Call OpenAI API
    ↓
Return AI response
    ↓
Save to conversation history
```
