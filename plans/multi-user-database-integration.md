# Multi-User Database Integration Plan

## Overview

Implement multi-user support for the Telegram bot by integrating with the external PostgreSQL database. The bot will use the shared `users` table for user authentication and balance management while maintaining bot-specific session data separately.

## Architecture Design

### Data Separation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Bot (viAIzer)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  External PostgreSQL Database (taigerdb)            │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  users table (SHARED across services)        │  │   │
│  │  │  - id, telegram_id, telegram_user_name      │  │   │
│  │  │  - balance, VIP_level, is_active              │  │   │
│  │  │  - language_code, first_name, last_name      │  │   │
│  │  │  - created_at, is_newcomer                   │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Bot-Specific Session Data (In-Memory/Redis)        │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  User Sessions (per bot instance)          │  │   │
│  │  │  - telegram_id (key)                        │  │   │
│  │  │  - mode (ChatGPT, Nano Banana, etc.)        │  │   │
│  │  │  - conversationHistory[]                    │  │   │
│  │  │  - dailyRequests, lastRequestDate           │  │   │
│  │  │  - subscription (derived from VIP_level)    │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Shared User Identity**: Use `telegram_id` as the unique identifier across both services
2. **Shared Balance**: Balance is stored in external DB and shared between services
3. **Separate Session Data**: Bot-specific data (mode, conversation history) stays local
4. **Graceful Degradation**: Bot works with in-memory fallback if DB is unavailable
5. **Minimal DB Schema Changes**: Use existing `users` table structure

## Implementation Plan

### Phase 1: Database Connection Module

**File**: `src/db/connection.js`

Create a robust PostgreSQL connection module with:

```javascript
// GRACE: Database connection with retry logic and error handling
import pg from 'pg';
const { Pool } = pg;

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  async connect(config) {
    try {
      this.pool = new Pool({
        user: config.user,
        host: config.host,
        database: config.database,
        password: config.password,
        port: config.port,
        max: 20, // Maximum pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      this.isConnected = false;
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying connection (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect(config);
      }
      
      return false;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Database disconnected');
    }
  }

  getPool() {
    return this.pool;
  }

  isAvailable() {
    return this.isConnected && this.pool !== null;
  }
}

export default new DatabaseConnection();
```

### Phase 2: User Management Module

**File**: `src/db/userManager.js`

Create user CRUD operations:

```javascript
// GRACE: User management with database operations
import dbConnection from './connection.js';

class UserManager {
  constructor() {
    this.db = dbConnection;
  }

  // Get user by telegram_id
  async getUserByTelegramId(telegramId) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, returning null');
      return null;
    }

    try {
      const query = `
        SELECT 
          id, telegram_id, telegram_user_name, 
          balance, VIP_level, is_active, 
          language_code, first_name, last_name,
          created_at, is_newcomer, username
        FROM users 
        WHERE telegram_id = $1
      `;
      
      const result = await this.db.getPool().query(query, [telegramId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error fetching user:', error.message);
      return null;
    }
  }

  // Create new user
  async createUser(telegramUser) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, cannot create user');
      return null;
    }

    try {
      const query = `
        INSERT INTO users (
          telegram_id, 
          telegram_user_name, 
          username,
          first_name, 
          last_name, 
          language_code,
          balance,
          VIP_level,
          is_active,
          is_newcomer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        telegramUser.id,
        telegramUser.username || null,
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.language_code || 'ru',
        0.0, // Initial balance
        0,   // VIP level (0 = regular)
        true, // is_active
        true  // is_newcomer
      ];

      const result = await this.db.getPool().query(query, values);
      console.log(`✅ Created new user: ${telegramUser.id}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating user:', error.message);
      return null;
    }
  }

  // Update user balance
  async updateBalance(telegramId, amount) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, cannot update balance');
      return false;
    }

    try {
      const query = `
        UPDATE users 
        SET balance = balance + $1
        WHERE telegram_id = $2
        RETURNING balance
      `;
      
      const result = await this.db.getPool().query(query, [amount, telegramId]);
      
      if (result.rows.length > 0) {
        console.log(`💰 Updated balance for user ${telegramId}: ${result.rows[0].balance}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error updating balance:', error.message);
      return false;
    }
  }

  // Update user language
  async updateLanguage(telegramId, languageCode) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, cannot update language');
      return false;
    }

    try {
      const query = `
        UPDATE users 
        SET language_code = $1
        WHERE telegram_id = $2
      `;
      
      await this.db.getPool().query(query, [languageCode, telegramId]);
      console.log(`🌐 Updated language for user ${telegramId}: ${languageCode}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating language:', error.message);
      return false;
    }
  }

  // Get user subscription type based on VIP_level
  getSubscriptionType(vipLevel) {
    return vipLevel > 0 ? 'PREMIUM' : 'FREE';
  }

  // Get daily request limit based on subscription
  getDailyLimit(subscription) {
    return subscription === 'PREMIUM' ? 1000 : 25;
  }
}

export default new UserManager();
```

### Phase 3: Session Management Module

**File**: `src/session/sessionManager.js`

Create session management that combines DB data with bot-specific data:

```javascript
// GRACE: Session management combining database and in-memory data
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

  // Get all active sessions (for monitoring)
  getActiveSessions() {
    return Array.from(this.sessions.values());
  }

  // Get session count
  getSessionCount() {
    return this.sessions.size;
  }
}

export default new SessionManager();
```

### Phase 4: Environment Configuration

**File**: `.env.example` (update)

Add database configuration:

```bash
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# PostgreSQL Database Configuration
DB_ENABLED=true
DB_HOST=94.141.161.21
DB_PORT=5433
DB_NAME=taigerdb
DB_USER=taiger
DB_PASSWORD=your_db_password_here

# OpenRouter Configuration
OPENROUTER=false
OPENROUTER_API_KEY=your_openrouter_api_key_here
NANO_OPENROUTER_MODEL_NAME=google/gemini-2.5-flash-image

# kie.ai Configuration
KIE_AI_ENABLED=true
KIE_AI_API_KEY=your_kie_ai_api_key_here
KIE_AI_POLL_INTERVAL=2000
KIE_AI_MAX_WAIT_TIME=120000

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here
NANO_API_KEY=your_nano_api_key_here
SORA_API_KEY=your_sora_api_key_here

# Server Configuration
NODE_ENV=development
PORT=3000
WEBHOOK_URL=

# Bot Settings
DEFAULT_LANGUAGE=ru
MAX_HISTORY_LENGTH=50
RESPONSE_TIMEOUT=30000
MAX_DAILY_REQUESTS_FREE=25
MAX_DAILY_REQUESTS_PREMIUM=1000
```

### Phase 5: Refactor Bot.js

**Key Changes in `bot.js`**:

1. **Import new modules**:
```javascript
import dbConnection from './src/db/connection.js';
import userManager from './src/db/userManager.js';
import sessionManager from './src/session/sessionManager.js';
```

2. **Initialize database on startup**:
```javascript
async initializeBot() {
  console.log('🤖 Initializing Gemini Bot Copy...');
  
  // Connect to database
  if (process.env.DB_ENABLED === 'true') {
    const dbConfig = {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT) || 5432
    };
    
    await dbConnection.connect(dbConfig);
    
    if (!dbConnection.isAvailable()) {
      console.warn('⚠️ Database unavailable, running in fallback mode');
    }
  } else {
    console.log('⚠️ Database disabled, running in memory-only mode');
  }
  
  // ... rest of initialization
}
```

3. **Replace `getUserSession` with `sessionManager.getSession`**:
```javascript
// OLD CODE (remove):
getUserSession(userId) {
  if (!this.userSessions.has(userId)) {
    this.userSessions.set(userId, {
      id: userId,
      mode: null,
      language: 'ru',
      // ... other fields
    });
  }
  return this.userSessions.get(userId);
}

// NEW CODE:
async getUserSession(telegramUser) {
  return await sessionManager.getSession(telegramUser);
}
```

4. **Update all command handlers** to use `await`:
```javascript
async handleStart(msg) {
  const chatId = msg.chat.id;
  const session = await this.getUserSession(msg.from); // Changed
  
  const welcomeText = this.getLocalizedText('welcome', session.language);
  
  await this.bot.sendMessage(chatId, welcomeText, {
    reply_markup: this.getMainMenuKeyboard()
  });
}
```

5. **Update profile display** to show database fields:
```javascript
generateProfileText(session) {
  const today = new Date().toDateString();
  const isNewDay = session.lastRequestDate !== today;
  const currentRequests = isNewDay ? 0 : session.dailyRequests;
  const maxRequests = userManager.getDailyLimit(session.subscription);
  
  return `<b>👤 Профиль ${session.id}</b>

📅 Дата регистрации: ${session.registrationDate.toLocaleDateString('ru-RU')}
🔑 Ключ: ${session.subscription}
🧪 ${session.subscription} запросов сегодня: ${currentRequests}/${maxRequests}
💰 Баланс: ${session.balance.toFixed(1)} 🔋
🎟️ Подписка: ${session.subscription}
📅 Дата окончания: никогда
🆔 Уникальный ID: ${session.id}
${session.isFallback ? '⚠️ Оффлайн-режим (база данных недоступна)' : ''}`;
}
```

6. **Update language selection** to persist to database:
```javascript
async setUserLanguage(chatId, session, lang) {
  console.log(`🌐 Setting user language to: ${lang}`);
  
  session.language = lang;
  await sessionManager.updateLanguage(session.id, lang);
  
  const text = this.getLocalizedText('language_selected', session.language)
    .replace('{lang}', lang);
  
  await this.bot.sendMessage(chatId, text);
}
```

### Phase 6: Error Handling and Fallback

**Key Fallback Scenarios**:

1. **Database Connection Failed**:
   - Use in-memory sessions only
   - Log warning messages
   - Continue bot operation
   - Show fallback indicator in profile

2. **User Not Found in Database**:
   - Create new user in database
   - If creation fails, use fallback session
   - Mark session as `isFallback: true`

3. **Database Query Failed**:
   - Use cached session data
   - Log error
   - Continue operation

4. **Balance Update Failed**:
   - Keep balance in session
   - Log error
   - Retry on next operation

### Phase 7: Testing Strategy

**Test Cases**:

1. **Database Connection Test**:
   ```javascript
   // test-db-integration.js
   import dbConnection from './src/db/connection.js';
   
   const config = {
     user: 'taiger',
     host: '94.141.161.21',
     database: 'taigerdb',
     password: 'Pp969291',
     port: 5433
   };
   
   const connected = await dbConnection.connect(config);
   console.log('Connection result:', connected);
   ```

2. **User CRUD Test**:
   ```javascript
   import userManager from './src/db/userManager.js';
   
   // Create user
   const newUser = await userManager.createUser({
     id: 123456789,
     username: 'testuser',
     first_name: 'Test',
     last_name: 'User',
     language_code: 'ru'
   });
   
   // Get user
   const user = await userManager.getUserByTelegramId(123456789);
   
   // Update balance
   await userManager.updateBalance(123456789, 100);
   ```

3. **Session Management Test**:
   ```javascript
   import sessionManager from './src/session/sessionManager.js';
   
   const session = await sessionManager.getSession({
     id: 123456789,
     username: 'testuser',
     first_name: 'Test',
     language_code: 'ru'
   });
   
   console.log('Session:', session);
   ```

4. **Bot Integration Test**:
   - Start bot with database connected
   - Send `/start` command
   - Check user created in database
   - Send `/profile` command
   - Verify balance and subscription displayed
   - Change language
   - Verify language updated in database

### Phase 8: Documentation Updates

**Files to Update**:

1. **README.md**:
   - Add database configuration section
   - Update setup instructions
   - Add troubleshooting section

2. **DEPLOYMENT.md**:
   - Add database setup steps
   - Update environment variables
   - Add migration instructions

3. **Create DATABASE_SETUP.md**:
   - Database schema reference
   - Connection troubleshooting
   - Backup and restore procedures

## Migration Strategy

### Step 1: Prepare Codebase
- Create new modules in `src/` directory
- Update `.env.example`
- Keep existing `bot.js` functional

### Step 2: Test in Development
- Run bot with database connection
- Test all user flows
- Verify fallback behavior

### Step 3: Deploy to Production
- Update environment variables on VPS
- Restart bot
- Monitor logs for errors

### Step 4: Monitor and Optimize
- Monitor database connection pool
- Track query performance
- Optimize slow queries if needed

## Benefits

1. **Multi-User Support**: Each user has isolated session and balance
2. **Shared Balance**: Balance works across both services
3. **Persistent Data**: User data survives bot restarts
4. **Scalability**: Can handle multiple bot instances
5. **Graceful Degradation**: Bot works even if database is down
6. **User Recognition**: Users recognized by both services
7. **Minimal Changes**: Uses existing database schema
8. **Easy Maintenance**: Clear separation of concerns

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Database connection failure | In-memory fallback mode |
| Slow database queries | Connection pooling, query optimization |
| Concurrent access issues | Proper transaction handling |
| Data inconsistency | Regular sync checks, validation |
| Bot downtime during migration | Gradual rollout, rollback plan |

## Success Criteria

- ✅ Bot starts successfully with database connection
- ✅ New users are created in database
- ✅ Existing users are recognized
- ✅ Balance is shared between services
- ✅ Bot works in fallback mode when DB is down
- ✅ All existing features work as before
- ✅ No data loss during migration
- ✅ Performance is not degraded

## Timeline

- **Phase 1-2**: Database modules (2-3 hours)
- **Phase 3**: Session management (1-2 hours)
- **Phase 4**: Configuration (30 minutes)
- **Phase 5**: Bot refactoring (3-4 hours)
- **Phase 6**: Error handling (1-2 hours)
- **Phase 7**: Testing (2-3 hours)
- **Phase 8**: Documentation (1-2 hours)

**Total Estimated Time**: 10-17 hours

---

**Created**: 2026-01-07
**Status**: Ready for implementation
**Next Step**: Switch to Code mode to implement
