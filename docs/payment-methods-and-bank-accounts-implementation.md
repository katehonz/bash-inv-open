# Имплементация на Методи на Плащане и Банкови Сметки

## Дата: 18.07.2025

## Описание на Задачата

Имплементирахме две нови таблици в базата данни за управление на методи на плащане и банкови сметки за всяка собствена фирма в системата за фактуриране.

## Изпълнени Компоненти

### 1. Нови Entity класове

#### PaymentMethod Entity
- **Файл**: `backend/src/main/java/com/invoiceapp/backend/model/PaymentMethod.java`
- **Таблица**: `payment_methods`
- **Полета**:
  - `id` - уникален идентификатор
  - `name` - наименование на български
  - `name_en` - наименование на английски
  - `method_code` - код на метода (CASH, BANK_TRANSFER, CARD, PAYPAL, PAYBG)
  - `is_active` - активен/неактивен
  - `is_default` - дали е по подразбиране
  - `requires_bank_account` - изисква ли банкова сметка
  - `sort_order` - ред на сортиране
  - `description` - описание
  - `company_id` - връзка към фирмата

#### BankAccount Entity
- **Файл**: `backend/src/main/java/com/invoiceapp/backend/model/BankAccount.java`
- **Таблица**: `bank_accounts`
- **Полета**:
  - `id` - уникален идентификатор
  - `bank_name` - наименование на банката
  - `iban` - IBAN номер
  - `bic` - BIC код
  - `currency_code` - валута (ISO 4217)
  - `account_name` - описателно име на сметката
  - `is_active` - активна/неактивна
  - `is_default` - дали е по подразбиране
  - `sort_order` - ред на сортиране
  - `description` - описание
  - `company_id` - връзка към фирмата

### 2. Repository класове

#### PaymentMethodRepository
- **Файл**: `backend/src/main/java/com/invoiceapp/backend/repository/PaymentMethodRepository.java`
- **Функции**:
  - Търсене на активни методи по фирма
  - Търсене по код на метода
  - Намиране на методи изискващи банкова сметка
  - Търсене на default метод

#### BankAccountRepository
- **Файл**: `backend/src/main/java/com/invoiceapp/backend/repository/BankAccountRepository.java`
- **Функции**:
  - Търсене на активни сметки по фирма
  - Търсене по IBAN
  - Филтриране по валута
  - Разделяне BGN/валутни сметки

### 3. GraphQL Schema

#### Нови типове
- **PaymentMethod** - тип за методи на плащане
- **BankAccount** - тип за банкови сметки

#### Нови заявки (Queries)
- `paymentMethodsByCompany` - всички методи за фирма
- `activePaymentMethodsByCompany` - активни методи за фирма
- `bankAccountsByCompany` - всички сметки за фирма
- `activeBankAccountsByCompany` - активни сметки за фирма
- `bgnBankAccounts` - BGN сметки
- `foreignCurrencyBankAccounts` - валутни сметки

#### Нови мутации (Mutations)
- `createPaymentMethod` - създаване на метод на плащане
- `createBankAccount` - създаване на банкова сметка
- `setDefaultPaymentMethod` - задаване по подразбиране
- `setDefaultBankAccount` - задаване по подразбиране

### 4. Controller класове

#### PaymentController
- **Файл**: `backend/src/main/java/com/invoiceapp/backend/controller/PaymentController.java`
- **Функционалност**:
  - GraphQL заявки за методи на плащане
  - GraphQL заявки за банкови сметки
  - CRUD операции за двата entity типа
  - Управление на default настройки

### 5. DTO класове

#### CreatePaymentMethodInput
- **Файл**: `backend/src/main/java/com/invoiceapp/backend/model/dto/CreatePaymentMethodInput.java`
- **Цел**: Входни данни за създаване на метод на плащане

#### CreateBankAccountInput
- **Файл**: `backend/src/main/java/com/invoiceapp/backend/model/dto/CreateBankAccountInput.java`
- **Цел**: Входни данни за създаване на банкова сметка

### 6. Първоначални данни

#### DataInitializer промени
- **Файл**: `backend/src/main/java/com/invoiceapp/backend/config/DataInitializer.java`
- **Добавени методи**:
  - `createDefaultPaymentMethods()` - създава задължителните методи
  - `createDefaultBankAccounts()` - създава примерни банкови сметки

#### Задължителни методи на плащане
1. **В брой** (CASH) - default, не изисква банкова сметка
2. **По банкова сметка** (BANK_TRANSFER) - изисква банкова сметка
3. **Карта** (CARD) - не изисква банкова сметка

#### Опционални методи
4. **PayPal** (PAYPAL)
5. **PayBG** (PAYBG)

#### Примерни банкови сметки
1. **BGN сметка** - УниКредит Булбанк (default)
2. **EUR сметка** - УниКредит Булбанк
3. **USD сметка** - ДСК Банк

### 7. Връзки с Company Entity

Обновен `Company.java` за включване на:
- `List<PaymentMethod> paymentMethods` - методи на плащане
- `List<BankAccount> bankAccounts` - банкови сметки

## Логика за Формите

### Условна активация на банкови сметки
Когато се избере метод на плащане с `requiresBankAccount = true` (например "По банкова сметка"), формата може да активира dropdown меню със списък на банковите сметки на фирмата.

### GraphQL заявка за форма
```graphql
query GetPaymentData($companyId: ID!) {
  activePaymentMethodsByCompany(companyId: $companyId) {
    id
    name
    methodCode
    requiresBankAccount
  }
  activeBankAccountsByCompany(companyId: $companyId) {
    id
    displayName
    currencyCode
    isDefault
  }
}
```

## Тестване

### Компилация
- ✅ Успешна компилация с `mvn clean compile`
- ✅ Няма грешки в кода

### Стартиране на приложението
- ✅ Успешно стартиране с `mvn spring-boot:run`
- ✅ Автоматично създаване на таблици в базата данни
- ✅ Зареждане на първоначални данни

## Технически детайли

### JPA Анотации
- `@Entity` - JPA entity класове
- `@Table` - конфигурация на таблици
- `@OneToMany` - връзки 1:много с Company
- `@ManyToOne` - връзки много:1 към Company

### Spring GraphQL
- `@QueryMapping` - GraphQL заявки
- `@MutationMapping` - GraphQL мутации
- `@Argument` - параметри на заявките

### База данни
- PostgreSQL съвместимост
- Автоматично генериране на схема чрез Hibernate
- Каскадни операции за изтриване

## Резултат

Системата сега поддържа пълно управление на методи на плащане и банкови сметки за всяка фирма, включително:

1. ✅ Създаване на нови методи на плащане
2. ✅ Създаване на нови банкови сметки
3. ✅ Управление на активни/неактивни записи
4. ✅ Задаване на метод/сметка по подразбиране
5. ✅ Връзка между методи на плащане и банкови сметки
6. ✅ Поддръжка на множество валути
7. ✅ GraphQL API за всички операции
8. ✅ Автоматично зареждане на първоначални данни

Имплементацията е готова за използване и интегриране с frontend формите.