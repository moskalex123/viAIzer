#!/bin/bash
# Команды для выполнения на VPS
# Скопируйте и выполните эти команды на VPS после подключения как root

echo "🔑 Настройка SSH на VPS"
echo "=========================="
echo ""

# Шаг 1: Создание директории .ssh
echo "📋 Шаг 1: Создание директории .ssh..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "✅ Директория создана"
echo ""

# Шаг 2: Добавление публичного ключа
echo "📋 Шаг 2: Добавление публичного ключа..."
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHvVgsuo8UPSZjV9kv3RYT2yEIabT0ClROCKjkwfLho5 botuser@vps' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ Публичный ключ добавлен"
echo ""

# Шаг 3: Проверка
echo "📋 Шаг 3: Проверка authorized_keys..."
ls -la ~/.ssh/
echo ""

# Шаг 4: Создание пользователя botuser
echo "📋 Шаг 4: Создание пользователя botuser..."
if id botuser >/dev/null 2>&1; then
    echo "✅ Пользователь botuser уже существует"
else
    echo "⚠️  Создание пользователя botuser..."
    adduser botuser --gecos "" --disabled-password
    usermod -aG sudo botuser
    echo "✅ Пользователь botuser создан и добавлен в sudo"
fi
echo ""

# Шаг 5: Настройка SSH для botuser
echo "📋 Шаг 5: Настройка SSH для пользователя botuser..."
mkdir -p /home/botuser/.ssh
cp /root/.ssh/authorized_keys /home/botuser/.ssh/authorized_keys
chmod 600 /home/botuser/.ssh/authorized_keys
chmod 700 /home/botuser/.ssh
chown -R botuser:botuser /home/botuser/.ssh
echo "✅ SSH настроен для пользователя botuser"
echo ""

# Шаг 6: Проверка прав
echo "📋 Шаг 6: Проверка прав..."
echo "Права для botuser:"
ls -la /home/botuser/.ssh/
echo ""

# Шаг 7: Тест
echo "📋 Шаг 7: Тестирование..."
echo "Проверка пользователя botuser:"
id botuser
echo ""
echo "✅ Настройка SSH завершена!"
echo ""
echo "📝 Теперь вы можете подключаться с локальной машины:"
echo "ssh -i D:\\viAIzer\\ssh\\vps_bot_key botuser@217.119.129.239"
