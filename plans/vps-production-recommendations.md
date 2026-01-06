# 🏢 Production Deployment Recommendations

## 📋 Executive Summary

Этот документ содержит рекомендации для развертывания бота Viaizer в production среде с учетом лучших практик безопасности, надежности и масштабируемости.

---

## 🎯 Текущее состояние vs Production-ready

| Аспект | Текущее состояние | Production-ready |
|--------|-------------------|-----------------|
| Process Management | nohup | PM2 / Systemd |
| Auto-restart | ❌ Нет | ✅ Да |
| Monitoring | ❌ Нет | ✅ Да |
| Logging | Базовое | ✅ Ротация, сжатие |
| Backups | ❌ Нет | ✅ Автоматические |
| Security | Root пользователь | ✅ Отдельный пользователь |
| Health Checks | ❌ Нет | ✅ Да |
| Rate Limiting | ❌ Нет | ✅ Да |
| Session Storage | In-memory | ✅ Redis |
| SSL/TLS | ❌ Нет | ✅ Да |
| CI/CD | ❌ Нет | ✅ Да |

---

## 🏗️ Рекомендуемая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        User Layer                          │
│                   (Telegram Users)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Load Balancer (Nginx)                    │
│              (Optional for scaling)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Bot Inst   │  │   Bot Inst   │  │   Bot Inst   │   │
│  │     #1       │  │     #2       │  │     #3       │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │    Redis     │  │  PostgreSQL  │  │   Backups    │   │
│  │  (Sessions)  │  │  (Metadata)  │  │  (S3/Local)  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Этапы внедрения (Roadmap)

### Этап 1: Критические исправления (1-2 дня)
**Приоритет:** 🔴 Критический

1. ✅ Установка PM2
2. ✅ Создание ecosystem.config.js
3. ✅ Настройка .env файла
4. ✅ Настройка ротации логов
5. ✅ Базовый мониторинг

**Результат:** Бот стабильно работает и автоматически перезапускается

---

### Этап 2: Улучшение безопасности (2-3 дня)
**Приоритет:** 🟠 Высокий

1. Создание отдельного пользователя для бота
2. Настройка firewall (UFW)
3. Получение SSL сертификата (Let's Encrypt)
4. Настройка Nginx reverse proxy
5. Установка Fail2Ban

**Результат:** Улучшенная безопасность и защита от атак

---

### Этап 3: Надежность и мониторинг (3-5 дней)
**Приоритет:** 🟡 Средний

1. Установка Redis для сессий
2. Добавление health check endpoint
3. Настройка бэкапов
4. Настройка алертов (Telegram/Email)
5. Интеграция с системой мониторинга (Grafana/Prometheus)

**Результат:** Полный контроль над состоянием системы

---

### Этап 4: Производительность и масштабирование (5-7 дней)
**Приоритет:** 🟢 Низкий

1. Добавление rate limiting
2. Оптимизация запросов к API
3. Кэширование данных
4. Настройка CDN для статических ресурсов
5. Горизонтальное масштабирование

**Результат:** Высокая производительность и готовность к росту

---

### Этап 5: Автоматизация (7-10 дней)
**Приоритет:** 🟢 Низкий

1. Настройка CI/CD (GitHub Actions)
2. Автоматическое тестирование
3. Автоматический деплой
4. Инфраструктура как код (Terraform/Ansible)
5. Blue-green deployment

**Результат:** Полная автоматизация процессов

---

## 🔒 Рекомендации по безопасности

### 1. Изоляция пользователей

```bash
# Создание пользователя для бота
useradd -r -s /bin/false viaizer-bot

# Создание директории
mkdir -p /opt/viaizer
chown -R viaizer-bot:viaizer-bot /opt/viaizer

# Настройка sudo для конкретных команд
echo "viaizer-bot ALL=(ALL) NOPASSWD:/usr/bin/pm2" >> /etc/sudoers.d/viaizer-bot
```

### 2. Firewall правила

```bash
# Базовая конфигурация UFW
ufw default deny incoming
ufw default allow outgoing

# Разрешить SSH (измените порт на нестандартный)
ufw allow 2222/tcp

# Разрешить HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Ограничить доступ к health check
ufw allow from 127.0.0.1 to any port 3000
ufw allow from 10.0.0.0/8 to any port 3000  # Внутренняя сеть

# Включить firewall
ufw --force enable
```

### 3. SSL/TLS конфигурация

```nginx
# /etc/nginx/sites-available/viaizer-bot
server {
    listen 80;
    server_name bot.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bot.yourdomain.com;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/bot.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bot.yourdomain.com/privkey.pem;

    # Современная конфигурация SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Webhook endpoint (если используется)
    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Защита от DDoS

```bash
# Установка и настройка Fail2Ban
apt-get install -y fail2ban

# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 3600
findtime = 600

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
maxretry = 10
findtime = 60
bantime = 3600
```

---

## 📊 Мониторинг и алерты

### 1. Стек мониторинга

```
Prometheus (сбор метрик)
    ↓
Grafana (визуализация)
    ↓
Alertmanager (отправка алертов)
```

### 2. Ключевые метрики

```javascript
// Добавить в bot.js
const promClient = require('prom-client');

// Создание реестра
const register = new promClient.Registry();

// Метрики
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5]
});

const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

const apiRequests = new promClient.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['api', 'status']
});

const memoryUsage = new promClient.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes'
});

// Обновление метрик
setInterval(() => {
  activeUsers.set(bot.userSessions.size);
  memoryUsage.set(process.memoryUsage().heapUsed);
}, 5000);

// Endpoint для Prometheus
import express from 'express';
const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 3. Настройка алертов

```yaml
# prometheus/alerts.yml
groups:
  - name: viaizer-bot
    interval: 30s
    rules:
      - alert: BotDown
        expr: up{job="viaizer-bot"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Bot is down"
          description: "Bot {{ $labels.instance }} has been down for more than 1 minute."

      - alert: HighMemoryUsage
        expr: memory_usage_bytes / 1024 / 1024 > 400
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}MB on {{ $labels.instance }}"

      - alert: HighErrorRate
        expr: rate(api_requests_total{status="error"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate"
          description: "Error rate is {{ $value }} req/s on {{ $labels.instance }}"
```

---

## 🗄️ Базы данных и хранилища

### 1. Redis для сессий

```javascript
// sessionManager.js
import { createClient } from 'redis';

class SessionManager {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Max reconnection retries reached');
          }
          return retries * 100;
        }
      }
    });
    
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    this.connect();
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Redis connected');
  }

  async getSession(userId) {
    try {
      const session = await this.client.get(`session:${userId}`);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async setSession(userId, session, ttl = 86400) {
    try {
      await this.client.setEx(
        `session:${userId}`,
        ttl,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Error setting session:', error);
    }
  }

  async deleteSession(userId) {
    try {
      await this.client.del(`session:${userId}`);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  async getAllSessions() {
    try {
      const keys = await this.client.keys('session:*');
      const sessions = [];
      for (const key of keys) {
        const session = await this.client.get(key);
        sessions.push(JSON.parse(session));
      }
      return sessions;
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }

  async getStats() {
    try {
      const info = await this.client.info('stats');
      return {
        totalConnections: parseInt(info.match(/total_connections_received:(\d+)/)[1]),
        totalCommands: parseInt(info.match(/total_commands_processed:(\d+)/)[1]),
        keyCount: await this.client.dbSize()
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

export default new SessionManager();
```

### 2. PostgreSQL для метаданных (опционально)

```sql
-- Создание таблицы пользователей
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    subscription VARCHAR(50) DEFAULT 'FREE',
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы запросов
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    mode VARCHAR(100),
    request_text TEXT,
    response_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_created_at ON requests(created_at);
CREATE INDEX idx_users_subscription ON users(subscription);

-- Создание функции для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Lint
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd /opt/viaizer
            git pull origin main
            npm install --production
            pm2 restart viaizer-bot
            pm2 save
```

---

## 📦 Стратегия бэкапов

### 1. Полный бэкап

```bash
#!/bin/bash
# full-backup.sh

BACKUP_DIR="/backups/viaizer"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Создание директории
mkdir -p $BACKUP_DIR

# Бэкап приложения
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" \
  /opt/viaizer/.env \
  /opt/viaizer/package.json \
  /opt/viaizer/*.js \
  --exclude='node_modules'

# Бэкап Redis
redis-cli --rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Бэкап PostgreSQL (если используется)
pg_dump -U viaizer viaizer_db > "$BACKUP_DIR/db_$DATE.sql"

# Загрузка в S3 (опционально)
# aws s3 cp "$BACKUP_DIR/app_$DATE.tar.gz" s3://viaizer-backups/

# Удаление старых бэкапов
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.rdb" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed: $DATE"
```

### 2. Инкрементальный бэкап

```bash
#!/bin/bash
# incremental-backup.sh

BACKUP_DIR="/backups/viaizer/incremental"
DATE=$(date +%Y%m%d_%H%M%S)
LAST_BACKUP=$(ls -t $BACKUP_DIR | head -1 | cut -d'_' -f1)

mkdir -p $BACKUP_DIR

# Использование rsync для инкрементального бэкапа
rsync -av --link-dest="$BACKUP_DIR/$LAST_BACKUP" \
  /opt/viaizer/ \
  "$BACKUP_DIR/$DATE/"

echo "✅ Incremental backup completed: $DATE"
```

---

## 🚨 Disaster Recovery Plan

### 1. Процедура восстановления

```bash
#!/bin/bash
# restore.sh

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: ./restore.sh <backup_date>"
  echo "Example: ./restore.sh 20240104_120000"
  exit 1
fi

BACKUP_DIR="/backups/viaizer"

# Остановка бота
pm2 stop viaizer-bot

# Восстановление приложения
tar -xzf "$BACKUP_DIR/app_$BACKUP_DATE.tar.gz" -C /opt/viaizer/

# Восстановление Redis
redis-cli --rdb "$BACKUP_DIR/redis_$BACKUP_DATE.rdb"

# Восстановление PostgreSQL (если используется)
psql -U viaizer viaizer_db < "$BACKUP_DIR/db_$BACKUP_DATE.sql"

# Запуск бота
pm2 start viaizer-bot

echo "✅ Restore completed: $BACKUP_DATE"
```

### 2. Процедура отката

```bash
#!/bin/bash
# rollback.sh

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./rollback.sh <version>"
  echo "Example: ./rollback.sh v1.0.0"
  exit 1
fi

cd /opt/viaizer

# Остановка бота
pm2 stop viaizer-bot

# Откат к версии
git checkout $VERSION
npm install --production

# Запуск бота
pm2 start viaizer-bot

echo "✅ Rollback to $VERSION completed"
```

---

## 📈 Масштабирование

### 1. Горизонтальное масштабирование

```javascript
// ecosystem.config.js для кластеризации
module.exports = {
  apps: [{
    name: 'viaizer-bot',
    script: 'bot.js',
    cwd: '/opt/viaizer',
    instances: 'max', // Или конкретное число: 4
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

### 2. Load Balancing с Nginx

```nginx
upstream viaizer_bot {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 443 ssl http2;
    server_name bot.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/bot.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bot.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://viaizer_bot;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📝 Документация

### 1. README.md

```markdown
# Viaizer Bot

Telegram AI бот с поддержкой нескольких моделей.

## Требования

- Node.js 18+
- Redis 6+
- PostgreSQL 14+ (опционально)
- PM2

## Установка

1. Клонирование репозитория
2. Установка зависимостей: `npm install`
3. Настройка .env файла
4. Запуск: `pm2 start ecosystem.config.js`

## Документация

- [Deployment Guide](docs/deployment.md)
- [API Documentation](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)

## Лицензия

MIT
```

### 2. API Documentation

```markdown
# API Documentation

## Health Check

### GET /health

Проверка состояния бота.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2024-01-04T12:00:00Z",
  "users": 100,
  "memory": {
    "heapUsed": 123456789,
    "heapTotal": 200000000
  }
}
```

## Metrics

### GET /metrics

Prometheus метрики.

**Response:** Prometheus metrics format
```

---

## 🎯 Чек-лист production deployment

### Критические компоненты

- [x] PM2 установлен и настроен
- [x] ecosystem.config.js создан
- [x] .env файл настроен
- [x] Ротация логов настроена
- [x] Базовый мониторинг настроен

### Безопасность

- [ ] Отдельный пользователь создан
- [ ] Firewall настроен
- [ ] SSL сертификат получен
- [ ] Nginx reverse proxy настроен
- [ ] Fail2Ban установлен
- [ ] SSH ключи настроены
- [ ] Права доступа настроены

### Надежность

- [ ] Redis установлен и настроен
- [ ] Health check endpoint добавлен
- [ ] Бэкапы настроены
- [ ] Алерты настроены
- [ ] Disaster recovery plan создан
- [ ] Rate limiting реализован

### Производительность

- [ ] Кэширование настроено
- [ ] Оптимизация запросов
- [ ] CDN настроен (опционально)
- [ ] Кластеризация настроена (опционально)

### Автоматизация

- [ ] CI/CD pipeline настроен
- [ ] Автоматическое тестирование
- [ ] Автоматический деплой
- [ ] Инфраструктура как код

### Документация

- [ ] README.md обновлен
- [ ] API документация
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Runbook

---

## 📞 Поддержка

### Контакты

- Email: support@viaizer.com
- Telegram: @viaizer_support
- GitHub: https://github.com/viaizer/bot

### Ресурсы

- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Telegram Bot API: https://core.telegram.org/bots/api
- Node.js Documentation: https://nodejs.org/docs/

---

*Документ создан: 2026-01-04*
*Автор: AI Assistant*
*Версия: 1.0.0*
