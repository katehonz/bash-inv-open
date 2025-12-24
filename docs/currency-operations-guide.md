# Операционно ръководство за многовалутната система

## Преглед

Това ръководство е предназначено за системни администратори и операторите на системата за фактуриране. Описва как да управлявате многовалутната функционалност и да решавате проблеми.

## Ежедневни операции

### Мониторинг на валутни курсове

#### Автоматично изтегляне
Системата автоматично изтегля курсове:
- **БНБ курсове**: Всеки ден в 14:30 (до 01.01.2026)
- **ЕЦБ курсове**: Всеки ден в 16:00 (от 01.01.2026)

#### Проверка на статуса
```sql
-- Проверка на последните курсове
SELECT currency_code, rate_date, rate, base_currency 
FROM exchange_rates 
WHERE rate_date = CURRENT_DATE
ORDER BY currency_code;

-- Проверка за липсващи курсове
SELECT DISTINCT currency_code 
FROM exchange_rates 
WHERE rate_date = CURRENT_DATE - INTERVAL '1 day'
AND currency_code NOT IN (
    SELECT currency_code 
    FROM exchange_rates 
    WHERE rate_date = CURRENT_DATE
);
```

### Логове за мониторинг

#### Важни лог файлове
```bash
# Основни логове
tail -f /var/log/invoice-app/application.log | grep -i "exchange\|currency\|bnb\|ecb"

# Специфични логове за валути
tail -f /var/log/invoice-app/application.log | grep -E "(BnbService|EcbService|ExchangeRateService)"
```

#### Ключови лог съобщения

**Нормални операции:**
```
INFO  - Using BNB rates (pre-Eurozone until 2026-01-01)
INFO  - Fetching exchange rates from BNB...
INFO  - Saved BNB rate for USD on 2025-01-15: 1.8234
INFO  - Processing BNB rates for date: 2025-01-15
```

**Предупреждения:**
```
WARN  - Empty response from BNB - using fallback rates
WARN  - Fallback rates saved - please check BNB connectivity
WARN  - Currency EUR not found in database - skipping BNB rate
```

**Грешки:**
```
ERROR - Failed to fetch BNB exchange rates: Connection timeout
ERROR - No exchange rate found for currency 'USD' on date '2025-01-15'
ERROR - Failed to parse BNB XML response
```

## Управление на системата

### Преглед на конфигурацията

```properties
# Файл: application.properties

# Основна конфигурация
currency.default-currency=BGN
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=true

# Логиране
logging.level.com.invoiceapp.backend.service.BnbService=DEBUG
logging.level.com.invoiceapp.backend.service.EcbService=DEBUG
```

### Ръчно изтегляне на курсове

#### Чрез API endpoint (ако е имплементиран)
```bash
# Ръчно изтегляне на всички курсове
curl -X POST http://localhost:8080/api/admin/exchange-rates/fetch

# Проверка на статуса
curl -X GET http://localhost:8080/api/admin/exchange-rates/status
```

#### Чрез база данни
```sql
-- Добавяне на курс ръчно
INSERT INTO exchange_rates (currency_code, rate_date, rate, base_currency) 
VALUES ('USD', CURRENT_DATE, 1.8234, 'BGN');

-- Обновяване на съществуващ курс
UPDATE exchange_rates 
SET rate = 1.8250 
WHERE currency_code = 'USD' AND rate_date = CURRENT_DATE;
```

### Управление на валути

#### Добавяне на нова валута
```sql
-- Добавяне в таблицата currencies
INSERT INTO currencies (code, name, symbol) 
VALUES ('NOK', 'Norwegian Krone', 'kr');

-- Добавяне на начален курс
INSERT INTO exchange_rates (currency_code, rate_date, rate, base_currency) 
VALUES ('NOK', CURRENT_DATE, 0.185, 'BGN');
```

#### Деактивиране на валута
```sql
-- Маркиране като неактивна (ако има такава колона)
UPDATE currencies SET active = false WHERE code = 'OLD_CURRENCY';

-- Или изтриване на стари курсове
DELETE FROM exchange_rates 
WHERE currency_code = 'OLD_CURRENCY' 
AND rate_date < CURRENT_DATE - INTERVAL '1 year';
```

## Решаване на проблеми

### Често срещани проблеми

#### 1. "No exchange rate found"

**Симптоми:**
- Документи не могат да бъдат създадени
- Лог съобщения: "No exchange rate found for currency 'USD' on date '2025-01-15'"

**Решение:**
```sql
-- Проверка за липсващи курсове
SELECT * FROM exchange_rates 
WHERE currency_code = 'USD' 
AND rate_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY rate_date DESC;

-- Добавяне на липсващ курс
INSERT INTO exchange_rates (currency_code, rate_date, rate, base_currency) 
VALUES ('USD', CURRENT_DATE, 1.8234, 'BGN');
```

#### 2. БНБ API не отговаря

**Симптоми:**
- Лог съобщения: "Failed to fetch BNB exchange rates"
- Използват се fallback курсове

**Решение:**
```bash
# Проверка на мрежовата свързаност
curl -I https://www.bnb.bg/Statistics/StExternalSector/StExchangeRates/

# Проверка на DNS
nslookup www.bnb.bg

# Ръчно добавяне на курсове
```

#### 3. Неконсистентни базови валути

**Симптоми:**
- Смесени BGN и EUR записи за същия период
- Неправилни конверсии

**Решение:**
```sql
-- Намиране на проблемни записи
SELECT currency_code, rate_date, base_currency, COUNT(*) 
FROM exchange_rates 
GROUP BY currency_code, rate_date, base_currency
HAVING COUNT(*) > 1;

-- Поправяне на базовата валута
UPDATE exchange_rates 
SET base_currency = 'BGN' 
WHERE rate_date < '2026-01-01' AND base_currency != 'BGN';
```

#### 4. Проблеми с преход към Еврозоната

**Симптоми:**
- Неправилна базова валута след 01.01.2026
- Продължават да се използват БНБ курсове

**Решение:**
```properties
# Проверка на конфигурацията
currency.force-eurozone-mode=false  # Не трябва да е true в production
currency.enable-ecb-rates=true      # Трябва да е true след 2026
```

### Диагностични команди

#### Проверка на системата
```sql
-- Статус на последните курсове
SELECT 
    currency_code,
    MAX(rate_date) as latest_date,
    COUNT(*) as total_rates,
    MIN(rate_date) as earliest_date
FROM exchange_rates 
GROUP BY currency_code
ORDER BY currency_code;

-- Проверка на базовите валути
SELECT 
    base_currency,
    COUNT(*) as count,
    MIN(rate_date) as earliest,
    MAX(rate_date) as latest
FROM exchange_rates 
GROUP BY base_currency;
```

#### Проверка на конфигурацията
```bash
# Проверка на Spring конфигурацията
grep -r "currency\." /path/to/application.properties

# Проверка на активните профили
curl -X GET http://localhost:8080/actuator/configprops | grep -i currency
```

## Преход към Еврозоната

### Подготовка (преди 01.01.2026)

#### Тестване на ЕЦБ интеграцията
```properties
# Тестова конфигурация
currency.force-eurozone-mode=true
currency.enable-bnb-rates=false
currency.enable-ecb-rates=true
```

#### Синхронизиране на курсове
```sql
-- Осигуряване на EUR курсове за преходния период
INSERT INTO exchange_rates (currency_code, rate_date, rate, base_currency) 
SELECT 'EUR', rate_date, 1.95583, 'BGN'
FROM exchange_rates 
WHERE rate_date >= '2025-12-01' 
AND currency_code = 'BGN'
AND NOT EXISTS (
    SELECT 1 FROM exchange_rates er2 
    WHERE er2.currency_code = 'EUR' 
    AND er2.rate_date = exchange_rates.rate_date
);
```

### В деня на прехода (01.01.2026)

#### Проверка на автоматичното превключване
```bash
# Проверка на лог съобщенията
tail -f /var/log/invoice-app/application.log | grep -i "eurozone\|transition"

# Очаквани съобщения:
# INFO - Eurozone transition detected on 2026-01-01
# INFO - Using ECB rates (Eurozone active since 2026-01-01)
```

#### Валидиране на новите курсове
```sql
-- Проверка на ЕЦБ курсовете
SELECT * FROM exchange_rates 
WHERE rate_date = '2026-01-01' 
AND base_currency = 'EUR'
ORDER BY currency_code;

-- Проверка на BGN курса
SELECT * FROM exchange_rates 
WHERE currency_code = 'BGN' 
AND rate_date = '2026-01-01';
```

### След прехода

#### Почистване на стари БНБ курсове (по избор)
```sql
-- Архивиране на стари курсове
CREATE TABLE exchange_rates_archive AS 
SELECT * FROM exchange_rates 
WHERE rate_date < '2026-01-01';

-- Изтриване на курсове по-стари от 2 години
DELETE FROM exchange_rates 
WHERE rate_date < '2024-01-01';
```

## Бекъп и възстановяване

### Ежедневен бекъп на валутни данни
```bash
#!/bin/bash
# Скрипт за бекъп на валутни данни

DATE=$(date +%Y%m%d)
pg_dump -h localhost -U postgres -d sp-inv-app \
  -t currencies -t exchange_rates \
  > /backup/currency_backup_$DATE.sql

# Компресиране
gzip /backup/currency_backup_$DATE.sql

# Запазване само на последните 30 дни
find /backup -name "currency_backup_*.sql.gz" -mtime +30 -delete
```

### Възстановяване на данни
```bash
# Възстановяване от бекъп
gunzip -c /backup/currency_backup_20250115.sql.gz | psql -h localhost -U postgres -d sp-inv-app

# Проверка на възстановените данни
psql -h localhost -U postgres -d sp-inv-app -c "SELECT COUNT(*) FROM exchange_rates;"
```

## Мониторинг и алерти

### Важни метрики

#### Prometheus метрики (ако са имплементирани)
```
# Брой неуспешни заявки към БНБ/ЕЦБ
exchange_rate_failures_total{provider="BNB"}
exchange_rate_failures_total{provider="ECB"}

# Брой валутни конверсии
currency_conversions_total{from="USD", to="BGN"}

# Възраст на най-стария курс
exchange_rate_age_seconds{currency="USD"}
```

#### Алерти
```yaml
# Пример за Prometheus алерти
- alert: ExchangeRateFailure
  expr: increase(exchange_rate_failures_total[5m]) > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Exchange rate fetch failed"
    description: "Failed to fetch exchange rates from {{ $labels.provider }}"

- alert: StaleExchangeRates
  expr: (time() - exchange_rate_age_seconds) > 86400
  for: 10m
  labels:
    severity: critical
  annotations:
    summary: "Exchange rates are stale"
    description: "Exchange rates for {{ $labels.currency }} are older than 24 hours"
```

## Контакти за поддръжка

### Ескалация на проблеми

**Ниво 1**: Системен администратор
- Рестартиране на сервиси
- Проверка на логове
- Ръчно добавяне на курсове

**Ниво 2**: Разработчик
- Проблеми с интеграцията
- Промяна на конфигурацията
- Анализ на грешки в кода

**Ниво 3**: Архитект
- Проблеми с дизайна
- Промяна на архитектурата
- Комплексни системни проблеми

### Документация за справка
- `docs/currency-architecture.md` - Техническа архитектура
- `docs/currency-api-guide.md` - API ръководство
- `ARCHITECTURE_CHANGES.md` - Промени в архитектурата

Това ръководство осигурява всички необходими инструменти за ефективно управление на многовалутната система!