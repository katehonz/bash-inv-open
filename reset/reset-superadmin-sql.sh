#!/bin/bash

# PostgreSQL SUPER_ADMIN Password Reset Script
# Този скрипт обновява паролата на SUPER_ADMIN потребителя директно в PostgreSQL базата данни

echo "=== PostgreSQL SUPER_ADMIN Password Reset ==="
echo "Този скрипт ще обнови паролата на superadmin потребителя в базата данни."
echo ""

# Проверяваме дали pgcrypto extension е налична
echo "Проверяваме pgcrypto extension..."

# Променливи за PostgreSQL връзка (може да се настроят)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-sp-inv-app}
DB_USER=${DB_USER:-postgres}

echo "Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT as user $DB_USER"
echo ""

# Уверяваме се че pgcrypto extension е включена
echo "Включваме pgcrypto extension..."
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

if [ $? -ne 0 ]; then
    echo "Грешка: Не мога да включа pgcrypto extension. Моля проверете правата за достъп."
    exit 1
fi

echo ""
echo "Стартираме скрипта за обновяване на паролата..."
echo ""

# Стартираме SQL скрипта
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f reset-superadmin-password.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Паролата на SUPER_ADMIN е обновена успешно!"
    echo ""
    echo "Можете да влезете в системата със следните данни:"
    echo "URL: http://localhost:3000"
    echo "Username: superadmin"
    echo "Password: CHANGE_THIS_PASSWORD"
    echo ""
else
    echo "❌ Грешка при обновяване на паролата. Моля проверете логовете."
    exit 1
fi