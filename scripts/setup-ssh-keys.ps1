# Скрипт для настройки SSH ключей и копирования на VPS
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

# Шаг 1: Создание директории для SSH ключей
Write-Host "📋 Шаг 1: Создание директории для SSH ключей..." -ForegroundColor Yellow
if (!(Test-Path -Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "✅ Директория создана: $sshDir" -ForegroundColor Green
} else {
    Write-Host "✅ Директория уже существует: $sshDir" -ForegroundColor Green
}
Write-Host ""

# Шаг 2: Генерация SSH ключей
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
$keyGenArgs = @("-t", "ed25519", "-f", $privateKey, "-C", "botuser@vps", "-N", "")
& ssh-keygen @keyGenArgs

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
    Write-Host $publicKeyContent.Trim() -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка при чтении публичного ключа: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Шаг 4: Подключение к VPS и добавление ключа
Write-Host "📋 Шаг 4: Добавление публичного ключа на VPS..." -ForegroundColor Yellow
Write-Host "IP: $vpsIp" -ForegroundColor Gray
Write-Host "Пользователь: $vpsUser" -ForegroundColor Gray
Write-Host "Пароль: $vpsPassword" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Подключение к VPS..." -ForegroundColor Cyan
Write-Host "Пожалуйста, введите пароль когда будет запрошен." -ForegroundColor Yellow
Write-Host ""

# Создаем команду для добавления ключа
$addKeyCommand = @"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "$publicKeyContent" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ Ключ добавлен на VPS"
ls -la ~/.ssh/
"@

# Сохраняем команду во временный файл
$tempCmdFile = "$env:TEMP\add-ssh-key.txt"
$addKeyCommand | Out-File -FilePath $tempCmdFile -Encoding UTF8

# Читаем команду и передаем в SSH
$commandContent = Get-Content $tempCmdFile -Raw
$sshArgs = @("-o", "StrictHostKeyChecking=no", "${vpsUser}@${vpsIp}", $commandContent)
& ssh @sshArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Публичный ключ успешно добавлен на VPS!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Ошибка при добавлении ключа на VPS" -ForegroundColor Red
    Write-Host "Код выхода: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Попробуйте подключиться вручную:" -ForegroundColor Yellow
    Write-Host "ssh $vpsUser@$vpsIp" -ForegroundColor White
}

Remove-Item $tempCmdFile -Force -ErrorAction SilentlyContinue

Write-Host ""

# Шаг 5: Копирование ключей для пользователя botuser
Write-Host "📋 Шаг 5: Настройка ключей для пользователя botuser..." -ForegroundColor Yellow
Write-Host "Подключение к VPS для настройки..." -ForegroundColor Cyan
Write-Host ""

$setupCommands = @"
# Проверяем существование пользователя botuser
if id botuser >/dev/null 2>&1; then
    echo "✅ Пользователь botuser существует"
    
    # Создаем директорию .ssh для botuser
    mkdir -p /home/botuser/.ssh
    
    # Копируем authorized_keys из root в botuser
    cp /root/.ssh/authorized_keys /home/botuser/.ssh/authorized_keys
    
    # Устанавливаем правильные права
    chmod 600 /home/botuser/.ssh/authorized_keys
    chmod 700 /home/botuser/.ssh
    
    # Устанавливаем владельца
    chown -R botuser:botuser /home/botuser/.ssh
    
    echo "✅ Ключи скопированы для пользователя botuser"
    
    # Проверка прав
    echo ""
    echo "Проверка прав:"
    ls -la /home/botuser/.ssh/
else
    echo "❌ Пользователь botuser не найден"
    echo "Создайте пользователя командой: adduser botuser"
    exit 1
fi
"@

$setupScript = "$env:TEMP\setup-botuser.sh"
$setupCommands | Out-File -FilePath $setupScript -Encoding UTF8

Write-Host "Выполнение команд настройки на VPS..." -ForegroundColor Gray
Write-Host "Пароль: $vpsPassword" -ForegroundColor White
Write-Host ""

# Читаем скрипт и передаем в SSH
$scriptContent = Get-Content $setupScript -Raw
$setupArgs = @("-o", "StrictHostKeyChecking=no", "${vpsUser}@${vpsIp}", "bash", "-s")
$scriptContent | & ssh @setupArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Настройка ключей для botuser завершена!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Ошибка при настройке ключей для botuser" -ForegroundColor Red
}

Remove-Item $setupScript -Force -ErrorAction SilentlyContinue

Write-Host ""

# Шаг 6: Тест подключения с ключом
Write-Host "📋 Шаг 6: Тест подключения с SSH ключом..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Попытка подключения к VPS как botuser..." -ForegroundColor Cyan
Write-Host "Используется ключ: $privateKey" -ForegroundColor Gray
Write-Host ""

$testArgs = @("-i", $privateKey, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10", "botuser@${vpsIp}", "echo '✅ SSH подключение успешно!' && whoami && hostname && date")
& ssh @testArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SSH подключение работает корректно!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Теперь вы можете подключаться без пароля:" -ForegroundColor Cyan
    Write-Host "ssh -i '$privateKey' botuser@$vpsIp" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Или создайте SSH config для удобства:" -ForegroundColor Cyan
    Write-Host "Host vps-bot" -ForegroundColor Gray
    Write-Host "    HostName $vpsIp" -ForegroundColor Gray
    Write-Host "    Port 22" -ForegroundColor Gray
    Write-Host "    User botuser" -ForegroundColor Gray
    Write-Host "    IdentityFile $privateKey" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 После настройки SSH config подключайтесь так:" -ForegroundColor Cyan
    Write-Host "ssh vps-bot" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ SSH подключение с ключом не работает" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Возможные причины:" -ForegroundColor Yellow
    Write-Host "1. Публичный ключ не добавлен в authorized_keys" -ForegroundColor White
    Write-Host "2. Неправильные права на файл authorized_keys" -ForegroundColor White
    Write-Host "3. Пользователь botuser не создан" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Проверьте на VPS:" -ForegroundColor Cyan
    Write-Host "ssh root@$vpsIp" -ForegroundColor White
    Write-Host "ls -la /home/botuser/.ssh/" -ForegroundColor Gray
    Write-Host "cat /home/botuser/.ssh/authorized_keys" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
