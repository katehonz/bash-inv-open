# Имплементация на ролеви достъп в SaaS системата

## Преглед

Тази документация описва имплементираната система за ролеви достъп в SaaS системата за онлайн фактуриране, базирана на инструкциите в `instructor/prava.md`.

## 🎯 Цел

Дефиниране и имплементиране на ролеви достъп в система с **много фирми**, където собственикът на SaaS продукта е **superadmin**, а всяка фирма има свой **administrator**, който плаща и управлява достъпа на потребители.

## 👑 Роли в системата

### 1. **SuperAdmin**
- Собственик на целия SaaS продукт
- Има глобален админ панел
- Може да:
  - Вижда всички регистрирани фирми
  - Задава колко потребителя е платена квота за всяка фирма
  - Блокира фирми
  - Ресетва пароли, трие акаунти

### 2. **Administrator (на фирма)**
- Потребител, който е платил услугата за своята фирма
- Има достъп до административен панел само за своята фирма
- Може да:
  - Кани потребители до лимита, определен от SuperAdmin
  - Задава роля на потребител (фактурист, счетоводител)
  - Редактира данни на фирмата
  - Преглежда всички фактури на фирмата

### 3. **Потребители на фирмата**
- **Фактурист** – може да създава, редактира и изпраща фактури
- **Счетоводител** – има само Read-only достъп до фактури (или експортиране)
- Всеки потребител е обвързан с точно една фирма

## 🛠️ Имплементирани компоненти

### 1. Модели и роли
**Файл:** `backend/internal/models/roles.go`

```go
type UserRole string

const (
    SuperAdmin    UserRole = "superadmin"
    Administrator UserRole = "administrator"
    Fakturist     UserRole = "fakturist"
    Schetovoditel UserRole = "schetovoditel"
)
```

**Методи за проверка на права:**
- `CanManageUsers()` - може ли да управлява потребители
- `CanCreateInvoices()` - може ли да създава фактури
- `CanViewInvoices()` - може ли да вижда фактури
- `CanEditCompany()` - може ли да редактира фирма

### 2. Разширени модели

#### Company модел
**Файл:** `backend/internal/models/company.go`

Добавено поле:
```go
PaidUserLimit *int `gorm:"column:paid_user_limit;default:2" json:"paidUserLimit"`
```

#### Invitation модел
**Файл:** `backend/internal/models/invitation.go`

Модел за поканите с:
- Статуси: `pending`, `accepted`, `expired`, `canceled`
- Методи: `IsExpired()`, `CanBeAccepted()`, `Accept()`, `Cancel()`

### 3. Middleware за проверка на права
**Файл:** `backend/internal/middleware/auth.go`

**Основни middleware функции:**
- `Authenticate()` - проверява JWT токен и задава потребителски контекст
- `RequireRole(role UserRole)` - изисква специфична роля за достъп
- `RequireSuperAdmin()` - изисква SuperAdmin права
- `RequireCompanyAdmin()` - изисква Administrator права за компания

**Utility функции:**
- `GetCurrentUser(c *gin.Context)` - връща текущия потребител
- `GetCurrentUserID(c *gin.Context)` - връща ID на потребителя
- `CheckPermission(c *gin.Context, action, resource string)` - проверява права

### 4. SuperAdmin панел
**Файл:** `backend/internal/services/superadmin_service.go`

**Функционалности:**
- `GetAllCompaniesWithStats()` - списък с всички фирми и статистики
- `SetCompanyUserLimit(companyID string, limit int)` - задава лимит на потребители
- `BlockCompany(companyID string)` - блокира фирма
- `UnblockCompany(companyID string)` - разблокира фирма
- `GetCompaniesOverLimit()` - фирми над лимита
- `ResetUserPassword(userID, newPassword string)` - ресетва парола
- `DeactivateUser(userID string)` - деактивира потребител
- `GetSystemStats()` - обща статистика на системата

**CompanyStats структура:**
```go
type CompanyStats struct {
    Company      *models.Company `json:"company"`
    ActiveUsers  int             `json:"activeUsers"`
    TotalUsers   int             `json:"totalUsers"`
    UserLimit    int             `json:"userLimit"`
    IsOverLimit  bool            `json:"isOverLimit"`
    UsagePercent float64         `json:"usagePercent"`
}
```

### 5. Administrator панел
**Файл:** `backend/internal/services/administrator_service.go`

**Функционалности:**
- `InviteUser(adminUserID string, request *InviteUserRequest)` - кани потребители
- `GetCompanyUsers(adminUserID, companyID string)` - преглежда потребители
- `UpdateUserRole(adminUserID, companyID, userID string, newRole UserRole)` - променя роля
- `RemoveUserFromCompany(adminUserID, companyID, userID string)` - премахва потребител
- `GetCompanyStats(adminUserID, companyID string)` - статистики за фирмата
- `GetCompanyInvitations(adminUserID, companyID string)` - списък с покани
- `CancelInvitation(adminUserID, invitationID string)` - отменя покана

## 🔐 Система за права

### Проверка на права по ресурс и действие

```go
func checkRolePermission(role UserRole, action string, resource string) bool {
    switch resource {
    case "users":
        return role.CanManageUsers() && (action == "create" || action == "update" || action == "delete" || action == "view")
    case "invoices":
        switch action {
        case "create", "update", "delete":
            return role.CanCreateInvoices()
        case "view":
            return role.CanViewInvoices()
        }
    case "company":
        return role.CanEditCompany() && (action == "update" || action == "view")
    }
    return false
}
```

### Йерархия на правата

1. **SuperAdmin** - пълен достъп до всичко
2. **Administrator** - пълен достъп до своята фирма
3. **Fakturist** - може да създава/редактира фактури
4. **Schetovoditel** - само четене на фактури

## 📊 Лимитиране на потребители

### Логика за лимити

```go
// Проверка на лимит при канене
userLimit := 2 // Default limit
if company.PaidUserLimit != nil {
    userLimit = *company.PaidUserLimit
}

currentUsers := len(company.Users)
if currentUsers >= userLimit {
    return fmt.Errorf("company has reached its user limit (%d/%d)", currentUsers, userLimit)
}
```

### Статистики за използване

- `TotalUsers` - общо потребители в компанията
- `ActiveUsers` - активни потребители
- `UserLimit` - максимален лимит
- `IsOverLimit` - дали е над лимита
- `UsagePercent` - процент използване

## 🎨 Система за покани

### Invitation workflow

1. **Създаване на покана**
   - Генерира се уникален токен
   - Задава се срок на валидност (7 дни)
   - Проверява се лимит на потребители

2. **Статуси на покани**
   - `pending` - изпратена, но не приета
   - `accepted` - приета от потребителя
   - `expired` - изтекла
   - `canceled` - отменена от администратора

3. **Валидация**
   - Проверка за съществуващ потребител
   - Проверка за дублиране на покани
   - Проверка на лимити

## 🚀 Готови за интеграция

Системата е архитектурно завършена и готова за:

- ✅ Интеграция с GraphQL API
- ✅ Интеграция с Gin HTTP framework
- ✅ PostgreSQL база данни с GORM
- ✅ JWT автентификация
- ✅ Middleware за проверка на права
- ✅ Административни панели

## 📝 Следващи стъпки

1. **Създаване на InvitationRepository** - за пълна функционалност на поканите
2. **Добавяне на GraphQL mutations** - за API endpoints
3. **Имплементация на JWT токени** - за автентификация
4. **Unit тестове** - за проверка на логиката
5. **Frontend интеграция** - за потребителски интерфейс

## 🔗 Връзки към файловете

- [`backend/internal/models/roles.go`](../backend/internal/models/roles.go) - Роли и права
- [`backend/internal/models/company.go`](../backend/internal/models/company.go) - Компания модел
- [`backend/internal/models/invitation.go`](../backend/internal/models/invitation.go) - Покани модел
- [`backend/internal/middleware/auth.go`](../backend/internal/middleware/auth.go) - Middleware за права
- [`backend/internal/services/superadmin_service.go`](../backend/internal/services/superadmin_service.go) - SuperAdmin панел
- [`backend/internal/services/administrator_service.go`](../backend/internal/services/administrator_service.go) - Administrator панел

---

*Документацията е създадена на базата на инструкциите в `instructor/prava.md` и имплементираният код.*