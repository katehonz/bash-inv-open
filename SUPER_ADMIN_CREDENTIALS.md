# SUPER_ADMIN Данни за вход - Bash Inv Web Електронно Фактуриране

За тестване на JWT автентикация на Bash Inv системата използвайте следните данни:

## Начални данни за SUPER_ADMIN:
- **Потребителско име:** `superadministrator`
- **Email:** `admin@invoiceapp.com`
- **Парола:** `CHANGE_THIS_PASSWORD`

## Как да инициализирате SUPER_ADMIN:

### Вариант 1: Чрез GraphiQL интерфейс
1. Отидете на http://localhost:8080/graphiql
2. Изпълнете следната мутация:

```graphql
mutation {
  initializeSuperAdmin
}
```

### Вариант 2: Чрез curl команда
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { initializeSuperAdmin }"}'
```

### Вариант 3: Директно от браузъра
Отидете на http://localhost:3000 и ако няма потребители, системата автоматично ще покаже опция за инициализация.

## Алтернативно рестартиране на парола:
Ако паролата е променена, можете да я рестартирате чрез:

**GraphiQL:**
```graphql
mutation {
  resetSuperAdminPassword
}
```

**Curl:**
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { resetSuperAdminPassword }"}'
```

## Login с JWT:
След инициализиране можете да се логнете с:
- Username: `superadministrator` ИЛИ Email: `admin@invoiceapp.com`
- Password: `CHANGE_THIS_PASSWORD`

Системата поддържа вход както с потребителско име, така и с email адрес.