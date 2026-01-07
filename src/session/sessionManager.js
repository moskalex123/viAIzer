import userManager from '../db/userManager.js';

class SessionManager {
  constructor() {
    this.sessions = new Map(); // In-memory session storage
  }

  // Get or create user session
  async getSession(telegramUser) {
    const telegramId = telegramUser.id;
    
    // Check if session exists in memory
    if (!this.sessions.has(telegramId)) {
      // Fetch user from database
      const dbUser = await userManager.getUserByTelegramId(telegramId);
      
      if (!dbUser) {
        // Create new user in database
        const newUser = await userManager.createUser(telegramUser);
        
        if (!newUser) {
          // Fallback: create session without database
          console.warn('⚠️ Using fallback session for new user');
          return this.createFallbackSession(telegramUser);
        }
        
        // Create session with new user data
        this.sessions.set(telegramId, this.createSessionFromDB(newUser));
      } else {
        // Create session with existing user data
        this.sessions.set(telegramId, this.createSessionFromDB(dbUser));
      }
    }
    
    // Reset daily requests if it's a new day
    const session = this.sessions.get(telegramId);
    const today = new Date().toDateString();
    
    if (session.lastRequestDate !== today) {
      session.dailyRequests = 0;
      session.lastRequestDate = today;
    }
    
    return session;
  }

  // Create session object from database user
  createSessionFromDB(dbUser) {
    const subscription = userManager.getSubscriptionType(dbUser.vip_level);
    
    return {
      id: dbUser.telegram_id,
      dbId: dbUser.id,
      username: dbUser.username,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      mode: null,
      language: dbUser.language_code || 'ru',
      registrationDate: new Date(dbUser.created_at),
      dailyRequests: 0,
      lastRequestDate: new Date().toDateString(),
      subscription: subscription,
      balance: dbUser.balance,
      vipLevel: dbUser.vip_level,
      isNewcomer: dbUser.is_newcomer,
      conversationHistory: []
    };
  }

  // Create fallback session when database is unavailable
  createFallbackSession(telegramUser) {
    return {
      id: telegramUser.id,
      dbId: null,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      mode: null,
      language: telegramUser.language_code || 'ru',
      registrationDate: new Date(),
      dailyRequests: 0,
      lastRequestDate: new Date().toDateString(),
      subscription: 'FREE',
      balance: 0.0,
      vipLevel: 0,
      isNewcomer: true,
      conversationHistory: [],
      isFallback: true // Flag to indicate this is a fallback session
    };
  }

  // Update session mode
  updateMode(telegramId, mode) {
    if (this.sessions.has(telegramId)) {
      this.sessions.get(telegramId).mode = mode;
    }
  }

  // Update session language
  async updateLanguage(telegramId, language) {
    if (this.sessions.has(telegramId)) {
      const session = this.sessions.get(telegramId);
      session.language = language;
      
      // Update in database if not fallback
      if (!session.isFallback) {
        await userManager.updateLanguage(telegramId, language);
      }
    }
  }

  // Increment daily requests
  incrementDailyRequests(telegramId) {
    if (this.sessions.has(telegramId)) {
      this.sessions.get(telegramId).dailyRequests++;
    }
  }

  // Update balance from database
  async refreshBalance(telegramId) {
    const session = this.sessions.get(telegramId);
    
    if (session && !session.isFallback) {
      const dbUser = await userManager.getUserByTelegramId(telegramId);
      if (dbUser) {
        session.balance = dbUser.balance;
        session.vipLevel = dbUser.vip_level;
        session.subscription = userManager.getSubscriptionType(dbUser.vip_level);
      }
    }
  }

  // Clear conversation history
  clearConversationHistory(telegramId) {
    if (this.sessions.has(telegramId)) {
      this.sessions.get(telegramId).conversationHistory = [];
    }
  }

  // Add message to conversation history
  addToConversationHistory(telegramId, message) {
    if (this.sessions.has(telegramId)) {
      const session = this.sessions.get(telegramId);
      session.conversationHistory.push(message);
      
      // Limit history size
      const maxHistory = 50;
      if (session.conversationHistory.length > maxHistory) {
        session.conversationHistory = session.conversationHistory.slice(-maxHistory);
      }
    }
  }

  // Get all active sessions (for monitoring)
  getActiveSessions() {
    return Array.from(this.sessions.values());
  }

  // Get session count
  getSessionCount() {
    return this.sessions.size;
  }

  // Check if session exists
  hasSession(telegramId) {
    return this.sessions.has(telegramId);
  }

  // Remove session (for cleanup)
  removeSession(telegramId) {
    this.sessions.delete(telegramId);
  }
}

export default new SessionManager();
