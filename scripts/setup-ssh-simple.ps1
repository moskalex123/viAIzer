# Упрощенный скрипт для настройки SSH ключей
# Запустите этот скрипт в PowerShell

Write-Host "🔑 Настройка SSH ключей для VPS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Настройки
$vpsIp = "217.119.129.239"
$vpsUser = "root"
$vpsPassword = "9sTUF001ug33"
$sshDir = "D:\viAIzer\ssh"
$privateKey = "$sshDir\vps_bot_key"
$publicKey = "$sshDir\vps_bot_key.pub"

# Шаг 1: Создание директории
Write-Host "📋 Шаг 1: Создание директории для SSH ключей..." -ForegroundColor Yellow
if (!(Test-Path -Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "✅ Директория создана: $sshDir" -ForegroundColor Green
} else {
    Write-Host "✅ Директория уже существует: $sshDir" -ForegroundColor Green
}
Write-Host ""

# Шаг 2: Генерация ключей
Write-Host "📋 Шаг 2: Генерация SSH ключей..." -ForegroundColor Yellow
if (Test-Path $privateKey) {
    Write-Host "⚠️  Ключи уже существуют!" -ForegroundColor Yellow
    $overwrite = Read-Host "Перезаписать существующие ключи? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Отмена операции" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Генерация ED25519 ключа..." -ForegroundColor Gray
& ssh-keygen -t ed25519 -f $privateKey -C "botuser@vps" -N ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH ключи успешно созданы!" -ForegroundColor Green
    Write-Host "   Приватный ключ: $privateKey" -ForegroundColor Gray
    Write-Host "   Публичный ключ: $publicKey" -ForegroundColor Gray
} else {
    Write-Host "❌ Ошибка при генерации ключей" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Шаг 3: Чтение публичного ключа
Write-Host "📋 Шаг 3: Чтение публичного ключа..." -ForegroundColor Yellow
try {
    $publicKeyContent = Get-Content $publicKey -Raw
    Write-Host "✅ Публичный ключ прочитан:" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $publicKeyContent.Trim() -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Ошибка при чтении публичного ключа: $_" -ForegroundColor Red
    exit 1
}

# Шаг 4: Инструкции по копированию на VPS
Write-Host "📋 Шаг 4: Копирование публичного ключа на VPS" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Выполните следующие команды в НОВОМ терминале PowerShell:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Подключитесь к VPS:" -ForegroundColor White
Write-Host "   ssh root@217.119.129.239" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Введите пароль: 9sTUF001ug33" -ForegroundColor White
Write-Host ""
Write-Host "3. На VPS выполните следующие команды:" -ForegroundColor White
Write-Host ""
Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Cyan
Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Cyan
Write-Host "   echo '$publicKeyContent' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host ""
Write-Host "Или одной командой:" -ForegroundColor Yellow
Write-Host "   mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$publicKeyContent' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host ""

# Шаг 5: Настройка для пользователя botuser
Write-Host "📋 Шаг 5: Настройка для пользователя botuser" -ForegroundColor Yellow
Write-Host ""
Write-Host "После добавления ключа, на VPS выполните:" -ForegroundColor White
Write-Host ""
Write-Host "   # Создаем пользователя botuser (если не создан)" -ForegroundColor Gray
Write-Host "   adduser botuser" -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Добавляем в sudo" -ForegroundColor Gray
Write-Host "   usermod -aG sudo botuser" -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Копируем ключи" -ForegroundColor Gray
Write-Host "   cp /root/.ssh/authorized_keys /home/botuser/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Устанавливаем права" -ForegroundColor Gray
Write-Host "   chmod 600 /home/botuser/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host "   chmod 700 /home/botuser/.ssh" -ForegroundColor Cyan
Write-Host "   chown -R botuser:botuser /home/botuser/.ssh" -ForegroundColor Cyan
Write-Host ""
Write-Host "Или одной командой:" -ForegroundColor Yellow
Write-Host "   adduser botuser && usermod -aG sudo botuser && mkdir -p /home/botuser/.ssh && cp /root/.ssh/authorized_keys /home/botuser/.ssh/authorized_keys && chmod 600 /home/botuser/.ssh/authorized_keys && chmod 700 /home/botuser/.ssh && chown -R botuser:botuser /home/botuser/.ssh" -ForegroundColor Cyan
Write-Host ""

# Шаг 6: Тест подключения
Write-Host "📋 Шаг 6: Тест подключения" -ForegroundColor Yellow
Write-Host ""
Write-Host "После выполнения всех шагов на VPS, выполните в PowerShell:" -ForegroundColor White
Write-Host ""
Write-Host "   ssh -i '$privateKey' botuser@217.119.129.239" -ForegroundColor Cyan
Write-Host ""
Write-Host "Если подключение прошло успешно без пароля - отлично!" -ForegroundColor Green
Write-Host ""

# Сохранение публичного ключа в файл для удобства
$keyFile = "$env:TEMP\vps_public_key.txt"
$publicKeyContent.Trim() | Out-File -FilePath $keyFile -Encoding UTF8
Write-Host "📁 Публичный ключ сохранен в: $keyFile" -ForegroundColor Gray
Write-Host ""

Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
