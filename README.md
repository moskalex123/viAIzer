# 🤖 Gemini Bot Copy

A complete working copy of @geminitelegrambot with multi-AI model support, premium features, and bilingual interface.

## ✨ Features

### 🤖 AI Models
- **ChatGPT** - OpenAI GPT-4 integration for general conversations
- **Nano Banana** - Fast lightweight model for quick responses
- **Sora 2** - Video generation capabilities (simulated)

### 👤 User Management
- User profiles with detailed statistics
- Daily request limits (FREE: 25/day, PREMIUM: 1000/day)
- Subscription system with CRED currency
- Conversation history tracking

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

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Bot
```bash
npm start
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
BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
DEFAULT_LANGUAGE=ru
MAX_DAILY_REQUESTS_FREE=25
MAX_DAILY_REQUESTS_PREMIUM=1000
```

### Customization
- Add new AI models in `config.modes`
- Modify daily limits in configuration
- Add languages in `getLocalizedText()`
- Customize premium features

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
├── bot-complete.js      # Main bot implementation
├── package.json         # Dependencies and scripts
├── .env.example         # Environment configuration
├── DEPLOYMENT.md        # Deployment guide
└── README.md           # This file
```

### Adding Features
1. New AI models: Add to `config.modes` and create response generator
2. New languages: Add to `getLocalizedText()` function
3. New commands: Add command handler in `initializeBot()`
4. Premium features: Extend subscription system

## 🆘 Troubleshooting

### Common Issues
1. **Bot not responding** - Check bot token and network connectivity
2. **OpenAI API errors** - Verify API key and quota
3. **Memory issues** - Implement session cleanup
4. **Rate limiting** - Check Telegram API limits

### Debug Mode
Enable debug logging:
```bash
DEBUG=telegram-bot-api node bot-complete.js
```

## 📞 Support

For issues and questions:
1. Check the logs for error messages
2. Verify environment configuration
3. Test with development mode first
4. Review Telegram Bot API documentation

## 🎉 Success!

Your Gemini Bot Copy is ready! The bot includes all features discovered in the original analysis and can be customized for your needs. Start chatting with your bot on Telegram!