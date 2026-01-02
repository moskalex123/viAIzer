# Diagnose GitHub SSH connection issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub SSH Diagnosis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if SSH key exists
$sshDir = "$env:USERPROFILE\.ssh"
$githubKey = "$sshDir\github_key"
$githubPubKey = "$githubKey.pub"

Write-Host "`n[1] Checking SSH keys..." -ForegroundColor Cyan

if (-not (Test-Path $sshDir)) {
    Write-Host "ERROR: .ssh directory does not exist" -ForegroundColor Red
    Write-Host "Run: powershell -ExecutionPolicy Bypass -File scripts\setup-github-local.ps1" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $githubKey)) {
    Write-Host "ERROR: GitHub SSH key does not exist" -ForegroundColor Red
    Write-Host "Run: powershell -ExecutionPolicy Bypass -File scripts\setup-github-local.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ SSH key exists at: $githubKey" -ForegroundColor Green

# Check SSH config
Write-Host "`n[2] Checking SSH config..." -ForegroundColor Cyan
$configPath = "$sshDir\config"

if (Test-Path $configPath) {
    Write-Host "✓ SSH config exists at: $configPath" -ForegroundColor Green
    Write-Host "`nCurrent SSH config:" -ForegroundColor Yellow
    Get-Content $configPath
} else {
    Write-Host "WARNING: SSH config does not exist" -ForegroundColor Yellow
    Write-Host "Creating SSH config..." -ForegroundColor Cyan
    
    @"
Host github.com
    HostName github.com
    User git
    IdentityFile $githubKey
"@ | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "✓ SSH config created" -ForegroundColor Green
}

# Show public key
Write-Host "`n[3] Public SSH Key:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray
Get-Content $githubPubKey
Write-Host "========================================" -ForegroundColor Gray

# Instructions
Write-Host "`n[4] Instructions:" -ForegroundColor Cyan
Write-Host "1. Copy the public key above" -ForegroundColor White
Write-Host "2. Go to: https://github.com/settings/keys" -ForegroundColor White
Write-Host "3. Click 'New SSH key'" -ForegroundColor White
Write-Host "4. Title: Windows PC - $env:COMPUTERNAME" -ForegroundColor White
Write-Host "5. Paste the key" -ForegroundColor White
Write-Host "6. Click 'Add SSH key'" -ForegroundColor White

# Test connection
Write-Host "`n[5] Testing connection..." -ForegroundColor Cyan
Write-Host "After adding the key to GitHub, run:" -ForegroundColor Yellow
Write-Host "ssh -T git@github.com" -ForegroundColor White
Write-Host "`nYou should see: 'Hi YOUR_USERNAME! You've successfully authenticated...'" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Diagnosis complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
