# GraphQL API Документация

## Въведение

Invoice-App използва **GraphQL** за комуникация между frontend и backend. GraphQL е query език, който позволява на клиента да изисква точно тези данни, които му трябват.

## GraphQL Playground

За тестване и експлориране на API:

```
URL: http://localhost:8080/graphiql
```

GraphiQL playground предоставя:
- Автоматично попълване (autocomplete)
- Документация на schema
- Тестване на queries и mutations
- Syntax highlighting

## Автентикация

Всички заявки (освен login) изискват JWT токен в header-а:

```
Authorization: Bearer <your-jwt-token>
```

### Получаване на токен

```graphql
mutation {
  login(input: {
    username: "admin"
    password: "password123"
  }) {
    token
    user {
      id
      username
      email
      role
      company {
        id
        name
      }
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "ADMIN",
        "company": {
          "id": 1,
          "name": "Demo Company"
        }
      }
    }
  }
}
```

## Основни операции

### Documents (Документи)

#### Списък с документи

```graphql
query {
  documents {
    id
    documentNumber
    documentType
    status
    issueDate
    dueDate
    totalAmountWithVat
    currency {
      code
      symbol
    }
    client {
      id
      name
    }
  }
}
```

#### Документ по ID

```graphql
query {
  document(id: 1) {
    id
    documentNumber
    documentType
    status
    issueDate
    vatDate
    dueDate
    currency {
      code
    }
    exchangeRate
    exchangeRateDate
    subtotalAmount
    vatAmount
    totalAmountWithVat
    totalAmountWithVatBaseCurrency
    client {
      id
      name
      eik
      vatNumber
      address
      city
    }
    items {
      id
      description
      quantity
      unit
      unitPrice
      vatRate
      discount
      netAmount
      vatAmount
      totalAmount
    }
    paymentMethod {
      id
      name
    }
    bankAccount {
      id
      accountName
      iban
      bic
      bankName
    }
    notes
    footerText
    compiledBy
  }
}
```

#### Създаване на документ

```graphql
mutation {
  createDocument(input: {
    companyId: 1
    clientId: 1
    documentType: INVOICE
    status: DRAFT
    issueDate: "2025-11-24"
    vatDate: "2025-11-24"
    dueDate: "2025-12-24"
    currencyId: 1
    paymentMethodId: 2
    bankAccountId: 1
    items: [
      {
        description: "Web Development Services"
        quantity: 40
        unit: "hours"
        unitPrice: 50.00
        vatRateId: 1
        discount: 0
      },
      {
        description: "Hosting (monthly)"
        quantity: 1
        unit: "pcs"
        unitPrice: 20.00
        vatRateId: 1
        discount: 0
      }
    ]
    notes: "Thank you for your business"
    footerText: "Payment due within 30 days"
    compiledBy: "John Doe"
  }) {
    id
    documentNumber
    status
    totalAmountWithVat
  }
}
```

#### Обновяване на документ

```graphql
mutation {
  updateDocument(
    id: 1
    input: {
      status: FINAL
      notes: "Updated notes"
    }
  ) {
    id
    documentNumber
    status
  }
}
```

#### Изтриване на документ (само DRAFT)

```graphql
mutation {
  deleteDocument(id: 1)
}
```

### Clients (Клиенти)

#### Списък с клиенти

```graphql
query {
  clients {
    id
    name
    type
    eik
    vatNumber
    email
    phone
    address
    city
    postalCode
    country
    isActive
  }
}
```

#### Клиент по ID

```graphql
query {
  client(id: 1) {
    id
    name
    type
    eik
    vatNumber
    email
    phone
    address
    address2
    city
    postalCode
    country
    paymentTermDays
    creditLimit
    defaultDiscount
    isActive
    documents {
      id
      documentNumber
      documentType
      totalAmount
      issueDate
    }
  }
}
```

#### Създаване на клиент (ръчно)

```graphql
mutation {
  createClient(input: {
    companyId: 1
    name: "ABC Ltd"
    type: B2B
    eik: "123456789"
    vatNumber: "BG123456789"
    email: "info@abc.com"
    phone: "+359888123456"
    address: "ul. Main St 1"
    city: "Sofia"
    postalCode: "1000"
    country: "Bulgaria"
    paymentTermDays: 30
  }) {
    id
    name
    vatNumber
  }
}
```

#### Създаване на клиент чрез VIES

```graphql
mutation {
  createClientWithVies(input: {
    companyId: 1
    vatNumber: "DE123456789"
    email: "info@german-company.de"
    phone: "+491234567890"
    paymentTermDays: 30
  }) {
    id
    name
    vatNumber
    address
    city
    country
  }
}
```

#### Валидация на ДДС номер (VIES)

```graphql
query {
  validateVatNumber(vatNumber: "BG123456789") {
    valid
    countryCode
    vatNumber
    name
    address
  }
}
```

#### Търсене на клиент по ДДС номер

```graphql
query {
  searchClientByVatNumber(
    companyId: 1
    vatNumber: "BG123456789"
  ) {
    id
    name
    vatNumber
    address
  }
}
```

#### Обновяване на клиент

```graphql
mutation {
  updateClient(
    id: 1
    input: {
      email: "newemail@abc.com"
      phone: "+359888999888"
      paymentTermDays: 45
    }
  ) {
    id
    email
    phone
  }
}
```

### Items (Артикули)

#### Списък с артикули

```graphql
query {
  items {
    id
    itemNumber
    nameBg
    nameEn
    description
    unitPrice
    unit
    currency {
      code
    }
    vatRate {
      id
      rate
    }
    accountCode
    isActive
  }
}
```

#### Създаване на артикул

```graphql
mutation {
  createItem(input: {
    companyId: 1
    itemNumber: "SERV001"
    nameBg: "Уеб разработка"
    nameEn: "Web Development"
    description: "Hourly rate for web development"
    unitPrice: 50.00
    unit: "hour"
    currencyId: 1
    vatRateId: 1
    accountCode: "702"
  }) {
    id
    itemNumber
    nameBg
  }
}
```

### Companies (Фирми)

#### Списък с фирми (SUPER_ADMIN)

```graphql
query {
  companies {
    id
    name
    nameEn
    eik
    vatNumber
    address
    city
    country
    phone
    email
    website
    subscriptionPlan
    isActive
  }
}
```

#### Фирма по ID

```graphql
query {
  company(id: 1) {
    id
    name
    nameEn
    eik
    vatNumber
    vatRegistered
    vatRegistrationDate
    address
    address2
    city
    postalCode
    country
    phone
    email
    website
    logoUrl
    stampUrl
    signatureUrl
    defaultPaymentTermDays
    footerText
    footerTextEn
    compiledBy
    subscriptionPlan
    maxUsers
    isActive
  }
}
```

#### Създаване на фирма (SUPER_ADMIN)

```graphql
mutation {
  createCompany(input: {
    name: "My Company Ltd"
    nameEn: "My Company Ltd"
    eik: "123456789"
    vatNumber: "BG123456789"
    vatRegistered: true
    address: "ul. Main St 1"
    city: "Sofia"
    postalCode: "1000"
    country: "Bulgaria"
    phone: "+359888123456"
    email: "info@mycompany.com"
    subscriptionPlan: PRO
  }) {
    id
    name
  }
}
```

### Users (Потребители)

#### Списък с потребители

```graphql
query {
  users {
    id
    username
    email
    firstName
    lastName
    role
    company {
      id
      name
    }
    isActive
    createdAt
  }
}
```

#### Създаване на потребител

```graphql
mutation {
  createUser(input: {
    username: "john.doe"
    password: "SecurePass123"
    email: "john@example.com"
    firstName: "John"
    lastName: "Doe"
    role: USER
    companyId: 1
  }) {
    id
    username
    email
  }
}
```

### Exchange Rates (Валутни курсове)

#### Получаване на курс

```graphql
query {
  exchangeRate(
    fromCurrency: "EUR"
    toCurrency: "BGN"
    date: "2025-11-24"
  ) {
    id
    currency {
      code
    }
    rate
    rateDate
    source
  }
}
```

#### Изтегляне на нови курсове

```graphql
mutation {
  fetchExchangeRates {
    success
    message
    ratesCount
  }
}
```

### Payment Methods (Методи на плащане)

#### Списък с методи

```graphql
query {
  paymentMethods {
    id
    code
    nameBg
    nameEn
    requiresBankAccount
    isActive
    isDefault
    displayOrder
  }
}
```

### Bank Accounts (Банкови сметки)

#### Списък със сметки

```graphql
query {
  bankAccounts {
    id
    bankName
    iban
    bic
    currency {
      code
    }
    accountName
    description
    isDefault
    isActive
  }
}
```

#### Създаване на банкова сметка

```graphql
mutation {
  createBankAccount(input: {
    companyId: 1
    bankName: "UniCredit Bulbank"
    iban: "BG80UNCR70001520000001"
    bic: "UNCRBGSF"
    currencyId: 1
    accountName: "Main BGN Account"
    description: "Primary BGN account"
    isDefault: true
  }) {
    id
    iban
    accountName
  }
}
```

### VAT Rates (ДДС ставки)

#### Списък с ДДС ставки

```graphql
query {
  vatRates {
    id
    rate
    description
    isActive
  }
}
```

### Dashboard

#### Dashboard статистики

```graphql
query {
  dashboardStats {
    totalClients
    totalDocuments
    totalRevenue
    finalizedDocuments
    overdueDocuments
    recentDocuments {
      id
      documentNumber
      documentType
      totalAmountWithVat
      issueDate
      client {
        name
      }
    }
    monthlyRevenue {
      month
      revenue
    }
  }
}
```

### Document Verification (Публичен)

#### Проверка на документ по UUID

**Забележка:** Тази заявка не изисква автентикация!

```graphql
query {
  verifyDocument(uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890") {
    documentUuid
    documentNumber
    documentType
    issueDate
    totalAmountWithVat
    currencyCode
    companyName
    companyEik
    clientName
    isValid
  }
}
```

**Response (успешен):**
```json
{
  "data": {
    "verifyDocument": {
      "documentUuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "documentNumber": "0000000001",
      "documentType": "INVOICE",
      "issueDate": "2025-11-25",
      "totalAmountWithVat": 1200.00,
      "currencyCode": "EUR",
      "companyName": "Тест ООД",
      "companyEik": "123456789",
      "clientName": "Клиент ЕООД",
      "isValid": true
    }
  }
}
```

**Response (документът не е намерен):**
```json
{
  "data": {
    "verifyDocument": null
  }
}
```

---

## Плащания

### Маркиране на документ като платен

```graphql
mutation {
  markDocumentAsPaid(
    documentId: "1"
    paidAt: "2025-11-25"
  ) {
    id
    isPaid
    paidAt
    paymentMethod {
      methodCode
      name
    }
  }
}
```

**Параметри:**
- `documentId` (ID!, задължителен) - ID на документа
- `paidAt` (String, опционален) - Дата на плащане (формат: YYYY-MM-DD). Ако не е подаден, използва се текущата дата.

**Response:**
```json
{
  "data": {
    "markDocumentAsPaid": {
      "id": "1",
      "isPaid": true,
      "paidAt": "2025-11-25",
      "paymentMethod": {
        "methodCode": "BANK_TRANSFER",
        "name": "Банков превод"
      }
    }
  }
}
```

### Проверка на статус на плащане

Полетата `isPaid` и `paidAt` са достъпни при заявка на документ:

```graphql
query {
  documentsByCompany(companyId: "1") {
    id
    fullDocumentNumber
    totalAmountWithVat
    isPaid
    paidAt
    paymentMethod {
      methodCode
      name
    }
  }
}
```

**Логика на `isPaid`:**
- `CASH` или `CARD` → винаги `true` (автоматично платени)
- `BANK_TRANSFER` → `true` само ако `paidAt` е зададено
- Други методи → `true` ако `paidAt` е зададено

---

## Типове данни

### Enums

#### DocumentType
```graphql
enum DocumentType {
  INVOICE
  CREDIT_NOTE
  DEBIT_NOTE
  PROFORMA
}
```

#### DocumentStatus
```graphql
enum DocumentStatus {
  DRAFT
  FINAL
}
```

#### ClientType
```graphql
enum ClientType {
  B2B
  B2C
}
```

#### UserRole
```graphql
enum UserRole {
  SUPER_ADMIN
  ADMIN
  USER
  ACCOUNTANT
}
```

#### PaymentMethodCode
```graphql
enum PaymentMethodCode {
  CASH
  BANK_TRANSFER
  CARD
  PAYPAL
  PAYBG
}
```

#### SubscriptionPlan
```graphql
enum SubscriptionPlan {
  FREE
  PRO
  BUSINESS
  ENTERPRISE
}
```

## Error Handling

GraphQL използва стандартен формат за грешки:

```json
{
  "errors": [
    {
      "message": "Document not found",
      "locations": [{"line": 2, "column": 3}],
      "path": ["document"],
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ],
  "data": null
}
```

### Често срещани грешки

**UNAUTHENTICATED:**
```json
{
  "errors": [{
    "message": "Unauthorized",
    "extensions": {"code": "UNAUTHENTICATED"}
  }]
}
```
→ JWT токенът липсва или е невалиден

**FORBIDDEN:**
```json
{
  "errors": [{
    "message": "Access denied",
    "extensions": {"code": "FORBIDDEN"}
  }]
}
```
→ Потребителят няма права за тази операция

**BAD_USER_INPUT:**
```json
{
  "errors": [{
    "message": "Invalid EIK format",
    "extensions": {"code": "BAD_USER_INPUT"}
  }]
}
```
→ Невалидни входни данни

**NOT_FOUND:**
```json
{
  "errors": [{
    "message": "Client with id 999 not found",
    "extensions": {"code": "NOT_FOUND"}
  }]
}
```
→ Търсеният ресурс не съществува

## Pagination

За големи списъци използвайте pagination:

```graphql
query {
  documents(
    page: 0
    size: 20
    sort: "issueDate,desc"
  ) {
    content {
      id
      documentNumber
      totalAmountWithVat
    }
    totalElements
    totalPages
    number
    size
  }
}
```

## Filtering

Много queries поддържат филтриране:

```graphql
query {
  documents(
    filter: {
      documentType: INVOICE
      status: FINAL
      fromDate: "2025-01-01"
      toDate: "2025-12-31"
      clientId: 1
      currencyCode: "BGN"
    }
  ) {
    id
    documentNumber
    totalAmountWithVat
  }
}
```

## Best Practices

### 1. Изисквайте само необходимите полета

**Лошо:**
```graphql
query {
  clients {
    id
    name
    type
    eik
    vatNumber
    email
    phone
    address
    address2
    city
    postalCode
    country
    # ... всички полета
  }
}
```

**Добре:**
```graphql
query {
  clients {
    id
    name
    email
  }
}
```

### 2. Използвайте fragments за повторяеми структури

```graphql
fragment ClientBasicInfo on Client {
  id
  name
  eik
  vatNumber
  email
}

query {
  client(id: 1) {
    ...ClientBasicInfo
    documents {
      id
      totalAmountWithVat
    }
  }
}
```

### 3. Обработвайте грешки правилно

```javascript
const result = await client.query({ query: GET_DOCUMENTS });

if (result.errors) {
  console.error('GraphQL errors:', result.errors);
  // Handle errors
}

if (result.data) {
  console.log('Documents:', result.data.documents);
}
```

### 4. Използвайте variables за динамични параметри

**Лошо:**
```graphql
query {
  document(id: 1) { ... }
}
```

**Добре:**
```graphql
query GetDocument($id: ID!) {
  document(id: $id) { ... }
}

# Variables:
{ "id": 1 }
```

## Примери за интеграция

### JavaScript/TypeScript (Apollo Client)

```javascript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache(),
  headers: {
    authorization: `Bearer ${token}`,
  },
});

// Query
const GET_DOCUMENTS = gql`
  query {
    documents {
      id
      documentNumber
      totalAmountWithVat
    }
  }
`;

const { data } = await client.query({ query: GET_DOCUMENTS });

// Mutation
const CREATE_CLIENT = gql`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      id
      name
    }
  }
`;

const { data } = await client.mutate({
  mutation: CREATE_CLIENT,
  variables: {
    input: {
      companyId: 1,
      name: "New Client",
      type: "B2B",
      // ...
    },
  },
});
```

### cURL

```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "{ documents { id documentNumber totalAmountWithVat } }"
  }'
```

### Python (requests)

```python
import requests

url = "http://localhost:8080/graphql"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

query = """
{
  documents {
    id
    documentNumber
    totalAmountWithVat
  }
}
"""

response = requests.post(url, json={"query": query}, headers=headers)
data = response.json()
```

## Schema Introspection

За получаване на пълната schema:

```graphql
query {
  __schema {
    types {
      name
      kind
      description
    }
  }
}
```

За получаване на информация за конкретен тип:

```graphql
query {
  __type(name: "Document") {
    name
    fields {
      name
      type {
        name
      }
    }
  }
}
```

---

**Следващо:** [Deployment на VPS](./05-deployment-vps.md)
