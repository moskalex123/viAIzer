#!/bin/bash
# Скрипт для генерации SSH ключа для VPS 217.119.129.239
# Сохраняет ключ в текущей папке проекта

set -e

# Конфигурация
VPS_IP="217.119.129.239"
KEY_NAME="vps_bot_key"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY_PATH="$PROJECT_DIR/$KEY_NAME"
PUB_KEY_PATH="$KEY_PATH.pub"

echo "========================================"
echo "Генерация SSH ключа для VPS"
echo "IP VPS: $VPS_IP"
echo "Путь к ключу: $KEY_PATH"
echo "========================================"

# Проверяем, существует ли уже ключ
if [ -f "$KEY_PATH" ]; then
    echo "ВНИМАНИЕ: Ключ $KEY_NAME уже существует!"
    read -p "Хотите перезаписать существующий ключ? (yes/no): " response
    
    if [ "$response" != "yes" ]; then
        echo "Операция отменена."
        exit 1
    fi
    
    # Удаляем старые ключи
    rm -f "$KEY_PATH" "$PUB_KEY_PATH"
    echo "Старые ключи удалены."
fi

# Проверяем наличие ssh-keygen
if ! command -v ssh-keygen &> /dev/null; then
    echo "ОШИБКА: ssh-keygen не найден. Установите openssh-client."
    exit 1
fi

# Генерируем новый SSH ключ
echo ""
echo "Генерация нового SSH ключа..."
ssh-keygen -t ed25519 -f "$KEY_PATH" -C "vps_bot@$VPS_IP" -N ""

echo "SSH ключ успешно создан!"

# Проверяем созданные файлы
if [ -f "$KEY_PATH" ]; then
    echo ""
    echo "Приватный ключ: $KEY_PATH"
    echo "Размер: $(stat -f%z "$KEY_PATH" 2>/dev/null || stat -c%s "$KEY_PATH") байт"
fi

if [ -f "$PUB_KEY_PATH" ]; then
    echo "Публичный ключ: $PUB_KEY_PATH"
    echo "Размер: $(stat -f%z "$PUB_KEY_PATH" 2>/dev/null || stat -c%s "$PUB_KEY_PATH") байт"
    
    # Показываем публичный ключ
    echo ""
    echo "Публичный ключ (для добавления на VPS):"
    echo "----------------------------------------"
    cat "$PUB_KEY_PATH"
    echo "----------------------------------------"
fi

# Инструкции по настройке
echo ""
echo "========================================"
echo "СЛЕДУЮЩИЕ ШАГИ:"
echo "========================================"
echo "1. Скопируйте публичный ключ на VPS:"
echo "   ssh-copy-id -i \"$PUB_KEY_PATH\" root@$VPS_IP"
echo ""
echo "   Или вручную:"
echo "   a) Скопируйте публичный ключ выше"
echo "   b) Подключитесь к VPS: ssh root@$VPS_IP"
echo "   c) Добавьте ключ в ~/.ssh/authorized_keys"
echo ""
echo "2. Проверьте подключение:"
echo "   ssh -i \"$KEY_PATH\" root@$VPS_IP"
echo ""
echo "3. Для автоматического подключения добавьте в ~/.ssh/config:"
echo "   Host vps"
echo "       HostName $VPS_IP"
echo "       User root"
echo "       IdentityFile $KEY_PATH"
echo "========================================"

# Предлагаем сразу скопировать ключ на VPS
echo ""
echo "Хотите скопировать публичный ключ на VPS сейчас?"
read -p "Введите 'yes' для копирования ключа через ssh-copy-id (требуется пароль root): " copyResponse

if [ "$copyResponse" = "yes" ]; then
    echo ""
    echo "Копирование публичного ключа на VPS..."
    
    if ssh-copy-id -i "$PUB_KEY_PATH" "root@$VPS_IP"; then
        echo "Публичный ключ успешно скопирован на VPS!"
        echo "Теперь можно подключаться без пароля:"
        echo "ssh -i \"$KEY_PATH\" root@$VPS_IP"
    else
        echo "ОШИБКА при копировании ключа."
        echo "Попробуйте скопировать ключ вручную, следуя инструкциям выше."
    fi
fi

echo ""
echo "Готово!"

# Устанавливаем правильные права для приватного ключа
chmod 600 "$KEY_PATH"
echo "Установлены права доступа 600 для приватного ключа"
