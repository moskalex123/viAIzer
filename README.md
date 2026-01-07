# 🤖 Gemini Bot Copy

A complete working copy of @geminitelegrambot with multi-AI model support, premium features, bilingual interface, and multi-user database integration.

## ✨ Features

### 🤖 AI Models
- **ChatGPT** - OpenAI GPT-4 integration for general conversations
- **Nano Banana** - Fast lightweight model for quick responses
- **Sora 2** - Video generation capabilities (simulated)

### 👤 User Management
- Multi-user support with PostgreSQL database integration
- User profiles with detailed statistics
- Shared balance across ecosystem services
- Daily request limits (FREE: 25/day, PREMIUM: 1000/day)
- Subscription system with батарейки currency
- Conversation history tracking
- Graceful fallback to in-memory sessions

### 🌍 Languages
- Russian (primary)
- English (secondary)
- Extensible for more languages

### 💎 Premium Features
- Increased daily limits
- Priority processing
- Access to all AI models
- Extended functionality

## 🚀 Quick Start

### 1. Get Bot Token
1. Message @BotFather on Telegram
2. Create a new bot: `/newbot`
3. Save your bot token

### 2. Setup Environment
```bash
cd gemini-bot-copy
cp .env.example .env
# Edit .env with your credentials
```

### 3. Configure Database (Optional)
The bot can work with an external PostgreSQL database for multi-user support:
```env
DB_ENABLED=true
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

If database is not configured or unavailable, the bot will use in-memory sessions (fallback mode).

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Bot
```bash
npm start
```

### 6. Test Database Connection (Optional)
```bash
node test-multi-user-integration.js
```

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and menu |
| `/menu` | Show main menu |
| `/profile` | User profile and statistics |
| `/info` | Bot information |
| `/newdialogue` | Clear conversation history |
| `/help` | Help and support |

## 🔘 Interactive Features

### Main Menu Buttons
- 👤 **Профиль** - View your profile
- 🖋 **Текст** - Text processing mode
- 🎨 **Дизайн** - Design/image generation mode
- ⚙️ **Выбрать нейросеть** - Select AI model
- 💰 **Премиум-услуги** - Premium services

### Mode Selection
Users must select an AI model before interaction:
- ChatGPT for general conversations
- Nano Banana for fast responses
- Sora 2 for video generation

## 🛠️ Configuration

### Environment Variables
```env
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
DEFAULT_LANGUAGE=ru
MAX_DAILY_REQUESTS_FREE=25
MAX_DAILY_REQUESTS_PREMIUM=1000

# Database Configuration (Optional)
DB_ENABLED=true
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

### Database Integration
The bot supports integration with external PostgreSQL databases for multi-user scenarios:

**Features:**
- User data stored in shared database
- Balance synchronization across services
- VIP level and subscription management
- Language preference persistence
- Automatic user creation on first interaction
- Graceful fallback when database unavailable

**Database Schema:**
The bot expects a `users` table with the following structure:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_user_name VARCHAR(255),
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'ru',
  balance DECIMAL(10, 2) DEFAULT 0.00,
  VIP_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_newcomer BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fallback Mode:**
If database connection fails or is not configured, the bot automatically switches to in-memory session storage. Users can still use all features, but data won't persist across restarts.

### Customization
- Add new AI models in `config.modes`
- Modify daily limits in configuration
- Add languages in `getLocalizedText()`
- Customize premium features
- Extend database schema in `src/db/userManager.js`

## 📈 Deployment

### Production Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Monitoring
- Health check endpoint available
- Comprehensive logging
- Error tracking and reporting

## 🔧 Development

### Project Structure
```
gemini-bot-copy/
├── bot.js               # Main bot implementation
├── src/
│   ├── db/
│   │   ├── connection.js    # Database connection management
│   │   └── userManager.js   # User CRUD operations
│   └── session/
│       └── sessionManager.js # Session management (DB + memory)
├── package.json         # Dependencies and scripts
├── .env.example         # Environment configuration
├── test-multi-user-integration.js # Database integration tests
├── DEPLOYMENT.md        # Deployment guide
└── README.md           # This file
```

### Adding Features
1. New AI models: Add to `config.modes` and create response generator
2. New languages: Add to `getLocalizedText()` function
3. New commands: Add command handler in `initializeBot()`
4. Premium features: Extend subscription system
5. Database fields: Update `userManager.js` and session schema

## 🆘 Troubleshooting

### Common Issues
1. **Bot not responding** - Check bot token and network connectivity
2. **OpenAI API errors** - Verify API key and quota
3. **Database connection failed** - Check DB credentials and network
4. **Fallback mode active** - Database unavailable, using in-memory sessions
5. **Memory issues** - Implement session cleanup
6. **Rate limiting** - Check Telegram API limits

### Database Issues
- **Connection timeout**: Verify DB_HOST and DB_PORT
- **Authentication failed**: Check DB_USER and DB_PASSWORD
- **Table not found**: Ensure `users` table exists in database
- **Permission denied**: Verify database user has required permissions

### Debug Mode
Enable debug logging:
```bash
DEBUG=telegram-bot-api node bot.js
```

## 📞 Support

For issues and questions:
1. Check the logs for error messages
2. Verify environment configuration
3. Test with development mode first
4. Review Telegram Bot API documentation

## 🎉 Success!

Your Gemini Bot Copy is ready! The bot includes all features discovered in the original analysis and can be customized for your needs. Start chatting with your bot on Telegram!

## 📚 Additional Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [plans/multi-user-database-integration.md](plans/multi-user-database-integration.md) - Detailed integration architecture
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database setup and configuration guide
