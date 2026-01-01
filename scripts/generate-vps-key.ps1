# Script to generate SSH key for VPS 217.119.129.239
# Saves key in current project folder

$ErrorActionPreference = "Stop"

# Configuration
$VPS_IP = "217.119.129.239"
$KEY_NAME = "vps_bot_key"
$PROJECT_DIR = "d:\viAIzer"
$KEY_PATH = "$PROJECT_DIR\$KEY_NAME"
$PUB_KEY_PATH = "$KEY_PATH.pub"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generating SSH key for VPS" -ForegroundColor Cyan
Write-Host "VPS IP: $VPS_IP" -ForegroundColor Yellow
Write-Host "Key path: $KEY_PATH" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Check if key already exists
if (Test-Path $KEY_PATH) {
    Write-Host "WARNING: Key $KEY_NAME already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite the existing key? (yes/no)"
    
    if ($response -ne "yes") {
        Write-Host "Operation cancelled." -ForegroundColor Red
        exit 1
    }
    
    # Remove old keys
    Remove-Item $KEY_PATH -Force -ErrorAction SilentlyContinue
    Remove-Item $PUB_KEY_PATH -Force -ErrorAction SilentlyContinue
    Write-Host "Old keys removed." -ForegroundColor Green
}

# Check if ssh-keygen is available
$sshKeygen = Get-Command ssh-keygen -ErrorAction SilentlyContinue
if (-not $sshKeygen) {
    Write-Host "ERROR: ssh-keygen not found. Install OpenSSH or Git Bash." -ForegroundColor Red
    Write-Host "For Windows 10/11: Settings -> Apps -> Optional features -> OpenSSH Server" -ForegroundColor Yellow
    exit 1
}

# Ask about passphrase
Write-Host "`nDo you want to set a passphrase for the key?" -ForegroundColor Cyan
Write-Host "1. No passphrase (recommended for automated connections)" -ForegroundColor White
Write-Host "2. Enter passphrase manually" -ForegroundColor White
Write-Host "3. Use default passphrase: 9sTUF001ug33" -ForegroundColor White
$passphraseChoice = Read-Host "Enter choice (1/2/3)"

$usePassphrase = $false
$passphrasePlain = ""

switch ($passphraseChoice) {
    "1" {
        $usePassphrase = $false
        Write-Host "Creating key without passphrase..." -ForegroundColor Yellow
    }
    "2" {
        $usePassphrase = $true
        $passphrase = Read-Host "Enter passphrase" -AsSecureString
        $passphrasePlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($passphrase))
        Write-Host "Creating key with custom passphrase..." -ForegroundColor Yellow
    }
    "3" {
        $usePassphrase = $true
        $passphrasePlain = "9sTUF001ug33"
        Write-Host "Creating key with default passphrase..." -ForegroundColor Yellow
    }
    default {
        Write-Host "Invalid choice. Creating key without passphrase..." -ForegroundColor Yellow
        $usePassphrase = $false
    }
}

# Generate new SSH key
Write-Host "`nGenerating new SSH key..." -ForegroundColor Cyan

try {
    # Build arguments
    $arguments = @("-t", "ed25519", "-f", "`"$KEY_PATH`"", "-C", "vps_bot@$VPS_IP")
    
    if ($usePassphrase) {
        $arguments += "-N"
        $arguments += "`"$passphrasePlain`""
    } else {
        # For no passphrase, we need to provide empty string
        $arguments += "-N"
        $arguments += '""'
    }
    
    Write-Host "Running: ssh-keygen $($arguments -join ' ')" -ForegroundColor Gray
    
    # Use Start-Process to properly handle the arguments
    $process = Start-Process -FilePath "ssh-keygen" -ArgumentList $arguments -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -ne 0) {
        Write-Host "ERROR: ssh-keygen failed with exit code $($process.ExitCode)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "SSH key successfully created!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR creating key: $_" -ForegroundColor Red
    exit 1
}

# Check created files
if (Test-Path $KEY_PATH) {
    Write-Host "`nPrivate key: $KEY_PATH" -ForegroundColor Green
    Write-Host "Size: $((Get-Item $KEY_PATH).Length) bytes"
} else {
    Write-Host "ERROR: Private key was not created!" -ForegroundColor Red
    exit 1
}

if (Test-Path $PUB_KEY_PATH) {
    Write-Host "Public key: $PUB_KEY_PATH" -ForegroundColor Green
    Write-Host "Size: $((Get-Item $PUB_KEY_PATH).Length) bytes"
    
    # Show public key
    Write-Host "`nPublic key (to add to VPS):" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Get-Content $PUB_KEY_PATH
    Write-Host "----------------------------------------" -ForegroundColor Gray
} else {
    Write-Host "WARNING: Public key was not created!" -ForegroundColor Yellow
    exit 1
}

# Setup instructions
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Copy public key to VPS:" -ForegroundColor Yellow
Write-Host "   type `"$PUB_KEY_PATH`" | ssh root@$VPS_IP `"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys`"" -ForegroundColor White
Write-Host "`n   Or manually:" -ForegroundColor Yellow
Write-Host "   a) Copy the public key above" -ForegroundColor White
Write-Host "   b) Connect to VPS: ssh root@$VPS_IP" -ForegroundColor White
Write-Host "   c) Add key to ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "`n2. Test connection:" -ForegroundColor Yellow
Write-Host "   ssh -i `"$KEY_PATH`" root@$VPS_IP" -ForegroundColor White
Write-Host "`n3. For automatic connection add to ~/.ssh/config:" -ForegroundColor Yellow
Write-Host "   Host vps" -ForegroundColor White
Write-Host "       HostName $VPS_IP" -ForegroundColor White
Write-Host "       User root" -ForegroundColor White
Write-Host "       IdentityFile $KEY_PATH" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

# Offer to copy key to VPS
Write-Host "`nDo you want to copy the public key to VPS now?" -ForegroundColor Cyan
$copyResponse = Read-Host "Enter 'yes' to copy key via SSH (requires root password)"

if ($copyResponse -eq "yes") {
    Write-Host "`nCopying public key to VPS..." -ForegroundColor Cyan
    
    try {
        $publicKeyContent = Get-Content $PUB_KEY_PATH -Raw
        $sshCommand = "echo `"$publicKeyContent`" | ssh root@$VPS_IP `"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`""
        Invoke-Expression $sshCommand
        Write-Host "Public key successfully copied to VPS!" -ForegroundColor Green
        Write-Host "Now you can connect without password:" -ForegroundColor Yellow
        Write-Host "ssh -i `"$KEY_PATH`" root@$VPS_IP" -ForegroundColor White
    }
    catch {
        Write-Host "ERROR copying key: $_" -ForegroundColor Red
        Write-Host "Try copying the key manually following the instructions above." -ForegroundColor Yellow
    }
}

Write-Host "`nDone!" -ForegroundColor Green
