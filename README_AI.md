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

### Generate new SSH key
```powershell
powershell -ExecutionPolicy Bypass -File scripts\generate-vps-key.ps1
```

### Setup VPS (if needed)
```bash
scp -i "d:\viAIzer\vps_bot_key" scripts\setup-vps.sh root@217.119.129.239:/root/
ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "chmod +x /root/setup-vps.sh && bash /root/setup-vps.sh"
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239` | Connect to VPS |
| `scp -i "d:\viAIzer\vps_bot_key" file root@217.119.129.239:/path/` | Upload file |
| `scp -i "d:\viAIzer\vps_bot_key" root@217.119.129.239:/path/file .` | Download file |
| `ssh -i "d:\viAIzer\vps_bot_key" root@217.119.129.239 "command"` | Execute command |

---

**Last Updated**: 2026-01-02
