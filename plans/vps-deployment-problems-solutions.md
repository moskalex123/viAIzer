# 🔍 Анализ проблем и решений при развертывании бота на VPS

## 📋 Обзор текущей ситуации

**VPS Информация:**
- IP: 217.119.129.239
- Пользователь: root
- Проект: /root/viaizer
- Команда запуска: `nohup node bot.js > app.log 2>&1 &`

**Статус:** Бот запускается через nohup в фоне

---

## 🚨 Критические проблемы

### 1. ❌ Отсутствие Process Manager (PM2)

**Проблема:**
- Бот запускается через `nohup`, который не обеспечивает автоматический перезапуск при сбоях
- Нет мониторинга состояния процесса
- Нет управления логами
- При перезагрузке VPS бот не запускается автоматически

**Решение:**

```bash
# Установка PM2
npm install -g pm2

# Создание ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'viaizer-bot',
    script: 'bot.js',
    cwd: '/root/viaizer',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/root/viaizer/logs/error.log',
    out_file: '/root/viaizer/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
EOF

# Запуск бота через PM2
pm2 start ecosystem.config.js

# Сохранение конфигурации
pm2 save

# Настройка автозапуска при старте системы
pm2 startup
```

**GRACE Markup для junior разработчика:**
```javascript
// ecosystem.config.js - Конфигурация PM2 для управления процессом бота
// Этот файл определяет как бот будет запускаться и управляться

module.exports = {
  apps: [{
    name: 'viaizer-bot',           // Имя приложения для PM2
    script: 'bot.js',              // Главный файл бота
    cwd: '/root/viaizer',          // Рабочая директория
    instances: 1,                  // Количество экземпляров
    autorestart: true,             // Автоматический перезапуск при падении
    watch: false,                  // Отключить отслеживание изменений файлов
    max_memory_restart: '500M',    // Перезапуск если память превышает 500MB
    env: {
      NODE_ENV: 'production'      // Режим работы
    },
    error_file: '/root/viaizer/logs/error.log',  // Лог ошибок
    out_file: '/root/viaizer/logs/out.log',      // Лог вывода
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',    // Формат времени в логах
    merge_logs: true,              // Объединение логов
    time: true                     // Добавлять время в логи
  }]
};
```

---

### 2. ❌ Отсутствие файла .env

**Проблема:**
- Бот требует переменные окружения (BOT_TOKEN, API ключи)
- Без .env файл бот не запустится или будет работать некорректно
- Ключи API могут быть жестко прописаны в коде (небезопасно)

**Решение:**

```bash
# Создание директории для логов
mkdir -p /root/viaizer/logs

# Проверка наличия .env файла
if [ ! -f /root/viaizer/.env ]; then
  echo "⚠️ .env файл не найден!"
  echo "Создайте .env файл с необходимыми переменными:"
  cat > /root/viaizer/.env << 'EOF'
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# OpenRouter Configuration
OPENROUTER=true
OPENROUTER_API_KEY=your_openrouter_api_key_here
NANO_OPENROUTER_MODEL_NAME=google/gemini-2.5-flash-image

# kie.ai Configuration
KIE_AI_ENABLED=true
KIE_AI_API_KEY=your_kie_ai_api_key_here
KIE_AI_POLL_INTERVAL=2000
KIE_AI_MAX_WAIT_TIME=120000

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
NODE_ENV=production
PORT=3000
EOF
  chmod 600 /root/viaizer/.env
  echo "✅ .env файл создан. Отредактируйте его с вашими ключами!"
else
  echo "✅ .env файл существует"
fi
```

**GRACE Markup для junior разработчика:**
```bash
# Создание безопасного .env файла с правильными правами доступа
# 600 означает: только владелец может читать и писать

if [ ! -f /root/viaizer/.env ]; then
  # Создаем .env файл если его нет
  cat > /root/viaizer/.env << 'EOF'
# Вставьте ваши реальные ключи вместо placeholder значений
BOT_TOKEN=your_actual_bot_token
OPENROUTER_API_KEY=your_actual_api_key
KIE_AI_API_KEY=your_actual_kie_ai_key
EOF
  
  # Устанавливаем безопасные права доступа
  chmod 600 /root/viaizer/.env
fi
```

---

### 3. ❌ Несоответствие имени файла в package.json

**Проблема:**
- В [`package.json`](package.json:5) указан `main: "bot-complete.js"`
- Но запускается `bot.js`
- Это может привести к путанице и ошибкам при деплое

**Решение:**

```bash
# Проверить какой файл существует
ls -la /root/viaizer/*.js

# Если существует bot.js, обновить package.json
sed -i 's/"bot-complete.js"/"bot.js"/g' /root/viaizer/package.json

# Или переименовать файл если нужно
# mv /root/viaizer/bot.js /root/viaizer/bot-complete.js
```

---

### 4. ❌ Отсутствие мониторинга и алертов

**Проблема:**
- Нет уведомлений о падении бота
- Нет мониторинга использования ресурсов
- Нет логирования ошибок и предупреждений
- Сложно диагностировать проблемы

**Решение:**

```bash
# Установка инструментов мониторинга
npm install -g pm2-logrotate

# Настройка ротации логов
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Создание скрипта мониторинга
cat > /root/viaizer/monitor.sh << 'EOF'
#!/bin/bash
# Скрипт мониторинга состояния бота

BOT_STATUS=$(pm2 status viaizer-bot | grep viaizer-bot | awk '{print $10}')
MEMORY_USAGE=$(pm2 jlist | grep -o '"memory":[0-9]*' | grep -o '[0-9]*')

if [ "$BOT_STATUS" != "online" ]; then
  echo "⚠️ Бот не работает! Статус: $BOT_STATUS"
  # Отправка уведомления (можно интегрировать с Telegram)
  # curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" ...
fi

if [ $MEMORY_USAGE -gt 400000000 ]; then
  echo "⚠️ Высокое потребление памяти: $((MEMORY_USAGE / 1024 / 1024))MB"
fi
EOF

chmod +x /root/viaizer/monitor.sh

# Добавление в cron для ежеминутной проверки
(crontab -l 2>/dev/null; echo "* * * * * /root/viaizer/monitor.sh >> /root/viaizer/logs/monitor.log 2>&1") | crontab -
```

**GRACE Markup для junior разработчика:**
```bash
# monitor.sh - Скрипт для мониторинга состояния бота
# Запускается каждую минуту через cron

#!/bin/bash

# Получаем статус бота из PM2
BOT_STATUS=$(pm2 status viaizer-bot | grep viaizer-bot | awk '{print $10}')

# Получаем использование памяти в байтах
MEMORY_USAGE=$(pm2 jlist | grep -o '"memory":[0-9]*' | grep -o '[0-9]*')

# Проверяем статус бота
if [ "$BOT_STATUS" != "online" ]; then
  echo "⚠️ Бот не работает! Статус: $BOT_STATUS"
  # Здесь можно добавить отправку уведомления в Telegram
fi

# Проверяем использование памяти (400MB = 400000000 байт)
if [ $MEMORY_USAGE -gt 400000000 ]; then
  echo "⚠️ Высокое потребление памяти: $((MEMORY_USAGE / 1024 / 1024))MB"
fi
```

---

## ⚠️ Важные проблемы

### 5. ⚠️ Небезопасный запуск от root

**Проблема:**
- Бот запускается от пользователя root
- Это создает риски безопасности
- При компрометации бота злоумышленник получит root доступ

**Решение:**

```bash
# Создание отдельного пользователя для бота
useradd -r -s /bin/false botuser

# Создание директории для бота
mkdir -p /home/botuser/viaizer
chown -R botuser:botuser /home/botuser/viaizer

# Перемещение файлов бота
cp -r /root/viaizer/* /home/botuser/viaizer/
chown -R botuser:botuser /home/botuser/viaizer

# Обновление ecosystem.config.js
cat > /home/botuser/viaizer/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'viaizer-bot',
    script: 'bot.js',
    cwd: '/home/botuser/viaizer',
    user: 'botuser',
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Запуск от пользователя botuser
pm2 start /home/botuser/viaizer/ecosystem.config.js --user botuser
pm2 save
```

---

### 6. ⚠️ Отсутствие health check

**Проблема:**
- Нет способа проверить работает ли бот корректно
- Нет API endpoint для health checks
- Сложно интегрировать с системами мониторинга

**Решение:**

```javascript
// Добавить в bot.js
import express from 'express';

// Создание Express сервера для health checks
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    users: bot.userSessions.size,
    memory: process.memoryUsage()
  });
});

app.get('/ready', (req, res) => {
  // Проверка готовности бота
  const isReady = bot.bot && bot.bot.isPolling();
  
  if (isReady) {
    res.json({
      status: 'ready',
      polling: true,
      users: bot.userSessions.size
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      polling: false
    });
  }
});

// Запуск Express сервера
app.listen(PORT, () => {
  console.log(`🏥 Health check server listening on port ${PORT}`);
});
```

**GRACE Markup для junior разработчика:**
```javascript
// Добавить в конец bot.js перед инициализацией бота
// Express сервер для health checks и мониторинга

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint - проверяет что процесс работает
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),           // Время работы процесса
    timestamp: new Date().toISOString(), // Текущее время
    users: bot.userSessions.size,       // Количество активных пользователей
    memory: process.memoryUsage()       // Использование памяти
  });
});

// Readiness check - проверяет что бот готов принимать сообщения
app.get('/ready', (req, res) => {
  const isReady = bot.bot && bot.bot.isPolling();
  
  if (isReady) {
    res.json({
      status: 'ready',
      polling: true,
      users: bot.userSessions.size
    });
  } else {
    // 503 = Service Unavailable
    res.status(503).json({
      status: 'not ready',
      polling: false
    });
  }
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`🏥 Health check server listening on port ${PORT}`);
});
```

---

### 7. ⚠️ Отсутствие ротации логов

**Проблема:**
- Логи растут бесконечно
- Могут заполнить диск
- Нет сжатия старых логов
- Сложно анализировать старые логи

**Решение:**

```bash
# Установка pm2-logrotate
pm2 install pm2-logrotate

# Настройка параметров
pm2 set pm2-logrotate:max_size 10M      # Максимальный размер файла 10MB
pm2 set pm2-logrotate:retain 7         # Хранить 7 файлов
pm2 set pm2-logrotate:compress true    # Сжимать старые логи
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Вращать каждый день в полночь

# Или настройка через logrotate
cat > /etc/logrotate.d/viaizer-bot << 'EOF'
/root/viaizer/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  missingok
  create 0640 botuser botuser
  sharedscripts
  postrotate
    pm2 reload viaizer-bot
  endscript
}
EOF
```

---

### 8. ⚠️ Отсутствие бэкапов

**Проблема:**
- Нет бэкапов данных пользователей
- Нет бэкапов конфигурации
- При потере данных восстановление невозможно

**Решение:**

```bash
# Создание скрипта бэкапа
cat > /root/viaizer/backup.sh << 'EOF'
#!/bin/bash
# Скрипт бэкапа данных бота

BACKUP_DIR="/root/backups/viaizer"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="viaizer_backup_${DATE}.tar.gz"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Создание бэкапа
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
  /root/viaizer/.env \
  /root/viaizer/package.json \
  /root/viaizer/logs/ \
  --exclude='node_modules'

# Удаление бэкапов старше 30 дней
find $BACKUP_DIR -name "viaizer_backup_*.tar.gz" -mtime +30 -delete

echo "✅ Бэкап создан: ${BACKUP_DIR}/${BACKUP_FILE}"
EOF

chmod +x /root/viaizer/backup.sh

# Добавление в cron для ежедневного бэкапа в 2:00 ночи
(crontab -l 2>/dev/null; echo "0 2 * * * /root/viaizer/backup.sh >> /root/viaizer/logs/backup.log 2>&1") | crontab -
```

**GRACE Markup для junior разработчика:**
```bash
# backup.sh - Скрипт для создания бэкапов данных бота
# Запускается ежедневно в 2:00 ночи через cron

#!/bin/bash

# Директория для хранения бэкапов
BACKUP_DIR="/root/backups/viaizer"

# Текущая дата и время для имени файла
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="viaizer_backup_${DATE}.tar.gz"

# Создаем директорию если её нет
mkdir -p $BACKUP_DIR

# Создаем архив бэкапа
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
  /root/viaizer/.env \         # Конфигурация
  /root/viaizer/package.json \  # Зависимости
  /root/viaizer/logs/ \         # Логи
  --exclude='node_modules'      # Исключаем node_modules

# Удаляем бэкапы старше 30 дней
find $BACKUP_DIR -name "viaizer_backup_*.tar.gz" -mtime +30 -delete

echo "✅ Бэкап создан: ${BACKUP_DIR}/${BACKUP_FILE}"
```

---

## 📊 Проблемы производительности

### 9. 📊 Отсутствие Redis для сессий

**Проблема:**
- Сессии хранятся в памяти (Map)
- При перезапуске все сессии теряются
- Нет масштабирования на несколько инстансов
- Потребление памяти растет с количеством пользователей

**Решение:**

```bash
# Установка Redis
apt-get install -y redis-server

# Запуск Redis
systemctl start redis-server
systemctl enable redis-server

# Установка Redis клиента для Node.js
cd /root/viaizer
npm install redis

# Создание модуля для управления сессиями
cat > /root/viaizer/sessionManager.js << 'EOF'
import { createClient } from 'redis';

class SessionManager {
  constructor() {
    this.client = createClient({
      url: 'redis://localhost:6379'
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
    const session = await this.client.get(`session:${userId}`);
    if (session) {
      return JSON.parse(session);
    }
    return null;
  }

  async setSession(userId, session) {
    await this.client.setEx(
      `session:${userId}`,
      86400, // 24 часа
      JSON.stringify(session)
    );
  }

  async deleteSession(userId) {
    await this.client.del(`session:${userId}`);
  }

  async getAllSessions() {
    const keys = await this.client.keys('session:*');
    const sessions = [];
    for (const key of keys) {
      const session = await this.client.get(key);
      sessions.push(JSON.parse(session));
    }
    return sessions;
  }
}

export default new SessionManager();
EOF
```

---

### 10. 📊 Отсутствие rate limiting

**Проблема:**
- Нет ограничений на количество запросов от одного пользователя
- Возможна DoS атака через спам сообщений
- Может превысить лимиты API

**Решение:**

```javascript
// Добавить в bot.js
class RateLimiter {
  constructor(maxRequests = 30, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  check(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Удаление старых запросов
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: validRequests[0] + this.windowMs
      };
    }

    validRequests.push(now);
    this.requests.set(userId, validRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetTime: now + this.windowMs
    };
  }

  reset(userId) {
    this.requests.delete(userId);
  }
}

// Использование в bot.js
const rateLimiter = new RateLimiter(30, 60000); // 30 запросов в минуту

async handleMessage(msg) {
  const userId = msg.from.id;
  const rateCheck = rateLimiter.check(userId);

  if (!rateCheck.allowed) {
    const waitTime = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
    await this.bot.sendMessage(
      msg.chat.id,
      `⚠️ Слишком много запросов! Подождите ${waitTime} секунд.`
    );
    return;
  }

  // Продолжение обработки сообщения...
}
```

**GRACE Markup для junior разработчика:**
```javascript
// RateLimiter класс для ограничения частоты запросов
// Предотвращает спам и DoS атаки

class RateLimiter {
  constructor(maxRequests = 30, windowMs = 60000) {
    this.maxRequests = maxRequests;    // Максимальное количество запросов
    this.windowMs = windowMs;          // Временное окно в миллисекундах
    this.requests = new Map();         // Хранилище запросов по userId
  }

  // Проверяет может ли пользователь сделать запрос
  check(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Удаляем запросы старше windowMs
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Если превышен лимит
    if (validRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: validRequests[0] + this.windowMs
      };
    }

    // Добавляем текущий запрос
    validRequests.push(now);
    this.requests.set(userId, validRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetTime: now + this.windowMs
    };
  }

  // Сброс счетчика для пользователя
  reset(userId) {
    this.requests.delete(userId);
  }
}
```

---

## 🔒 Проблемы безопасности

### 11. 🔒 Отсутствие HTTPS для webhooks

**Проблема:**
- Если использовать webhooks вместо polling, нужен SSL
- Открытый HTTP небезопасен
- Telegram требует HTTPS для webhooks

**Решение:**

```bash
# Установка Certbot для Let's Encrypt
apt-get install -y certbot

# Получение SSL сертификата
certbot certonly --standalone -d your-domain.com

# Настройка Nginx как reverse proxy
cat > /etc/nginx/sites-available/viaizer-bot << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3000;
    }
}
EOF

ln -s /etc/nginx/sites-available/viaizer-bot /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### 12. 🔒 Отсутствие firewall правил

**Проблема:**
- Открыты все порты
- Нет защиты от несанкционированного доступа
- Уязвимость к сканированию портов

**Решение:**

```bash
# Настройка UFW
ufw default deny incoming
ufw default allow outgoing

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Разрешить локальные соединения
ufw allow from 127.0.0.1

# Включить firewall
ufw --force enable

# Проверка статуса
ufw status verbose
```

---

### 13. 🔒 Небезопасное хранение ключей

**Проблема:**
- Ключи API в .env файле могут быть скомпрометированы
- Нет шифрования чувствительных данных
- Ключи могут попасть в git

**Решение:**

```bash
# Добавить .env в .gitignore
echo ".env" >> /root/viaizer/.gitignore

# Установить правильные права на .env
chmod 600 /root/viaizer/.env

# Использовать секреты вместо прямых ключей
# Можно интегрировать с Vault или AWS Secrets Manager
```

---

## 🔄 Проблемы обновлений

### 14. 🔄 Отсутствие CI/CD

**Проблема:**
- Обновления вручную через SSH
- Возможность ошибок при деплое
- Нет автоматического тестирования
- Нет отката при проблемах

**Решение:**

```bash
# Создание скрипта безопасного деплоя
cat > /root/viaizer/deploy.sh << 'EOF'
#!/bin/bash
set -e

PROJECT_DIR="/root/viaizer"
BACKUP_DIR="/root/backups/viaizer"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment..."

# Создание бэкапа перед деплоем
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf "${BACKUP_DIR}/pre_deploy_${DATE}.tar.gz" \
  $PROJECT_DIR/.env \
  $PROJECT_DIR/package.json \
  $PROJECT_DIR/bot.js

# Остановка бота
echo "⏹️ Stopping bot..."
pm2 stop viaizer-bot || true

# Получение обновлений
echo "📥 Pulling changes..."
cd $PROJECT_DIR
git fetch origin
git reset --hard origin/main

# Установка зависимостей
echo "📦 Installing dependencies..."
npm install --production

# Запуск бота
echo "▶️ Starting bot..."
pm2 restart viaizer-bot

# Проверка статуса
sleep 5
if pm2 status viaizer-bot | grep -q "online"; then
  echo "✅ Deployment successful!"
  pm2 logs viaizer-bot --lines 20 --nostream
else
  echo "❌ Deployment failed! Rolling back..."
  # Откат
  tar -xzf "${BACKUP_DIR}/pre_deploy_${DATE}.tar.gz" -C $PROJECT_DIR
  pm2 restart viaizer-bot
  exit 1
fi
EOF

chmod +x /root/viaizer/deploy.sh
```

**GRACE Markup для junior разработчика:**
```bash
# deploy.sh - Скрипт безопасного деплоя с возможностью отката
#!/bin/bash
set -e  # Остановить скрипт при любой ошибке

PROJECT_DIR="/root/viaizer"
BACKUP_DIR="/root/backups/viaizer"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment..."

# 1. Создаем бэкап перед деплоем
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf "${BACKUP_DIR}/pre_deploy_${DATE}.tar.gz" \
  $PROJECT_DIR/.env \
  $PROJECT_DIR/package.json \
  $PROJECT_DIR/bot.js

# 2. Останавливаем бота
echo "⏹️ Stopping bot..."
pm2 stop viaizer-bot || true

# 3. Получаем обновления из git
echo "📥 Pulling changes..."
cd $PROJECT_DIR
git fetch origin
git reset --hard origin/main

# 4. Устанавливаем зависимости
echo "📦 Installing dependencies..."
npm install --production

# 5. Запускаем бота
echo "▶️ Starting bot..."
pm2 restart viaizer-bot

# 6. Проверяем статус
sleep 5
if pm2 status viaizer-bot | grep -q "online"; then
  echo "✅ Deployment successful!"
  pm2 logs viaizer-bot --lines 20 --nostream
else
  echo "❌ Deployment failed! Rolling back..."
  # Откат к бэкапу
  tar -xzf "${BACKUP_DIR}/pre_deploy_${DATE}.tar.gz" -C $PROJECT_DIR
  pm2 restart viaizer-bot
  exit 1
fi
```

---

### 15. 🔄 Отсутствие версионирования

**Проблема:**
- Нет тегов версий
- Сложно отследить изменения
- Нет возможности отката к конкретной версии

**Решение:**

```bash
# Создание тегов версий
git tag -a v1.0.0 -m "Initial production release"
git push origin v1.0.0

# Скрипт для отката к версии
cat > /root/viaizer/rollback.sh << 'EOF'
#!/bin/bash
VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./rollback.sh <version>"
  echo "Example: ./rollback.sh v1.0.0"
  exit 1
fi

echo "🔄 Rolling back to $VERSION..."

# Остановка бота
pm2 stop viaizer-bot

# Откат к версии
cd /root/viaizer
git checkout $VERSION
npm install --production

# Запуск бота
pm2 restart viaizer-bot

echo "✅ Rollback to $VERSION completed!"
EOF

chmod +x /root/viaizer/rollback.sh
```

---

## 📝 Проблемы документации

### 16. 📝 Отсутствие документации по запуску

**Проблема:**
- Нет инструкции для других разработчиков
- Сложно воспроизвести настройку
- Нет информации о зависимостях

**Решение:**

```markdown
# 🚀 Viaizer Bot - Production Deployment Guide

## Требования
- Node.js 18+
- PM2
- Redis (опционально)
- VPS с Ubuntu 20.04+

## Установка

### 1. Клонирование репозитория
\`\`\`bash
git clone https://github.com/your-repo/viaizer.git /root/viaizer
cd /root/viaizer
\`\`\`

### 2. Установка зависимостей
\`\`\`bash
npm install --production
\`\`\`

### 3. Настройка окружения
\`\`\`bash
cp .env.example .env
nano .env
# Заполните все необходимые переменные
\`\`\`

### 4. Запуск через PM2
\`\`\`bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

## Управление

### Просмотр логов
\`\`\`bash
pm2 logs viaizer-bot
\`\`\`

### Перезапуск
\`\`\`bash
pm2 restart viaizer-bot
\`\`\`

### Остановка
\`\`\`bash
pm2 stop viaizer-bot
\`\`\`

### Мониторинг
\`\`\`bash
pm2 monit
\`\`\`

## Troubleshooting

### Бот не запускается
\`\`\`bash
# Проверьте логи
pm2 logs viaizer-bot --lines 100

# Проверьте .env файл
cat .env

# Проверьте зависимости
npm list
\`\`\`

### Высокое потребление памяти
\`\`\`bash
# Перезапустите бота
pm2 restart viaizer-bot

# Проверьте использование памяти
pm2 monit
\`\`\`
```

---

## 🎯 Рекомендации по приоритету

### Немедленно (Критично)
1. ✅ Установить PM2 для управления процессом
2. ✅ Создать и настроить .env файл
3. ✅ Добавить мониторинг и алерты
4. ✅ Настроить ротацию логов

### В ближайшее время (Важно)
5. ⚠️ Создать отдельного пользователя для бота
6. ⚠️ Добавить health check endpoint
7. ⚠️ Настроить бэкапы
8. ⚠️ Добавить rate limiting

### По возможности (Желательно)
9. 📊 Интегрировать Redis для сессий
10. 🔒 Настроить firewall
11. 🔒 Получить SSL сертификат
12. 🔄 Настроить CI/CD

---

## 📊 Мониторинг и метрики

### Ключевые метрики для мониторинга

```bash
# Создание скрипта для сбора метрик
cat > /root/viaizer/metrics.sh << 'EOF'
#!/bin/bash

echo "=== Viaizer Bot Metrics ==="
echo "Time: $(date)"
echo ""

# Статус PM2
echo "PM2 Status:"
pm2 status viaizer-bot
echo ""

# Использование памяти
echo "Memory Usage:"
pm2 jlist | grep -o '"memory":[0-9]*' | grep -o '[0-9]*' | awk '{print $1 / 1024 / 1024 " MB"}'
echo ""

# Количество пользователей
echo "Active Users:"
curl -s http://localhost:3000/health | grep -o '"users":[0-9]*' | grep -o '[0-9]*'
echo ""

# Uptime
echo "Uptime:"
pm2 jlist | grep -o '"pm_uptime":[0-9]*' | grep -o '[0-9]*' | awk '{print $1 / 60 " minutes"}'
echo ""

# Диск
echo "Disk Usage:"
df -h /root | tail -1 | awk '{print $5 " used"}'
echo ""

# CPU
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'
echo ""
EOF

chmod +x /root/viaizer/metrics.sh
```

---

## 🔧 Полный скрипт исправлений

```bash
#!/bin/bash
# fix-deployment.sh - Исправление всех критических проблем

set -e

echo "🔧 Starting deployment fixes..."

# 1. Установка PM2
echo "[1/8] Installing PM2..."
npm install -g pm2

# 2. Создание ecosystem.config.js
echo "[2/8] Creating PM2 configuration..."
cat > /root/viaizer/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'viaizer-bot',
    script: 'bot.js',
    cwd: '/root/viaizer',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/root/viaizer/logs/error.log',
    out_file: '/root/viaizer/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
EOF

# 3. Создание директории для логов
echo "[3/8] Creating logs directory..."
mkdir -p /root/viaizer/logs

# 4. Проверка .env
echo "[4/8] Checking .env file..."
if [ ! -f /root/viaizer/.env ]; then
  echo "⚠️ .env not found! Creating from .env.example..."
  if [ -f /root/viaizer/.env.example ]; then
    cp /root/viaizer/.env.example /root/viaizer/.env
    chmod 600 /root/viaizer/.env
    echo "✅ .env created. Please edit it with your keys!"
  else
    echo "❌ .env.example not found!"
    exit 1
  fi
else
  echo "✅ .env exists"
fi

# 5. Установка pm2-logrotate
echo "[5/8] Installing pm2-logrotate..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# 6. Остановка текущего процесса
echo "[6/8] Stopping current bot process..."
pkill -f "node.*bot.js" || true
sleep 2

# 7. Запуск через PM2
echo "[7/8] Starting bot with PM2..."
pm2 start ecosystem.config.js
pm2 save

# 8. Настройка автозапуска
echo "[8/8] Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ All fixes completed!"
echo ""
echo "Check bot status:"
pm2 status viaizer-bot
echo ""
echo "View logs:"
pm2 logs viaizer-bot --lines 20
```

---

## 📞 Поддержка и помощь

### Полезные команды

```bash
# Проверка статуса бота
pm2 status viaizer-bot

# Просмотр логов в реальном времени
pm2 logs viaizer-bot

# Перезапуск бота
pm2 restart viaizer-bot

# Остановка бота
pm2 stop viaizer-bot

# Мониторинг ресурсов
pm2 monit

# Просмотр информации о процессе
pm2 show viaizer-bot

# Сброс логов
pm2 flush viaizer-bot

# Удаление процесса
pm2 delete viaizer-bot
```

### Диагностика проблем

```bash
# Проверка .env файла
cat /root/viaizer/.env

# Проверка зависимостей
cd /root/viaizer && npm list

# Проверка портов
netstat -tlnp | grep :3000

# Проверка диска
df -h

# Проверка памяти
free -h

# Проверка CPU
top -bn1 | head -20
```

---

## ✅ Чек-лист для production deployment

- [ ] Установлен PM2
- [ ] Создан ecosystem.config.js
- [ ] Настроен .env файл с правильными ключами
- [ ] Настроена ротация логов
- [ ] Добавлен мониторинг
- [ ] Настроены бэкапы
- [ ] Добавлен health check
- [ ] Настроен firewall
- [ ] Создан отдельный пользователь для бота
- [ ] Настроен rate limiting
- [ ] Добавлена документация
- [ ] Настроены алерты
- [ ] Протестирован rollback
- [ ] Проверены все зависимости
- [ ] Настроен CI/CD (опционально)

---

*Документ создан: 2026-01-04*
*Автор: AI Assistant*
