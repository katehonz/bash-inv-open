# SP-INV-MASTER - Docker Deployment

## Преглед на архитектурата

Приложението **sp-inv-master** (система за фактуриране) е интегрирано в мрежата на **rs-ac-bg** и споделя същите PostgreSQL и Redis контейнери.

### Мрежова архитектура

```
rs-ac-bg_accounting_network (172.20.0.0/16)
├── accounting_db (172.20.0.10) - PostgreSQL
├── accounting_redis (172.20.0.11) - Redis
├── accounting_service (172.20.0.20) - Rust Backend
├── accounting_frontend (172.20.0.30) - React Frontend
├── invoicing_backend (172.20.0.40) - Java/Spring Boot Backend
└── invoicing_frontend (172.20.0.41) - React/Nginx Frontend
```

### Бази данни в PostgreSQL

- `accounting` - Счетоводно приложение (rs-ac-bg)
- `sp_inv_app` - Система за фактуриране (sp-inv-master)

## Предварителни изисквания

1. **rs-ac-bg трябва да е стартиран:**
   ```bash
   cd /home/rshet/hetz-rs/rs-ac-bg
   docker-compose up -d
   ```

2. **Docker и Docker Compose** трябва да са инсталирани

## Файлова структура

```
sp-inv-master/
├── backend/
│   ├── src/                    # Java source code
│   ├── pom.xml                 # Maven configuration
│   ├── Dockerfile              # Multi-stage build (Maven + JRE)
│   └── .dockerignore
├── frontend/
│   ├── src/                    # React source code
│   ├── package.json
│   ├── Dockerfile              # Multi-stage build (Node + Nginx)
│   ├── nginx.conf              # Nginx configuration
│   └── .dockerignore
├── docker-compose.yml          # Главна конфигурация
├── .env.example                # Примерни environment variables
├── start-docker.sh             # Скрипт за стартиране
└── DOCKER_DEPLOYMENT.md        # Тази документация
```

## Компилация и deployment

### 1. Първоначална настройка

Копирайте `.env.example` като `.env`:

```bash
cd /home/rshet/hetz-rs/sp-inv-master
cp .env.example .env
```

Редактирайте `.env` файла ако е необходимо:
```bash
nano .env
```

### 2. Стартиране

**Автоматично (препоръчва се):**
```bash
./start-docker.sh
```

**Ръчно:**
```bash
# Проверка че rs-ac-bg работи
docker ps | grep accounting_db

# Build и start
docker-compose up -d --build
```

### 3. Проверка на статуса

```bash
# Всички контейнери
docker ps

# Логове
docker-compose logs -f

# Логове само за backend
docker-compose logs -f invoicing_backend

# Логове само за frontend
docker-compose logs -f invoicing_frontend
```

## Build процес (автоматично в Docker)

### Backend (Java/Spring Boot)
1. **Build stage:** Maven компилира Java кода и създава JAR файл
2. **Runtime stage:** Копира JAR-a в JRE контейнер

```dockerfile
# Стъпка 1: Build с Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
RUN mvn clean package -DskipTests

# Стъпка 2: Runtime
FROM eclipse-temurin:17-jre-alpine
COPY --from=builder /app/target/*.jar app.jar
```

### Frontend (React)
1. **Build stage:** Node.js компилира React приложението
2. **Runtime stage:** Nginx сървър за статичните файлове

```dockerfile
# Стъпка 1: Build с Node
FROM node:20-alpine AS builder
RUN npm ci && npm run build

# Стъпка 2: Nginx сървър
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
```

## Достъп до приложението

### Локален достъп (development)
- Backend API: http://localhost:8080
- GraphQL: http://localhost:8080/graphql
- GraphiQL: http://localhost:8080/graphiql (ако е enabled)
- Frontend: Достъпен чрез Caddy proxy

### Production достъп (чрез Caddy)
- **https://inv.cyberbuch.org**
  - Frontend: React SPA
  - Backend API: /graphql endpoint

## Caddy конфигурация

Caddy reverse proxy автоматично управлява:
- SSL сертификати (Let's Encrypt)
- HTTPS редиректи
- Proxy към backend и frontend
- Gzip компресия
- Security headers

Конфигурацията е в `/home/rshet/hetz-rs/caddy-proxy/Caddyfile`:

```caddy
inv.cyberbuch.org {
    encode gzip

    handle /graphql {
        reverse_proxy invoicing_backend:8080
    }

    handle {
        reverse_proxy invoicing_frontend:80
    }
}
```

## Управление

### Стартиране
```bash
docker-compose up -d
```

### Спиране
```bash
docker-compose down
```

### Рестартиране
```bash
docker-compose restart
```

### Преизграждане след промени в кода
```bash
docker-compose down
docker-compose up -d --build
```

### Изтриване на всичко (включително volumes)
```bash
docker-compose down -v
```

## Database миграции

Flyway автоматично прилага database миграциите при стартиране на backend-а.

Миграционните файлове са в:
```
backend/src/main/resources/db/migration/
```

## Troubleshooting

### Backend не може да се свърже с базата данни

1. Проверете че rs-ac-bg е стартиран:
   ```bash
   docker ps | grep accounting_db
   ```

2. Проверете мрежата:
   ```bash
   docker network inspect rs-ac-bg_accounting_network
   ```

3. Проверете логовете:
   ```bash
   docker-compose logs invoicing_backend
   ```

### Frontend не може да достигне backend

1. Проверете че backend-ът работи:
   ```bash
   docker exec invoicing_backend curl http://localhost:8080/actuator/health
   ```

2. Проверете nginx конфигурацията в контейнера:
   ```bash
   docker exec invoicing_frontend cat /etc/nginx/conf.d/default.conf
   ```

### Бавна компилация

Multi-stage build използва Docker layer caching:
- Maven dependencies се кешират ако `pom.xml` не е променен
- npm dependencies се кешират ако `package.json` не е променен

### Проверка на базата данни

```bash
# Влизане в PostgreSQL
docker exec -it accounting_db psql -U app -d sp_inv_app

# Списък на таблиците
\dt

# Изход
\q
```

## Environment Variables

Пълен списък на променливите в `.env`:

```bash
# Database (споделя парола с rs-ac-bg)
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# JWT Security
JWT_SECRET=MySecureJwtSecretKeyThatIsAtLeast32CharactersLong!
JWT_EXPIRATION=86400

# Logging
LOG_LEVEL=INFO
SHOW_SQL=false

# Development
GRAPHIQL_ENABLED=false  # true за development
```

## Backup

Backup-ите се управляват от самото приложение чрез интерфейса.
Файловете се съхраняват в `./backups/` директорията.

## Мониторинг

### Health checks

Backend:
```bash
curl http://localhost:8080/actuator/health
```

Frontend:
```bash
curl http://localhost:80/
```

### Metrics (ако е enabled)

```bash
curl http://localhost:8080/actuator/metrics
```

## Security

1. **JWT Authentication:** Backend използва JWT tokens
2. **HTTPS:** Caddy управлява SSL сертификатите
3. **Database:** Отделна база данни за всяко приложение
4. **Network isolation:** Само accounting network
5. **Non-root containers:** И двата контейнера работят с non-root user

---

**Последна актуализация:** 26 ноември 2025
