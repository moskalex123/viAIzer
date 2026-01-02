# Setup VPS with GitHub integration
# Run this script locally to set up VPS for deployment

$ErrorActionPreference = "Stop"

# Configuration
$VPS_IP = "217.119.129.239"
$KEY_PATH = "d:\viAIzer\vps_bot_key"
$PROJECT_DIR = "d:\viAIzer"
$GITHUB_REPO = "git@github.com:moskalex123/viAIzer.git"
$VPS_PROJECT_DIR = "/root/viaizer"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS GitHub Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if VPS key exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "ERROR: VPS SSH key not found at: $KEY_PATH" -ForegroundColor Red
    Write-Host "Run: powershell -ExecutionPolicy Bypass -File scripts\generate-vps-key.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK - VPS SSH key found" -ForegroundColor Green

# Test VPS connection
Write-Host ""
Write-Host "[1/6] Testing VPS connection..." -ForegroundColor Cyan
$testResult = ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o ServerAliveInterval=5 -o ServerAliveCountMax=2 root@${VPS_IP} "echo 'Connection successful'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to VPS" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}

Write-Host "OK - VPS connection successful" -ForegroundColor Green

# Add GitHub to known_hosts on VPS
Write-Host ""
Write-Host "[2/6] Adding GitHub to known_hosts on VPS..." -ForegroundColor Cyan
ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${VPS_IP} "ssh-keyscan -H github.com >> ~/.ssh/known_hosts 2>/dev/null"

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to add GitHub to known_hosts (may not be critical)" -ForegroundColor Yellow
} else {
    Write-Host "OK - GitHub added to known_hosts" -ForegroundColor Green
}

# Check if project directory exists on VPS
Write-Host ""
Write-Host "[3/6] Checking project directory on VPS..." -ForegroundColor Cyan
$dirExists = ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${VPS_IP} "test -d $VPS_PROJECT_DIR && echo 'exists' || echo 'not_exists'"

if ($dirExists -eq "exists") {
    Write-Host "OK - Project directory exists: $VPS_PROJECT_DIR" -ForegroundColor Green
} else {
    Write-Host "Creating project directory: $VPS_PROJECT_DIR" -ForegroundColor Yellow
    ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${VPS_IP} "mkdir -p $VPS_PROJECT_DIR"
    Write-Host "OK - Project directory created" -ForegroundColor Green
}

# Check if GitHub is configured on VPS
Write-Host ""
Write-Host "[4/6] Checking GitHub configuration on VPS..." -ForegroundColor Cyan
$gitConfigured = ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${VPS_IP} "test -d $VPS_PROJECT_DIR/.git && echo 'yes' || echo 'no'"

if ($gitConfigured -eq "yes") {
    Write-Host "OK - Git repository already configured on VPS" -ForegroundColor Green
} else {
    Write-Host "Cloning repository on VPS..." -ForegroundColor Yellow
    
    # Use a bash script to avoid PowerShell parsing issues
    $bashCommand = "cd $VPS_PROJECT_DIR ; git clone -o StrictHostKeyChecking=no -o ConnectTimeout=30 $GITHUB_REPO ."
    ssh -i $KEY_PATH -o ConnectTimeout=60 -o StrictHostKeyChecking=no root@${VPS_IP} $bashCommand
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to clone repository on VPS" -ForegroundColor Red
        Write-Host "Make sure you have added VPS SSH key to GitHub" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "OK - Repository cloned on VPS" -ForegroundColor Green
}

# Check if .env.production exists on VPS
Write-Host ""
Write-Host "[5/6] Checking production environment file..." -ForegroundColor Cyan
$envExists = ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${VPS_IP} "test -f $VPS_PROJECT_DIR/.env.production && echo 'yes' || echo 'no'"

if ($envExists -eq "yes") {
    Write-Host "OK - .env.production exists on VPS" -ForegroundColor Green
} else {
    Write-Host "WARNING: .env.production not found on VPS" -ForegroundColor Yellow
    Write-Host "Creating from .env.example..." -ForegroundColor Cyan
    
    $bashCommand = "cd $VPS_PROJECT_DIR ; cp .env.example .env.production"
    ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${VPS_IP} $bashCommand
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create .env.production" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "OK - .env.production created" -ForegroundColor Green
    Write-Host "IMPORTANT: Edit .env.production on VPS with production values" -ForegroundColor Yellow
}

# Test deployment script
Write-Host ""
Write-Host "[6/6] Testing deployment script..." -ForegroundColor Cyan
Write-Host "Copying deployment script to VPS..." -ForegroundColor Yellow
scp -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$PROJECT_DIR\scripts\deploy.sh" root@${VPS_IP}:/root/

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to copy deployment script" -ForegroundColor Red
    exit 1
}

Write-Host "OK - Deployment script copied" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OK - VPS GitHub setup completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit production environment on VPS:" -ForegroundColor White
Write-Host "   ssh -i $KEY_PATH root@${VPS_IP} 'nano $VPS_PROJECT_DIR/.env.production'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy to VPS:" -ForegroundColor White
Write-Host "   powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check application status:" -ForegroundColor White
Write-Host "   ssh -i $KEY_PATH root@${VPS_IP} 'cd $VPS_PROJECT_DIR && tail -f app.log'" -ForegroundColor Gray
