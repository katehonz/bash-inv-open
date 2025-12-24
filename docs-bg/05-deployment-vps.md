# Deployment на VPS

## Въведение

Това ръководство ще ви преведе през процеса на публикуване на Invoice-App на production VPS сървър.

## Изисквания за VPS

### Минимални спецификации

- **CPU:** 2 cores
- **RAM:** 4GB (препоръчва се 8GB)
- **Disk:** 40GB SSD
- **OS:** Ubuntu 22.04 LTS или по-нова
- **Network:** 100 Mbps

### Препоръчани доставчици

- **DigitalOcean** - $24/месец (4GB RAM, 2 CPU)
- **Hetzner** - €10/месец (4GB RAM, 2 CPU)
- **Vultr** - $18/месец (4GB RAM, 2 CPU)
- **AWS EC2** - t3.medium (~$30/месец)
- **Azure** - B2s (~$30/месец)

## Подготовка на VPS

### 1. Първоначална настройка

Свържете се към VPS-а като root:

```bash
ssh root@YOUR_VPS_IP
```

#### 1.1. Актуализация на системата

```bash
apt update
apt upgrade -y
apt install -y curl wget git vim ufw
```

#### 1.2. Създаване на non-root потребител

```bash
# Създаване на потребител
adduser invoiceapp
usermod -aG sudo invoiceapp

# Разрешаване на SSH за новия потребител
mkdir -p /home/invoiceapp/.ssh
cp ~/.ssh/authorized_keys /home/invoiceapp/.ssh/
chown -R invoiceapp:invoiceapp /home/invoiceapp/.ssh
chmod 700 /home/invoiceapp/.ssh
chmod 600 /home/invoiceapp/.ssh/authorized_keys

# Тествайте връзката преди да затворите root сесията
ssh invoiceapp@YOUR_VPS_IP
```

Излезте от root и от сега нататък работете като `invoiceapp` потребител.

#### 1.3. Firewall настройка

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### 2. Инсталиране на необходимия софтуер

#### 2.1. Java 17

```bash
sudo apt install -y openjdk-17-jdk
java -version
```

#### 2.2. PostgreSQL 15

```bash
# Добавяне на PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Инсталация
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15

# Проверка
sudo systemctl status postgresql
```

#### 2.3. Node.js 18

```bash
# Инсталация на nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Инсталация на Node.js
nvm install 18
nvm use 18
nvm alias default 18

# Проверка
node -v
npm -v
```

#### 2.4. Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2.5. Certbot (за SSL certificates)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Настройка на PostgreSQL

```bash
# Влизане в PostgreSQL
sudo -u postgres psql

# В PostgreSQL конзолата:
CREATE DATABASE sp_inv_app;
CREATE USER invoiceapp WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE sp_inv_app TO invoiceapp;

# Даване на права на schema
\c sp_inv_app
GRANT ALL ON SCHEMA public TO invoiceapp;
ALTER DATABASE sp_inv_app OWNER TO invoiceapp;

\q
```

#### Тестване на връзката

```bash
psql -h localhost -U invoiceapp -d sp_inv_app
# Въведете паролата
# Ако влезете успешно, напишете \q за изход
```

## Deployment на приложението

### 1. Клониране на кода

```bash
cd /home/invoiceapp
git clone <YOUR_REPOSITORY_URL> invoice-app
cd invoice-app
```

Ако нямате Git repository, качете файловете чрез `scp`:

```bash
# От вашия локален компютър
scp -r /path/to/sp-inv invoiceapp@YOUR_VPS_IP:/home/invoiceapp/invoice-app
```

### 2. Конфигуриране на Backend

```bash
cd /home/invoiceapp/invoice-app/backend
```

Редактирайте `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/sp_inv_app
spring.datasource.username=invoiceapp
spring.datasource.password=STRONG_PASSWORD_HERE

# Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Flyway
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true

# Server
server.port=8080
server.address=127.0.0.1

# Security
jwt.secret=YOUR_SUPER_SECRET_JWT_KEY_HERE_MIN_256_BITS
jwt.expiration=86400000

# Currency (преди 2026)
currency.default-currency=BGN
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=false

# VIES
vies.enabled=true
vies.timeout=5000

# Logging (production)
logging.level.root=WARN
logging.level.com.invoiceapp.backend=INFO
logging.file.name=/home/invoiceapp/invoice-app/logs/app.log
```

**Важно:** Генерирайте сигурен JWT secret:
```bash
openssl rand -base64 64
```

### 3. Build на Backend

```bash
cd /home/invoiceapp/invoice-app/backend
mvn clean package -DskipTests

# JAR файлът ще бъде в target/backend-0.0.1-SNAPSHOT.jar
```

### 4. Конфигуриране на Frontend

```bash
cd /home/invoiceapp/invoice-app/frontend
```

Създайте `.env.production`:

```bash
REACT_APP_GRAPHQL_URI=https://yourdomain.com/graphql
REACT_APP_API_URL=https://yourdomain.com/api
```

### 5. Build на Frontend

```bash
cd /home/invoiceapp/invoice-app/frontend
npm install --production
npm run build

# Build output ще бъде в build/
```

### 6. Systemd Service за Backend

Създайте service file:

```bash
sudo nano /etc/systemd/system/invoice-backend.service
```

Съдържание:

```ini
[Unit]
Description=Invoice App Backend
After=network.target postgresql.service

[Service]
Type=simple
User=invoiceapp
WorkingDirectory=/home/invoiceapp/invoice-app/backend
ExecStart=/usr/bin/java -jar -Xmx2g -Xms512m target/backend-0.0.1-SNAPSHOT.jar
Restart=on-failure
RestartSec=10
StandardOutput=append:/home/invoiceapp/invoice-app/logs/backend.log
StandardError=append:/home/invoiceapp/invoice-app/logs/backend-error.log

Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"

[Install]
WantedBy=multi-user.target
```

Създайте папката за логове:

```bash
mkdir -p /home/invoiceapp/invoice-app/logs
```

Активирайте и стартирайте service-а:

```bash
sudo systemctl daemon-reload
sudo systemctl enable invoice-backend
sudo systemctl start invoice-backend
sudo systemctl status invoice-backend
```

Проверка на логовете:

```bash
tail -f /home/invoiceapp/invoice-app/logs/backend.log
```

### 7. Nginx конфигурация

Създайте Nginx config:

```bash
sudo nano /etc/nginx/sites-available/invoice-app
```

Съдържание:

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (ще бъдат създадени от Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React build)
    root /home/invoiceapp/invoice-app/frontend/build;
    index index.html;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API (GraphQL)
    location /graphql {
        proxy_pass http://127.0.0.1:8080/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend GraphiQL (опционално, само за development)
    # location /graphiql {
    #     proxy_pass http://127.0.0.1:8080/graphiql;
    #     proxy_http_version 1.1;
    #     proxy_set_header Host $host;
    # }

    # Backend API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logs
    access_log /var/log/nginx/invoice-app-access.log;
    error_log /var/log/nginx/invoice-app-error.log;
}
```

Активирайте конфигурацията:

```bash
sudo ln -s /etc/nginx/sites-available/invoice-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL Certificate (Let's Encrypt)

**Важно:** Преди това трябва да насочите вашия домейн към VPS IP адреса чрез DNS A record.

```bash
# Получаване на сертификат
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Следвайте инструкциите на Certbot
# Изберете опция за автоматично redirect към HTTPS
```

Certbot автоматично ще:
- Генерира SSL сертификат
- Обнови Nginx конфигурацията
- Настрои auto-renewal (сертификатите се обновяват на всеки 90 дни)

Проверка на auto-renewal:

```bash
sudo certbot renew --dry-run
```

### 9. Създаване на SUPER_ADMIN потребител

```bash
cd /home/invoiceapp/invoice-app/reset
chmod +x create-super-admin.sh
./create-super-admin.sh
```

Следвайте инструкциите за създаване на първия администраторски акаунт.

### 10. Финална проверка

1. **Backend health check:**
```bash
curl http://localhost:8080/actuator/health
# Очакван отговор: {"status":"UP"}
```

2. **Frontend:**
Отворете браузър и посетете: `https://yourdomain.com`

Трябва да видите login страницата.

3. **GraphQL:**
Посетете: `https://yourdomain.com/graphql` (ако не сте коментирали graphiql в Nginx)

4. **Login:**
Влезте с SUPER_ADMIN credentials

## Поддръжка и мониторинг

### Логове

**Backend логове:**
```bash
tail -f /home/invoiceapp/invoice-app/logs/backend.log
tail -f /home/invoiceapp/invoice-app/logs/backend-error.log
```

**Nginx логове:**
```bash
sudo tail -f /var/log/nginx/invoice-app-access.log
sudo tail -f /var/log/nginx/invoice-app-error.log
```

**Systemd service логове:**
```bash
sudo journalctl -u invoice-backend -f
```

### Restart на услуги

**Backend:**
```bash
sudo systemctl restart invoice-backend
```

**Nginx:**
```bash
sudo systemctl reload nginx
```

**PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

### Обновяване на приложението

#### Backend обновяване

```bash
cd /home/invoiceapp/invoice-app
git pull origin main

cd backend
mvn clean package -DskipTests

sudo systemctl restart invoice-backend
```

#### Frontend обновяване

```bash
cd /home/invoiceapp/invoice-app
git pull origin main

cd frontend
npm install --production
npm run build

# Не е нужен restart, Nginx serve-ва статичните файлове
```

### Backup

#### Database backup

Създайте скрипт за автоматичен backup:

```bash
sudo nano /home/invoiceapp/backup-db.sh
```

Съдържание:

```bash
#!/bin/bash

# Configuration
DB_NAME="sp_inv_app"
DB_USER="invoiceapp"
BACKUP_DIR="/home/invoiceapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='STRONG_PASSWORD_HERE' pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Delete old backups (older than 30 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Направете скрипта изпълним:

```bash
chmod +x /home/invoiceapp/backup-db.sh
```

Добавете cron job за ежедневен backup:

```bash
crontab -e
```

Добавете:

```
0 2 * * * /home/invoiceapp/backup-db.sh >> /home/invoiceapp/backup.log 2>&1
```

Този cron job ще прави backup всяка нощ в 02:00.

#### Application files backup

```bash
# Backup на цялото приложение
cd /home/invoiceapp
tar -czf invoice-app-backup-$(date +%Y%m%d).tar.gz invoice-app

# Копиране на backup на друго място (опционално)
scp invoice-app-backup-*.tar.gz user@backup-server:/backups/
```

### Restore от backup

```bash
# Restore на database
gunzip < /home/invoiceapp/backups/db_backup_XXXXXX.sql.gz | psql -h localhost -U invoiceapp -d sp_inv_app

# Restore на application files
cd /home/invoiceapp
tar -xzf invoice-app-backup-XXXXXXXX.tar.gz
sudo systemctl restart invoice-backend
```

### Monitoring с простите инструменти

#### Disk space

```bash
df -h
```

#### Memory usage

```bash
free -h
```

#### CPU usage

```bash
top
# или
htop
```

#### Service status

```bash
sudo systemctl status invoice-backend
sudo systemctl status nginx
sudo systemctl status postgresql
```

### Мониторинг с външни tools (опционално)

За по-сериозен мониторинг разгледайте:

- **Prometheus + Grafana** - Метрики и визуализация
- **ELK Stack** - Централизирано логване
- **Uptime Robot** - Проверка на достъпност
- **Sentry** - Error tracking

## Security Best Practices

### 1. Firewall правила

Затворете ненужните портове:

```bash
sudo ufw status
sudo ufw deny 8080/tcp  # Backend port не трябва да е достъпен извън localhost
```

### 2. SSH ключове вместо пароли

Деактивирайте password authentication:

```bash
sudo nano /etc/ssh/sshd_config
```

Променете:
```
PasswordAuthentication no
PermitRootLogin no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 3. Fail2ban

Защита срещу brute-force атаки:

```bash
sudo apt install -y fail2ban

sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 4. Regular updates

```bash
# Автоматични security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 5. PostgreSQL security

Редактирайте `pg_hba.conf`:

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Уверете се, че има:
```
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
```

Само локални връзки са разрешени.

### 6. Промяна на JWT secret

Генерирайте силен JWT secret:

```bash
openssl rand -base64 64
```

Сложете го в `application.properties`:
```properties
jwt.secret=<generated-secret-here>
```

## Troubleshooting

### Backend не стартира

**Проверка 1: Логове**
```bash
sudo journalctl -u invoice-backend -n 100
```

**Проблем: Port already in use**
```bash
sudo lsof -i :8080
sudo kill -9 <PID>
sudo systemctl restart invoice-backend
```

**Проблем: Database connection failed**
- Проверете PostgreSQL service: `sudo systemctl status postgresql`
- Проверете credentials в `application.properties`
- Тествайте връзката ръчно: `psql -h localhost -U invoiceapp -d sp_inv_app`

### Frontend показва грешки

**Проблем: CORS errors**
- Уверете се, че backend е настроен правилно да приема requests от frontend домейна
- Проверете Nginx proxy headers

**Проблем: Cannot connect to GraphQL**
- Проверете дали backend е стартиран: `sudo systemctl status invoice-backend`
- Тествайте GraphQL endpoint: `curl http://localhost:8080/graphql -d '{"query":"{__typename}"}'`
- Проверете Nginx конфигурацията за `/graphql` location

### SSL certificate грешки

**Проблем: Certificate expired**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

**Проблем: Certbot failed**
- Проверете дали домейнът сочи към правилния IP
- Проверете firewall: `sudo ufw status`
- Проверете Nginx syntax: `sudo nginx -t`

## Performance Optimization

### 1. PostgreSQL tuning

Редактирайте `postgresql.conf`:

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

За VPS с 4GB RAM:
```
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 2. JVM tuning

Редактирайте systemd service:

```bash
sudo nano /etc/systemd/system/invoice-backend.service
```

Променете `ExecStart`:
```
ExecStart=/usr/bin/java -jar -Xmx2g -Xms512m -XX:+UseG1GC target/backend-0.0.1-SNAPSHOT.jar
```

### 3. Nginx caching

Добавете в Nginx config:

```nginx
# Кеширане на static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. Database connection pool

В `application.properties`:

```properties
# Connection pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

## Заключение

Вашето приложение е сега deploy-нато и работи на production VPS!

**Checklist:**
- ✅ VPS настроен и secured
- ✅ PostgreSQL database running
- ✅ Backend service активен
- ✅ Frontend build deployed
- ✅ Nginx configured като reverse proxy
- ✅ SSL certificate активен
- ✅ SUPER_ADMIN потребител създаден
- ✅ Backups конфигурирани
- ✅ Monitoring setup

**Следващи стъпки:**
1. Създайте първата си фирма
2. Добавете потребители
3. Започнете да използвате системата
4. Настройте SMTP за email функционалност
5. Конфигурирайте редовни backups
6. Проследявайте логовете за проблеми

---

**За помощ:** Свържете се с поддръжката или отворете issue в GitHub repository.

**Последна актуализация:** 24 ноември 2025
