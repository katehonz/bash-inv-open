-- V4: Document Types (UNCL1001) and Full Countries (ISO 3166-1)
-- Standards: UN/EDIFACT D.16B, EN 16931, Peppol BIS 3.0

-- ========================================
-- DOCUMENT TYPES (UNCL1001)
-- ========================================
CREATE TABLE IF NOT EXISTS document_type_codes (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description TEXT,
    description_en TEXT,
    applies_to VARCHAR(50) NOT NULL, -- INVOICE, CREDIT_NOTE, BOTH
    is_common BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 999
);

INSERT INTO document_type_codes (code, name, name_en, description, description_en, applies_to, is_common, sort_order) VALUES
-- Най-често използвани / Most common
('380', 'Търговска фактура', 'Commercial invoice', 'Стандартна фактура за продажба на стоки/услуги', 'Document/message claiming payment for goods or services supplied', 'INVOICE', true, 1),
('381', 'Кредитно известие', 'Credit note', 'Документ за кредитиране на клиент', 'Document/message for providing credit information to the relevant party', 'CREDIT_NOTE', true, 2),
('383', 'Дебитно известие', 'Debit note', 'Документ за дебитиране на клиент', 'Document/message for providing debit information to the relevant party', 'INVOICE', true, 3),
('384', 'Коригираща фактура', 'Corrected invoice', 'Фактура с коригирана информация', 'Commercial invoice that includes corrected information', 'INVOICE', true, 4),
('386', 'Авансова фактура', 'Prepayment invoice', 'Фактура за авансово плащане', 'Invoice requesting payment in advance for goods or services', 'INVOICE', true, 5),
('389', 'Самофактура', 'Self-billed invoice', 'Фактура издадена от получателя', 'Invoice produced by the invoicee instead of the seller', 'INVOICE', true, 6),

-- Други типове фактури / Other invoice types
('71', 'Искане за плащане', 'Request for payment', 'Искане за плащане на просрочени фактури', 'Document requesting payment of past due invoices', 'INVOICE', false, 10),
('80', 'Дебитно известие за стоки/услуги', 'Debit note related to goods or services', 'Дебитно известие свързано със стоки или услуги', 'Debit note related to goods or services', 'INVOICE', false, 11),
('82', 'Фактура за измерени услуги', 'Metered services invoice', 'Фактура за комунални услуги по измерване', 'Claiming payment for measured utility supplies', 'INVOICE', false, 12),
('84', 'Дебитно известие за финансови корекции', 'Debit note related to financial adjustments', 'Дебитно известие за финансови корекции', 'Debit note related to financial adjustments', 'INVOICE', false, 13),
('102', 'Данъчно уведомление', 'Tax notification', 'Уведомление за данъчни задължения', 'Notification related to tax obligations', 'INVOICE', false, 14),
('218', 'Финално искане за плащане', 'Final payment request based on completion of work', 'Искане за плащане след завършена работа', 'Final payment request based on completion of work', 'INVOICE', false, 15),
('219', 'Искане за плащане за завършени единици', 'Payment request for completed units', 'Искане за плащане за завършени етапи', 'Payment request for completed units', 'INVOICE', false, 16),
('326', 'Частична фактура', 'Partial invoice', 'Фактура за част от поръчка', 'Invoice for partial delivery or service', 'INVOICE', false, 17),
('331', 'Търговска фактура с опаковъчен лист', 'Commercial invoice with packing list', 'Фактура включваща опаковъчен лист', 'Commercial invoice which includes a packing list', 'INVOICE', false, 18),
('382', 'Комисионна бележка', 'Commission note', 'Документ за комисионна', 'Document specifying commission amount or percentage', 'INVOICE', false, 19),
('388', 'Данъчна фактура', 'Tax invoice', 'Фактура за данъчни цели', 'Invoice issued for tax purposes', 'INVOICE', true, 7),
('393', 'Факторинг фактура', 'Factored invoice', 'Фактура прехвърлена на трета страна', 'Invoice assigned to a third party for collection', 'INVOICE', false, 20),
('395', 'Консигнационна фактура', 'Consignment invoice', 'Фактура за консигнация (не продажба)', 'Invoice for consignment (non-sale transaction)', 'INVOICE', false, 21),
('553', 'Доклад за несъответствие', 'Forwarder''s invoice discrepancy report', 'Доклад за несъответствие от спедитор', 'Forwarder invoice discrepancy report', 'INVOICE', false, 22),
('575', 'Застрахователна фактура', 'Insurer''s invoice', 'Фактура за застрахователни разходи', 'Invoice specifying insurance costs', 'INVOICE', false, 23),
('623', 'Спедиторска фактура', 'Forwarder''s invoice', 'Фактура за спедиторски услуги', 'Forwarder invoice for services and costs', 'INVOICE', false, 24),
('780', 'Фрахтова фактура', 'Freight invoice', 'Фактура за транспортни разходи', 'Invoice stating freight costs', 'INVOICE', false, 25),
('817', 'Уведомление за претенция', 'Claim notification', 'Документ за претенция', 'Notification of a claim', 'INVOICE', false, 26),
('870', 'Консулска фактура', 'Consular invoice', 'Фактура за износ/внос документация', 'Invoice for export/import documentation', 'INVOICE', false, 27),
('875', 'Частична строителна фактура', 'Partial construction invoice', 'Фактура за етап от строителство', 'Invoice for partial construction work', 'INVOICE', false, 28),
('876', 'Частична финална строителна фактура', 'Partial final construction invoice', 'Частична финална строителна фактура', 'Partial final construction invoice', 'INVOICE', false, 29),
('877', 'Финална строителна фактура', 'Final construction invoice', 'Фактура за завършено строителство', 'Final construction invoice', 'INVOICE', false, 30),

-- Кредитни известия / Credit notes
('81', 'Кредитно известие за стоки/услуги', 'Credit note related to goods or services', 'Кредитно известие свързано със стоки или услуги', 'Credit note related to goods or services', 'CREDIT_NOTE', false, 40),
('83', 'Кредитно известие за финансови корекции', 'Credit note related to financial adjustments', 'Кредитно известие за финансови корекции', 'Credit note related to financial adjustments', 'CREDIT_NOTE', false, 41),
('261', 'Самоиздадено кредитно известие', 'Self billed credit note', 'Кредитно известие издадено от получателя', 'Self billed credit note', 'CREDIT_NOTE', false, 42),
('262', 'Консолидирано кредитно известие', 'Consolidated credit note goods and services', 'Консолидирано кредитно известие', 'Consolidated credit note goods and services', 'CREDIT_NOTE', false, 43),
('296', 'Кредитно известие за лизинг', 'Credit note for goods and services', 'Кредитно известие за лизингови услуги', 'Credit note for goods and services', 'CREDIT_NOTE', false, 44),
('308', 'Кредитно известие от доставчик', 'Supplier credit note', 'Кредитно известие издадено от доставчик', 'Supplier credit note', 'CREDIT_NOTE', false, 45),
('396', 'Факторинг кредитно известие', 'Factored credit note', 'Кредитно известие прехвърлено на трета страна', 'Credit note assigned to a third party', 'CREDIT_NOTE', false, 46),
('420', 'Оптична кредитна бележка', 'Optical credit note', 'Оптично сканируемо кредитно известие', 'Optical credit note', 'CREDIT_NOTE', false, 47),
('458', 'Кредитно известие за грешки', 'Credit note for errors', 'Кредитно известие за корекция на грешки', 'Credit note for correction of errors', 'CREDIT_NOTE', false, 48),
('532', 'Кредитно известие от спедитор', 'Forwarder''s credit note', 'Кредитно известие от спедитор', 'Credit note from forwarder', 'CREDIT_NOTE', false, 49)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    description = EXCLUDED.description,
    description_en = EXCLUDED.description_en,
    applies_to = EXCLUDED.applies_to,
    is_common = EXCLUDED.is_common,
    sort_order = EXCLUDED.sort_order;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doc_type_applies_to ON document_type_codes (applies_to);
CREATE INDEX IF NOT EXISTS idx_doc_type_is_common ON document_type_codes (is_common);

-- ========================================
-- FULL COUNTRIES (ISO 3166-1 + Peppol)
-- ========================================
TRUNCATE TABLE countries;

INSERT INTO countries (code, name, name_en, is_eu_member) VALUES
-- ЕС членки (27) / EU Members
('AT', 'Австрия', 'Austria', true),
('BE', 'Белгия', 'Belgium', true),
('BG', 'България', 'Bulgaria', true),
('HR', 'Хърватия', 'Croatia', true),
('CY', 'Кипър', 'Cyprus', true),
('CZ', 'Чехия', 'Czech Republic', true),
('DK', 'Дания', 'Denmark', true),
('EE', 'Естония', 'Estonia', true),
('FI', 'Финландия', 'Finland', true),
('FR', 'Франция', 'France', true),
('DE', 'Германия', 'Germany', true),
('GR', 'Гърция', 'Greece', true),
('HU', 'Унгария', 'Hungary', true),
('IE', 'Ирландия', 'Ireland', true),
('IT', 'Италия', 'Italy', true),
('LV', 'Латвия', 'Latvia', true),
('LT', 'Литва', 'Lithuania', true),
('LU', 'Люксембург', 'Luxembourg', true),
('MT', 'Малта', 'Malta', true),
('NL', 'Нидерландия', 'Netherlands', true),
('PL', 'Полша', 'Poland', true),
('PT', 'Португалия', 'Portugal', true),
('RO', 'Румъния', 'Romania', true),
('SK', 'Словакия', 'Slovakia', true),
('SI', 'Словения', 'Slovenia', true),
('ES', 'Испания', 'Spain', true),
('SE', 'Швеция', 'Sweden', true),

-- ЕИП и ЕФТА / EEA and EFTA
('IS', 'Исландия', 'Iceland', false),
('LI', 'Лихтенщайн', 'Liechtenstein', false),
('NO', 'Норвегия', 'Norway', false),
('CH', 'Швейцария', 'Switzerland', false),

-- Великобритания / United Kingdom
('GB', 'Великобритания', 'United Kingdom', false),
('XI', 'Северна Ирландия (NI Protocol)', 'Northern Ireland (NI Protocol)', false),

-- Балкани / Balkans
('AL', 'Албания', 'Albania', false),
('BA', 'Босна и Херцеговина', 'Bosnia and Herzegovina', false),
('ME', 'Черна гора', 'Montenegro', false),
('MK', 'Северна Македония', 'North Macedonia', false),
('RS', 'Сърбия', 'Serbia', false),
('XK', 'Косово', 'Kosovo', false),

-- Източна Европа / Eastern Europe
('BY', 'Беларус', 'Belarus', false),
('MD', 'Молдова', 'Moldova', false),
('UA', 'Украйна', 'Ukraine', false),
('RU', 'Русия', 'Russia', false),

-- Близък Изток / Middle East
('AE', 'ОАЕ', 'United Arab Emirates', false),
('IL', 'Израел', 'Israel', false),
('SA', 'Саудитска Арабия', 'Saudi Arabia', false),
('TR', 'Турция', 'Turkey', false),

-- Азия / Asia
('CN', 'Китай', 'China', false),
('HK', 'Хонконг', 'Hong Kong', false),
('IN', 'Индия', 'India', false),
('JP', 'Япония', 'Japan', false),
('KR', 'Южна Корея', 'South Korea', false),
('SG', 'Сингапур', 'Singapore', false),
('TW', 'Тайван', 'Taiwan', false),
('TH', 'Тайланд', 'Thailand', false),
('VN', 'Виетнам', 'Vietnam', false),
('MY', 'Малайзия', 'Malaysia', false),
('ID', 'Индонезия', 'Indonesia', false),
('PH', 'Филипини', 'Philippines', false),

-- Америка / Americas
('US', 'САЩ', 'United States', false),
('CA', 'Канада', 'Canada', false),
('MX', 'Мексико', 'Mexico', false),
('BR', 'Бразилия', 'Brazil', false),
('AR', 'Аржентина', 'Argentina', false),
('CL', 'Чили', 'Chile', false),
('CO', 'Колумбия', 'Colombia', false),
('PE', 'Перу', 'Peru', false),

-- Океания / Oceania
('AU', 'Австралия', 'Australia', false),
('NZ', 'Нова Зеландия', 'New Zealand', false),

-- Африка / Africa
('ZA', 'Южна Африка', 'South Africa', false),
('EG', 'Египет', 'Egypt', false),
('MA', 'Мароко', 'Morocco', false),
('NG', 'Нигерия', 'Nigeria', false),
('KE', 'Кения', 'Kenya', false)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    is_eu_member = EXCLUDED.is_eu_member;

-- Add Peppol scheme ID column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'countries' AND column_name = 'peppol_scheme_id') THEN
        ALTER TABLE countries ADD COLUMN peppol_scheme_id VARCHAR(10);
    END IF;
END $$;

-- Update Peppol scheme IDs for EU countries
UPDATE countries SET peppol_scheme_id = '9947' WHERE code = 'BG';
UPDATE countries SET peppol_scheme_id = '9914' WHERE code = 'AT';
UPDATE countries SET peppol_scheme_id = '9956' WHERE code = 'BE';
UPDATE countries SET peppol_scheme_id = '9934' WHERE code = 'HR';
UPDATE countries SET peppol_scheme_id = '9925' WHERE code = 'CY';
UPDATE countries SET peppol_scheme_id = '9917' WHERE code = 'DK';
UPDATE countries SET peppol_scheme_id = '9931' WHERE code = 'EE';
UPDATE countries SET peppol_scheme_id = '9935' WHERE code = 'FI';
UPDATE countries SET peppol_scheme_id = '9957' WHERE code = 'FR';
UPDATE countries SET peppol_scheme_id = '9930' WHERE code = 'DE';
UPDATE countries SET peppol_scheme_id = '9933' WHERE code = 'GR';
UPDATE countries SET peppol_scheme_id = '9910' WHERE code = 'HU';
UPDATE countries SET peppol_scheme_id = '9955' WHERE code = 'IE';
UPDATE countries SET peppol_scheme_id = '9906' WHERE code = 'IT';
UPDATE countries SET peppol_scheme_id = '9939' WHERE code = 'LV';
UPDATE countries SET peppol_scheme_id = '9938' WHERE code = 'LT';
UPDATE countries SET peppol_scheme_id = '9915' WHERE code = 'LU';
UPDATE countries SET peppol_scheme_id = '9923' WHERE code = 'MT';
UPDATE countries SET peppol_scheme_id = '9944' WHERE code = 'NL';
UPDATE countries SET peppol_scheme_id = '9945' WHERE code = 'PL';
UPDATE countries SET peppol_scheme_id = '9946' WHERE code = 'PT';
UPDATE countries SET peppol_scheme_id = '9948' WHERE code = 'RO';
UPDATE countries SET peppol_scheme_id = '9929' WHERE code = 'SK';
UPDATE countries SET peppol_scheme_id = '9928' WHERE code = 'SI';
UPDATE countries SET peppol_scheme_id = '9920' WHERE code = 'ES';
UPDATE countries SET peppol_scheme_id = '9955' WHERE code = 'SE';
UPDATE countries SET peppol_scheme_id = '9932' WHERE code = 'CZ';
UPDATE countries SET peppol_scheme_id = '9921' WHERE code = 'NO';
UPDATE countries SET peppol_scheme_id = '9959' WHERE code = 'GB';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_countries_eu ON countries (is_eu_member);
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries (name);
CREATE INDEX IF NOT EXISTS idx_countries_name_en ON countries (name_en);
