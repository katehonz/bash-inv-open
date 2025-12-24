# Поправка на функционалността за добавяне на потребители
**Дата:** Юли 2025  
**Статус:** ✅ Успешно решено  

## Проблем
Функционалността "Add User" в Global Settings страницата не работеше. При натискане на "Save" нямаше никакъв ефект и се показваха грешки в браузъра. Потребителят съобщи: "не работи не знам какви действия трябват, трябваще да направим някаква таблица с релации между фирми и потребители във формата добавям потребител към фирма има избор и без фирма".

## Корен на проблема
Открити бяха множество проблеми:

1. **Role Enum несъответствие**: Backend използваше `ADMINISTRATOR`, докато frontend използваше `ADMIN`
2. **GraphQL Schema валидация**: `companyId` беше дефиниран като задължителен (`ID!`) но frontend изпращаше `null` стойности
3. **JavaScript тип проблем**: `parseInt("")` връщаше `NaN` вместо `null`
4. **Backend логика**: UserController изискваше всички потребители да имат компания
5. **Липсващо поле**: GraphQL схемата не включваше `isActive` полето

## Решение

### 1. Поправка на Role Enum несъответствие
```java
// backend/src/main/java/com/invoiceapp/backend/model/Role.java
public enum Role {
    SUPER_ADMIN,
    ADMIN,  // Променено от ADMINISTRATOR
    USER,
    ACCOUNTANT
}
```

### 2. GraphQL Schema корекции
```graphql
# backend/src/main/resources/graphql/schema.graphqls
enum Role {
    SUPER_ADMIN
    ADMIN              # Променено от ADMINISTRATOR
    USER
    ACCOUNTANT
}

input CreateUserInput {
    username: String!
    email: String!
    password: String!
    role: Role!
    companyId: ID      # Премахнато !, сега е nullable
    isActive: Boolean  # Добавено липсващо поле
}
```

### 3. Backend логика поправка
```java
// backend/src/main/java/com/invoiceapp/backend/controller/UserController.java
@PostMapping("/create")
public User createUser(@RequestBody CreateUserInput input) {
    // Променена логика - позволява потребители без компания
    Company company = null;
    if (input.companyId() != null) {
        company = companyRepository.findById(input.companyId())
                .orElseThrow(() -> new RuntimeException("Company not found"));
    }
    
    User user = new User();
    user.setUsername(input.username());
    user.setEmail(input.email());
    user.setPassword(passwordEncoder.encode(input.password()));
    user.setRole(input.role());
    user.setCompany(company);
    user.setActive(input.isActive() != null ? input.isActive() : true);
    
    return userRepository.save(user);
}
```

### 4. Frontend поправки
```javascript
// frontend/src/pages/GlobalSettings.jsx
const handleSaveUser = async () => {
    const userInput = {
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        // Поправка: parseInt("") връщаше NaN вместо null
        companyId: userForm.companyId && userForm.companyId !== '' 
                  ? parseInt(userForm.companyId) 
                  : null,
        isActive: userForm.isActive !== undefined ? userForm.isActive : true
    };
    
    // ... GraphQL mutation
};
```

### 5. Подобрен UI с Company-User Relations таблица
```javascript
// Добавена детайлна таблица за визуализация на връзките
<Card sx={{ mt: 3 }}>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      Company-User Relations
    </Typography>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Company</TableCell>
            <TableCell>Users</TableCell>
            <TableCell>User Limit</TableCell>
            <TableCell>Available Slots</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
        </TableHead>
        {/* Детайлни редове с цветови индикатори */}
      </Table>
    </TableContainer>
  </CardContent>
</Card>
```

## База данни миграция
```sql
-- Обновяване на съществуващи записи
UPDATE users SET role = 'ADMIN' WHERE role = 'ADMINISTRATOR';

-- Премахване на стария constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Добавяне на нов constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'USER', 'ACCOUNTANT'));
```

## Тестване
Успешно тестване на следните сценарии:

### Тест 1: Потребител без компания
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { 
      createUser(input: { 
        username: \"test_no_company\", 
        email: \"test@test.com\", 
        password: \"password123\", 
        role: USER, 
        companyId: null, 
        isActive: true 
      }) { 
        id username email role company { name } isActive 
      } 
    }"
  }'

# Резултат:
{
  "data": {
    "createUser": {
      "id": "5",
      "username": "test_no_company",
      "email": "test@test.com",
      "role": "USER",
      "company": null,
      "isActive": true
    }
  }
}
```

### Тест 2: Потребител с компания
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { 
      createUser(input: { 
        username: \"test_with_company\", 
        email: \"test2@test.com\", 
        password: \"password123\", 
        role: USER, 
        companyId: 1, 
        isActive: true 
      }) { 
        id username email role company { name } isActive 
      } 
    }"
  }'

# Резултат:
{
  "data": {
    "createUser": {
      "id": "6",
      "username": "test_with_company",
      "email": "test2@test.com",
      "role": "USER",
      "company": {
        "name": "Тест ООД"
      },
      "isActive": true
    }
  }
}
```

## Резултат
✅ **Пълно функциониране на създаването на потребители**
- Потребители могат да се създават БЕЗ компания (companyId: null)
- Потребители могат да се създават С компания (companyId: [ID])
- UI ясно показва връзките между компании и потребители в подобрена таблица
- Всички GraphQL валидационни грешки са отстранени
- Добавени цветови индикатори за роли, квоти и статус

## Ключови учения
1. **Консистентност в именуването** - Важно е enum стойностите да са същите във всички слоеве
2. **GraphQL валидация** - Nullable полета трябва да бъдат правилно дефинирани в схемата
3. **JavaScript тип безопасност** - `parseInt("")` върна `NaN`, не `null`
4. **UI/UX подобрения** - Детайлна таблица за връзки значително подобри потребителския опит
5. **Систематично тестване** - Важно е да се тестват и двата сценария (с и без компания)

## Засегнати файлове
- `backend/src/main/java/com/invoiceapp/backend/model/Role.java`
- `backend/src/main/java/com/invoiceapp/backend/model/Company.java`
- `backend/src/main/java/com/invoiceapp/backend/config/DataInitializer.java`
- `backend/src/main/java/com/invoiceapp/backend/controller/UserController.java`
- `backend/src/main/resources/graphql/schema.graphqls`
- `frontend/src/pages/GlobalSettings.jsx`

**Автор:** Kilo Code  
**Време за изпълнение:** ~45 минути  
**Сложност:** Средна - множество свързани проблеми в различни слоеве