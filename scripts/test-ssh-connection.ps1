# Скрипт для тестирования SSH подключения к VPS
# Запустите этот скрипт в PowerShell

Write-Host "🔑 Тестирование SSH подключения к VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия ключей
$privateKey = "D:\viAIzer\ssh\vps_bot_key"
$publicKey = "D:\viAIzer\ssh\vps_bot_key.pub"

Write-Host "📋 Проверка SSH ключей..." -ForegroundColor Yellow
if (Test-Path $privateKey) {
    Write-Host "✅ Приватный ключ найден: $privateKey" -ForegroundColor Green
} else {
    Write-Host "❌ Приватный ключ НЕ найден: $privateKey" -ForegroundColor Red
    exit 1
}

if (Test-Path $publicKey) {
    Write-Host "✅ Публичный ключ найден: $publicKey" -ForegroundColor Green
} else {
    Write-Host "❌ Публичный ключ НЕ найден: $publicKey" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Проверка прав доступа к ключам..." -ForegroundColor Yellow
$acl = Get-Acl $privateKey
Write-Host "Права на приватный ключ: $($acl.AccessToString)" -ForegroundColor Gray

Write-Host ""
Write-Host "🔗 Попытка подключения к VPS..." -ForegroundColor Yellow
Write-Host "IP: 217.119.129.239" -ForegroundColor Gray
Write-Host "Пользователь: botuser" -ForegroundColor Gray
Write-Host "Ключ: $privateKey" -ForegroundColor Gray
Write-Host ""

# Тест подключения
try {
    $result = ssh -i $privateKey -o StrictHostKeyChecking=no -o ConnectTimeout=10 botuser@217.119.129.239 "echo '✅ SSH подключение успешно!' && whoami && hostname && date"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ SSH подключение работает корректно!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Следующие шаги:" -ForegroundColor Cyan
        Write-Host "1. Подключитесь к VPS: ssh -i '$privateKey' botuser@217.119.129.239" -ForegroundColor White
        Write-Host "2. Настройте SSH config для удобства" -ForegroundColor White
        Write-Host "3. Продолжите установку окружения" -ForegroundColor White
    } else {
        Write-Host "❌ Ошибка SSH подключения. Код выхода: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 Возможные причины:" -ForegroundColor Yellow
        Write-Host "1. Публичный ключ не добавлен на VPS" -ForegroundColor White
        Write-Host "2. Неправильные права на файл authorized_keys на VPS" -ForegroundColor White
        Write-Host "3. Пользователь botuser не создан на VPS" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 Решение:" -ForegroundColor Cyan
        Write-Host "1. Подключитесь как root: ssh root@217.119.129.239" -ForegroundColor White
        Write-Host "2. Выполните на VPS:" -ForegroundColor White
        Write-Host "   cp /root/.ssh/authorized_keys /home/botuser/.ssh/authorized_keys" -ForegroundColor Gray
        Write-Host "   chmod 600 /home/botuser/.ssh/authorized_keys" -ForegroundColor Gray
        Write-Host "   chown -R botuser:botuser /home/botuser/.ssh" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Ошибка при подключении: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Попробуйте подключиться вручную:" -ForegroundColor Yellow
    Write-Host "ssh -i '$privateKey' botuser@217.119.129.239" -ForegroundColor White
}

Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
