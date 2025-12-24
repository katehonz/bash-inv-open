# Bash Inv - Web Електронно Фактуриране Deployment Guide

## Системни изисквания на VPS

- **CPU:** 12 ядра
- **RAM:** 32 GB
- **OS:** Linux (Debian/Ubuntu)
- **Контейнери:** PostgreSQL, Redis, Caddy (вече инсталирани)

## Предварителни изисквания

```bash
# Java 21
sudo apt update
sudo apt install openjdk-21-jdk -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Maven
sudo apt install maven -y

# PostgreSQL client (за pg_dump - backup функционалност)
sudo apt install postgresql-client -y
```

## Първоначална инсталация

### 1. Клониране на репозиторито

```bash
cd /opt
sudo git clone https://gitlab.com/your-username/sp-inv.git
sudo chown -R $USER:$USER sp-inv
cd sp-inv
```

### 2. Конфигурация на базата данни

Създайте база данни в PostgreSQL контейнера:

```bash
docker exec -it postgres psql -U postgres -c "CREATE DATABASE \"sp-inv-app\";"
```

### 3. Конфигурация на приложението

```bash
cd backend/src/main/resources

# Копирайте и редактирайте production конфигурацията
cp application.properties application-local.properties

# Редактирайте application.properties за production
nano application.properties
```

Променете следните стойности:

```properties
# Database - използвайте Docker network или localhost с port mapping
spring.datasource.url=jdbc:postgresql://localhost:5432/sp-inv-app
spring.datasource.username=postgres
spring.datasource.password=YOUR_SECURE_PASSWORD

# JWT - генерирайте сигурен ключ
jwt.secret=YOUR_VERY_LONG_AND_SECURE_JWT_SECRET_KEY_AT_LEAST_32_CHARS

# Production settings
spring.jpa.show-sql=false
spring.graphql.graphiql.enabled=false
logging.level.root=WARN
logging.level.com.invoiceapp=INFO
```

### 4. Build и стартиране

```bash
# Backend
cd /opt/sp-inv/backend
mvn clean package -DskipTests
java -jar target/*.jar &

# Frontend
cd /opt/sp-inv/frontend
npm ci
npm run build
```

### 5. Nginx конфигурация за Frontend

```bash
sudo nano /etc/nginx/sites-available/sp-inv
```

```nginx
server {
    listen 3000;
    server_name localhost;
    root /opt/sp-inv/frontend/build;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location /graphql {
        proxy_pass http://localhost:8080/graphql;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    location /actuator {
        proxy_pass http://localhost:8080/actuator;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sp-inv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Caddy конфигурация

Добавете към Caddyfile:

```caddy
your-domain.com {
    reverse_proxy localhost:3000
    encode gzip

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        -Server
    }
}
```

```bash
sudo systemctl reload caddy
```

## Systemd Service (автоматично стартиране)

### Backend Service

```bash
sudo nano /etc/systemd/system/sp-inv-backend.service
```

```ini
[Unit]
Description=SP-INV Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/sp-inv/backend
ExecStart=/usr/bin/java -Xms512m -Xmx4g -jar /opt/sp-inv/backend/target/backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable sp-inv-backend
sudo systemctl start sp-inv-backend
```

## Обновяване на приложението

```bash
cd /opt/sp-inv

# Спиране на backend
sudo systemctl stop sp-inv-backend

# Pull от GitLab
git pull origin master

# Rebuild backend
cd backend
mvn clean package -DskipTests

# Rebuild frontend
cd ../frontend
npm ci
npm run build

# Стартиране
sudo systemctl start sp-inv-backend
```

### Скрипт за бързо обновяване

```bash
#!/bin/bash
# /opt/sp-inv/update.sh

set -e
cd /opt/sp-inv

echo "Pulling latest changes..."
git pull origin master

echo "Building backend..."
cd backend
mvn clean package -DskipTests -q

echo "Building frontend..."
cd ../frontend
npm ci --silent
npm run build

echo "Restarting backend..."
sudo systemctl restart sp-inv-backend

echo "Done! Application updated."
```

## Мониторинг

```bash
# Backend логове
sudo journalctl -u sp-inv-backend -f

# Backend статус
sudo systemctl status sp-inv-backend

# Health check
curl http://localhost:8080/actuator/health
```

## Backup

Архивирането се управлява от приложението (Глобални настройки -> Архивиране).
Конфигурирайте Hetzner S3 Object Storage за автоматични backup-и.

## Ports

| Service | Port | Description |
|---------|------|-------------|
| Backend | 8080 | Spring Boot API |
| Frontend (nginx) | 3000 | React static files |
| Caddy | 443 | HTTPS reverse proxy |
| PostgreSQL | 5432 | Database |
