#!/bin/bash
# Deployment script for VPS
# This script will be executed on the VPS to deploy the application

set -e

PROJECT_DIR="/root/viaizer"
LOG_FILE="$PROJECT_DIR/deploy.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting deployment..."

# Navigate to project directory
cd "$PROJECT_DIR" || {
    log "ERROR: Failed to navigate to project directory"
    exit 1
}

# Stop the application (if running)
log "Stopping application..."
if [ -f "pm2.config.js" ]; then
    pm2 stop viaizer-bot || true
    pm2 delete viaizer-bot || true
elif systemctl is-active --quiet viaizer-bot 2>/dev/null; then
    systemctl stop viaizer-bot
fi

# Pull latest changes from GitHub
log "Pulling latest changes from GitHub..."
git fetch origin
git reset --hard origin/main

# Install/update dependencies
log "Installing dependencies..."
npm install --production

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
    log "WARNING: .env.production not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        log "Please edit .env.production with production values"
    else
        log "ERROR: .env.example not found"
        exit 1
    fi
fi

# Copy production environment file
log "Setting up environment..."
cp .env.production .env

# Run database migrations if needed
if [ -f "migrate.js" ]; then
    log "Running database migrations..."
    node migrate.js
fi

# Start the application
log "Starting application..."
if [ -f "pm2.config.js" ]; then
    pm2 start pm2.config.js --env production
    pm2 save
    log "Application started with PM2"
elif [ -f "viaizer-bot.service" ]; then
    # Install systemd service if not installed
    if [ ! -f "/etc/systemd/system/viaizer-bot.service" ]; then
        log "Installing systemd service..."
        cp viaizer-bot.service /etc/systemd/system/
        systemctl daemon-reload
        systemctl enable viaizer-bot
    fi
    systemctl start viaizer-bot
    log "Application started with systemd"
else
    # Simple start with nohup
    log "Starting application with nohup..."
    pkill -f "node.*bot.js" || true
    nohup node bot.js > app.log 2>&1 &
    log "Application started with nohup"
fi

# Wait a moment and check if application is running
sleep 3

if [ -f "pm2.config.js" ]; then
    if pm2 list | grep -q "viaizer-bot.*online"; then
        log "✓ Application is running successfully"
        pm2 logs viaizer-bot --lines 20 --nostream
    else
        log "✗ Application failed to start"
        pm2 logs viaizer-bot --lines 50 --nostream
        exit 1
    fi
elif pgrep -f "node.*bot.js" > /dev/null; then
    log "✓ Application is running successfully"
    tail -n 20 app.log
else
    log "✗ Application failed to start"
    tail -n 50 app.log
    exit 1
fi

log "Deployment completed successfully!"
