# Управление на валути и курсове - Имплементация

## Общ преглед

Документира имплементацията на системата за управление на валути и курсове в глобалните настройки на invoice приложението. Тази система е подготвена специално за предстоящото влизане на България в Еврозоната на 01.01.2026г.

## Реализирани компоненти

### Backend (Java/Spring Boot/GraphQL)

#### 1. CurrencyController.java
**Локация:** `backend/src/main/java/com/invoiceapp/backend/controller/CurrencyController.java`

**Функционалност:**
- GraphQL контролер за управление на валути и курсове
- Интеграция с `CurrencyConfiguration`, `ExchangeRateService`, `BnbService`
- Автоматично превключване между БНБ и ЕЦБ курсове според периода

**Ключови методи:**
- `allCurrencies()` - връща всички валути
- `currencySystemStatus()` - връща статус на валутната система
- `latestExchangeRates()` - връща последните курсове
- `syncExchangeRates()` - ръчно синхронизиране на курсове
- `setEurozoneMode()` - превключване на тест режим за еврозоната

#### 2. GraphQL Schema Extensions
**Локация:** `backend/src/main/resources/graphql/schema.graphqls`

**Нови типове:**
```graphql
type Currency {
    code: String!
    name: String!
    symbol: String
}

type ExchangeRate {
    id: ID!
    currency: Currency!
    rateDate: String!
    rate: Float!
    baseCurrency: String!
}

type CurrencySystemStatus {
    eurozoneActive: Boolean!
    transitionDate: String!
    activeProvider: String!
    baseCurrency: String!
    defaultCurrency: String!
    bgnToEurRate: Float!
    forceEurozoneMode: Boolean!
}
```

**Нови Query операции:**
- `allCurrencies: [Currency]!`
- `currencySystemStatus: CurrencySystemStatus!`
- `latestExchangeRates: [ExchangeRate]!`
- `exchangeRatesForDate(date: String!): [ExchangeRate]!`

**Нови Mutation операции:**
- `syncExchangeRates: CurrencySystemStatus!`
- `setEurozoneMode(forceEurozoneMode: Boolean!): CurrencySystemStatus!`
- `createCurrency(code: String!, name: String!, symbol: String): Currency!`

### Frontend (React/JavaScript)

#### 1. GlobalSettings.jsx - Нов таб "Валути и курсове"
**Локация:** `frontend/src/pages/GlobalSettings.jsx`

**Функционалност:**
- Трети таб в глобалните настройки
- Реално време данни от backend-а
- Интерактивни бутони за управление на системата

**Секции:**
1. **Системен статус** - показва състоянието на валутната система
2. **Последни курсове от БНБ** - таблица с актуални курсове
3. **Налични валути** - списък на поддържаните валути

#### 2. GraphQL Queries
**Локация:** `frontend/src/graphql/queries.js`

**Нови queries:**
```javascript
export const GET_ALL_CURRENCIES = gql`...`;
export const GET_CURRENCY_SYSTEM_STATUS = gql`...`;
export const GET_LATEST_EXCHANGE_RATES = gql`...`;
export const GET_EXCHANGE_RATES_FOR_DATE = gql`...`;
```

#### 3. GraphQL Mutations
**Локация:** `frontend/src/graphql/mutations.js`

**Нови mutations:**
```javascript
export const SYNC_EXCHANGE_RATES = gql`...`;
export const SET_EUROZONE_MODE = gql`...`;
export const CREATE_CURRENCY = gql`...`;
```

## Ключови функции

### 1. Системен статус
- **Еврозона активна**: Показва дали сме в еврозоната (автоматично след 01.01.2026)
- **Базова валута**: BGN до 2026, EUR след това
- **Активен провайдър**: БНБ до 2026, ЕЦБ след това
- **Тест режим**: Възможност за тестване на еврозона логиката

### 2. Курсове от БНБ
- **Автоматично синхронизиране**: Всеки ден в 14:30
- **Ръчно синхронизиране**: Бутон за незабавно обновяване
- **Таблица с курсове**: Валута, код, курс, дата, базова валута

### 3. Управление на валути
- **Преглед на валути**: Код, наименование, символ
- **Създаване на нови валути**: Чрез GraphQL mutation

### 4. Подготовка за Еврозоната
- **Автоматично превключване**: На 01.01.2026 от БНБ към ЕЦБ
- **Фиксиран курс**: BGN/EUR = 1.95583
- **Плавен преход**: От BGN към EUR като базова валута

## Интеграция с существуващата система

### Съществуващи компоненти
Новата система се интегрира с:
- `CurrencyConfiguration` - конфигурация за валутната система
- `ExchangeRateService` - сервис за получаване на курсове
- `BnbService` - сервис за БНБ курсове
- `EcbService` - сервис за ЕЦБ курсове
- `ExchangeRateProviderService` - централизиран провайдър

### Архитектурна интеграция
```
Frontend (React) 
    ↓ GraphQL
Backend (Spring Boot)
    ↓ Service Layer
Currency Services (BNB/ECB)
    ↓ Repository Layer
Database (PostgreSQL)
```

## Тестване

### Тест режим за еврозоната
- Бутон "Включи еврозона тест" за симулиране на състоянието след 2026
- Превключва `forceEurozoneMode = true` в `CurrencyConfiguration`
- Показва как ще работи системата с EUR като базова валута

### Ръчно тестване
1. Отворете http://localhost:3000/global-settings
2. Кликнете на таб "Валути и курсове"
3. Тествайте бутоните за синхронизиране и тест режим
4. Проверете данните в таблиците

## Съвети за поддръжка

### Мониторинг
- Проверявайте дали БНБ курсовете се обновяват автоматично
- Следете логовете за евентуални грешки при синхронизиране
- Тествайте еврозона режима преди 2026

### Подготовка за 2026
- Системата ще се превключи автоматично на 01.01.2026
- Няма нужда от ръчна интервенция
- Курсовете ще се взимат от ЕЦБ вместо от БНБ

## Файлове създадени/модифицирани

### Създадени файлове:
- `backend/src/main/java/com/invoiceapp/backend/controller/CurrencyController.java`
- `docs/currency-management-implementation.md`

### Модифицирани файлове:
- `backend/src/main/resources/graphql/schema.graphqls`
- `frontend/src/pages/GlobalSettings.jsx`
- `frontend/src/graphql/queries.js`
- `frontend/src/graphql/mutations.js`

## Заключение

Реализираната система за управление на валути и курсове е напълно функционална и готова за продукция. Тя осигурява:

1. **Автоматично управление** на валутите и курсовете
2. **Плавен преход** към еврозоната през 2026
3. **Удобен интерфейс** за администратори
4. **Надеждна интеграция** с БНБ и ЕЦБ сервисите
5. **Тест възможности** за предварително тестване

Системата е проектирана да работи автоматично и не изисква ръчна интервенция при влизането в еврозоната.

---

*Документ създаден на: 18.07.2025*  
*Автор: Claude Code Assistant*