# Конфигурация

## Въведение

Този документ описва всички налични конфигурационни опции за Invoice-App.

## Backend конфигурация

### application.properties

Основният конфигурационен файл е:
```
backend/src/main/resources/application.properties
```

### Database настройки

```properties
# PostgreSQL Connection
spring.datasource.url=jdbc:postgresql://localhost:5432/sp-inv-app
spring.datasource.username=postgres
spring.datasource.password=your_password

# Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# HikariCP Connection Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

**Важни параметри:**

- `ddl-auto=validate` - Проверява schema без да я променя (за production)
- `ddl-auto=update` - Автоматично обновява schema (само за development!)
- `show-sql=true` - Показва SQL queries в логовете (само за development)
- `maximum-pool-size` - Максимален брой database connections

### Flyway Migration

```properties
# Flyway Configuration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=0
spring.flyway.locations=classpath:db/migration
```

**Migration файлове:**
```
backend/src/main/resources/db/migration/
├── V1__Initial_schema.sql
├── V2__Add_payment_methods.sql
└── V3__Add_vat_exemptions.sql
```

**Naming convention:**
- V{version}__{description}.sql
- Пример: V1__Create_users_table.sql

### Server настройки

```properties
# Server Port
server.port=8080

# Server Address (за production използвайте 127.0.0.1)
server.address=0.0.0.0

# Context Path (опционално)
# server.servlet.context-path=/api
```

### Security настройки

```properties
# JWT Configuration
jwt.secret=your-super-secret-jwt-key-here-min-256-bits
jwt.expiration=86400000

# CORS (за development)
cors.allowed-origins=http://localhost:3000,http://localhost:3001

# Security (за production)
spring.security.require-ssl=true
```

**Генериране на JWT secret:**
```bash
openssl rand -base64 64
```

**JWT expiration:**
- `86400000` ms = 24 часа
- `3600000` ms = 1 час
- `604800000` ms = 7 дни

### Currency настройки

```properties
currency.default-currency=EUR
currency.force-eurozone-mode=true
currency.enable-bnb-rates=false
currency.enable-ecb-rates=true
```

### VIES настройки

```properties
# VIES Integration
vies.enabled=true
vies.timeout=5000
vies.cache.ttl=1800
vies.retry.attempts=3
vies.retry.delay=1000
```

**Параметри:**
- `enabled` - Включва/изключва VIES интеграцията
- `timeout` - Timeout в milliseconds (5000 = 5 секунди)
- `cache.ttl` - Time-to-live на кеша в секунди (1800 = 30 минути)
- `retry.attempts` - Брой опити при неуспех
- `retry.delay` - Забавяне между опитите в milliseconds

### Logging настройки

#### Development

```properties
# Root level
logging.level.root=INFO

# Application logs
logging.level.com.invoiceapp.backend=DEBUG

# Specific services
logging.level.com.invoiceapp.backend.service.EcbService=DEBUG
logging.level.com.invoiceapp.backend.service.ViesService=DEBUG
logging.level.com.invoiceapp.backend.service.ValidationService=DEBUG

# Spring components
logging.level.org.springframework.web=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.hibernate.SQL=DEBUG
```

#### Production

```properties
# Root level
logging.level.root=WARN

# Application logs
logging.level.com.invoiceapp.backend=INFO

# Log file
logging.file.name=/var/log/invoice-app/app.log
logging.file.max-size=10MB
logging.file.max-history=30

# Pattern
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
```

### GraphQL настройки

```properties
# GraphQL Configuration
spring.graphql.graphiql.enabled=true
spring.graphql.path=/graphql
spring.graphql.schema.printer.enabled=true

# GraphQL performance
spring.graphql.schema.introspection.enabled=true
```

**Важно:** В production задайте `graphiql.enabled=false` за сигурност!

### Actuator настройки

```properties
# Actuator Endpoints
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized

# Base path
management.endpoints.web.base-path=/actuator
```

Достъпни endpoints:
- `/actuator/health` - Health check
- `/actuator/info` - Application info
- `/actuator/metrics` - Метрики

### Email (SMTP) настройки

SMTP настройките се конфигурират от UI (Company Settings), но могат и от `application.properties`:

```properties
# SMTP Configuration (опционално, ако не използвате UI)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**За Gmail:**
1. Включете 2-Factor Authentication
2. Генерирайте App Password: https://myaccount.google.com/apppasswords
3. Използвайте App Password вместо обикновената ви парола

### File Upload настройки

```properties
# File Upload
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB

# File storage
file.upload.dir=/home/invoiceapp/uploads
```

### Scheduled Tasks

```properties
# Task Scheduling
spring.task.scheduling.pool.size=5

# Cron expressions (вътрешно настроени, но могат да се override-нат)
# BNB rates: 0 30 14 * * ?  (14:30 daily)
# ECB rates: 0 0 16 * * ?   (16:00 daily)
# Token cleanup: 0 0 2 * * ? (02:00 daily)
```

## Frontend конфигурация

### package.json

Основната конфигурация на frontend:

```json
{
  "name": "invoice-app-frontend",
  "version": "1.0.0",
  "proxy": "http://localhost:8080",
  "dependencies": {
    "react": "^18.2.0",
    "@apollo/client": "^3.8.0",
    "@mui/material": "^5.14.0"
  }
}
```

### Environment variables

#### Development (.env.development)

```bash
REACT_APP_GRAPHQL_URI=http://localhost:8080/graphql
REACT_APP_API_URL=http://localhost:8080/api
```

#### Production (.env.production)

```bash
REACT_APP_GRAPHQL_URI=https://yourdomain.com/graphql
REACT_APP_API_URL=https://yourdomain.com/api
```

### Apollo Client конфигурация

В `src/apollo/client.js`:

```javascript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_GRAPHQL_URI || 'http://localhost:8080/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
```

## Environment-specific конфигурации

### Development

```properties
# Backend: application-dev.properties
spring.profiles.active=dev

spring.jpa.show-sql=true
logging.level.com.invoiceapp.backend=DEBUG
spring.graphql.graphiql.enabled=true
cors.allowed-origins=http://localhost:3000
```

Стартиране:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Production

```properties
# Backend: application-prod.properties
spring.profiles.active=prod

spring.jpa.show-sql=false
logging.level.com.invoiceapp.backend=INFO
spring.graphql.graphiql.enabled=false
server.address=127.0.0.1
spring.security.require-ssl=true
```

Стартиране:
```bash
java -jar -Dspring.profiles.active=prod backend.jar
```

## Database конфигурация

### PostgreSQL настройки

Редактиране на `postgresql.conf`:

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

#### За development (малък VPS)

```
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 8MB
```

#### За production (4GB RAM)

```
max_connections = 200
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### За production (8GB+ RAM)

```
max_connections = 300
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 32MB
random_page_cost = 1.1
effective_io_concurrency = 200
```

Restart след промени:
```bash
sudo systemctl restart postgresql
```

### pg_hba.conf

Редактиране на `pg_hba.conf`:

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

#### Development (позволява всички локални връзки)

```
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
```

#### Production (изисква парола)

```
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Reload след промени:
```bash
sudo systemctl reload postgresql
```

## Nginx конфигурация

Виж детайлна конфигурация в [05-deployment-vps.md](./05-deployment-vps.md)

## Systemd Service конфигурация

### Backend service

```ini
[Unit]
Description=Invoice App Backend
After=network.target postgresql.service

[Service]
Type=simple
User=invoiceapp
WorkingDirectory=/home/invoiceapp/invoice-app/backend
ExecStart=/usr/bin/java -jar -Xmx2g -Xms512m target/backend.jar
Restart=on-failure
RestartSec=10

Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
Environment="SPRING_PROFILES_ACTIVE=prod"

[Install]
WantedBy=multi-user.target
```

### JVM параметри

**Memory settings:**
- `-Xmx2g` - Maximum heap size (2GB)
- `-Xms512m` - Initial heap size (512MB)

**Garbage Collector:**
- `-XX:+UseG1GC` - G1 Garbage Collector (препоръчва се)
- `-XX:+UseZGC` - Z Garbage Collector (за low-latency)

**GC logging:**
- `-Xlog:gc*:file=/var/log/invoice-app/gc.log`

**Performance tuning:**
- `-server` - Server mode
- `-XX:+UseStringDeduplication` - String deduplication

Пълен пример:
```
ExecStart=/usr/bin/java -server -Xmx2g -Xms512m -XX:+UseG1GC -XX:+UseStringDeduplication -jar target/backend.jar
```

## Monitoring конфигурация

### Prometheus (опционално)

Добавете в `pom.xml`:

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

В `application.properties`:

```properties
management.endpoints.web.exposure.include=prometheus,health,info,metrics
management.metrics.export.prometheus.enabled=true
```

Endpoint: `/actuator/prometheus`

## Backup конфигурация

Виж детайлна конфигурация в [05-deployment-vps.md](./05-deployment-vps.md#backup)

## Troubleshooting конфигурации

### Debug mode

Временно включване на debug logging:

```bash
# За specific package
curl -X POST http://localhost:8080/actuator/loggers/com.invoiceapp.backend -H "Content-Type: application/json" -d '{"configuredLevel":"DEBUG"}'

# Връщане към INFO
curl -X POST http://localhost:8080/actuator/loggers/com.invoiceapp.backend -H "Content-Type: application/json" -d '{"configuredLevel":"INFO"}'
```

**Важно:** Изисква actuator endpoint `/actuator/loggers` да е enabled.

### Проверка на текуща конфигурация

```bash
# Environment variables
http://localhost:8080/actuator/env

# Configuration properties
http://localhost:8080/actuator/configprops
```

## Заключение

Това са основните конфигурационни опции за Invoice-App. За допълнителна информация вижте:

- [Spring Boot Configuration Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)
- [PostgreSQL Configuration](https://www.postgresql.org/docs/current/runtime-config.html)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Последна актуализация:** 24 ноември 2025
