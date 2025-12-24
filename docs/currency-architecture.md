# Многовалутна архитектура - Техническа документация - Bash Inv

## Преглед

Системата за електронно фактуриране Bash Inv поддържа документи в различни валути с автоматично изчисляване на левовата равностойност. Архитектурата е проектирана да се адаптира към прехода на България в Еврозоната на 01.01.2026г.

## Архитектурни компоненти

### 1. CurrencyConfiguration
**Файл:** `backend/src/main/java/com/invoiceapp/backend/config/CurrencyConfiguration.java`

Централна конфигурация за управление на валутната система:
- Определя базовата валута според периода
- Управлява прехода към Еврозоната
- Предоставя фиксирания курс BGN/EUR = 1.95583

```java
@Component
@ConfigurationProperties(prefix = "currency")
public class CurrencyConfiguration {
    private static final LocalDate EUROZONE_TRANSITION_DATE = LocalDate.of(2026, 1, 1);
    private static final BigDecimal BGN_TO_EUR_FIXED_RATE = new BigDecimal("1.95583");
    
    public boolean isEurozoneActive() {
        return forceEurozoneMode || LocalDate.now().isAfter(EUROZONE_TRANSITION_DATE);
    }
    
    public String getBaseCurrency() {
        return isEurozoneActive() ? "EUR" : "BGN";
    }
}
```

### 2. Dual-Source Exchange Rate System

#### 2.1 BnbService
**Файл:** `backend/src/main/java/com/invoiceapp/backend/service/BnbService.java`

Отговаря за изтегляне на курсове от БНБ (до 01.01.2026):
- Изтегля курсове всеки ден в 14:30
- Използва BGN като базова валута
- Включва fallback механизми

```java
@Scheduled(cron = "0 30 14 * * ?")
@Transactional
public void fetchAndSaveBnbRates() {
    if (!currencyConfig.shouldUseBnbRates()) {
        return;
    }
    // Логика за изтегляне от БНБ
}
```

#### 2.2 EcbService
**Файл:** `backend/src/main/java/com/invoiceapp/backend/service/EcbService.java`

Отговаря за изтегляне на курсове от ЕЦБ (от 01.01.2026):
- Изтегля курсове всеки ден в 16:00
- Използва EUR като базова валута
- Наследява съществуващата функционалност

### 3. ExchangeRateProviderService
**Файл:** `backend/src/main/java/com/invoiceapp/backend/service/ExchangeRateProviderService.java`

Централно управление на валутните източници:
- Координира между BNB и ECB сервисите
- Автоматично превключва според датата
- Публикува события за прехода

```java
@Scheduled(cron = "0 0 15 * * ?")
public void fetchDailyRates() {
    checkEurozoneTransition();
    
    if (currencyConfig.shouldUseEcbRates()) {
        ecbService.fetchAndSaveRates();
    } else if (currencyConfig.shouldUseBnbRates()) {
        bnbService.fetchAndSaveBnbRates();
    }
}
```

### 4. ExchangeRateService
**Файл:** `backend/src/main/java/com/invoiceapp/backend/service/ExchangeRateService.java`

Унифициран достъп до валутни курсове:
- Обработва специално BGN и EUR
- Търси най-близки курсове при липса на точна дата
- Създава виртуални курсове за базовите валути

```java
public ExchangeRate getRate(String currencyCode, LocalDate date) {
    String baseCurrency = currencyConfig.getBaseCurrency();
    
    if (currencyCode.equalsIgnoreCase(baseCurrency)) {
        return createBaseRate(currencyCode, date, baseCurrency);
    }
    
    // Специална обработка за BGN/EUR
    if ("BGN".equalsIgnoreCase(currencyCode) && "EUR".equalsIgnoreCase(baseCurrency)) {
        return createBgnToEurRate(date);
    }
    
    return findMostRecentRate(currencyCode, date, baseCurrency);
}
```

## Валутна конверсия в документи

### DocumentService
**Файл:** `backend/src/main/java/com/invoiceapp/backend/service/DocumentService.java`

Обновена логика за конверсия към BGN:

```java
private BigDecimal calculateExchangeRateToBgn(String currencyCode, LocalDate date) {
    if ("BGN".equalsIgnoreCase(currencyCode)) {
        return BigDecimal.ONE;
    }
    
    if (currencyConfig.isEurozoneActive()) {
        // След 2026: EUR е базова валута
        if ("EUR".equalsIgnoreCase(currencyCode)) {
            return currencyConfig.getBgnToEurRate();
        }
        // За други валути: валута -> EUR -> BGN
        ExchangeRate eurRate = exchangeRateService.getRate(currencyCode, date);
        return eurRate.getRate().multiply(currencyConfig.getBgnToEurRate());
    } else {
        // Преди 2026: BGN е базова валута
        if ("EUR".equalsIgnoreCase(currencyCode)) {
            return currencyConfig.getBgnToEurRate();
        }
        // За други валути: директно от БНБ
        ExchangeRate bgnRate = exchangeRateService.getRate(currencyCode, date);
        return bgnRate.getRate();
    }
}
```

## Конфигурация

### application.properties
```properties
# Currency Configuration
currency.default-currency=BGN
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=true

# Logging
logging.level.com.invoiceapp.backend.service.BnbService=DEBUG
logging.level.com.invoiceapp.backend.service.EcbService=DEBUG
logging.level.com.invoiceapp.backend.service.ExchangeRateService=DEBUG
```

### Режими на работа

#### Текущ режим (до 01.01.2026)
```properties
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=false
```

#### Режим на Еврозоната (от 01.01.2026)
```properties
currency.force-eurozone-mode=true
currency.enable-bnb-rates=false
currency.enable-ecb-rates=true
```

## База данни

### Модел ExchangeRate
```sql
CREATE TABLE exchange_rates (
    id BIGINT PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL,
    rate_date DATE NOT NULL,
    rate DECIMAL(19,9) NOT NULL,
    base_currency VARCHAR(3) NOT NULL,
    CONSTRAINT unique_currency_date UNIQUE (currency_code, rate_date)
);
```

### Примерни данни

#### Преди 2026 (BGN базова валута)
```sql
INSERT INTO exchange_rates (currency_code, rate_date, rate, base_currency) VALUES
('BGN', '2025-01-01', 1.0000, 'BGN'),
('EUR', '2025-01-01', 1.95583, 'BGN'),
('USD', '2025-01-01', 1.8234, 'BGN');
```

#### След 2026 (EUR базова валута)
```sql
INSERT INTO exchange_rates (currency_code, rate_date, rate, base_currency) VALUES
('EUR', '2026-01-01', 1.0000, 'EUR'),
('BGN', '2026-01-01', 1.95583, 'EUR'),
('USD', '2026-01-01', 1.0512, 'EUR');
```

## Мониторинг и логиране

### Ключови лог съобщения
```
INFO  - Using BNB rates (pre-Eurozone until 2026-01-01)
INFO  - Using ECB rates (Eurozone active since 2026-01-01)
INFO  - Eurozone transition detected on 2026-01-01
WARN  - Fallback rates saved - please check BNB connectivity
ERROR - Failed to fetch BNB exchange rates
```

### Статус на системата
```java
ExchangeRateProviderService.SystemStatus status = providerService.getSystemStatus();
System.out.println("Eurozone Active: " + status.isEurozoneActive());
System.out.println("Active Provider: " + status.getActiveProvider());
System.out.println("Base Currency: " + status.getBaseCurrency());
```

## Грешки и решения

### Чести проблеми

1. **"No exchange rate found for currency"**
   - Причина: Липсва курс за дадена дата
   - Решение: Проверете дали съответният сервис работи

2. **"Currency not found in database"**
   - Причина: Валутата не е добавена в таблицата currencies
   - Решение: Добавете валутата чрез DataInitializer

3. **Неконсистентни курсове**
   - Причина: Смесване на BGN и EUR базови валути
   - Решение: Проверете базовата валута в записите

### Тестване на преход
```java
// Форсиране на Еврозона режим за тестване
@TestPropertySource(properties = {
    "currency.force-eurozone-mode=true",
    "currency.enable-ecb-rates=true"
})
```

## Бъдещи подобрения

1. **Кеширане на курсове** - Redis/Caffeine cache
2. **Исторически курсове** - Запазване на по-дълга история
3. **Валидация на курсове** - Проверка за реалистични стойности
4. **Уведомления** - Email/SMS при проблеми с курсовете
5. **API endpoints** - REST endpoints за външни интеграции

## Заключение

Новата архитектура осигурява:
- Безпроблемен преход към Еврозоната
- Консистентно управление на валутни курсове
- Надеждна обработка на грешки
- Гъвкавост за бъдещи разширения

Системата е готова за производствена употреба и бъдещето на България в Еврозоната.