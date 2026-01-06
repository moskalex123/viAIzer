# Gemini Bot Copy - Deployment Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Telegram Bot Token (get from @BotFather)
- OpenAI API Key (optional, for ChatGPT mode)

### 2. Setup
```bash
# Clone or copy the bot files
cd gemini-bot-copy

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 3. Environment Configuration
Create a `.env` file with:
```env
BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=3000
```

### 4. Start the Bot
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📋 Bot Features

### AI Models
- **ChatGPT** - OpenAI GPT-4 integration
- **Nano Banana** - Fast lightweight model
- **Sora 2** - Video generation (simulated)

### User Management
- User profiles with statistics
- Daily request limits (FREE: 25, PREMIUM: 1000)
- Subscription system
- батарейки balance management

### Interface
- Bilingual support (Russian/English)
- Interactive inline keyboards
- Command-based interface
- Profile cards with statistics

### Commands
- `/start` - Welcome message
- `/menu` - Main menu
- `/profile` - User profile
- `/info` - Bot information
- `/newdialogue` - Clear conversation
- `/help` - Help and support

## 🔧 Customization

### Adding New AI Models
Edit `bot-complete.js` and add to `config.modes`:
```javascript
'model_name': { 
  name: 'Model Name', 
  description: 'Model description' 
}
```

Then add a response generator:
```javascript
async generateModelNameResponse(session) {
  // Your model logic here
  return 'Model response';
}
```

### Modifying Limits
Change daily limits in `config.maxDailyRequests`:
```javascript
maxDailyRequests: {
  FREE: 50,      // Change from 25
  PREMIUM: 2000  // Change from 1000
}
```

### Adding Languages
Add new language in `getLocalizedText()`:
```javascript
const texts = {
  ru: { /* Russian */ },
  en: { /* English */ },
  es: { /* Spanish - add this */ }
};
```

## 🛡️ Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start bot-complete.js --name "gemini-bot"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "bot-complete.js"]
```

```bash
# Build and run
docker build -t gemini-bot .
docker run -d --env-file .env gemini-bot
```

### Using Systemd
Create `/etc/systemd/system/gemini-bot.service`:
```ini
[Unit]
Description=Gemini Telegram Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/gemini-bot-copy
ExecStart=/usr/bin/node bot-complete.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable gemini-bot
sudo systemctl start gemini-bot
```

## 📊 Monitoring

### Logs
```bash
# PM2 logs
pm2 logs gemini-bot

# Systemd logs
sudo journalctl -u gemini-bot -f

# Docker logs
docker logs container_name
```

### Health Check
Add this to your bot code:
```javascript
// Health check endpoint
if (process.env.NODE_ENV === 'production') {
  const express = require('express');
  const app = express();
  
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      uptime: process.uptime(),
      users: userSessions.size 
    });
  });
  
  app.listen(process.env.PORT || 3000);
}
```

## 🔒 Security

### Best Practices
1. **Use environment variables** for all sensitive data
2. **Implement rate limiting** to prevent abuse
3. **Validate user input** before processing
4. **Sanitize error messages** to avoid information leakage
5. **Use HTTPS webhooks** instead of polling in production

### Rate Limiting
Add rate limiting middleware:
```javascript
const rateLimit = require('telegraf-ratelimit');

const limitConfig = {
  window: 1000, // 1 second
  limit: 1,     // 1 message per window
  onLimitExceeded: (ctx) => ctx.reply('Rate limit exceeded')
};

bot.use(rateLimit(limitConfig));
```

## 🔄 Updates & Maintenance

### Updating the Bot
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart the service
pm2 restart gemini-bot
# or
sudo systemctl restart gemini-bot
```

### Backup Strategy
- Regular database backups (if using persistent storage)
- Configuration file backups
- Log file rotation

## 🆘 Troubleshooting

### Common Issues

**Bot not responding:**
- Check bot token is correct
- Verify webhook URL (if using webhooks)
- Check network connectivity

**OpenAI API errors:**
- Verify API key is valid
- Check API quota/limit
- Monitor API status page

**Memory issues:**
- Implement session cleanup
- Use external session storage (Redis)
- Monitor memory usage

### Debug Mode
Enable debug logging:
```bash
DEBUG=telegram-bot-api node bot-complete.js
```

## 📞 Support

For issues and questions:
1. Check the logs first
2. Verify environment configuration
3. Test with development mode
4. Review Telegram Bot API documentation
5. Check OpenAI API status

## 🎉 Success!

Your Gemini Bot Copy is now ready for deployment! The bot includes all the features discovered in the original analysis and can be customized to your needs.