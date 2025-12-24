# SP-INV-MASTER - Deployment Status

**Дата:** 26 ноември 2025
**Статус:** ✅ DEPLOYED & RUNNING

## Контейнери

| Контейнер | Статус | Мрежа | IP Адрес |
|-----------|--------|-------|----------|
| `invoicing_backend` | Running (Java/Spring Boot) | rs-ac-bg_accounting_network | 172.20.0.40:8080 |
| `invoicing_frontend` | Running (React/Nginx) | rs-ac-bg_accounting_network | 172.20.0.41:80 |

## Споделени ресурси с rs-ac-bg

- **PostgreSQL:** `accounting_db` (172.20.0.10:5432)
  - База данни: `sp_inv_app` ✅ Created
- **Redis:** `accounting_redis` (172.20.0.11:6379)
- **Мрежа:** `rs-ac-bg_accounting_network` (172.20.0.0/16)

## Достъп до приложението

### Production URL
🌐 **https://your-domain.com**

- Frontend: React SPA
- Backend API: /graphql endpoint
- GraphiQL: /graphiql (ако е enabled)

### Вътрешен достъп (Docker network)
- Backend: `http://invoicing_backend:8080`
- Frontend: `http://invoicing_frontend:80`
- GraphQL: `http://invoicing_backend:8080/graphql`

### Портове
- Всички портове са `expose` only (не са mapped към хост)
- Достъп само чрез Caddy reverse proxy
- ✅ Няма port conflicts с други приложения

## Caddy конфигурация

Файл: `/home/rshet/hetz-rs/caddy-proxy/Caddyfile`

```caddy
your-domain.com {
    encode gzip

    handle /graphql {
        reverse_proxy invoicing_backend:8080
    }

    handle {
        reverse_proxy invoicing_frontend:80
    }
}
```

**Статус:** ✅ Reload-нат и активен

## Database Schema

**Метод:** JPA/Hibernate `ddl-auto=update`

- Flyway migrations временно изключени
- JPA автоматично създава schema на база на Entity класове
- Таблици създадени успешно в `sp_inv_app` база данни

**Забележка:** Migration файловете са премес тени в:
```
backend/src/main/resources/db/migration_backup/
```

## Управление

### Стартиране
```bash
cd /home/rshet/hetz-rs/sp-inv-master
docker compose up -d
```

### Спиране
```bash
docker compose down
```

### Логове
```bash
# Всички логове
docker compose logs -f

# Само backend
docker logs -f invoicing_backend

# Само frontend
docker logs -f invoicing_frontend
```

### Restart
```bash
# Цялото приложение
docker compose restart

# Само backend
docker compose restart invoicing_backend

# Reload на Caddy
docker exec caddy_proxy caddy reload --config /etc/caddy/Caddyfile
```

## Build процес

- **Backend:** Multi-stage Docker build
  1. Maven 3.9 + Eclipse Temurin 17 (build stage)
  2. Eclipse Temurin 17 JRE (runtime)

- **Frontend:** Multi-stage Docker build
  1. Node.js 20 (build stage)
  2. Nginx stable (runtime)

**Време за build:** ~5-7 минути (първия път)

## Environment Variables

Файл: `.env` (създаден от `.env.example`)

```bash
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
JWT_SECRET=YOUR_JWT_SECRET_KEY_HERE_32_CHARS_MIN
JWT_EXPIRATION=86400
LOG_LEVEL=INFO
SHOW_SQL=false
GRAPHIQL_ENABLED=false
```

## Мрежова архитектура

```
Internet
    ↓
Caddy Proxy (caddy_proxy) - Ports 80, 443
    ↓
rs-ac-bg_accounting_network (172.20.0.0/16)
    ├── accounting_db (172.20.0.10) - PostgreSQL
    │   ├── Database: accounting (rs-ac-bg)
    │   └── Database: sp_inv_app (sp-inv-master) ✅
    ├── accounting_redis (172.20.0.11) - Redis
    ├── accounting_service (172.20.0.20) - Rust Backend
    ├── accounting_frontend (172.20.0.30) - React Frontend
    ├── invoicing_backend (172.20.0.40) - Java Backend ✅
    └── invoicing_frontend (172.20.0.41) - React Frontend ✅
```

## Security

- ✅ JWT Authentication (Backend)
- ✅ HTTPS via Caddy (автоматичен SSL от Let's Encrypt)
- ✅ Non-root containers
- ✅ Network isolation (само accounting_network)
- ✅ Отделни бази данни за всяко приложение
- ✅ Password хеширане (BCrypt)

## Следващи стъпки (препоръки)

1. **Активиране на Flyway migrations:**
   - Върнете migration файловете
   - Създайте V0__Initial_schema.sql с базов schema
   - Променете `SPRING_FLYWAY_ENABLED: true`

2. **Мониторинг:**
   - Настройте health check endpoints
   - Добавете logging aggregation

3. **Backup:**
   - Конфигурирайте S3 backup (Hetzner Object Storage)
   - Настройте cron jobs за автоматични backups

4. **Production hardening:**
   - Променете JWT_SECRET с по-дълъг random key
   - Променете DB_PASSWORD
   - Изключете GraphiQL в production
   - Настройте rate limiting

## Troubleshooting

### Backend не стартира
```bash
docker logs invoicing_backend --tail=100
```

### Frontend не показва данни
```bash
# Проверете network connectivity
docker exec invoicing_frontend curl http://invoicing_backend:8080/graphql

# Проверете nginx config
docker exec invoicing_frontend cat /etc/nginx/conf.d/default.conf
```

### Database connection issues
```bash
# Влезте в PostgreSQL
docker exec -it accounting_db psql -U app -d sp_inv_app

# Списък на таблиците
\dt

# Проверете мрежата
docker network inspect rs-ac-bg_accounting_network
```

## Контакти & Поддръжка

- Deployment location: `/home/rshet/hetz-rs/sp-inv-master`
- Logs location: `./logs/`
- Backups location: `./backups/`

---

**Последна актуализация:** 26 ноември 2025, 19:18 UTC
