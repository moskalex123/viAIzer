# Script to setup GitHub SSH key locally
# This script generates SSH key for GitHub and shows instructions

$ErrorActionPreference = "Stop"

# Configuration
$KEY_NAME = "github_key"
$KEY_PATH = "$env:USERPROFILE\.ssh\$KEY_NAME"
$PUB_KEY_PATH = "$KEY_PATH.pub"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub SSH Key Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if key already exists
if (Test-Path $KEY_PATH) {
    Write-Host "SSH key already exists at: $KEY_PATH" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite? (yes/no)"
    
    if ($response -ne "yes") {
        Write-Host "Operation cancelled." -ForegroundColor Red
        exit 0
    }
    
    Remove-Item $KEY_PATH -Force
    Remove-Item $PUB_KEY_PATH -Force -ErrorAction SilentlyContinue
}

# Create .ssh directory if it doesn't exist
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "Created .ssh directory" -ForegroundColor Green
}

# Generate SSH key
Write-Host "`nGenerating SSH key for GitHub..." -ForegroundColor Cyan
$process = Start-Process -FilePath "ssh-keygen" -ArgumentList @("-t", "ed25519", "-f", $KEY_PATH, "-C", "github@$env:USERNAME") -NoNewWindow -Wait -PassThru

if ($process.ExitCode -ne 0) {
    Write-Host "ERROR: Failed to generate SSH key" -ForegroundColor Red
    exit 1
}

Write-Host "SSH key generated successfully!" -ForegroundColor Green

# Show public key
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Add this SSH key to GitHub:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n1. Go to: https://github.com/settings/keys" -ForegroundColor White
Write-Host "2. Click 'New SSH key'" -ForegroundColor White
Write-Host "3. Title: Windows PC - $env:COMPUTERNAME" -ForegroundColor White
Write-Host "4. Paste the key below:" -ForegroundColor White
Write-Host "`n----------------------------------------" -ForegroundColor Gray
Get-Content $PUB_KEY_PATH
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "5. Click 'Add SSH key'" -ForegroundColor White

# Add to SSH config
$configPath = "$sshDir\config"
$configExists = Test-Path $configPath

if (-not $configExists) {
    Write-Host "`nCreating SSH config..." -ForegroundColor Cyan
    @"
Host github.com
    HostName github.com
    User git
    IdentityFile $KEY_PATH
"@ | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "SSH config created at: $configPath" -ForegroundColor Green
} else {
    Write-Host "`nSSH config already exists at: $configPath" -ForegroundColor Yellow
    Write-Host "Please add this to your SSH config:" -ForegroundColor Yellow
    Write-Host "`nHost github.com" -ForegroundColor White
    Write-Host "    HostName github.com" -ForegroundColor White
    Write-Host "    User git" -ForegroundColor White
    Write-Host "    IdentityFile $KEY_PATH" -ForegroundColor White
}

# Test connection
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "After adding the key to GitHub:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test connection with:" -ForegroundColor Yellow
Write-Host "ssh -T git@github.com" -ForegroundColor White
Write-Host "`nYou should see: 'Hi YOUR_USERNAME! You've successfully authenticated...'" -ForegroundColor Green

Write-Host "`nDone!" -ForegroundColor Green
