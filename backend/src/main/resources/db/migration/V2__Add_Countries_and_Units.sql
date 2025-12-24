-- V2: Add Countries and Units of Measure tables

-- Countries table (ISO 3166-1 alpha-2)
CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    is_eu_member BOOLEAN DEFAULT FALSE
);

-- Units of Measure table (UN/ECE Rec 20)
CREATE TABLE IF NOT EXISTS units_of_measure (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    symbol VARCHAR(20),
    category VARCHAR(50)
);

-- Insert common EU countries
INSERT INTO countries (code, name, name_en, is_eu_member) VALUES
('BG', 'България', 'Bulgaria', true),
('DE', 'Германия', 'Germany', true),
('FR', 'Франция', 'France', true),
('IT', 'Италия', 'Italy', true),
('ES', 'Испания', 'Spain', true),
('AT', 'Австрия', 'Austria', true),
('BE', 'Белгия', 'Belgium', true),
('NL', 'Нидерландия', 'Netherlands', true),
('PL', 'Полша', 'Poland', true),
('RO', 'Румъния', 'Romania', true),
('GR', 'Гърция', 'Greece', true),
('CZ', 'Чехия', 'Czech Republic', true),
('PT', 'Португалия', 'Portugal', true),
('HU', 'Унгария', 'Hungary', true),
('SE', 'Швеция', 'Sweden', true),
('SK', 'Словакия', 'Slovakia', true),
('DK', 'Дания', 'Denmark', true),
('FI', 'Финландия', 'Finland', true),
('IE', 'Ирландия', 'Ireland', true),
('HR', 'Хърватия', 'Croatia', true),
('LT', 'Литва', 'Lithuania', true),
('SI', 'Словения', 'Slovenia', true),
('LV', 'Латвия', 'Latvia', true),
('EE', 'Естония', 'Estonia', true),
('CY', 'Кипър', 'Cyprus', true),
('LU', 'Люксембург', 'Luxembourg', true),
('MT', 'Малта', 'Malta', true),
('GB', 'Великобритания', 'United Kingdom', false),
('US', 'САЩ', 'United States', false),
('CH', 'Швейцария', 'Switzerland', false),
('NO', 'Норвегия', 'Norway', false),
('RS', 'Сърбия', 'Serbia', false),
('MK', 'Северна Македония', 'North Macedonia', false),
('TR', 'Турция', 'Turkey', false),
('UA', 'Украйна', 'Ukraine', false),
('RU', 'Русия', 'Russia', false),
('CN', 'Китай', 'China', false)
ON CONFLICT (code) DO NOTHING;

-- Insert common units of measure (UN/ECE Rec 20)
INSERT INTO units_of_measure (code, name, name_en, symbol, category) VALUES
('C62', 'Брой', 'Unit', 'бр.', 'UNIT'),
('EA', 'Брой', 'Each', 'бр.', 'UNIT'),
('KGM', 'Килограм', 'Kilogram', 'кг', 'WEIGHT'),
('GRM', 'Грам', 'Gram', 'г', 'WEIGHT'),
('TNE', 'Тон', 'Tonne', 'т', 'WEIGHT'),
('LTR', 'Литър', 'Litre', 'л', 'VOLUME'),
('MTR', 'Метър', 'Metre', 'м', 'LENGTH'),
('CMT', 'Сантиметър', 'Centimetre', 'см', 'LENGTH'),
('MTK', 'Квадратен метър', 'Square metre', 'м²', 'AREA'),
('MTQ', 'Кубичен метър', 'Cubic metre', 'м³', 'VOLUME'),
('HUR', 'Час', 'Hour', 'ч', 'TIME'),
('DAY', 'Ден', 'Day', 'дни', 'TIME'),
('MON', 'Месец', 'Month', 'мес.', 'TIME'),
('ANN', 'Година', 'Year', 'год.', 'TIME'),
('SET', 'Комплект', 'Set', 'к-т', 'UNIT'),
('PR', 'Чифт', 'Pair', 'чифт', 'UNIT'),
('PK', 'Пакет', 'Pack', 'пак.', 'UNIT'),
('BX', 'Кутия', 'Box', 'кут.', 'UNIT'),
('CT', 'Кашон', 'Carton', 'каш.', 'UNIT'),
('ROL', 'Ролка', 'Roll', 'рол.', 'UNIT')
ON CONFLICT (code) DO NOTHING;
