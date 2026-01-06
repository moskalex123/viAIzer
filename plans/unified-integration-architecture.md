# Unified Integration Architecture: viAIzer + Text AI

## Executive Summary

This document outlines the technical architecture for integrating two AI-powered Telegram projects:
- **viAIzer**: Multi-modal AI bot (text, image editing, video generation)
- **Text AI**: Channel content improvement automation bot

**Goal**: Create a unified platform that leverages the strengths of both projects while maintaining their unique capabilities.

## Current State Analysis

### viAIzer (Current Project)
```
Strengths:
✅ Direct user interaction via Telegram
✅ Multi-modal AI (text, images, video)
✅ Multiple AI providers (OpenAI, OpenRouter, kie.ai)
✅ Premium subscription system
✅ In-memory session management

Limitations:
❌ No persistent storage for user data
❌ Limited to direct user interactions
❌ No automation/workflow capabilities
❌ батарейки currency isolated to this platform
```

### Text AI (Existing Project)
```
Strengths:
✅ Persistent PostgreSQL database
✅ Channel automation and monitoring
✅ Scheduled posting system
✅ 23 AI models available
✅ Payment integration (Telegram Stars)
✅ Background worker system
✅ Currency system (batteries)

Limitations:
❌ No direct image processing
❌ Limited to text improvement
❌ No multi-modal capabilities
❌ Batteries currency isolated to this platform
```

## Integration Vision

### Unified Platform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified User Portal                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  viAIzer Bot │  │  Text AI Bot │  │   Web UI     │   │
│  │  (Direct)    │  │ (Automation) │  │  (Dashboard) │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Unified API    │
                    │  Gateway        │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │   Users   │    │  Content  │    │ Payments  │
    │  Service  │    │  Service  │    │  Service  │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                   ┌────────▼────────┐
                   │  PostgreSQL DB  │
                   │  (Unified)      │
                   └─────────────────┘
```

## Unified User Management System

### User Entity Design

```sql
-- Unified users table
CREATE TABLE unified_users (
  id SERIAL PRIMARY KEY,
  
  -- Telegram Integration
  telegram_id BIGINT UNIQUE,
  telegram_username VARCHAR(255),
  telegram_first_name VARCHAR(255),
  telegram_last_name VARCHAR(255),
  phone_number VARCHAR(20),
  
  -- Platform-specific IDs
  viaizer_user_id INTEGER,  -- Links to viAIzer sessions
  text_ai_user_id INTEGER,   -- Links to Text AI users
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  is_newcomer BOOLEAN DEFAULT true,
  language_code VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Profile
  avatar_url TEXT,
  bio TEXT
);

-- Unified currency system
CREATE TABLE unified_currencies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES unified_users(id),
  
  -- Currency Types
  батарейки_balance DECIMAL(10, 2) DEFAULT 0,      -- viAIzer currency
  batteries_balance DECIMAL(10, 2) DEFAULT 0,   -- Text AI currency
  stars_balance DECIMAL(10, 2) DEFAULT 0,      -- Telegram Stars
  
  -- Conversion Rates (configurable)
  батарейки_to_batteries_rate DECIMAL(10, 4) DEFAULT 1.0,
  batteries_to_батарейки_rate DECIMAL(10, 4) DEFAULT 1.0,
  
  -- Usage Tracking
  total_батарейки_earned DECIMAL(10, 2) DEFAULT 0,
  total_batteries_earned DECIMAL(10, 2) DEFAULT 0,
  total_stars_purchased DECIMAL(10, 2) DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Unified subscription system
CREATE TABLE unified_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES unified_users(id),
  
  -- Subscription Details
  tier VARCHAR(50) NOT NULL,  -- FREE, PRO, ENTERPRISE
  status VARCHAR(50) NOT NULL, -- ACTIVE, EXPIRED, CANCELLED
  
  -- Platform-specific features
  viaizer_daily_limit INTEGER DEFAULT 25,
  text_ai_daily_limit INTEGER DEFAULT 100,
  viaizer_models_access TEXT[],  -- Array of model IDs
  text_ai_models_access TEXT[], -- Array of model IDs
  
  -- Dates
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT false,
  
  -- Payment
  payment_method VARCHAR(50),
  amount DECIMAL(10, 2),
  currency VARCHAR(10),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking across platforms
CREATE TABLE unified_usage_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES unified_users(id),
  
  -- Request Details
  platform VARCHAR(20) NOT NULL,  -- 'viaizer' or 'text_ai'
  feature VARCHAR(50) NOT NULL,    -- 'text', 'image', 'video', 'channel'
  model_id INTEGER,
  model_name VARCHAR(100),
  
  -- Resource Usage
  tokens_used INTEGER,
  cost_in_батарейки DECIMAL(10, 4),
  cost_in_batteries DECIMAL(10, 4),
  
  -- Metadata
  request_metadata JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cross-platform workflows
CREATE TABLE unified_workflows (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES unified_users(id),
  
  -- Workflow Definition
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_type VARCHAR(50),  -- 'image_to_caption', 'channel_automation', etc.
  
  -- Workflow Steps (JSON array)
  steps JSONB NOT NULL,
  -- Example: [
  --   { "platform": "viaizer", "action": "generate_image", "params": {...} },
  --   { "platform": "text_ai", "action": "improve_text", "params": {...} },
  --   { "platform": "text_ai", "action": "post_to_channel", "params": {...} }
  -- ]
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  trigger_type VARCHAR(50),  -- 'manual', 'schedule', 'webhook'
  trigger_config JSONB,
  
  -- Execution
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow execution history
CREATE TABLE unified_workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES unified_workflows(id),
  user_id INTEGER REFERENCES unified_users(id),
  
  -- Execution Details
  status VARCHAR(50) NOT NULL,  -- 'running', 'completed', 'failed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Results
  steps_executed JSONB,
  output_data JSONB,
  error_message TEXT,
  
  -- Cost
  total_cost_батарейки DECIMAL(10, 4),
  total_cost_batteries DECIMAL(10, 4)
);
```

### User Authentication Flow

```javascript
// Unified authentication service
class UnifiedAuthService {
  constructor(db) {
    this.db = db;
  }

  async authenticateUser(telegramId) {
    // Check if user exists
    let user = await this.db.query(
      'SELECT * FROM unified_users WHERE telegram_id = $1',
      [telegramId]
    );

    if (user.rows.length === 0) {
      // Create new user
      user = await this.db.query(`
        INSERT INTO unified_users (telegram_id, created_at)
        VALUES ($1, NOW())
        RETURNING *
      `, [telegramId]);

      // Initialize currency
      await this.db.query(`
        INSERT INTO unified_currencies (user_id, батарейки_balance, batteries_balance)
        VALUES ($1, 25, 100)
      `, [user.rows[0].id]);
    }

    return user.rows[0];
  }

  async linkPlatform(userId, platform, platformUserId) {
    if (platform === 'viaizer') {
      await this.db.query(`
        UPDATE unified_users
        SET viaizer_user_id = $1
        WHERE id = $2
      `, [platformUserId, userId]);
    } else if (platform === 'text_ai') {
      await this.db.query(`
        UPDATE unified_users
        SET text_ai_user_id = $1
        WHERE id = $2
      `, [platformUserId, userId]);
    }
  }

  async getUnifiedBalance(userId) {
    const result = await this.db.query(`
      SELECT батарейки_balance, batteries_balance, stars_balance
      FROM unified_currencies
      WHERE user_id = $1
    `, [userId]);

    return result.rows[0];
  }

  async convertCurrency(userId, fromCurrency, toCurrency, amount) {
    // Implement currency conversion logic
    // with proper rate validation and transaction logging
  }
}
```

## Database Schema Migration Plan

### Phase 1: Create Unified Tables
```sql
-- Create unified schema
CREATE SCHEMA IF NOT EXISTS unified;

-- Create unified tables (as defined above)
-- ...

-- Create indexes for performance
CREATE INDEX idx_unified_users_telegram ON unified_users(telegram_id);
CREATE INDEX idx_unified_currencies_user ON unified_currencies(user_id);
CREATE INDEX idx_unified_subscriptions_user ON unified_subscriptions(user_id);
CREATE INDEX idx_unified_usage_logs_user ON unified_usage_logs(user_id);
CREATE INDEX idx_unified_usage_logs_created ON unified_usage_logs(created_at);
```

### Phase 2: Migrate Existing Data
```sql
-- Migrate Text AI users to unified schema
INSERT INTO unified_users (
  telegram_id,
  telegram_username,
  phone_number,
  first_name,
  last_name,
  language_code,
  is_active,
  created_at,
  text_ai_user_id
)
SELECT 
  telegram_id,
  telegram_user_name,
  phone_number,
  first_name,
  last_name,
  language_code,
  is_active,
  created_at,
  id
FROM text_ai.users;

-- Migrate Text AI balances
INSERT INTO unified_currencies (user_id, batteries_balance)
SELECT 
  u.id,
  COALESCE(tai.balance, 0)
FROM unified_users u
JOIN text_ai.users tai ON u.text_ai_user_id = tai.id;
```

### Phase 3: Create Views for Backward Compatibility
```sql
-- Create view for Text AI compatibility
CREATE VIEW text_ai_users_view AS
SELECT 
  u.id,
  u.telegram_id,
  u.telegram_username AS telegram_user_name,
  u.phone_number,
  c.batteries_balance AS balance,
  u.language_code,
  u.created_at,
  u.is_active
FROM unified_users u
JOIN unified_currencies c ON u.id = c.user_id
WHERE u.text_ai_user_id IS NOT NULL;
```

## API Integration Points

### Unified API Gateway

```javascript
// Unified API Gateway
class UnifiedAPIGateway {
  constructor() {
    this.viaizerAPI = new ViaizerAPI();
    this.textAIAPI = new TextAIAPI();
    this.authService = new UnifiedAuthService(db);
  }

  // Cross-platform workflow execution
  async executeWorkflow(userId, workflowId) {
    const workflow = await this.getWorkflow(workflowId);
    const execution = await this.createExecution(workflowId, userId);

    try {
      const results = [];
      for (const step of workflow.steps) {
        const result = await this.executeStep(step, userId);
        results.push(result);
      }

      await this.completeExecution(execution.id, 'completed', results);
      return results;
    } catch (error) {
      await this.completeExecution(execution.id, 'failed', null, error);
      throw error;
    }
  }

  async executeStep(step, userId) {
    switch (step.platform) {
      case 'viaizer':
        return await this.viaizerAPI.execute(step.action, step.params, userId);
      case 'text_ai':
        return await this.textAIAPI.execute(step.action, step.params, userId);
      default:
        throw new Error(`Unknown platform: ${step.platform}`);
    }
  }

  // Image to caption workflow
  async imageToCaptionWorkflow(userId, imageUrl, targetChannel) {
    const workflow = {
      steps: [
        {
          platform: 'viaizer',
          action: 'analyze_image',
          params: { imageUrl }
        },
        {
          platform: 'text_ai',
          action: 'improve_text',
          params: { 
            text: '${viaizer_result.description}',
            model: 'gemma-3-27b-it'
          }
        },
        {
          platform: 'text_ai',
          action: 'post_to_channel',
          params: { 
            channel: targetChannel,
            content: '${text_ai_result.improved_text}'
          }
        }
      ]
    };

    return await this.executeWorkflow(userId, workflow);
  }
}
```

### viAIzer API Extensions

```javascript
// Extend viAIzer bot with unified features
class ViAIzerBotExtended extends ViAIzerBot {
  constructor() {
    super();
    this.unifiedAPI = new UnifiedAPIGateway();
  }

  // New command: Generate image and post to channel
  async handleGenerateAndPost(msg) {
    const userId = msg.from.id;
    const session = this.getUserSession(userId);

    // Get image from user
    const imageUrl = await this.getImageFromMessage(msg);

    // Analyze image
    const analysis = await this.analyzeImage(imageUrl);

    // Improve text using Text AI
    const improvedText = await this.unifiedAPI.textAIAPI.improveText(
      analysis.description,
      userId
    );

    // Ask for target channel
    await this.bot.sendMessage(
      msg.chat.id,
      `Image analyzed! Improved text:\n\n${improvedText}\n\n` +
      `Which channel should I post to?`
    );
  }

  // New command: Check unified balance
  async handleUnifiedBalance(msg) {
    const userId = msg.from.id;
    const balance = await this.unifiedAPI.getUnifiedBalance(userId);

    await this.bot.sendMessage(
      msg.chat.id,
      `💰 Unified Balance:\n\n` +
      `🔋 батарейки: ${balance.батарейки_balance}\n` +
      `🔋 Batteries: ${balance.batteries_balance}\n` +
      `⭐ Stars: ${balance.stars_balance}`
    );
  }
}
```

### Text AI API Extensions

```javascript
// Extend Text AI with viAIzer features
class TextAIExtended {
  constructor() {
    this.viaizerAPI = new ViaizerAPI();
  }

  // New feature: Generate image for channel post
  async generateImageForPost(userId, prompt, channelPairId) {
    // Generate image using viAIzer
    const imageResult = await this.viaizerAPI.generateImage(prompt, userId);

    // Improve caption using Text AI
    const caption = await this.improveText(
      `Caption for image: ${prompt}`,
      userId,
      channelPairId
    );

    // Schedule post
    await this.schedulePost({
      userId,
      channelPairId,
      content: caption,
      mediaPath: imageResult.imagePath,
      mediaType: 'photo'
    });

    return { imageResult, caption };
  }

  // New feature: Multi-modal content improvement
  async improveMultiModalContent(userId, imageUrl, text) {
    // Analyze image
    const imageAnalysis = await this.viaizerAPI.analyzeImage(imageUrl, userId);

    // Combine image analysis with text
    const combinedPrompt = `
      Image analysis: ${imageAnalysis.description}
      Original text: ${text}
      
      Create an improved version that incorporates visual elements.
    `;

    // Improve combined content
    const improved = await this.improveText(combinedPrompt, userId);

    return improved;
  }
}
```

## Unified Subscription System

### Subscription Tiers

```javascript
const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    viaizer: {
      dailyLimit: 25,
      models: ['chatgpt-3.5-turbo']
    },
    text_ai: {
      dailyLimit: 100,
      models: ['mistral-small-3.2-24b-instruct']
    },
    price: 0,
    currency: 'USD'
  },
  PRO: {
    name: 'Pro',
    viaizer: {
      dailyLimit: 1000,
      models: ['*']  // All models
    },
    text_ai: {
      dailyLimit: 1000,
      models: ['*']  // All models
    },
    price: 9.99,
    currency: 'USD'
  },
  ENTERPRISE: {
    name: 'Enterprise',
    viaizer: {
      dailyLimit: -1,  // Unlimited
      models: ['*']
    },
    text_ai: {
      dailyLimit: -1,  // Unlimited
      models: ['*']
    },
    price: 99.99,
    currency: 'USD'
  }
};
```

### Subscription Service

```javascript
class UnifiedSubscriptionService {
  constructor(db) {
    this.db = db;
  }

  async upgradeSubscription(userId, tier, paymentMethod) {
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    
    // Create subscription
    const subscription = await this.db.query(`
      INSERT INTO unified_subscriptions (
        user_id, tier, status,
        viaizer_daily_limit, text_ai_daily_limit,
        viaizer_models_access, text_ai_models_access,
        start_date, end_date, payment_method, amount, currency
      ) VALUES ($1, $2, 'ACTIVE', $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days', $7, $8, $9)
      RETURNING *
    `, [
      userId,
      tier,
      tierConfig.viaizer.dailyLimit,
      tierConfig.text_ai.dailyLimit,
      tierConfig.viaizer.models,
      tierConfig.text_ai.models,
      paymentMethod,
      tierConfig.price,
      tierConfig.currency
    ]);

    return subscription.rows[0];
  }

  async checkUsageLimit(userId, platform, feature) {
    const subscription = await this.getActiveSubscription(userId);
    const today = new Date().toDateString();

    // Count today's usage
    const usage = await this.db.query(`
      SELECT COUNT(*) as count
      FROM unified_usage_logs
      WHERE user_id = $1
        AND platform = $2
        AND DATE(created_at) = $3
    `, [userId, platform, today]);

    const limit = platform === 'viaizer' 
      ? subscription.viaizer_daily_limit
      : subscription.text_ai_daily_limit;

    return {
      used: usage.rows[0].count,
      limit: limit,
      remaining: limit === -1 ? -1 : limit - usage.rows[0].count
    };
  }
}
```

## Cross-Platform Workflows

### Workflow Templates

```javascript
const WORKFLOW_TEMPLATES = {
  image_to_caption: {
    name: 'Image to Caption',
    description: 'Generate image, create caption, post to channel',
    steps: [
      {
        platform: 'viaizer',
        action: 'generate_image',
        params: { prompt: '${user_input}' }
      },
      {
        platform: 'text_ai',
        action: 'improve_text',
        params: { 
          text: 'Create a caption for this image: ${viaizer_result.description}',
          model: 'gemma-3-27b-it'
        }
      },
      {
        platform: 'text_ai',
        action: 'post_to_channel',
        params: {
          channel: '${user_channel}',
          content: '${text_ai_result.improved_text}',
          image: '${viaizer_result.image_url}'
        }
      }
    ]
  },
  
  channel_automation_with_images: {
    name: 'Channel Automation with Images',
    description: 'Monitor channel, improve content, generate images, repost',
    steps: [
      {
        platform: 'text_ai',
        action: 'monitor_channel',
        params: { channel: '${source_channel}' }
      },
      {
        platform: 'text_ai',
        action: 'improve_text',
        params: { text: '${text_ai_result.original_text}' }
      },
      {
        platform: 'viaizer',
        action: 'generate_image',
        params: { prompt: '${text_ai_result.improved_text}' }
      },
      {
        platform: 'text_ai',
        action: 'post_to_channel',
        params: {
          channel: '${target_channel}',
          content: '${text_ai_result.improved_text}',
          image: '${viaizer_result.image_url}'
        }
      }
    ]
  }
};
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create unified database schema
- [ ] Set up unified API gateway
- [ ] Implement unified authentication service
- [ ] Create migration scripts for existing data
- [ ] Set up development environment

### Phase 2: Core Integration (Week 3-4)
- [ ] Implement unified user management
- [ ] Create unified currency system
- [ ] Build unified subscription service
- [ ] Implement usage tracking
- [ ] Create API endpoints for both platforms

### Phase 3: Cross-Platform Features (Week 5-6)
- [ ] Implement workflow engine
- [ ] Create workflow templates
- [ ] Build cross-platform API calls
- [ ] Implement workflow execution service
- [ ] Create workflow management UI

### Phase 4: Testing & Optimization (Week 7-8)
- [ ] Unit testing for all services
- [ ] Integration testing across platforms
- [ ] Load testing for unified API
- [ ] Performance optimization
- [ ] Security audit

### Phase 5: Deployment (Week 9-10)
- [ ] Staging environment setup
- [ ] Data migration to production
- [ ] Gradual rollout strategy
- [ ] Monitoring and alerting setup
- [ ] Documentation completion

## Success Metrics

### User Engagement
- Cross-platform user adoption: Target 30% within 3 months
- Daily active users: Increase by 50%
- Session duration: Increase by 40%
- Workflow usage: 100+ workflows created in first month

### Business Impact
- Premium subscriptions: Increase by 40%
- Average revenue per user: Increase by 35%
- Customer acquisition cost: Decrease by 20%
- Customer satisfaction: NPS > 50

### Technical Performance
- API response time: < 500ms (p95)
- System uptime: 99.9%
- Database query optimization: 50% improvement
- Successful migration: < 1% data loss

## Security Considerations

### Authentication & Authorization
- JWT tokens for API authentication
- Role-based access control
- Platform-specific permissions
- Session management

### Data Protection
- Encryption at rest
- Encryption in transit
- GDPR compliance
- Data retention policies

### API Security
- Rate limiting per platform
- Request validation
- SQL injection prevention
- XSS protection

## Monitoring & Logging

### Metrics to Track
```javascript
const MONITORING_METRICS = {
  // User metrics
  'users.total': 'Total number of users',
  'users.active_daily': 'Daily active users',
  'users.cross_platform': 'Users using both platforms',
  
  // Usage metrics
  'requests.total': 'Total API requests',
  'requests.viaizer': 'viAIzer requests',
  'requests.text_ai': 'Text AI requests',
  'requests.cross_platform': 'Cross-platform requests',
  
  // Performance metrics
  'api.response_time': 'API response time',
  'database.query_time': 'Database query time',
  'workflow.execution_time': 'Workflow execution time',
  
  // Business metrics
  'subscriptions.active': 'Active subscriptions',
  'revenue.total': 'Total revenue',
  'currency.conversions': 'Currency conversions',
  
  // Error metrics
  'errors.total': 'Total errors',
  'errors.api': 'API errors',
  'errors.database': 'Database errors',
  'errors.workflow': 'Workflow errors'
};
```

## Conclusion

This unified architecture provides a solid foundation for integrating viAIzer and Text AI while preserving their unique strengths. The modular design allows for gradual implementation and future extensibility.

**Key Benefits:**
- ✅ Unified user experience across platforms
- ✅ Shared resources and economies of scale
- ✅ Cross-platform workflows and automation
- ✅ Simplified billing and subscription management
- ✅ Comprehensive analytics and insights
- ✅ Scalable and maintainable architecture

---

**Document Version**: 1.0
**Last Updated**: 2026-01-06
**Status**: Ready for Implementation
