# VPS Connection Guide

## SSH Connection Information

### VPS Details
- **IP Address**: 217.119.129.239
- **Hostname**: viaizer.art
- **User**: root
- **OS**: Ubuntu 24.04 LTS (Linux 6.8.0-79-generic)

### SSH Keys Location
- **Private Key**: `d:\viAIzer\vps_bot_key`
- **Public Key**: `d:\viAIzer\vps_bot_key.pub`
- **Key Type**: ed25519
- **Passphrase**: None (for automated connections)

## Connecting to VPS

### Windows (PowerShell)
```powershell
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239
```

### Windows (Git Bash / WSL)
```bash
ssh -i d:/viAIzer/vps_bot_key root@217.119.129.239
```

### Linux / macOS
```bash
ssh -i ~/viAIzer/vps_bot_key root@217.119.129.239
```

## SSH Config (Optional)

Add this to `~/.ssh/config` for easier connection:

```
Host vps
    HostName 217.119.129.239
    User root
    IdentityFile d:/viAIzer/vps_bot_key
    StrictHostKeyChecking no
```

Then connect simply with:
```bash
ssh vps
```

## VPS Software

### Installed Software
- **Node.js**: v24.12.0
- **npm**: 11.6.2
- **Git**: 2.43.0
- **curl**: 8.5.0
- **wget**: 1.21.4
- **vim**: 9.1.0016
- **htop**: 3.3.0

### System Resources
- **Disk**: 9.8GB total, 5.0GB available (47% used)
- **RAM**: 3.8GB total, 3.3GB available
- **Swap**: 511MB

## Common Commands

### Check system status
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "node --version && npm --version"
```

### Check disk space
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "df -h"
```

### Check memory
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "free -h"
```

### Check running processes
```bash
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "htop"
```

## Project Directory

Project files are located at: `/root/viaizer`

### Copy files to VPS
```bash
scp -i "d:\viAIzer\vps_bot_key" local_file root@217.119.129.239:/root/viaizer/
```

### Copy directory to VPS
```bash
scp -i "d:\viAIzer\vps_bot_key" -r local_dir root@217.119.129.239:/root/viaizer/
```

### Copy files from VPS
```bash
scp -i "d:\viAIzer\vps_bot_key" root@217.119.129.239:/root/viaizer/file.txt d:\viAIzer\
```

## Environment Configuration

### Development vs Production

The project uses environment variables to distinguish between development and production environments.

#### Environment Files
- `.env` - Local development environment (DO NOT commit to git)
- `.env.example` - Template with example values (safe to commit)
- `.env.production` - Production environment variables (for VPS)

#### Key Environment Variables

```bash
# Environment type
NODE_ENV=development    # or 'production'

# Bot configuration
BOT_TOKEN=your_telegram_bot_token
OPENROUTER_API_KEY=your_api_key

# Server configuration
PORT=3000              # Development port
# PORT=80              # Production port

# Logging
LOG_LEVEL=debug         # Development: debug, Production: info
```

#### Detecting Environment in Code

```javascript
// Check if running in development or production
const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

// Example usage
if (isProduction) {
    console.log('Running in PRODUCTION mode');
    // Production-specific logic
} else {
    console.log('Running in DEVELOPMENT mode');
    // Development-specific logic
}
```

#### Switching Environments

**Local Development:**
```bash
# Set NODE_ENV to development
export NODE_ENV=development
# or
$env:NODE_ENV="development"  # PowerShell
```

**Production (VPS):**
```bash
# Set NODE_ENV to production on VPS
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "export NODE_ENV=production"
```

#### Deployment Configuration

**Development Environment:**
- Uses local `.env` file
- Debug logging enabled
- Hot reload (if using nodemon)
- Port 3000 or other development port
- No SSL/TLS (usually)

**Production Environment:**
- Uses `.env.production` on VPS
- Info/warn logging only
- Process manager (PM2 or systemd)
- Port 80 or 443 with SSL
- Optimized for performance

#### Example .env Files

**.env (Local Development):**
```env
NODE_ENV=development
BOT_TOKEN=dev_bot_token_here
OPENROUTER_API_KEY=dev_api_key_here
PORT=3000
LOG_LEVEL=debug
```

**.env.production (VPS):**
```env
NODE_ENV=production
BOT_TOKEN=prod_bot_token_here
OPENROUTER_API_KEY=prod_api_key_here
PORT=80
LOG_LEVEL=info
```

#### Best Practices

1. **Never commit `.env` files** to version control
2. **Use `.env.example`** as a template for required variables
3. **Different API keys** for development and production
4. **Separate bot tokens** for testing and live bots
5. **Validate environment** on application startup

#### Environment Validation

```javascript
// Validate required environment variables on startup
const requiredEnvVars = ['BOT_TOKEN', 'OPENROUTER_API_KEY'];
const missingVars = requiredEnvVars.filter(var => !process.env[var]);

if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}
```

## GitHub & Deployment Setup

### Initial Setup (One-time)

#### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `viAIzer` (or your preferred name)
3. Make it **Private** (recommended for bot projects)
4. Do NOT initialize with README, .gitignore, or license
5. Click "Create repository"

#### 2. Setup GitHub SSH Key Locally

**Option A: Use Setup Script (Recommended)**
```powershell
# Generate SSH key and get instructions
powershell -ExecutionPolicy Bypass -File scripts\setup-github-local.ps1
```

The script will:
- Generate SSH key for GitHub
- Display the public key to add to GitHub
- Create/update SSH config automatically

**Option B: Manual Setup**
```powershell
# Generate SSH key
ssh-keygen -t ed25519 -f ~/.ssh/github_key -C "github@your-pc"

# Show public key
cat ~/.ssh/github_key.pub
```

#### 3. Add SSH Key to GitHub
1. Copy the public key from the script output
2. Go to: https://github.com/settings/keys
3. Click "New SSH key"
4. Title: "Windows PC - YOUR_COMPUTER_NAME"
5. Paste the public key
6. Click "Add SSH key"

#### 4. Test GitHub Connection
```powershell
# Test SSH connection to GitHub
ssh -T git@github.com
```

You should see: `Hi YOUR_USERNAME! You've successfully authenticated...`

#### 5. Connect Local Repository to GitHub
```powershell
# Replace with your GitHub username and repository name
git remote add origin git@github.com:YOUR_USERNAME/viAIzer.git
git branch -M main
git push -u origin main
```

#### 6. Generate VPS GitHub SSH Key
```powershell
# Generate SSH key on VPS and get public key
powershell -ExecutionPolicy Bypass -File scripts\generate-vps-github-key.ps1
```

The script will:
- Test VPS connection
- Generate SSH key on VPS
- Display the public key to add to GitHub

#### 7. Add VPS SSH Key to GitHub
1. Copy the public key from the script output
2. Go to: https://github.com/settings/keys
3. Click "New SSH key"
4. Title: "VPS viaizer.art"
5. Paste the public key
6. Click "Add SSH key"

#### 8. Setup VPS with GitHub
```powershell
# Run setup script from local machine
powershell -ExecutionPolicy Bypass -File scripts\setup-vps-github.ps1
```

This script will:
- Test VPS connection
- Clone repository to `/root/viaizer`
- Create `.env.production` from `.env.example`
- Copy deployment script to VPS

### Deploy to Production

#### Quick Deploy (One Command)
```powershell
# From project directory
powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1
```

This script will:
1. Check git status and show changes
2. Commit changes with a message
3. Push to GitHub
4. Copy deployment script to VPS
5. Execute deployment on VPS
6. Show deployment logs

#### What Happens During Deployment

On VPS, the deployment script (`scripts/deploy.sh`) will:
1. Stop the running bot (PM2 or systemd)
2. Pull the latest changes from GitHub
3. Install/update dependencies (`npm install --production`)
4. Setup environment (copy `.env.production` to `.env`)
5. Run database migrations (if any)
6. Start the bot (PM2, systemd, or nohup)
7. Verify the bot is running
8. Show recent logs

#### Manual Deployment Steps

If you need more control, you can deploy manually:

```powershell
# 1. Commit and push to GitHub
git add .
git commit -m "Your commit message"
git push origin main

# 2. SSH to VPS and deploy
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239
cd /root/viaizer
git pull origin main
npm install --production
cp .env.production .env
pm2 restart viaizer-bot  # or: systemctl restart viaizer-bot
```

### Process Management

#### Using PM2 (Recommended)
```bash
# Install PM2 on VPS (one-time)
npm install -g pm2

# Start bot with PM2
pm2 start bot.js --name viaizer-bot

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

PM2 commands:
```bash
pm2 list              # List all processes
pm2 logs viaizer-bot  # View logs
pm2 restart viaizer-bot # Restart bot
pm2 stop viaizer-bot   # Stop bot
pm2 monit             # Monitor resources
```

#### Using systemd (Alternative)
Create `viaizer-bot.service`:
```ini
[Unit]
Description=Viaizer Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/viaizer
ExecStart=/usr/bin/node bot.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Install and start:
```bash
cp viaizer-bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable viaizer-bot
systemctl start viaizer-bot
```

Systemd commands:
```bash
systemctl status viaizer-bot  # Check status
systemctl restart viaizer-bot  # Restart bot
systemctl stop viaizer-bot     # Stop bot
journalctl -u viaizer-bot     # View logs
```

### Troubleshooting Deployment

#### Deployment Fails
```bash
# Check deployment log on VPS
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "tail -n 100 /root/viaizer/deploy.log"

# Check application logs
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "tail -n 100 /root/viaizer/app.log"
```

#### Git Push Fails
```powershell
# Check remote URL
git remote -v

# Update remote URL if needed
git remote set-url origin git@github.com:YOUR_USERNAME/viAIzer.git
```

#### Environment Variables Missing
```bash
# SSH to VPS and check .env
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239
cd /root/viaizer
cat .env.production

# Edit if needed
nano .env.production
```

#### Bot Won't Start
```bash
# Check if process is running
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "ps aux | grep node"

# Check PM2 status
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "pm2 status"

# Check systemd status
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "systemctl status viaizer-bot"
```

### Deployment Workflow Summary

```
Local Development
    ↓
git add & commit
    ↓
git push origin main
    ↓
GitHub Repository
    ↓
VPS: git pull origin main
    ↓
VPS: npm install --production
    ↓
VPS: Restart bot (PM2/systemd)
    ↓
Bot Running in Production
```

## Firewall

Active firewall (UFW) with rules:
- Port 22 (SSH): Open
- Port 80 (HTTP): Open
- Port 443 (HTTPS): Open

## Security Notes

- SSH key is stored locally at `d:\viAIzer\vps_bot_key`
- Key has no passphrase (for automated deployments)
- Keep the private key secure - never share it
- Public key is already added to VPS `~/.ssh/authorized_keys`

## Troubleshooting

### Permission denied
```powershell
# Ensure correct permissions on private key
icacls "d:\viAIzer\vps_bot_key" /inheritance:r
icacls "d:\viAIzer\vps_bot_key" /grant:r "$env:USERNAME:F"
```

### Connection refused
- Check VPS is running: `ping 217.119.129.239`
- Check firewall settings
- Verify SSH service is running on VPS

### Key not found
- Verify key path is correct: `d:\viAIzer\vps_bot_key`
- Check file exists: `Test-Path "d:\viAIzer\vps_bot_key"`

## Scripts

### Generate new SSH key for VPS
```powershell
powershell -ExecutionPolicy Bypass -File scripts\generate-vps-key.ps1
```

### Setup GitHub SSH key locally
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-github-local.ps1
```

### Diagnose GitHub SSH issues
```powershell
powershell -ExecutionPolicy Bypass -File scripts\diagnose-github.ps1
```

### Generate VPS GitHub SSH key
```powershell
powershell -ExecutionPolicy Bypass -File scripts\generate-vps-github-key.ps1
```

### Setup VPS with GitHub
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-vps-github.ps1
```

### Deploy to production
```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239` | Connect to VPS |
| `scp -i "d:\viAIzer\vps_bot_key" file root@217.119.129.239:/path/` | Upload file |
| `scp -i "d:\viAIzer\vps_bot_key" root@217.119.129.239:/path/file .` | Download file |
| `ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "command"` | Execute command |
| `powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1` | Deploy to production |

---

**Last Updated**: 2026-01-02
