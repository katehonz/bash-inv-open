-- V1__Initial_Schema.sql

-- 0. Nomenclature Tables (Countries, UOMs)
CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    is_eu_member BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS units_of_measure (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    symbol VARCHAR(20),
    category VARCHAR(50)
);

-- Seed Initial Countries (Basic List)
INSERT INTO countries (code, name, name_en, is_eu_member) VALUES
('BG', 'България', 'Bulgaria', true),
('DE', 'Германия', 'Germany', true),
('FR', 'Франция', 'France', true),
('IT', 'Италия', 'Italy', true),
('ES', 'Испания', 'Spain', true),
('GB', 'Великобритания', 'United Kingdom', false),
('US', 'САЩ', 'United States', false),
('RO', 'Румъния', 'Romania', true),
('GR', 'Гърция', 'Greece', true);

-- Seed Initial Units of Measure (UN/ECE Rec 20)
INSERT INTO units_of_measure (code, name, name_en, symbol, category) VALUES
('C62', 'брой', 'one (piece)', 'бр.', 'UNIT'),
('KGM', 'килограм', 'kilogram', 'кг', 'WEIGHT'),
('MTR', 'метър', 'metre', 'м', 'LENGTH'),
('MTK', 'квадратен метър', 'square metre', 'м2', 'AREA'),
('MTQ', 'кубичен метър', 'cubic metre', 'м3', 'VOLUME'),
('LTR', 'литър', 'litre', 'л', 'VOLUME'),
('DAY', 'ден', 'day', 'ден', 'TIME'),
('HUR', 'час', 'hour', 'час', 'TIME'),
('MON', 'месец', 'month', 'мес', 'TIME'),
('KMT', 'километър', 'kilometre', 'км', 'LENGTH');

-- 1. Companies
CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    address VARCHAR(255),
    vat_number VARCHAR(255),
    eik VARCHAR(255),
    name_en VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(255),
    signature_url VARCHAR(255),
    company_stamp_url VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'FREE',
    user_limit INT NOT NULL DEFAULT 2,
    tax_registration_date DATE,
    is_vat_registered BOOLEAN DEFAULT FALSE,
    default_payment_terms INT DEFAULT 14,
    invoice_footer TEXT,
    invoice_footer_en TEXT,
    compiled_by VARCHAR(255)
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    company_id BIGINT REFERENCES companies(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clients
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    vat_number VARCHAR(50),
    eik VARCHAR(50),
    name_en VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    registration_address TEXT,
    client_type VARCHAR(50) DEFAULT 'B2B',
    is_eu_vat_payer BOOLEAN DEFAULT FALSE,
    is_individual BOOLEAN DEFAULT FALSE,
    payment_terms INT DEFAULT 14,
    credit_limit DECIMAL(15, 2),
    discount_percent DECIMAL(5, 2),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id BIGINT NOT NULL REFERENCES companies(id)
);

-- 4. Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    method_code VARCHAR(50) NOT NULL,
    requires_bank_account BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT,
    description TEXT,
    company_id BIGINT NOT NULL REFERENCES companies(id)
);

-- 5. Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    iban VARCHAR(50) NOT NULL,
    bic VARCHAR(50) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    account_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT,
    description TEXT,
    company_id BIGINT NOT NULL REFERENCES companies(id)
);

-- 6. Currencies
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE
);

-- 7. Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id BIGSERIAL PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    rate_date DATE NOT NULL,
    rate DECIMAL(19, 9) NOT NULL,
    base_currency VARCHAR(3) NOT NULL
);

-- 8. Vat Rates
CREATE TABLE IF NOT EXISTS vat_rates (
    id BIGSERIAL PRIMARY KEY,
    rate_value DECIMAL(5, 2) NOT NULL,
    rate_name VARCHAR(255) NOT NULL,
    rate_name_en VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT
);

-- 9. Vat Exemption Reasons
CREATE TABLE IF NOT EXISTS vat_exemption_reasons (
    id BIGSERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL,
    reason_name VARCHAR(255) NOT NULL,
    reason_name_en VARCHAR(255),
    legal_basis VARCHAR(255) NOT NULL,
    legal_basis_en VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT
);

-- 10. Items (Products/Services)
CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    item_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    unit_of_measure VARCHAR(50) DEFAULT 'бр.',
    unit_price DECIMAL(15, 2),
    default_vat_rate DECIMAL(5, 2) DEFAULT 20.00,
    accounting_account_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id BIGINT NOT NULL REFERENCES companies(id)
);

-- 11. Documents
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    document_uuid VARCHAR(36) NOT NULL UNIQUE,
    document_number VARCHAR(50) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    vat_date DATE,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    client_id BIGINT NOT NULL REFERENCES clients(id),
    payment_method_id BIGINT REFERENCES payment_methods(id),
    bank_account_id BIGINT REFERENCES bank_accounts(id),
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    exchange_rate DECIMAL(19, 9),
    exchange_rate_date DATE,
    subtotal_amount DECIMAL(15, 2) NOT NULL,
    vat_amount DECIMAL(15, 2) NOT NULL,
    total_amount_with_vat DECIMAL(15, 2) NOT NULL,
    subtotal_amount_base_currency DECIMAL(15, 2) NOT NULL,
    vat_amount_base_currency DECIMAL(15, 2) NOT NULL,
    total_amount_with_vat_base_currency DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    paid_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, document_type, document_number)
);

-- 12. Document Items
CREATE TABLE IF NOT EXISTS document_items (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id),
    item_id BIGINT NOT NULL REFERENCES items(id),
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    vat_exemption_reason_id BIGINT REFERENCES vat_exemption_reasons(id),
    line_total DECIMAL(10, 2) NOT NULL,
    vat_amount DECIMAL(10, 2) NOT NULL,
    line_total_with_vat DECIMAL(10, 2) NOT NULL,
    item_description TEXT,
    item_description_en TEXT,
    line_number INT
);

-- 13. Invoices (Legacy/Compatibility)
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    client_id BIGINT NOT NULL REFERENCES clients(id)
);

-- 14. Document Number Sequences
CREATE TABLE IF NOT EXISTS document_number_sequences (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    sequence_type VARCHAR(50) NOT NULL,
    current_number BIGINT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, sequence_type)
);

-- 15. SMTP Settings
CREATE TABLE IF NOT EXISTS smtp_settings (
    id BIGSERIAL PRIMARY KEY,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INT NOT NULL,
    smtp_username VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    use_tls BOOLEAN DEFAULT TRUE,
    use_ssl BOOLEAN DEFAULT FALSE,
    smtp_auth BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_tested_at TIMESTAMP,
    test_result VARCHAR(255),
    provider_name VARCHAR(50)
);

-- 16. Backup Settings
CREATE TABLE IF NOT EXISTS backup_settings (
    id BIGSERIAL PRIMARY KEY,
    s3_endpoint VARCHAR(255) NOT NULL,
    s3_region VARCHAR(50) NOT NULL,
    s3_bucket_name VARCHAR(255) NOT NULL,
    s3_access_key VARCHAR(255) NOT NULL,
    s3_secret_key VARCHAR(255) NOT NULL,
    backup_prefix VARCHAR(255),
    auto_backup_enabled BOOLEAN DEFAULT FALSE,
    backup_cron_expression VARCHAR(50),
    retention_days INT DEFAULT 30,
    max_backups INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_backup_at TIMESTAMP,
    last_backup_status VARCHAR(50),
    last_backup_size_bytes BIGINT,
    last_backup_filename VARCHAR(255),
    last_error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_tested_at TIMESTAMP,
    test_result VARCHAR(255)
);

-- 17. Backup History
CREATE TABLE IF NOT EXISTS backup_history (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    backup_type VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds DECIMAL(10, 2),
    error_message TEXT,
    database_name VARCHAR(255),
    checksum VARCHAR(255),
    initiated_by VARCHAR(255),
    deleted_at TIMESTAMP
);

-- 18. Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    expiry_date TIMESTAMP NOT NULL
);
