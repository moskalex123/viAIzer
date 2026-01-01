#!/bin/bash
# Setup GitHub on VPS
# This script configures Git on VPS and clones the repository

set -e

REPO_URL=$1
PROJECT_DIR="/root/viaizer"

if [ -z "$REPO_URL" ]; then
    echo "Usage: $0 <github-repo-url>"
    echo "Example: $0 git@github.com:username/viaizer.git"
    exit 1
fi

echo "Setting up GitHub on VPS..."
echo "Repository URL: $REPO_URL"

# Configure git
echo "Configuring git..."
git config --global user.name "VPS Bot"
git config --global user.email "vps@viaizer.art"

# Install SSH key for GitHub (if needed)
if [ ! -f ~/.ssh/github_key ]; then
    echo "Generating GitHub SSH key..."
    ssh-keygen -t ed25519 -f ~/.ssh/github_key -N "" -C "vps@viaizer.art"
    
    echo ""
    echo "========================================"
    echo "Add this SSH key to GitHub:"
    echo "========================================"
    cat ~/.ssh/github_key.pub
    echo "========================================"
    echo ""
    echo "1. Go to: https://github.com/settings/keys"
    echo "2. Click 'New SSH key'"
    echo "3. Paste the key above"
    echo "4. Run this script again after adding the key"
    echo ""
    
    # Add to SSH config
    cat >> ~/.ssh/config <<EOF

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_key
EOF
    
    exit 0
fi

# Clone or pull repository
if [ -d "$PROJECT_DIR" ]; then
    echo "Project directory exists, pulling changes..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
    echo "Creating .env.production from .env.example..."
    cp .env.example .env.production
    echo "Please edit .env.production with production values"
fi

echo "GitHub setup completed!"
