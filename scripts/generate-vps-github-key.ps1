# Generate SSH key on VPS for GitHub
# Run this script locally to generate SSH key on VPS

$ErrorActionPreference = "Stop"

# Configuration
$VPS_IP = "217.119.129.239"
$KEY_PATH = "d:\viAIzer\vps_bot_key"
$VPS_PROJECT_DIR = "/root/viaizer"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generate VPS GitHub SSH Key" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if VPS key exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "ERROR: VPS SSH key not found at: $KEY_PATH" -ForegroundColor Red
    exit 1
}

Write-Host "OK - VPS SSH key found" -ForegroundColor Green

# Test VPS connection
Write-Host ""
Write-Host "[1/3] Testing VPS connection..." -ForegroundColor Cyan
$testResult = ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${VPS_IP} "echo 'Connection successful'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to VPS" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}

Write-Host "OK - VPS connection successful" -ForegroundColor Green

# Generate SSH key on VPS
Write-Host ""
Write-Host "[2/3] Generating SSH key on VPS..." -ForegroundColor Cyan
ssh -i $KEY_PATH root@${VPS_IP} "mkdir -p ~/.ssh ; ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N '' -C 'vps@viaizer.art'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to generate SSH key on VPS" -ForegroundColor Red
    exit 1
}

Write-Host "OK - SSH key generated on VPS" -ForegroundColor Green

# Show public key
Write-Host ""
Write-Host "[3/3] Public SSH Key:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray
ssh -i $KEY_PATH root@${VPS_IP} "cat ~/.ssh/id_ed25519.pub"
Write-Host "========================================" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the public key above" -ForegroundColor White
Write-Host "2. Go to: https://github.com/settings/keys" -ForegroundColor White
Write-Host "3. Click New SSH key" -ForegroundColor White
Write-Host "4. Title: VPS viaizer.art" -ForegroundColor White
Write-Host "5. Paste the key" -ForegroundColor White
Write-Host "6. Click Add SSH key" -ForegroundColor White
Write-Host ""
Write-Host "After adding the key, run:" -ForegroundColor Yellow
Write-Host "powershell -ExecutionPolicy Bypass -File scripts\setup-vps-github.ps1" -ForegroundColor Gray
