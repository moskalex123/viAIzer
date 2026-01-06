# VPS Bot Startup Plan

## Current Status
- VPS IP: 217.119.129.239
- Project directory: /root/viaizer
- Bot file: bot.js
- Current command running: `nohup node bot.js > app.log 2>&1 &`

## Tasks to Complete

### 1. Check Bot Status
Verify if the bot is currently running on the VPS:
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "ps aux | grep 'node.*bot.js'"
```

### 2. Check Bot Logs
Review the application logs to identify any errors:
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && tail -n 50 app.log"
```

### 3. Verify Dependencies
Ensure all Node.js dependencies are installed:
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && npm list --depth=0"
```

### 4. Check .env Configuration
Verify the .env file exists and is properly configured:
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && ls -la .env && cat .env"
```

### 5. Start/Restart Bot
Based on findings, start the bot using the appropriate method:

**Option A: Using nohup (simple)**
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && pkill -f 'node.*bot.js' || true && nohup node bot.js > app.log 2>&1 &"
```

**Option B: Using PM2 (recommended for production)**
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && pm2 start bot.js --name viaizer-bot && pm2 save && pm2 startup"
```

### 6. Verify Bot is Running
Confirm the bot is running and responsive:
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && ps aux | grep 'node.*bot.js' && tail -n 20 app.log"
```

### 7. Test Bot Functionality
Send a test message to the bot in Telegram to verify it's responding.

## Expected Environment Variables (.env)
```
BOT_TOKEN=your_telegram_bot_token_here
OPENROUTER=false
OPENROUTER_API_KEY=your_openrouter_api_key_here
NANO_OPENROUTER_MODEL_NAME=google/gemini-2.5-flash-image
KIE_AI_ENABLED=true
KIE_AI_API_KEY=your_kie_ai_api_key_here
KIE_AI_POLL_INTERVAL=2000
KIE_AI_MAX_WAIT_TIME=120000
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=3000
DEFAULT_LANGUAGE=ru
```

## Common Issues & Solutions

### Issue: Module not found
**Solution:** Run `npm install` on VPS

### Issue: BOT_TOKEN not set
**Solution:** Create/edit .env file with valid bot token

### Issue: Port already in use
**Solution:** Kill existing process or use different port

### Issue: Bot starts but crashes
**Solution:** Check logs for specific error messages

## Monitoring Commands

### View real-time logs
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && tail -f app.log"
```

### Check PM2 status (if using PM2)
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "pm2 status"
```

### Restart bot
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && pm2 restart viaizer-bot"
# or
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "cd /root/viaizer && pkill -f 'node.*bot.js' && nohup node bot.js > app.log 2>&1 &"
```

## Success Criteria
- [ ] Bot process is running on VPS
- [ ] No errors in application logs
- [ ] Bot responds to /start command in Telegram
- [ ] Bot handles user messages correctly
