# Подобрения в многовалутната архитектура

## Проблеми в старата архитектура

### 1. **Неконсистентност в базовата валута**
- `ExchangeRate.java` имаше `baseCurrency = "BGN"` по подразбиране
- `EcbService.java` записваше с `baseCurrency = "EUR"`
- Това създаваше объркване и неконсистентност в данните

### 2. **Проблематична BGN обработка**
- `ExchangeRateService.java` имаше незавършена BGN логика
- `DocumentService.java` се опитваше да намира BGN курс от ЕЦБ (което не съществува)
- Липсваше обработка на фиксирания курс BGN/EUR = 1.95583

### 3. **Липса на подготовка за Еврозоната**
- Нямаше план за прехода към EUR като базова валута от 01.01.2026
- Нямаше централизирано управление на валутните източници

## Нова архитектура

### 1. **Dual-Source Exchange Rate System**

**Структура:**
```
CurrencyConfiguration -> определя кой източник да се използва
├── BnbService (до 01.01.2026)
├── EcbService (от 01.01.2026)
└── ExchangeRateProviderService (координира между двата)
```

**Ключови файлове:**
- `CurrencyConfiguration.java` - управлява конфигурацията и прехода
- `BnbService.java` - изтегля курсове от БНБ с BGN като база
- `ExchangeRateProviderService.java` - централизирано управление
- `ExchangeRateService.java` - унифициран достъп до курсове

### 2. **Интелигентна валутна конверсия**

**Преди 2026г. (BGN базова валута):**
- BGN = 1.0000 (базова)
- EUR = 1.95583 (фиксиран курс)
- USD, GBP, etc. = според БНБ

**След 2026г. (EUR базова валута):**
- EUR = 1.0000 (базова)
- BGN = 1.95583 (фиксиран курс)
- USD, GBP, etc. = според ЕЦБ

**Конверсия към BGN:**
```java
// Преди 2026: директно от БНБ курсовете
if (!currencyConfig.isEurozoneActive()) {
    return exchangeRateService.getRate(currencyCode, date).getRate();
}

// След 2026: валута -> EUR -> BGN
else {
    ExchangeRate eurRate = exchangeRateService.getRate(currencyCode, date);
    return eurRate.getRate().multiply(BGN_TO_EUR_RATE);
}
```

### 3. **Автоматичен преход към Еврозоната**

**Конфигурация:**
```properties
currency.default-currency=BGN
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=true
```

**Автоматично превключване:**
- На 01.01.2026 системата автоматично преминава към ЕЦБ
- Публикува се EurozoneTransitionEvent
- Незабавно се изтеглят ЕЦБ курсове

### 4. **Подобрена грешка обработка**

**Fallback стратегии:**
- Ако БНБ API не работи -> използва се fallback курсове
- Ако няма точен курс за дата -> търси се най-близкия
- Ако липсва валута -> хвърля се описателна грешка

**Логиране:**
```properties
logging.level.com.invoiceapp.backend.service.BnbService=DEBUG
logging.level.com.invoiceapp.backend.service.EcbService=DEBUG
logging.level.com.invoiceapp.backend.service.ExchangeRateService=DEBUG
```

### 5. **Централизирано управление**

**ExchangeRateProviderService** предоставя:
- `getSystemStatus()` - информация за текущо състояние
- `getActiveProvider()` - кой източник е активен
- `fetchRatesManually()` - ръчно изтегляне
- Автоматично превключване между източници

## Предимства на новата архитектура

### 1. **Консистентност**
- Еднаква базова валута във всички записи
- Ясно разделение между БНБ и ЕЦБ курсове
- Прозрачно управление на фиксирания BGN/EUR курс

### 2. **Готовност за Еврозоната**
- Автоматичен преход на 01.01.2026
- Безпроблемна смяна на базовата валута
- Запазена съвместимост с всички документи

### 3. **Надеждност**
- Fallback механизми при проблеми с API
- Търсене на най-близки курсове
- Подробно логиране за debugging

### 4. **Гъвкавост**
- Възможност за тестване с `force-eurozone-mode=true`
- Конфигурируемо включване/изключване на източници
- Лесно добавяне на нови валутни източници

### 5. **Ясна архитектура**
- Разделение на отговорностите
- Централизирано управление
- Единен интерфейс за всички валутни операции

## Файлове и промени

### Нови файлове:
1. `CurrencyConfiguration.java` - конфигурация
2. `BnbService.java` - БНБ интеграция
3. `ExchangeRateProviderService.java` - централизирано управление
4. `BnbDtos.java` - БНБ XML парсиране

### Обновени файлове:
1. `ExchangeRateService.java` - унифицирана логика
2. `DocumentService.java` - нова конверсия
3. `ExchangeRateRepository.java` - нови query методи
4. `ExchangeRate.java` - подобрени коментари
5. `application.properties` - нови настройки

## Тестване

**За тестване преди 2026:**
```properties
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=false
```

**За тестване след 2026:**
```properties
currency.force-eurozone-mode=true
currency.enable-bnb-rates=false
currency.enable-ecb-rates=true
```

**Проверка на състоянието:**
```java
SystemStatus status = exchangeRateProviderService.getSystemStatus();
System.out.println(status); // показва активен източник, базова валута, etc.
```

Новата архитектура елиминира обърканите места и прави системата готова за бъдещето на България в Еврозоната.