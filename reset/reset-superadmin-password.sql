-- PostgreSQL скрипт за обновяване на SUPER_ADMIN парола
-- Стартира се с: psql -d your_database_name -f reset-superadmin-password.sql

DO $$
DECLARE
    new_password_plain TEXT := 'CHANGE_THIS_PASSWORD';
    new_password_hash TEXT;
    user_count INTEGER;
BEGIN
    -- Проверяваме дали съществува SUPER_ADMIN потребител
    SELECT COUNT(*) INTO user_count 
    FROM users 
    WHERE role = 'SUPER_ADMIN' AND username = 'superadmin';
    
    IF user_count = 0 THEN
        RAISE NOTICE 'Не е намерен SUPER_ADMIN потребител с username "superadmin"';
        RETURN;
    END IF;
    
    -- Генерираме BCrypt hash на новата парола
    -- Използваме crypt функцията от pgcrypto extension
    SELECT crypt(new_password_plain, gen_salt('bf', 10)) INTO new_password_hash;
    
    -- Обновяваме паролата на SUPER_ADMIN потребителя
    UPDATE users 
    SET 
        password = new_password_hash,
        is_active = true,
        email = 'admin@invoiceapp.com'
    WHERE role = 'SUPER_ADMIN' AND username = 'superadmin';
    
    -- Показваме резултата
    RAISE NOTICE '=== SUPER_ADMIN парола обновена успешно ===';
    RAISE NOTICE 'Username: superadmin';
    RAISE NOTICE 'Email: admin@invoiceapp.com'; 
    RAISE NOTICE 'Нова парола: %', new_password_plain;
    RAISE NOTICE '============================================';
    
END $$;

-- Показваме информация за обновения потребител
SELECT 
    id,
    username,
    email,
    role,
    is_active,
    company_id
FROM users 
WHERE role = 'SUPER_ADMIN' AND username = 'superadmin';