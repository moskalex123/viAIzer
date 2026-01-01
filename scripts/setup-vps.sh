#!/bin/bash
# Setup script for VPS 217.119.129.239
# This script will be executed on the VPS

set -e

echo "========================================"
echo "Setting up VPS 217.119.129.239"
echo "========================================"

# Update system
echo ""
echo "[1/6] Updating system packages..."
apt-get update && apt-get upgrade -y

# Install essential tools
echo ""
echo "[2/6] Installing essential tools..."
apt-get install -y curl wget git vim htop net-tools unzip

# Install Node.js (latest LTS)
echo ""
echo "[3/6] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# Install Docker
echo ""
echo "[4/6] Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker root

# Install Docker Compose
echo ""
echo "[5/6] Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configure firewall
echo ""
echo "[6/6] Configuring firewall..."
apt-get install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Clean up
echo ""
echo "Cleaning up..."
rm -f get-docker.sh
apt-get autoremove -y
apt-get clean

# Display versions
echo ""
echo "========================================"
echo "Installation complete!"
echo "========================================"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version)"
echo "========================================"

# Create project directory
echo ""
echo "Creating project directory..."
mkdir -p /root/viaizer
echo "Project directory created: /root/viaizer"

echo ""
echo "Setup complete! You can now deploy your bot."
