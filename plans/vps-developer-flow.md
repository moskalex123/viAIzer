# 🚀 VPS Developer Flow для Gemini Bot

## 📋 Обзор

Этот документ описывает максимально эффективный workflow для разработки и развертывания Telegram бота на чистом Ubuntu VPS.

```
Локальная машина → Git → CI/CD → VPS (Production)
                  ↓
              VPS (Staging)
```

---

## 🎯 Архитектура разработки

```
┌─────────────────────────────────────────────────────────┐
│                    Local Development                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   VS Code    │  │   Docker     │  │   Git        │  │
│  │  (Remote)    │  │  (Local)     │  │  (Push)      │  │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘  │
└─────────┼──────────────────────────────────┼───────────┘
          │                                  │
          │ SSH                              │
          ▼                                  │
┌────────────────────────────────────────────┼───────────┐
│                    VPS (Ubuntu)             │           │
│  ┌────────────────────────────────────────┼────────┐  │
│  │  Development Environment               │        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐│        │  │
│  │  │ Node.js  │  │  Docker  │  │  Redis ││        │  │
│  │  │  18+     │  │  Compose │  │  7.x   ││        │  │
│  │  └──────────┘  └──────────┘  └────────┘│        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐│        │  │
│  │  │ PM2      │  │ Nginx    │  │  Git   ││        │  │
│  │  └──────────┘  └──────────┘  └────────┘│        │  │
│  └────────────────────────────────────────┼────────┘  │
│  ┌────────────────────────────────────────┼────────┐  │
│  │  CI/CD Pipeline                        │        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐│        │  │
│  │  │ GitHub   │  │  Docker   │  │  Auto  ││        │  │
│  │  │ Actions  │  │  Build   │  │ Deploy ││        │  │
│  │  └──────────┘  └──────────┘  └────────┘│        │  │
│  └────────────────────────────────────────┼────────┘  │
│  ┌────────────────────────────────────────┼────────┐  │
│  │  Monitoring & Logging                   │        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐│        │  │
│  │  │ Winston  │  │ Grafana  │  │ Alerts ││        │  │
│  │  └──────────┘  └──────────┘  └────────┘│        │  │
│  └────────────────────────────────────────┼────────┘  │
└────────────────────────────────────────────┼───────────┘
                                           │
                                           │ Pull/Deploy
                                           ▼
                                  ┌────────────────┐
                                  │  Production    │
                                  │  (PM2 Cluster) │
                                  └────────────────┘
```

---

## 📦 Часть 1: Начальная настройка VPS

### 1.1 Подключение к VPS

```bash
# С локальной машины
ssh root@your-vps-ip

# Или с SSH ключом
ssh -i ~/.ssh/your-key.pem root@your-vps-ip
```

### 1.2 Обновление системы

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Установка базовых утилит
apt install -y \
  curl \
  wget \
  git \
  vim \
  nano \
  htop \
  tmux \
  ufw \
  fail2ban \
  unzip \
  build-essential \
  python3 \
  python3-pip \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release

# Настройка часового пояса
timedatectl set-timezone Europe/Moscow
```

### 1.3 Создание пользователя для разработки

```bash
# Создание пользователя
adduser botuser

# Добавление в sudo группу
usermod -aG sudo botuser

# Настройка SSH ключей
mkdir -p /home/botuser/.ssh
chmod 700 /home/botuser/.ssh

# Копируем ваш публичный ключ (с локальной машины)
ssh-copy-id botuser@your-vps-ip

# Или вручную
nano /home/botuser/.ssh/authorized_keys
# Вставьте ваш публичный ключ

chmod 600 /home/botuser/.ssh/authorized_keys
chown -R botuser:botuser /home/botuser/.ssh

# Переключение на пользователя
su - botuser
```

### 1.4 Настройка SSH безопасности

```bash
# Редактирование SSH конфигурации
sudo nano /etc/ssh/sshd_config

# Измените следующие параметры:
Port 2222                          # Измените стандартный порт
PermitRootLogin no                  # Запрет root логина
PasswordAuthentication no           # Запрос пароля по паролю
PubkeyAuthentication yes            # Разрешить только ключи
MaxAuthTries 3                      # Максимум 3 попытки
ClientAliveInterval 300             # Таймаут сессии
ClientAliveCountMax 2

# Перезапуск SSH
sudo systemctl restart sshd
```

### 1.5 Настройка Firewall (UFW)

```bash
# Разрешить SSH (новый порт)
sudo ufw allow 2222/tcp

# Разрешить HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Разрешить Telegram webhook (если используете)
sudo ufw allow 8443/tcp

# Включить firewall
sudo ufw enable

# Проверить статус
sudo ufw status verbose
```

### 1.6 Настройка Fail2Ban

```bash
# Установка
sudo apt install -y fail2ban

# Создание локальной конфигурации
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

sudo nano /etc/fail2ban/jail.local

# Добавьте/измените:
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 3600
findtime = 600

# Перезапуск
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Проверка статуса
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## 🔧 Часть 2: Установка окружения разработки

### 2.1 Установка Node.js 18+ (через NVM)

```bash
# Установка NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Перезагрузка конфигурации
source ~/.bashrc

# Установка последней версии Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Проверка
node --version
npm --version

# Установка глобальных пакетов
npm install -g \
  pm2 \
  nodemon \
  yarn \
  typescript \
  @nestjs/cli \
  docker-compose
```

### 2.2 Установка Docker и Docker Compose

```bash
# Добавление Docker GPG ключа
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление Docker репозитория
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Добавление пользователя в docker группу
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка
docker --version
docker-compose --version

# Выйдите и войдите снова для применения группы docker
exit
ssh botuser@your-vps-ip
```

### 2.3 Установка Redis

```bash
# Установка через Docker (рекомендуется)
docker run -d \
  --name redis \
  --restart unless-stopped \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine \
  redis-server --appendonly yes

# Или установка нативно
sudo apt install -y redis-server

# Настройка Redis
sudo nano /etc/redis/redis.conf

# Измените:
bind 127.0.0.1
requirepass your_strong_password_here
maxmemory 256mb
maxmemory-policy allkeys-lru

# Перезапуск
sudo systemctl enable redis
sudo systemctl start redis

# Проверка
redis-cli ping
# Должно вернуть: PONG
```

### 2.4 Установка PostgreSQL (опционально)

```bash
# Установка через Docker
docker run -d \
  --name postgres \
  --restart unless-stopped \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -e POSTGRES_USER=botuser \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=gemini_bot \
  postgres:15-alpine

# Проверка
docker ps
```

### 2.5 Установка Nginx

```bash
# Установка
sudo apt install -y nginx

# Создание директории для SSL
sudo mkdir -p /etc/letsencrypt/live/your-domain.com

# Настройка Nginx для бота
sudo nano /etc/nginx/sites-available/gemini-bot

# Добавьте конфигурацию (см. ниже в разделе Nginx)
```

### 2.6 Установка Certbot (SSL сертификаты)

```bash
# Установка
sudo apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo certbot renew --dry-run

# Проверка
sudo systemctl status certbot.timer
```

---

## 📁 Часть 3: Структура проекта на VPS

### 3.1 Создание структуры директорий

```bash
# Создание базовой структуры
mkdir -p ~/gemini-bot
cd ~/gemini-bot

# Структура проекта
mkdir -p \
  src \
  src/handlers \
  src/services \
  src/utils \
  src/config \
  logs \
  scripts \
  tests \
  .github/workflows

# Инициализация Git репозитория
git init
```

### 3.2 Клонирование проекта

```bash
# Клонирование с GitHub
git clone https://github.com/your-username/gemini-bot.git .

# Или загрузка файлов с локальной машины
# С локальной машины:
scp -r -P 2222 /path/to/local/project/* botuser@your-vps-ip:~/gemini-bot/
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
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
PORT=3000

# Защита файла
chmod 600 .env
```

---

## 🔐 Часть 4: Безопасность

### 4.1 Настройка SSH ключей

```bash
# На локальной машине
ssh-keygen -t ed25519 -C "botuser@vps" -f ~/.ssh/vps_bot_key

# Копирование ключа на VPS
ssh-copy-id -i ~/.ssh/vps_bot_key.pub -p 2222 botuser@your-vps-ip

# Добавление в SSH config
nano ~/.ssh/config

# Добавьте:
Host vps-bot
    HostName your-vps-ip
    Port 2222
    User botuser
    IdentityFile ~/.ssh/vps_bot_key
    ServerAliveInterval 60

# Теперь можно подключаться просто:
ssh vps-bot
```

### 4.2 Настройка автоматического деплоя через SSH ключи

```bash
# На VPS
cd ~/.ssh
ssh-keygen -t ed25519 -C "github-deploy" -f github_deploy_key

# Добавьте публичный ключ в GitHub репозиторий
# Settings → Deploy keys → Add deploy key
cat github_deploy_key.pub

# Копируйте содержимое и добавьте в GitHub
```

### 4.3 Настройка автоматического бэкапа

```bash
# Создание скрипта бэкапа
sudo nano /usr/local/bin/backup-bot.sh

#!/bin/bash
BACKUP_DIR="/home/botuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec postgres pg_dump -U botuser gemini_bot > $BACKUP_DIR/db_$DATE.sql

# Бэкап Redis
docker exec redis redis-cli --rdb /data/dump_$DATE.rdb
docker cp redis:/data/dump_$DATE.rdb $BACKUP_DIR/

# Бэкап .env файла
cp /home/botuser/gemini-bot/.env $BACKUP_DIR/.env_$DATE

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete

# Отправка на удаленный сервер (опционально)
# rsync -avz $BACKUP_DIR/ user@backup-server:/backups/gemini-bot/

# Сделать исполняемым
sudo chmod +x /usr/local/bin/backup-bot.sh

# Добавить в crontab (ежедневно в 2:00)
crontab -e

# Добавьте:
0 2 * * * /usr/local/bin/backup-bot.sh >> /var/log/bot-backup.log 2>&1
```

---

## 🐳 Часть 5: Docker Compose конфигурация

### 5.1 Создание docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  bot:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gemini-bot
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://botuser:your_password@postgres:5432/gemini_bot
    depends_on:
      - redis
      - postgres
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    networks:
      - bot-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: gemini-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - bot-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres:
    image: postgres:15-alpine
    container_name: gemini-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=botuser
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=gemini_bot
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - bot-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U botuser"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: gemini-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - bot
    networks:
      - bot-network

volumes:
  redis_data:
  postgres_data:

networks:
  bot-network:
    driver: bridge
```

### 5.2 Создание Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка (если нужно)
# RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Установка системных зависимостей
RUN apk add --no-cache \
    curl \
    dumb-init

# Копирование с builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Создание пользователя
RUN addgroup -g 1001 -S bot && \
    adduser -S -u 1001 -G bot bot

# Создание директорий
RUN mkdir -p /app/logs /app/uploads && \
    chown -R bot:bot /app

USER bot

# Использование dumb-init для корректной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]

# Команда запуска
CMD ["node", "bot.js"]
```

---

## 🔄 Часть 6: CI/CD Pipeline (GitHub Actions)

### 6.1 Создание workflow для деплоя

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  DOCKER_IMAGE: gemini-bot

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint || echo "No lint script"

      - name: Run tests
        run: npm test || echo "No tests configured"

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub (optional)
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: false
          tags: ${{ env.DOCKER_IMAGE }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd ~/gemini-bot
            git pull origin main
            docker-compose pull
            docker-compose up -d --build
            docker-compose exec -T bot npm run migrate || true
            docker system prune -f

      - name: Health check
        run: |
          sleep 30
          curl -f ${{ secrets.BOT_URL }}/health || exit 1

      - name: Notify on success
        if: success()
        run: |
          echo "✅ Deployment successful!"
          # Добавьте уведомление в Telegram/Slack

      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Deployment failed!"
          # Добавьте уведомление в Telegram/Slack
```

### 6.2 Настройка GitHub Secrets

В GitHub репозитории добавьте следующие secrets:

```
VPS_HOST=your-vps-ip
VPS_USER=botuser
VPS_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
VPS_PORT=2222
BOT_URL=https://your-domain.com
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password
```

---

## 📊 Часть 7: Мониторинг и логирование

### 7.1 Настройка PM2 для управления процессами

```bash
# Установка PM2 (если не установлен)
npm install -g pm2

# Создание ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gemini-bot',
    script: './bot.js',
    instances: 'max',
    exec_mode: 'cluster',
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
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
EOF

# Запуск в production режиме
pm2 start ecosystem.config.js --env production

# Сохранение конфигурации
pm2 save

# Настройка автозапуска при старте системы
pm2 startup
# Выполните команду, которую покажет PM2

# Мониторинг
pm2 monit

# Просмотр логов
pm2 logs gemini-bot

# Перезапуск
pm2 restart gemini-bot

# Обновление без простоя (zero-downtime)
pm2 reload gemini-bot
```

### 7.2 Настройка логирования с Winston

```javascript
// src/utils/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    // Combined logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ]
});

// Console logging в development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

### 7.3 Настройка мониторинга с Prometheus и Grafana

```bash
# Установка Prometheus через Docker
docker run -d \
  --name prometheus \
  --restart unless-stopped \
  -p 9090:9090 \
  -v ~/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
  -v prometheus_data:/prometheus \
  prom/prometheus

# Установка Grafana через Docker
docker run -d \
  --name grafana \
  --restart unless-stopped \
  -p 3001:3000 \
  -v grafana_data:/var/lib/grafana \
  grafana/grafana

# Конфигурация Prometheus
mkdir -p ~/monitoring
cat > ~/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gemini-bot'
    static_configs:
      - targets: ['bot:3000']
    metrics_path: '/metrics'
EOF
```

### 7.4 Настройка алертов

```bash
# Установка Alertmanager через Docker
docker run -d \
  --name alertmanager \
  --restart unless-stopped \
  -p 9093:9093 \
  -v ~/monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml \
  prom/alertmanager

# Конфигурация Alertmanager
cat > ~/monitoring/alertmanager.yml << 'EOF'
route:
  receiver: 'telegram-notifications'
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h

receivers:
  - name: 'telegram-notifications'
    telegram_configs:
      - bot_token: 'YOUR_BOT_TOKEN'
        chat_id: 'YOUR_CHAT_ID'
        send_resolved: true
EOF
```

---

## 🎨 Часть 8: VS Code Remote Development

### 8.1 Установка VS Code Remote SSH Extension

1. Установите VS Code
2. Установите расширение "Remote - SSH"
3. Настройте SSH config:

```bash
# ~/.ssh/config на локальной машине
Host vps-bot
    HostName your-vps-ip
    Port 2222
    User botuser
    IdentityFile ~/.ssh/vps_bot_key
    ForwardAgent yes
    ServerAliveInterval 60
```

4. Подключение к VPS:
   - Откройте VS Code
   - Нажмите F1 → "Remote-SSH: Connect to Host"
   - Выберите "vps-bot"

### 8.2 Рекомендуемые расширения для VS Code

```
- Remote - SSH
- Prettier
- ESLint
- GitLens
- Docker
- GitHub Copilot
- Thunder Client (для API тестирования)
- Error Lens
- Code Spell Checker
- TODO Highlight
```

### 8.3 Настройка VS Code Workspace

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "terminal.integrated.defaultProfile.linux": "bash",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/logs": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/logs": true
  }
}
```

---

## 🚀 Часть 9: Developer Workflow

### 9.1 Ежедневный workflow

```bash
# 1. Подключение к VPS
ssh vps-bot

# 2. Переход в проект
cd ~/gemini-bot

# 3. Проверка статуса
git status
pm2 status
docker ps

# 4. Обновление кода
git pull origin main

# 5. Установка зависимостей (если изменились)
npm install

# 6. Перезапуск бота
pm2 reload gemini-bot

# 7. Проверка логов
pm2 logs gemini-bot --lines 100

# 8. Мониторинг
pm2 monit
```

### 9.2 Разработка новой функции

```bash
# 1. Создание новой ветки
git checkout -b feature/new-feature

# 2. Разработка кода
# ... пишем код ...

# 3. Тестирование
npm test

# 4. Коммит
git add .
git commit -m "feat: add new feature"

# 5. Пуш в GitHub
git push origin feature/new-feature

# 6. Создание Pull Request в GitHub
# 7. После слияния - автоматический деплой
```

### 9.3 Горячие фиксы

```bash
# 1. Создание ветки для hotfix
git checkout -b hotfix/critical-bug

# 2. Исправление
# ... исправляем ...

# 3. Тестирование
npm test

# 4. Коммит и пуш
git add .
git commit -m "fix: critical bug"
git push origin hotfix/critical-bug

# 5. Создание PR и слияние
# 6. Автоматический деплой
```

### 9.4 Отладка на VPS

```bash
# 1. Просмотр логов в реальном времени
pm2 logs gemini-bot

# 2. Подключение к консоли процесса
pm2 attach gemini-bot

# 3. Проверка метрик
pm2 show gemini-bot

# 4. Перезапуск с отладкой
NODE_ENV=development pm2 restart gemini-bot

# 5. Проверка Docker контейнеров
docker logs gemini-bot -f
docker exec -it gemini-bot sh

# 6. Проверка Redis
redis-cli
> KEYS session:*
> GET session:123456

# 7. Проверка базы данных
docker exec -it gemini-postgres psql -U botuser -d gemini_bot
```

---

## 📋 Часть 10: Чек-лист для деплоя

### Перед первым деплоем:

- [ ] Настроить SSH ключи
- [ ] Настроить Firewall (UFW)
- [ ] Настроить Fail2Ban
- [ ] Установить Node.js 18+
- [ ] Установить Docker и Docker Compose
- [ ] Настроить Redis
- [ ] Настроить PostgreSQL (если нужно)
- [ ] Настроить Nginx
- [ ] Получить SSL сертификаты
- [ ] Настроить .env файл
- [ ] Настроить PM2
- [ ] Настроить логирование
- [ ] Настроить мониторинг
- [ ] Настроить бэкапы
- [ ] Настроить CI/CD pipeline

### Перед каждым деплоем:

- [ ] Запустить тесты: `npm test`
- [ ] Проверить linting: `npm run lint`
- [ ] Сделать бэкап: `backup-bot.sh`
- [ ] Проверить ветку: `git branch`
- [ ] Проверить изменения: `git diff`
- [ ] Обновить документацию

### После деплоя:

- [ ] Проверить статус PM2: `pm2 status`
- [ ] Проверить логи: `pm2 logs`
- [ ] Проверить health check: `curl http://localhost:3000/health`
- [ ] Проверить Docker контейнеры: `docker ps`
- [ ] Протестировать бота в Telegram
- [ ] Проверить мониторинг
- [ ] Уведомить команду

---

## 🔧 Часть 11: Полезные скрипты

### 11.1 Скрипт быстрого деплоя

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Starting deployment..."

# Проверка изменений
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ There are uncommitted changes!"
  exit 1
fi

# Пул изменений
echo "📥 Pulling latest changes..."
git pull origin main

# Установка зависимостей
echo "📦 Installing dependencies..."
npm ci

# Запуск миграций
echo "🗄️ Running migrations..."
npm run migrate || echo "No migrations to run"

# Перезапуск бота
echo "🔄 Restarting bot..."
pm2 reload gemini-bot

# Ожидание запуска
echo "⏳ Waiting for bot to start..."
sleep 10

# Health check
echo "🏥 Health check..."
if curl -f http://localhost:3000/health; then
  echo "✅ Deployment successful!"
else
  echo "❌ Health check failed!"
  pm2 logs gemini-bot --lines 50
  exit 1
fi
```

### 11.2 Скрипт очистки старых логов

```bash
#!/bin/bash
# scripts/cleanup-logs.sh

echo "🧹 Cleaning up old logs..."

# Удаление логов старше 30 дней
find ~/gemini-bot/logs -name "*.log" -mtime +30 -delete

# Очистка Docker логов
docker system prune -f

# Очистка PM2 логов
pm2 flush

echo "✅ Cleanup completed!"
```

### 11.3 Скрипт мониторинга

```bash
#!/bin/bash
# scripts/monitor.sh

echo "📊 System Status"
echo "=================="

# CPU и память
echo "🖥️ CPU & Memory:"
free -h
echo ""
top -bn1 | head -20

echo ""
echo "🐳 Docker Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "⚡ PM2 Status:"
pm2 status

echo ""
echo "📈 Disk Usage:"
df -h

echo ""
echo "🌐 Network Connections:"
netstat -tuln | grep LISTEN
```

---

## 📚 Часть 12: Дополнительные ресурсы

### Полезные команды:

```bash
# System
htop                    # Мониторинг системы
df -h                   # Использование диска
du -sh ~/gemini-bot     # Размер проекта
netstat -tuln          # Открытые порты

# Git
git log --oneline -10  # Последние коммиты
git diff               # Изменения
git stash              # Скрыть изменения

# Docker
docker-compose logs -f # Логи всех сервисов
docker stats          # Статистика контейнеров
docker system df      # Использование места

# PM2
pm2 list               # Список процессов
pm2 info gemini-bot    # Информация о процессе
pm2 reset gemini-bot   # Сброс метрик

# Redis
redis-cli INFO        # Информация о Redis
redis-cli DBSIZE      # Количество ключей

# Nginx
sudo nginx -t         # Проверка конфигурации
sudo systemctl reload nginx  # Перезагрузка без простоя
```

### Мониторинг URLs:

```
http://your-vps-ip:3000/health    # Health check
http://your-vps-ip:3000/metrics   # Prometheus metrics
http://your-vps-ip:9090           # Prometheus UI
http://your-vps-ip:3001           # Grafana UI
```

---

## 🎯 Заключение

Этот developer flow обеспечивает:

✅ **Безопасность** - SSH ключи, firewall, fail2ban  
✅ **Автоматизация** - CI/CD pipeline, автоматические бэкапы  
✅ **Мониторинг** - PM2, Prometheus, Grafana  
✅ **Масштабируемость** - Docker, Redis, PostgreSQL  
✅ **Удобство** - VS Code Remote, скрипты автоматизации  
✅ **Надежность** - Health checks, алерты, логирование  

Следуйте этому workflow для эффективной разработки и деплоя вашего Telegram бота!

---

*Документ создан: 2026-01-01*  
*Автор: Kilo Code (Architect Mode)*
