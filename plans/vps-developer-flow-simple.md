# 🚀 Упрощенный VPS Developer Flow (Без Docker)

## 📋 Обзор

Максимально простой и эффективный workflow для разработки Telegram бота на Ubuntu VPS через SSH с Android устройства. Без Docker, с нативными сервисами.

```
Android (Termux/JuiceSSH) → SSH → VPS (Ubuntu)
                              ↓
                         Node.js + PM2
                              ↓
                         Redis + PostgreSQL
```

---

## 🎯 Преимущества подхода без Docker

✅ **Простота** - прямая установка, без контейнеров  
✅ **Быстрота** - мгновенный перезапуск, без сборки образов  
✅ **Минимум ресурсов** - меньше потребление RAM/CPU  
✅ **Простая отладка** - прямой доступ к процессам  
✅ **Удобство для Android** - все через SSH терминал  

---

## 📦 Часть 1: Начальная настройка VPS

### 1.1 Подключение к VPS

```bash
# С Android через Termux/JuiceSSH
ssh root@your-vps-ip

# Или с SSH ключом
ssh -i ~/.ssh/your-key.pem root@your-vps-ip
```

### 1.2 Быстрая настройка системы

```bash
# Обновление и базовые пакеты (одной командой)
apt update && apt upgrade -y && \
apt install -y curl wget git vim nano htop tmux ufw fail2ban unzip \
build-essential python3 python3-pip software-properties-common

# Настройка часового пояса
timedatectl set-timezone Europe/Moscow

# Создание пользователя
adduser botuser && \
usermod -aG sudo botuser && \
mkdir -p /home/botuser/.ssh && \
chmod 700 /home/botuser/.ssh
```

### 1.3 Настройка SSH ключей

```bash
# С локальной машины (или Android Termux)
ssh-keygen -t ed25519 -f ~/.ssh/vps_bot_key

# Копирование ключа
ssh-copy-id -i ~/.ssh/vps_bot_key.pub botuser@your-vps-ip

# Или вручную на VPS
nano /home/botuser/.ssh/authorized_keys
# Вставьте ваш публичный ключ

chmod 600 /home/botuser/.ssh/authorized_keys
chown -R botuser:botuser /home/botuser/.ssh
```

### 1.4 Усиление безопасности SSH

```bash
# Редактирование конфигурации
sudo nano /etc/ssh/sshd_config

# Измените:
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Перезапуск
sudo systemctl restart sshd
```

### 1.5 Настройка Firewall

```bash
# Разрешить SSH (новый порт)
sudo ufw allow 2222/tcp

# Разрешить HTTP/HTTPS (если нужен webhook)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включить firewall
sudo ufw enable

# Проверить статус
sudo ufw status
```

### 1.6 Настройка Fail2Ban

```bash
sudo apt install -y fail2ban

sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

sudo nano /etc/fail2ban/jail.local

# Добавьте:
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 3600
findtime = 600

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🔧 Часть 2: Установка окружения (Без Docker)

### 2.1 Установка Node.js 18+ (через NVM)

```bash
# Переключение на пользователя
su - botuser

# Установка NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Перезагрузка
source ~/.bashrc

# Установка Node.js
nvm install 18
nvm use 18
nvm alias default 18

# Проверка
node --version
npm --version

# Глобальные пакеты
npm install -g pm2 nodemon yarn
```

### 2.2 Установка Redis (нативно)

```bash
# Установка
sudo apt install -y redis-server

# Настройка
sudo nano /etc/redis/redis.conf

# Измените:
bind 127.0.0.1
requirepass your_strong_redis_password
maxmemory 256mb
maxmemory-policy allkeys-lru

# Перезапуск
sudo systemctl enable redis
sudo systemctl start redis

# Проверка
redis-cli ping
# Должно вернуть: PONG

# Тест с паролем
redis-cli -a your_strong_redis_password ping
```

### 2.3 Установка PostgreSQL (нативно)

```bash
# Установка
sudo apt install -y postgresql postgresql-contrib

# Создание базы данных и пользователя
sudo -u postgres psql

# В PostgreSQL консоли:
CREATE USER botuser WITH PASSWORD 'your_strong_password';
CREATE DATABASE gemini_bot OWNER botuser;
GRANT ALL PRIVILEGES ON DATABASE gemini_bot TO botuser;
\q

# Проверка
sudo -u postgres psql -c "l"

# Настройка удаленного доступа (если нужно)
sudo nano /etc/postgresql/15/main/postgresql.conf
# Измените: listen_addresses = 'localhost'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Добавьте: local all all peer

sudo systemctl restart postgresql
```

### 2.4 Установка Nginx (для webhook, если нужен)

```bash
# Установка
sudo apt install -y nginx

# Базовая конфигурация
sudo nano /etc/nginx/sites-available/gemini-bot

# Добавьте:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
    }
}

# Активация
sudo ln -s /etc/nginx/sites-available/gemini-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2.5 Установка SSL (если нужен webhook)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo certbot renew --dry-run
```

---

## 📁 Часть 3: Настройка проекта

### 3.1 Клонирование проекта

```bash
# Создание директории
cd ~
mkdir -p ~/gemini-bot
cd ~/gemini-bot

# Клонирование с GitHub
git clone https://github.com/your-username/gemini-bot.git .

# Или инициализация нового репозитория
git init
git remote add origin https://github.com/your-username/gemini-bot.git
```

### 3.2 Установка зависимостей

```bash
# Установка зависимостей
npm ci --production

# Или для разработки
npm install
```

### 3.3 Настройка переменных окружения

```bash
# Создание .env файла
cp .env.example .env

# Редактирование
nano .env

# Добавьте:
BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
OPENROUTER=true
OPENROUTER_API_KEY=your_openrouter_api_key
NANO_OPENROUTER_MODEL_NAME=google/gemini-2.5-flash-image
KIE_AI_ENABLED=true
KIE_AI_API_KEY=your_kie_ai_api_key
KIE_AI_POLL_INTERVAL=2000
KIE_AI_MAX_WAIT_TIME=120000
NODE_ENV=production
REDIS_URL=redis://:your_redis_password@localhost:6379
DATABASE_URL=postgresql://botuser:your_db_password@localhost:5432/gemini_bot
LOG_LEVEL=info
PORT=3000

# Защита файла
chmod 600 .env
```

---

## 🚀 Часть 4: Управление через PM2

### 4.1 Создание PM2 конфигурации

```bash
# Создание ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gemini-bot',
    script: './bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    time: true
  }]
};
EOF

# Создание директории для логов
mkdir -p logs
```

### 4.2 Запуск бота

```bash
# Запуск в production режиме
pm2 start ecosystem.config.js --env production

# Сохранение конфигурации
pm2 save

# Настройка автозапуска при старте системы
pm2 startup
# Выполните команду, которую покажет PM2

# Проверка статуса
pm2 status

# Просмотр логов
pm2 logs gemini-bot
```

### 4.3 Основные команды PM2

```bash
# Статус
pm2 status

# Логи в реальном времени
pm2 logs gemini-bot

# Логи последних 100 строк
pm2 logs gemini-bot --lines 100

# Перезапуск
pm2 restart gemini-bot

# Перезагрузка без простоя
pm2 reload gemini-bot

# Остановка
pm2 stop gemini-bot

# Удаление
pm2 delete gemini-bot

# Мониторинг
pm2 monit

# Информация о процессе
pm2 show gemini-bot

# Очистка логов
pm2 flush
```

---

## 🔄 Часть 5: Деплой через Git

### 5.1 Настройка Git

```bash
# Настройка имени и email
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Настройка SSH ключей для GitHub
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_key

# Добавьте публичный ключ в GitHub
cat ~/.ssh/github_key.pub
# Settings → SSH and GPG keys → New SSH key

# Тест подключения
ssh -T git@github.com
```

### 5.2 Деплой через GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd ~/gemini-bot
            git pull origin main
            npm ci --production
            pm2 reload gemini-bot
            echo "✅ Deployment successful!"

      - name: Health check
        run: |
          sleep 10
          curl -f ${{ secrets.BOT_URL }}/health || exit 1
```

### 5.3 Ручной деплой через SSH

```bash
# Подключение к VPS
ssh botuser@your-vps-ip -p 2222

# Переход в проект
cd ~/gemini-bot

# Пул изменений
git pull origin main

# Установка зависимостей (если изменились)
npm ci --production

# Перезапуск бота
pm2 reload gemini-bot

# Проверка логов
pm2 logs gemini-bot --lines 50
```

---

## 📱 Часть 6: Работа с Android

### 6.1 Рекомендуемые приложения

**Termux** - терминал с Linux окружением
```bash
# Установка в Termux
pkg install git openssh nano vim htop

# Подключение к VPS
ssh -i ~/.ssh/vps_bot_key botuser@your-vps-ip -p 2222
```

**JuiceSSH** - удобный SSH клиент
- Сохранение профилей соединений
- Поддержка SSH ключей
- Удобный интерфейс

**AndroSSH** - альтернатива JuiceSSH
- Бесплатный
- Поддержка ключей

**Termius** - продвинутый SSH клиент
- Синхронизация настроек
- Поддержка SFTP
- Автодополнение

### 6.2 Создание алиасов для быстрой работы

```bash
# На VPS
nano ~/.bashrc

# Добавьте в конец:
alias bot='cd ~/gemini-bot'
alias botlog='pm2 logs gemini-bot --lines 100'
alias botrestart='cd ~/gemini-bot && pm2 reload gemini-bot'
alias botstatus='pm2 status'
alias botdeploy='cd ~/gemini-bot && git pull && npm ci --production && pm2 reload gemini-bot'
alias botmonit='pm2 monit'
alias redis='redis-cli -a your_redis_password'
alias db='sudo -u postgres psql -d gemini_bot'

# Применение изменений
source ~/.bashrc
```

### 6.3 Быстрые команды с Android

```bash
# Подключение и проверка статуса
ssh botuser@your-vps-ip -p 2222
botstatus

# Просмотр логов
botlog

# Перезапуск
botrestart

# Деплой
botdeploy

# Мониторинг
botmonit
```

---

## 🛠️ Часть 7: Полезные скрипты

### 7.1 Скрипт быстрого деплоя

```bash
#!/bin/bash
# ~/gemini-bot/deploy.sh

set -e

echo "🚀 Starting deployment..."

# Проверка изменений
cd ~/gemini-bot

# Пул изменений
echo "📥 Pulling latest changes..."
git pull origin main

# Установка зависимостей
echo "📦 Installing dependencies..."
npm ci --production

# Перезапуск бота
echo "🔄 Restarting bot..."
pm2 reload gemini-bot

# Ожидание запуска
echo "⏳ Waiting for bot to start..."
sleep 5

# Проверка статуса
echo "📊 Bot status:"
pm2 status

echo "✅ Deployment completed!"
```

Сделать исполняемым:
```bash
chmod +x ~/gemini-bot/deploy.sh
```

### 7.2 Скрипт просмотра логов

```bash
#!/bin/bash
# ~/gemini-bot/logs.sh

echo "📋 Bot Logs (last 50 lines):"
pm2 logs gemini-bot --lines 50 --nostream

echo ""
echo "📊 Bot Status:"
pm2 status
```

### 7.3 Скрипт мониторинга

```bash
#!/bin/bash
# ~/gemini-bot/monitor.sh

echo "📊 System Status"
echo "=================="

echo ""
echo "🖥️ CPU & Memory:"
free -h
echo ""
top -bn1 | head -15

echo ""
echo "⚡ PM2 Status:"
pm2 status

echo ""
echo "📈 Disk Usage:"
df -h

echo ""
echo "🌐 Network Connections:"
netstat -tuln | grep LISTEN | grep -E ':(3000|6379|5432|2222)'

echo ""
echo "📦 Services Status:"
systemctl status redis --no-pager
systemctl status postgresql --no-pager
```

### 7.4 Скрипт бэкапа

```bash
#!/bin/bash
# ~/gemini-bot/backup.sh

BACKUP_DIR="/home/botuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo "💾 Starting backup..."

# Бэкап базы данных
sudo -u postgres pg_dump gemini_bot > $BACKUP_DIR/db_$DATE.sql

# Бэкап Redis
redis-cli -a your_redis_password --rdb /tmp/dump_$DATE.rdb
cp /tmp/dump_$DATE.rdb $BACKUP_DIR/

# Бэкап .env файла
cp ~/gemini-bot/.env $BACKUP_DIR/.env_$DATE

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR"
```

### 7.5 Скрипт обновления

```bash
#!/bin/bash
# ~/gemini-bot/update.sh

set -e

echo "🔄 Updating system..."

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Обновление Node.js
source ~/.bashrc
nvm install 18
nvm use 18

# Обновление npm пакетов
cd ~/gemini-bot
npm update

# Перезапуск бота
pm2 reload gemini-bot

echo "✅ Update completed!"
```

---

## 📊 Часть 8: Мониторинг и отладка

### 8.1 Просмотр логов

```bash
# PM2 логи
pm2 logs gemini-bot

# Логи ошибок
pm2 logs gemini-bot --err

# Логи вывода
pm2 logs gemini-bot --out

# Логи с фильтром
pm2 logs gemini-bot --lines 100 | grep ERROR

# Следить за логами в реальном времени
pm2 logs gemini-bot --lines 0
```

### 8.2 Мониторинг ресурсов

```bash
# PM2 мониторинг
pm2 monit

# Системный мониторинг
htop

# Использование памяти
free -h

# Использование диска
df -h

# Процессы Node.js
ps aux | grep node

# Сетевые соединения
netstat -tuln | grep LISTEN
```

### 8.3 Отладка Redis

```bash
# Подключение к Redis
redis-cli -a your_redis_password

# Команды Redis:
KEYS session:*          # Все сессии
GET session:123456      # Получить сессию
DEL session:123456      # Удалить сессию
DBSIZE                  # Количество ключей
INFO                     # Информация о сервере
FLUSHDB                 # Очистить базу (ОСТОРОЖНО!)
```

### 8.4 Отладка PostgreSQL

```bash
# Подключение к базе
sudo -u postgres psql -d gemini_bot

# Основные команды:
\dt                      # Все таблицы
\d table_name            # Структура таблицы
SELECT * FROM users;     # Все пользователи
\q                       # Выход
```

---

## 🔐 Часть 9: Безопасность

### 9.1 Проверка безопасности

```bash
# Проверка открытых портов
sudo netstat -tuln

# Проверка SSH попыток
sudo lastb

# Проверка fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd

# Проверка firewall
sudo ufw status verbose
```

### 9.2 Регулярное обновление

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Обновление npm пакетов
cd ~/gemini-bot
npm outdated
npm update

# Обновление Node.js
nvm install 18
nvm use 18
```

### 9.3 Бэкапы

```bash
# Ручной бэкап
~/gemini-bot/backup.sh

# Автоматический бэкап (cron)
crontab -e

# Добавьте (ежедневно в 2:00):
0 2 * * * /home/botuser/gemini-bot/backup.sh >> /var/log/bot-backup.log 2>&1
```

---

## 📋 Часть 10: Ежедневный workflow

### 10.1 Утренняя проверка

```bash
# Подключение к VPS
ssh botuser@your-vps-ip -p 2222

# Проверка статуса бота
botstatus

# Просмотр логов
botlog

# Проверка ресурсов
htop
```

### 10.2 Деплой изменений

```bash
# Подключение
ssh botuser@your-vps-ip -p 2222

# Деплой
botdeploy

# Проверка логов
botlog

# Мониторинг
botmonit
```

### 10.3 Решение проблем

```bash
# Если бот не отвечает
botrestart

# Если нужно больше логов
pm2 logs gemini-bot --lines 200

# Если нужно перезапустить Redis
sudo systemctl restart redis

# Если нужно перезапустить PostgreSQL
sudo systemctl restart postgresql

# Если нужно проверить память
free -h
pm2 show gemini-bot
```

---

## 🎯 Часть 11: Быстрые команды (шпаргалка)

```bash
# === Подключение ===
ssh botuser@your-vps-ip -p 2222

# === Статус ===
botstatus                # Статус бота
pm2 status              # Все процессы
systemctl status redis  # Статус Redis
systemctl status postgresql  # Статус PostgreSQL

# === Логи ===
botlog                  # Логи бота
pm2 logs gemini-bot     # PM2 логи
tail -f logs/pm2-error.log  # Логи ошибок

# === Управление ===
botrestart              # Перезапуск бота
pm2 reload gemini-bot   # Перезагрузка без простоя
pm2 stop gemini-bot     # Остановить бота
pm2 start gemini-bot    # Запустить бота

# === Деплой ===
botdeploy               # Быстрый деплой
cd ~/gemini-bot && git pull && npm ci --production && pm2 reload gemini-bot

# === Мониторинг ===
botmonit                # PM2 мониторинг
htop                    # Системный мониторинг
pm2 show gemini-bot     # Информация о процессе

# === Базы данных ===
redis                   # Redis CLI
db                      # PostgreSQL CLI

# === Система ===
free -h                 # Память
df -h                   # Диск
netstat -tuln          # Сетевые соединения

# === Бэкап ===
~/gemini-bot/backup.sh  # Создать бэкап

# === Обновление ===
sudo apt update && sudo apt upgrade -y  # Обновить систему
npm update              # Обновить пакеты
```

---

## 📱 Часть 12: Android Termux настройки

### 12.1 Установка Termux

```bash
# В Termux
pkg update && pkg upgrade

# Установка необходимых пакетов
pkg install git openssh nano vim htop curl wget

# Настройка SSH ключей
ssh-keygen -t ed25519 -f ~/.ssh/vps_key

# Копирование ключа на VPS
ssh-copy-id -i ~/.ssh/vps_key.pub botuser@your-vps-ip -p 2222

# Создание алиасов
echo "alias vps='ssh -i ~/.ssh/vps_key botuser@your-vps-ip -p 2222'" >> ~/.bashrc
source ~/.bashrc

# Теперь можно подключаться просто:
vps
```

### 12.2 Настройка Termux для удобной работы

```bash
# Установка zsh (опционально)
pkg install zsh

# Установка oh-my-zsh (опционально)
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Настройка .bashrc или .zshrc
nano ~/.bashrc

# Добавьте:
export EDITOR=nano
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias vps='ssh -i ~/.ssh/vps_key botuser@your-vps-ip -p 2222'

# Применение
source ~/.bashrc
```

---

## 🚨 Часть 13: Решение проблем

### 13.1 Бот не запускается

```bash
# Проверка логов
pm2 logs gemini-bot --err

# Проверка конфигурации
pm2 show gemini-bot

# Проверка порта
netstat -tuln | grep 3000

# Проверка переменных окружения
cat .env

# Ручной запуск для отладки
NODE_ENV=production node bot.js
```

### 13.2 Проблемы с Redis

```bash
# Проверка статуса
systemctl status redis

# Проверка подключения
redis-cli -a your_redis_password ping

# Проверка логов
sudo tail -f /var/log/redis/redis-server.log

# Перезапуск
sudo systemctl restart redis
```

### 13.3 Проблемы с PostgreSQL

```bash
# Проверка статуса
systemctl status postgresql

# Проверка подключения
sudo -u postgres psql -c "SELECT version();"

# Проверка логов
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Перезапуск
sudo systemctl restart postgresql
```

### 13.4 Проблемы с памятью

```bash
# Проверка использования памяти
free -h
pm2 show gemini-bot

# Перезапуск бота
pm2 restart gemini-bot

# Проверка Node.js процессов
ps aux | grep node

# Если нужно увеличить лимит памяти
# В ecosystem.config.js:
max_memory_restart: '2G'
```

---

## 📊 Часть 14: Мониторинг через Telegram

### 14.1 Создание скрипта для мониторинга

```bash
#!/bin/bash
# ~/gemini-bot/telegram-monitor.sh

BOT_TOKEN="your_bot_token"
CHAT_ID="your_chat_id"

# Получение статуса
STATUS=$(pm2 status gemini-bot | grep "online" | wc -l)
MEMORY=$(free -h | grep Mem | awk '{print $3 "/" $2}')
DISK=$(df -h / | tail -1 | awk '{print $3 "/" $2}')

# Отправка сообщения
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d "chat_id=$CHAT_ID" \
  -d "text=📊 Bot Status:
✅ Online: $STATUS
💾 Memory: $MEMORY
💿 Disk: $DISK
🕐 $(date)"
```

### 14.2 Настройка автоматических уведомлений

```bash
# Добавить в crontab
crontab -e

# Ежедневные отчеты в 9:00
0 9 * * * /home/botuser/gemini-bot/telegram-monitor.sh

# Проверка каждые 5 минут
*/5 * * * * /home/botuser/gemini-bot/telegram-monitor.sh
```

---

## ✅ Часть 15: Чек-лист для быстрого старта

### Первичная настройка (один раз):

- [ ] Подключиться к VPS как root
- [ ] Создать пользователя botuser
- [ ] Настроить SSH ключи
- [ ] Усилить безопасность SSH (изменить порт, отключить root)
- [ ] Настроить firewall (UFW)
- [ ] Установить Fail2Ban
- [ ] Установить Node.js через NVM
- [ ] Установить Redis
- [ ] Установить PostgreSQL (если нужно)
- [ ] Установить PM2
- [ ] Клонировать проект
- [ ] Настроить .env файл
- [ ] Создать ecosystem.config.js
- [ ] Запустить бота через PM2
- [ ] Настроить автозапуск PM2
- [ ] Создать алиасы в .bashrc
- [ ] Настроить бэкапы
- [ ] Настроить мониторинг

### Ежедневная проверка:

- [ ] Подключиться к VPS
- [ ] Проверить статус бота: `botstatus`
- [ ] Просмотреть логи: `botlog`
- [ ] Проверить ресурсы: `htop`

### Перед деплоем:

- [ ] Протестировать изменения локально
- [ ] Сделать бэкап: `backup.sh`
- [ ] Проверить ветку: `git branch`
- [ ] Обновить документацию

### После деплоя:

- [ ] Проверить статус: `botstatus`
- [ ] Проверить логи: `botlog`
- [ ] Протестировать бота в Telegram
- [ ] Проверить мониторинг

---

## 🎯 Заключение

Этот упрощенный workflow обеспечивает:

✅ **Максимальную простоту** - без Docker, с нативными сервисами  
✅ **Быстроту работы** - мгновенный перезапуск и деплой  
✅ **Минимум ресурсов** - меньше потребление RAM/CPU  
✅ **Удобство для Android** - все через SSH терминал  
✅ **Надежность** - PM2, логирование, мониторинг  
✅ **Безопасность** - SSH ключи, firewall, fail2ban  

### Ключевые преимущества без Docker:

1. **Прямой доступ** - нет абстракции контейнеров
2. **Быстрый перезапуск** - без сборки образов
3. **Простая отладка** - прямой доступ к процессам
4. **Меньше ресурсов** - нет оверхеда Docker
5. **Проще для Android** - все через SSH терминал

### Основные команды для Android:

```bash
# Подключение
ssh botuser@your-vps-ip -p 2222

# Статус
botstatus

# Логи
botlog

# Перезапуск
botrestart

# Деплой
botdeploy

# Мониторинг
botmonit
```

Этот workflow идеально подходит для работы с Android устройства через SSH!

---

*Документ создан: 2026-01-01*  
*Автор: Kilo Code (Architect Mode)*
