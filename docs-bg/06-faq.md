# Често задавани въпроси (FAQ)

## Общи въпроси

### Какво е Invoice-App?

Invoice-App е модерна система за управление на фактури, специално проектирана за българския пазар. Предлага пълна функционалност за фактуриране с уникални възможности като VIES интеграция и автоматична подготовка за Еврозоната.

### Колко струва?

Subscription планове:
- **FREE** - Безплатен (до 2 потребителя)
- **PRO** - 30 лв/месец (до 10 потребителя)
- **BUSINESS** - 70 лв/месец (неограничен брой потребители)
- **ENTERPRISE** - По договаряне (custom функции)

### Подходящо ли е за моята фирма?

Invoice-App е подходящо за:
- Малки и средни фирми в България
- Фирми, които работят с EU клиенти
- ДДС регистрирани фирми
- Фирми, които искат да автоматизират фактурирането
- Фирми, които работят в множество валути

### Има ли mobile приложение?

В момента няма native mobile app, но уеб интерфейсът е responsive и работи добре на мобилни устройства. Native mobile app е в нашата roadmap.

## Технически въпроси

### Какви са системните изисквания?

**За локално development:**
- Java 17+
- Node.js 16+
- PostgreSQL 15+
- 4GB RAM минимум

**За VPS production:**
- 2 CPU cores
- 4GB RAM (препоръчва се 8GB)
- 40GB SSD
- Ubuntu 22.04 LTS

### Мога ли да го deploy-на на shared hosting?

Не, Invoice-App изисква VPS или dedicated сървър с пълен root достъп. Shared hosting не е достатъчен.

### Поддържа ли се Docker?

В момента няма официални Docker images, но можете сами да създадете Dockerfile. Docker support е планиран за бъдеща версия.

### Мога ли да използвам друга база данни освен PostgreSQL?

Не, приложението е оптимизирано специално за PostgreSQL. MySQL/MariaDB не се поддържат.

## Функционалности

### Какви типове документи мога да създавам?

- **INVOICE** - Фактура (данъчен документ)
- **CREDIT_NOTE** - Кредитно известие (данъчен документ)
- **DEBIT_NOTE** - Дебитно известие (данъчен документ)
- **PROFORMA** - Проформа фактура (неданъчен документ)

### Как работи VIES интеграцията?

VIES (VAT Information Exchange System) е официална EU система за валидация на ДДС номера. Когато въведете EU ДДС номер, системата автоматично:
1. Валидира номера
2. Извлича официално име на компанията
3. Извлича адрес
4. Попълва данните в полетата

**Работи само за EU държави!**

### Мога ли да създавам фактури в USD/EUR/други валути?

Да! Системата поддържа множество валути:
- BGN, EUR, USD, GBP, CHF, JPY и много други
- Автоматично изтегляне на курсове от БНБ/ЕЦБ
- Автоматично изчисляване на левова равностойност
- Готовност за Еврозоната

### Как се номерират документите?

Документите се номерират автоматично **без пропуски** (изискване на НАП):
- Отделни номерации за данъчни и неданъчни документи
- Формат: 0000000001, 0000000002, и т.н.
- DRAFT документи могат да имат временен номер
- FINAL документи получават окончателен номер

### Мога ли да експортирам PDF?

Да! Всеки документ може да се експортира в PDF формат:
- Client-side генериране (бързо)
- Професионален изглед
- Включва лого, печат, подпис
- Готов за принтиране

### Има ли email изпращане на фактури?

Функционалността за email изпращане е налична, но изисква конфигуриране на SMTP настройки. Планираме да добавим email templates и автоматично изпращане в следваща версия.

## VIES и валидации

### VIES не работи, какво да правя?

Възможни причини:
1. **VIES API е недостъпен** - Изчакайте и опитайте отново
2. **Невалиден ДДС номер** - Проверете формата (напр. BG123456789)
3. **Компанията не е EU** - VIES работи само за EU държави
4. **Firewall блокира** - Проверете интернет връзката

Системата автоматично прави fallback към SOAP API при проблем с REST API.

### Какви валидации има за български данни?

- **ЕИК** - Проверка на контролна сума (9 или 13 цифри)
- **ДДС номер** - BG + 9-10 цифри с контролна сума
- **IBAN** - mod 97 проверка
- **Телефон** - +359 формат
- **Последователност на фактури** - Без пропуски

### Мога ли да създавам клиенти извън EU?

Да! За non-EU клиенти (САЩ, Великобритания, Швейцария и др.) използвайте ръчното въвеждане. VIES работи само за EU държави.

## Еврозона

### Какво ще се случи на 01.01.2026?

На 01.01.2026, когато България влезе в Еврозоната, системата **автоматично**:
1. Сменя базовата валута от BGN на EUR
2. Спира изтегляне на БНБ курсове
3. Започва изтегляне на ЕЦБ курсове
4. Обръща конверсията BGN ↔ EUR

**Не е нужна никаква намеса от ваша страна!**

### Какво става с моите стари фактури в BGN?

Всички стари документи остават **непроменени**. Те са създадени с BGN като базова валута и така остават. Новите документи след 01.01.2026 ще използват EUR като база.

Левовата равностойност винаги е правилна, независимо от базовата валута.

### Мога ли да тествам Eurozone режима предварително?

Да! В `application.properties`:
```properties
currency.force-eurozone-mode=true
```

Рестартирайте приложението и то ще работи в EUR режим.

## Сигурност

### Сигурна ли е системата?

Да, Invoice-App използва industry-standard security практики:
- **JWT authentication** - Сигурни токени
- **BCrypt password hashing** - 10+ rounds
- **HTTPS/SSL** - Криптирана комуникация
- **Role-based access control** - Ограничен достъп по роли
- **SQL injection protection** - Prepared statements
- **XSS protection** - Input sanitization

### Как се съхраняват паролите?

Паролите се съхраняват като **BCrypt hash** с уникален salt за всяка парола. Никой (дори администраторите) не може да види реалната парола.

### Мога ли да сменя JWT secret-а?

Да, но **всички потребители ще трябва да се login-нат отново**. Променете `jwt.secret` в `application.properties` и рестартирайте.

### Какво прави SUPER_ADMIN роля?

SUPER_ADMIN има пълен достъп до:
- Всички фирми в системата
- Създаване/изтриване на фирми
- Global Settings
- Управление на всички потребители

**SUPER_ADMIN може да се създаде само чрез Linux скриптове** (не през UI).

## Данни и Backup

### Как да направя backup?

**Database backup:**
```bash
pg_dump -U invoiceapp sp_inv_app | gzip > backup.sql.gz
```

**Application files backup:**
```bash
tar -czf invoice-app-backup.tar.gz /home/invoiceapp/invoice-app
```

Препоръчваме автоматичен нощен backup чрез cron job. Виж [05-deployment-vps.md](./05-deployment-vps.md#backup).

### Къде се съхраняват файловете (лого, печат, подпис)?

Файловете се съхраняват в:
```
/home/invoiceapp/invoice-app/uploads/
```

Уверете се, че тази папка е включена в backup-ите.

### Мога ли да експортирам данните си?

В момента няма built-in export функционалност, но можете:
1. **Database dump** - `pg_dump` за пълен експорт
2. **GraphQL API** - Извличане на данни чрез API
3. **PDF експорт** - За индивидуални документи

Excel/CSV експорт е планиран за бъдеща версия.

### Изтрих документ по погрешка, мога ли да го върна?

**DRAFT документи** - Не, изтриването е окончателно.
**FINAL документи** - НЕ могат да се изтриват! Можете само да създадете CREDIT_NOTE за неутрализиране.

Ако имате актуален database backup, можете да restore-нете от него.

## Performance

### Приложението работи бавно, какво да правя?

**Проверка 1: Server resources**
```bash
free -h  # RAM usage
df -h    # Disk space
top      # CPU usage
```

**Проверка 2: Database performance**
```bash
# PostgreSQL connection count
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
psql -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"
```

**Проверка 3: Logs**
```bash
tail -f /home/invoiceapp/invoice-app/logs/backend.log
```

**Оптимизации:**
- Увеличете JVM heap: `-Xmx4g` вместо `-Xmx2g`
- Оптимизирайте PostgreSQL (виж [04-konfiguraciq.md](./04-konfiguraciq.md))
- Добавете Nginx caching
- Upgrade на VPS plan

### Колко документи може да съхранява системата?

Няма hardcoded лимит. Зависи от:
- Disk space
- Database performance
- VPS resources

Тествали сме с **10,000+ документи** без проблеми. За 100,000+ може да са нужни database оптимизации.

## Интеграции

### Има ли API?

Да, приложението използва **GraphQL API**. Виж [03-graphql-api.md](./03-graphql-api.md) за пълна документация.

Достъпен endpoint: `/graphql`

### Мога ли да интегрирам с WordPress/WooCommerce?

Не директно, но можете да използвате GraphQL API за custom интеграция. Native WordPress plugin е в roadmap.

### Има ли интеграция с БитБетър/Тера?

Не в момента. Планираме XML експорт в бъдеща версия, който ще може да се импортира в счетоводни системи.

### Интеграция с payment gateway-и (ePay, Stripe)?

Не в момента. Payment tracking и gateway интеграции са планирани за v2.0.

## Troubleshooting

### Backend не стартира

**Проверка 1: Логове**
```bash
sudo journalctl -u invoice-backend -n 100
```

**Проверка 2: Port usage**
```bash
sudo lsof -i :8080
```

**Проверка 3: Database connection**
```bash
psql -U invoiceapp -d sp_inv_app
```

Виж [05-deployment-vps.md](./05-deployment-vps.md#troubleshooting) за повече информация.

### Frontend показва "Cannot connect to server"

**Проверка 1: Backend running?**
```bash
curl http://localhost:8080/actuator/health
```

**Проверка 2: CORS settings**
Уверете се, че backend позволява requests от frontend домейна.

**Проверка 3: Nginx proxy**
Проверете Nginx логовете:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Валутни курсове не се обновяват

**Проверка 1: Scheduled tasks**
```bash
grep "Exchange rate" /home/invoiceapp/invoice-app/logs/backend.log
```

**Проверка 2: API connectivity**
```bash
curl https://www.bnb.bg/Statistics/StExternalSector/StExchangeRates/StERForeignCurrencies/index.htm
```

**Manual fetch:**
От UI: Company Settings → Currency → Fetch Latest Rates

### SMTP изпращане на имейли не работи

**Gmail setup:**
1. Включете 2FA
2. Генерирайте App Password
3. Използвайте App Password вместо обикновената парола

**Test connection:**
От UI: Company Settings → SMTP Settings → Test Connection

## Licensing & Support

### Какъв е лиценза?

Proprietary - Всички права запазени. Свържете се за licensing информация.

### Има ли техническа поддръжка?

Да, техническа поддръжка е включена в PRO и BUSINESS плановете:
- Email support
- Priority bug fixes
- Feature requests consideration

### Къде да докладвам bugs?

- GitHub Issues: [repository-url]/issues
- Email: support@yourdomain.com

### Мога ли да допринеса код?

В момента проектът не е open source. Ако имате идеи за подобрения, свържете се с нас.

## Roadmap

### Какво е планирано за бъдещи версии?

**v2.0 (Q1 2026):**
- Mobile app (iOS/Android)
- Payment tracking
- Email templates
- Recurring invoices
- Advanced reporting

**v2.5 (Q3 2026):**
- НАП API integration
- Търговски регистър API
- Excel/CSV export
- Bulk operations

**v3.0 (2027):**
- AI-powered insights
- OCR за автоматично четене на фактури
- Multi-currency accounting
- Advanced analytics

## Контакти

### Как да се свържа с вас?

- **Email:** [your-email@example.com]
- **Уебсайт:** [https://yourdomain.com]
- **GitHub:** [repository-url]
- **Телефон:** +359 XXX XXX XXX

### Работно време на поддръжката

Понеделник - Петък: 09:00 - 18:00 EET
Отговаряме на имейли в рамките на 24 часа (работни дни).

---

**Последна актуализация:** 24 ноември 2025

**Не намерихте отговор на вашия въпрос?** Свържете се с нас на [your-email@example.com]
