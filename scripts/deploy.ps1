# Deployment script - Push to GitHub and deploy to VPS
# Run this script locally to deploy to production

$ErrorActionPreference = "Stop"

# Configuration
$VPS_IP = "217.119.129.239"
$KEY_PATH = "d:\viAIzer\vps_bot_key"
$PROJECT_DIR = "d:\viAIzer"
$REMOTE_SCRIPT = "/root/deploy.sh"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if we're in the project directory
$currentDir = Get-Location
if ($currentDir.Path -ne $PROJECT_DIR) {
    Write-Host "Changing to project directory: $PROJECT_DIR" -ForegroundColor Yellow
    Set-Location $PROJECT_DIR
}

# Step 1: Check git status
Write-Host "`n[1/4] Checking git status..." -ForegroundColor Cyan
git status --short

if (-not (git status --porcelain)) {
    Write-Host "No changes to deploy." -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (yes/no)"
    if ($continue -ne "yes") {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit 0
    }
}

# Step 2: Commit changes
Write-Host "`n[2/4] Committing changes..." -ForegroundColor Cyan
git add -A
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}
git commit -m $commitMessage

# Step 3: Push to GitHub
Write-Host "`n[3/4] Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to push to GitHub" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Successfully pushed to GitHub" -ForegroundColor Green

# Step 4: Deploy to VPS
Write-Host "`n[4/4] Deploying to VPS..." -ForegroundColor Cyan

# Copy deployment script to VPS
Write-Host "Copying deployment script to VPS..." -ForegroundColor Yellow
scp -i $KEY_PATH "$PROJECT_DIR\scripts\deploy.sh" root@${VPS_IP}:/root/

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to copy deployment script to VPS" -ForegroundColor Red
    exit 1
}

# Execute deployment script on VPS
Write-Host "Executing deployment on VPS..." -ForegroundColor Yellow
ssh -i $KEY_PATH root@${VPS_IP} "chmod +x /root/deploy.sh && bash /root/deploy.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed on VPS" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Optional: Show logs from VPS
$showLogs = Read-Host "Show application logs? (yes/no)"
if ($showLogs -eq "yes") {
    Write-Host "`nFetching recent logs from VPS..." -ForegroundColor Cyan
    ssh -i $KEY_PATH root@${VPS_IP} "tail -n 50 /root/viaizer/deploy.log"
}

Write-Host "`nDeployment finished!" -ForegroundColor Green
