# Gemini Bot Copy - Deployment Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Telegram Bot Token (get from @BotFather)
- OpenAI API Key (optional, for ChatGPT mode)
- PostgreSQL database (optional, for multi-user support)

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
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=3000

# Database Configuration (Optional - for multi-user support)
DB_ENABLED=true
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Optional: SSL for database connections
DB_SSL=true
DB_SSL_MODE=require
```

For detailed database setup instructions, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

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
- Multi-user support with PostgreSQL database integration
- User profiles with statistics
- Shared balance across ecosystem services
- Daily request limits (FREE: 25, PREMIUM: 1000)
- Subscription system
- батарейки balance management
- Graceful fallback to in-memory sessions

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
Edit `bot.js` and add to `config.modes`:
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
pm2 start bot.js --name "gemini-bot"

# Save PM2 configuration
pm2 save
pm2 startup

# View logs
pm2 logs gemini-bot

# Monitor
pm2 monit
```

### Using PM2 with Ecosystem Config
The project includes `ecosystem.config.cjs` for easy deployment:

```bash
# Start with ecosystem config
pm2 start ecosystem.config.cjs

# View status
pm2 status

# Restart
pm2 restart gemini-bot
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "bot.js"]
```

```bash
# Build and run
docker build -t gemini-bot .
docker run -d --env-file .env --name gemini-bot gemini-bot

# View logs
docker logs -f gemini-bot

# Stop and remove
docker stop gemini-bot
docker rm gemini-bot
```

### Using Systemd
Create `/etc/systemd/system/gemini-bot.service`:
```ini
[Unit]
Description=Gemini Telegram Bot
After=network.target postgresql.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/gemini-bot-copy
ExecStart=/usr/bin/node bot.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/path/to/gemini-bot-copy/.env

[Install]
WantedBy=multi-user-target
```

```bash
# Enable and start
sudo systemctl enable gemini-bot
sudo systemctl start gemini-bot

# View logs
sudo journalctl -u gemini-bot -f

# Restart
sudo systemctl restart gemini-bot
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
The bot includes a built-in health check. Monitor:
- Bot process status
- Database connection status
- Active session count
- Error rates in logs

For production, consider adding:
```javascript
// Health check endpoint (optional)
import express from 'express';
import dbConnection from './src/db/connection.js';
import sessionManager from './src/session/sessionManager.js';

const app = express();

app.get('/health', async (req, res) => {
  const dbConnected = dbConnection.isConnected();
  const sessionCount = sessionManager.getSessionCount();
  
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    database: dbConnected ? 'connected' : 'disconnected',
    sessions: sessionCount,
    timestamp: new Date().toISOString()
  });
});

app.listen(process.env.PORT || 3000);
```

## 🔒 Security

### Best Practices
1. **Use environment variables** for all sensitive data
2. **Implement rate limiting** to prevent abuse
3. **Validate user input** before processing
4. **Sanitize error messages** to avoid information leakage
5. **Use HTTPS webhooks** instead of polling in production
6. **Enable SSL/TLS** for database connections in production
7. **Use strong passwords** and rotate them regularly
8. **Implement proper firewall rules**

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

#### Database Backups (if using PostgreSQL)
```bash
# Automated daily backup
0 2 * * * pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > /backups/bot_db_$(date +\%Y\%m\%d).sql

# Manual backup
pg_dump -h <host> -U <user> -d <database> > backup.sql

# Restore
psql -h <host> -U <user> -d <database> < backup.sql
```

#### Configuration Backups
```bash
# Backup environment and configuration
tar -czf bot_config_$(date +%Y%m%d).tar.gz .env ecosystem.config.cjs
```

#### Log Rotation
Configure logrotate for PM2:
```bash
# /etc/logrotate.d/pm2-gemini-bot
/home/user/.pm2/logs/gemini-bot-*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  create 0640 user user
}
```

## 🆘 Troubleshooting

### Common Issues

**Bot not responding:**
- Check bot token is correct
- Verify webhook URL (if using webhooks)
- Check network connectivity
- Review PM2/systemd logs for errors

**OpenAI API errors:**
- Verify API key is valid
- Check API quota/limit
- Monitor API status page

**Database connection issues:**
- Verify database credentials in `.env`
- Check database server is running
- Test connectivity: `telnet <host> <port>`
- Review database logs
- Check firewall rules
- Verify database user permissions

**Fallback mode active:**
- Database is unavailable or misconfigured
- Bot will continue working with in-memory sessions
- Data won't persist across restarts
- Check logs for connection errors

**Memory issues:**
- Implement session cleanup
- Monitor active session count
- Consider session timeout policies
- Monitor memory usage with `pm2 monit`

**Performance issues:**
- Check database query performance
- Monitor connection pool usage
- Review slow query logs
- Consider database indexing

### Debug Mode
Enable debug logging:
```bash
# Development mode with debug output
DEBUG=* node bot.js

# PM2 with debug
pm2 start bot.js --name "gemini-bot-debug" -- --debug

# View detailed logs
pm2 logs gemini-bot --lines 100
```

### Database Debugging
```bash
# Test database connection
node test-multi-user-integration.js

# Check database connectivity
psql -h <host> -U <user> -d <database> -c "SELECT 1"

# View database logs
tail -f /var/log/postgresql/postgresql-*.log
```

## 📞 Support

For issues and questions:
1. Check the logs first
2. Verify environment configuration
3. Test database connection with `test-multi-user-integration.js`
4. Test with development mode
5. Review Telegram Bot API documentation
6. Check OpenAI API status
7. See [DATABASE_SETUP.md](DATABASE_SETUP.md) for database-specific issues

## 🎉 Success!

Your Gemini Bot Copy is now ready for deployment! The bot includes all the features discovered in the original analysis, including multi-user database integration, and can be customized to your needs.

## 📚 Additional Documentation

- [README.md](README.md) - Main documentation
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database setup and configuration
- [plans/multi-user-database-integration.md](plans/multi-user-database-integration.md) - Integration architecture details

## ✅ Pre-Deployment Checklist

- [ ] Environment variables configured in `.env`
- [ ] Database connection tested (if using database)
- [ ] Bot token verified with @BotFather
- [ ] OpenAI API key configured (if using ChatGPT)
- [ ] Dependencies installed (`npm install`)
- [ ] PM2/systemd service configured
- [ ] Backup strategy implemented
- [ ] Monitoring and logging setup
- [ ] SSL/TLS configured (if using database remotely)
- [ ] Firewall rules configured
- [ ] Health check endpoint configured
- [ ] Error tracking setup
- [ ] Documentation reviewed
- [ ] Test deployment completed successfully
