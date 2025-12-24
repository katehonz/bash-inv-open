# Bash Inv - Bash Web Електронно Фактуриране

![Bash Inv Screenshot](./invd.jpg)

> **Пълната документация на български език е в папката [`docs-bg/`](./docs-bg/README.md)**

---

## Описание

**Bash Inv** е модерна, пълнофункционална система за електронно фактуриране, специално проектирана за българския пазар.

Приложението предлага:
- Пълно електронно управление на документи (фактури, кредитни/дебитни известия, проформи)
- **UBL 2.1 XML експорт** съгласно EN 16931 стандарт (Peppol съвместим)
- VIES интеграция за автоматично попълване на EU клиенти
- Многовалутна поддръжка с автоматични курсове от БНБ/ЕЦБ
- Готовност за присъединяването на България към Еврозоната (01.01.2026)
- PDF генериране и експорт
- Пълно съответствие със ЗДДС, българското и европейско данъчно законодателство
- Role-based access control (SUPER_ADMIN, ADMIN, USER, ACCOUNTANT)

## 2. Технологичен стек

- **Backend:**
  - **Език:** Java 21
  - **Framework:** Spring Boot 3.x
  - **База данни:** Spring Data JPA / Hibernate
  - **API:** Spring for GraphQL
  - **XML експорт:** UBL 2.1 генератор (EN 16931 съвместим)
  - **Scheduler:** Quartz (автоматични backup-и)
  - **Build Tool:** Apache Maven
- **Frontend:**
  - **Библиотека:** React 18+
  - **Език:** JavaScript
  - **GraphQL Client:** Apollo Client
  - **Стилизация:** Material-UI
- **База данни:**
  - **Система:** PostgreSQL 15+
- **Backup:**
  - **Storage:** S3-съвместимо (Hetzner Object Storage)

## Статус на проекта

✅ **Production Ready**

- Backend: 95% завършен
- Frontend: 90% завършен
- UBL XML експорт: ✅ Пълна EN 16931 съвместимост
- Peppol готовност: ✅ BIS Billing 3.0 поддръжка
- VIES интеграция: ✅ Автоматично попълване на EU клиенти
- Database: Стабилна schema с migrations
- Security: JWT автентикация
- Documentation: Пълна на български и английски език

## Бърз старт

### Предварителни изисквания

- Java 21
- Node.js 20+
- PostgreSQL 15+
- Maven 3.9+

### Стартиране в 3 стъпки

```bash
# 1. Създайте база данни
createdb sp-inv-app

# 2. Конфигурирайте application.properties
# Редактирайте backend/src/main/resources/application.properties
# Задайте вашите database credentials

# 3. Стартирайте приложението
./start.sh
```

Приложението ще стартира на:
- Backend: http://localhost:8080
- Frontend: http://localhost:3000
- GraphiQL: http://localhost:8080/graphiql

## Документация

Пълната документация е достъпна в следните раздели:

### 🇧� Българска документация (`docs-bg/`)
1. **[README.md](./docs-bg/README.md)** - Обща информация и преглед
2. **[01-instalacia.md](./docs-bg/01-instalacia.md)** - Детайлно ръководство за инсталация
3. **[02-funkcionalnisti.md](./docs-bg/02-funkcionalnisti.md)** - Описание на всички функционалности
4. **[03-graphql-api.md](./docs-bg/03-graphql-api.md)** - GraphQL API документация
5. **[04-konfiguraciq.md](./docs-bg/04-konfiguraciq.md)** - Конфигурационни настройки
6. **[05-deployment-vps.md](./docs-bg/05-deployment-vps.md)** - Ръководство за deployment на VPS
7. **[06-faq.md](./docs-bg/06-faq.md)** - Често задавани въпроси

### 🇬🇧 Техническа документация (`docs/`)
1. **[UBL-EXPORT.md](./docs/UBL-EXPORT.md)** - **UBL 2.1 XML експорт и Peppol интеграция**
2. **[currency-architecture.md](./docs/currency-architecture.md)** - Многовалутна архитектура
3. **[vies-integration-guide.md](./docs/vies-integration-guide.md)** - VIES API интеграция
4. **[payment-methods-and-bank-accounts-implementation.md](./docs/payment-methods-and-bank-accounts-implementation.md)** - Плащания и банки
5. **[role-based-access-implementation.md](./docs/role-based-access-implementation.md)** - Роли и права
6. **[bulgarian-invoicing-compliance.md](./docs/bulgarian-invoicing-compliance.md)** - Съответствие с българското законодателство

## Структура на проекта

```
/
├── backend/              # Spring Boot приложение
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/invoiceapp/backend/
│   │   │   │   ├── config/       # Конфигурация
│   │   │   │   ├── controller/   # GraphQL контролери
│   │   │   │   ├── model/        # Entity класове и DTOs
│   │   │   │   ├── repository/   # JPA repositories
│   │   │   │   └── service/      # Бизнес логика
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── db/migration/ # Flyway migrations
│   │   └── test/
│   └── pom.xml
├── frontend/             # React приложение
│   ├── src/
│   │   ├── pages/       # React pages/routes
│   │   ├── components/  # Reusable компоненти
│   │   ├── graphql/     # GraphQL операции
│   │   ├── context/     # React context
│   │   └── apollo/      # Apollo Client конфигурация
│   └── package.json
├── docs/                 # Техническа документация (английски)
├── docs-bg/              # Потребителска документация (български)
├── reset/                # Скриптове за reset и setup
├── start.sh              # Скрипт за стартиране
├── stop.sh               # Скрипт за спиране
└── README.md             # Този файл
```

## Ключови функции

### 🌟 VIES Интеграция (Уникална функция!)
Автоматично валидиране и попълване на данни за EU клиенти чрез техния ДДС номер. **Единствената система за електронно фактуриране в България с тази функционалност!**

### 💶 Готовност за Еврозоната
Автоматично превключване от BGN към EUR на 01.01.2026. Dual-source архитектура (БНБ + ЕЦБ) за валутни курсове.

### ✅ Българска валидация
- Автоматична проверка на ЕИК (с контролна сума)
- Валидация на български ДДС номера
- IBAN валидация
- Проверка на последователност на фактури

### 📄 Професионални електронни документи
- Фактури, кредитни/дебитни известия, проформи
- **UBL 2.1 XML експорт** (EN 16931 съвместим, Peppol готов)
- PDF експорт с лого, печат, подпис
- Автоматично номериране без пропуски
- Многовалутна поддръжка

### 🌐 UBL 2.1 XML & Peppol Интеграция
- **Пълен UBL 2.1 стандарт** - EN 16931 съвместимост
- **Peppol BIS Billing 3.0** - Готовност за мрежата Peppol
- **120+ мерни единици** - UN/ECE Rec 20 стандартизация
- **30+ типа документи** - Пълна поддръжка на UNCL1001 кодове
- **70+ държави** - Peppol endpoint схеми за цял ЕС
- **ERP интеграция** - Директен импорт в SAP, Oracle, Microsoft Dynamics
- **Автоматично прикачане** - UBL XML към имейли за ERP системи

### 🔒 Сигурност
- JWT автентикация
- Role-based access control
- BCrypt password hashing
- HTTPS/SSL ready

## Ръчно стартиране

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
# Стартира на http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm start
# Стартира на http://localhost:3000
```

### Използване на скриптовете (препоръчва се)

```bash
# Стартиране на всичко
./start.sh

# Спиране
./stop.sh
```

## Deployment на VPS

### Бързо обновяване

```bash
cd /opt/sp-inv
./update.sh
```

### Детайлно ръководство

Виж **[DEPLOYMENT.md](./DEPLOYMENT.md)** или **[docs-bg/05-deployment-vps.md](./docs-bg/05-deployment-vps.md)**

Включва:
- VPS setup и конфигурация (12 ядра, 32GB RAM)
- Caddy reverse proxy с автоматичен SSL
- Systemd services за автостарт
- S3 backup към Hetzner Object Storage
- PostgreSQL, Redis, Caddy контейнери

### Production URL

🌐 **https://your-domain.com**

## Поддръжка

За въпроси и проблеми:
- Документация: [docs-bg/](./docs-bg/)
- FAQ: [docs-bg/06-faq.md](./docs-bg/06-faq.md)

## Автор

**Информейт ЕООД**

## Лиценз

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2024 Informeit EOOD

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

**Последна актуализация:** 24 декември 2025

