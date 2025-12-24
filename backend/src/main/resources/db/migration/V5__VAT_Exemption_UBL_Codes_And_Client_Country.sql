-- V5: Add UBL codes to VAT exemption reasons and country code to clients
-- This migration adds EN 16931 / UBL 2.1 compliance fields

-- ===========================================
-- 1. Add UBL columns to vat_exemption_reasons
-- ===========================================
ALTER TABLE vat_exemption_reasons
ADD COLUMN IF NOT EXISTS ubl_category_code VARCHAR(3),
ADD COLUMN IF NOT EXISTS ubl_exemption_code VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN vat_exemption_reasons.ubl_category_code IS 'UBL VAT Category Code: S, Z, E, K, G, O, AE per UNCL5305';
COMMENT ON COLUMN vat_exemption_reasons.ubl_exemption_code IS 'UBL Exemption Reason Code per EN 16931 (e.g., vatex-eu-ic)';

-- ===========================================
-- 2. Add country_code column to clients
-- ===========================================
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);

COMMENT ON COLUMN clients.country_code IS 'ISO 3166-1 alpha-2 country code';

-- ===========================================
-- 3. Clear existing VAT exemption reasons (to repopulate with UBL codes)
-- ===========================================
DELETE FROM vat_exemption_reasons;

-- ===========================================
-- 4. Insert complete VAT exemption reasons with UBL codes
-- Based on Bulgarian VAT Law (ЗДДС) and EN 16931 standard
-- ===========================================

-- Category G: Export of goods (Износ на стоки)
INSERT INTO vat_exemption_reasons (reason_code, reason_name, reason_name_en, legal_basis, legal_basis_en, ubl_category_code, ubl_exemption_code, description, is_active, sort_order) VALUES
('VATEX-EU-G', 'Износ на стоки', 'Export of goods', 'чл. 28 от ЗДДС', 'Art. 28 VAT Act', 'G', 'vatex-eu-g', 'Доставка на стоки, изпратени или превозени извън територията на ЕС', true, 1);

-- Category K: Intra-Community supply (ВОД)
INSERT INTO vat_exemption_reasons (reason_code, reason_name, reason_name_en, legal_basis, legal_basis_en, ubl_category_code, ubl_exemption_code, description, is_active, sort_order) VALUES
('VATEX-EU-IC', 'Вътреобщностна доставка на стоки', 'Intra-Community supply of goods', 'чл. 7, ал. 1 от ЗДДС', 'Art. 7(1) VAT Act', 'K', 'vatex-eu-ic', 'Доставка на стоки към регистриран по ДДС получател в друга държава-членка', true, 2);

-- Category O: Not subject to VAT (Обратно начисляване / Извън обхвата)
INSERT INTO vat_exemption_reasons (reason_code, reason_name, reason_name_en, legal_basis, legal_basis_en, ubl_category_code, ubl_exemption_code, description, is_active, sort_order) VALUES
('VATEX-EU-O', 'Обратно начисляване на ДДС', 'Reverse charge', 'чл. 82, ал. 2-5 от ЗДДС', 'Art. 82(2-5) VAT Act', 'O', 'vatex-eu-o', 'Обратно начисляване - данъкът се дължи от получателя', true, 3);

-- Category AE: Reverse Charge (Специален режим обратно начисляване)
INSERT INTO vat_exemption_reasons (reason_code, reason_name, reason_name_en, legal_basis, legal_basis_en, ubl_category_code, ubl_exemption_code, description, is_active, sort_order) VALUES
('VATEX-EU-AE', 'Специален режим на обратно начисляване', 'VAT Reverse Charge', 'чл. 163а от ЗДДС', 'Art. 163a VAT Act', 'AE', 'vatex-eu-ae', 'Специален режим за обратно начисляване при сделки с инвестиционно злато и други', true, 4);

-- Category E: Exempt from VAT (Освободени доставки)
INSERT INTO vat_exemption_reasons (reason_code, reason_name, reason_name_en, legal_basis, legal_basis_en, ubl_category_code, ubl_exemption_code, description, is_active, sort_order) VALUES
('VATEX-EU-E-39', 'Освободена доставка - здравеопазване', 'Exempt - healthcare', 'чл. 39 от ЗДДС', 'Art. 39 VAT Act', 'E', 'vatex-eu-e', 'Доставка на здравни услуги и стоки, свързани с тях', true, 10),
('VATEX-EU-E-40', 'Освободена доставка - социални услуги', 'Exempt - social services', 'чл. 40 от ЗДДС', 'Art. 40 VAT Act', 'E', 'vatex-eu-e', 'Доставка на социални услуги', true, 11),
('VATEX-EU-E-41', 'Освободена доставка - образование', 'Exempt - education', 'чл. 41 от ЗДДС', 'Art. 41 VAT Act', 'E', 'vatex-eu-e', 'Образователни услуги', true, 12),
('VATEX-EU-E-42', 'Освободена доставка - културни услуги', 'Exempt - cultural services', 'чл. 42 от ЗДДС', 'Art. 42 VAT Act', 'E', 'vatex-eu-e', 'Културни и спортни услуги', true, 13),
('VATEX-EU-E-44', 'Освободена доставка - финансови услуги', 'Exempt - financial services', 'чл. 44 от ЗДДС', 'Art. 44 VAT Act', 'E', 'vatex-eu-e', 'Финансови услуги', true, 14),
('VATEX-EU-E-45', 'Освободена доставка - застраховки', 'Exempt - insurance', 'чл. 45 от ЗДДС', 'Art. 45 VAT Act', 'E', 'vatex-eu-e', 'Застрахователни и презастрахователни услуги', true, 15),
('VATEX-EU-E-46', 'Освободена доставка - недвижими имоти', 'Exempt - immovable property', 'чл. 45-46 от ЗДДС', 'Art. 45-46 VAT Act', 'E', 'vatex-eu-e', 'Доставка на недвижим имот, наем', true, 16),
('VATEX-EU-E-47', 'Освободена доставка - хазартни услуги', 'Exempt - gambling', 'чл. 47 от ЗДДС', 'Art. 47 VAT Act', 'E', 'vatex-eu-e', 'Хазартни услуги', true, 17);

-- Category Z: Zero rate (Нулева ставка - други случаи)
INSERT INTO vat_exemption_reasons (reason_code, reason_name, reason_name_en, legal_basis, legal_basis_en, ubl_category_code, ubl_exemption_code, description, is_active, sort_order) VALUES
('VATEX-EU-Z-29', 'Нулева ставка - международен транспорт', 'Zero rate - international transport', 'чл. 29 от ЗДДС', 'Art. 29 VAT Act', 'Z', 'vatex-eu-z', 'Международен транспорт на пътници и стоки', true, 20),
('VATEX-EU-Z-30', 'Нулева ставка - услуги за плавателни съдове', 'Zero rate - maritime services', 'чл. 30 от ЗДДС', 'Art. 30 VAT Act', 'Z', 'vatex-eu-z', 'Доставки за плавателни съдове', true, 21),
('VATEX-EU-Z-31', 'Нулева ставка - услуги за въздухоплавателни средства', 'Zero rate - aircraft services', 'чл. 31 от ЗДДС', 'Art. 31 VAT Act', 'Z', 'vatex-eu-z', 'Доставки за въздухоплавателни средства', true, 22),
('VATEX-EU-Z-32', 'Нулева ставка - транзитни стоки', 'Zero rate - transit goods', 'чл. 32 от ЗДДС', 'Art. 32 VAT Act', 'Z', 'vatex-eu-z', 'Доставки в режим транзит', true, 23),
('VATEX-EU-Z-33', 'Нулева ставка - митнически режими', 'Zero rate - customs regimes', 'чл. 33 от ЗДДС', 'Art. 33 VAT Act', 'Z', 'vatex-eu-z', 'Доставки, свързани с митнически режими', true, 24),
('VATEX-EU-Z-173', 'Нулева ставка - дипломатически мисии', 'Zero rate - diplomatic missions', 'чл. 173 от ЗДДС', 'Art. 173 VAT Act', 'Z', 'vatex-eu-z', 'Доставки за дипломатически и консулски представителства', true, 25);

-- Services to non-EU clients (Услуги към трети страни)
INSERT INTO vat_exemption_reasons (reason_code, reason_name, reason_name_en, legal_basis, legal_basis_en, ubl_category_code, ubl_exemption_code, description, is_active, sort_order) VALUES
('VATEX-EU-S-21', 'Услуги към лица извън ЕС', 'Services to non-EU persons', 'чл. 21, ал. 2 от ЗДДС', 'Art. 21(2) VAT Act', 'O', 'vatex-eu-o', 'Място на изпълнение извън ЕС - услуги към данъчно задължени лица', true, 30),
('VATEX-EU-S-22', 'Услуги, свързани с недвижим имот извън БГ', 'Services related to immovable property outside BG', 'чл. 21, ал. 4, т. 1 от ЗДДС', 'Art. 21(4)(1) VAT Act', 'O', 'vatex-eu-o', 'Услуги, свързани с недвижим имот, намиращ се извън България', true, 31);

-- Small business exemption (Малки предприятия)
INSERT INTO vat_exemption_reasons (reason_code, reason_name, reason_name_en, legal_basis, legal_basis_en, ubl_category_code, ubl_exemption_code, description, is_active, sort_order) VALUES
('VATEX-EU-SM', 'Освободена доставка - малко предприятие', 'Small business exemption', 'чл. 113 от ЗДДС', 'Art. 113 VAT Act', 'E', 'vatex-eu-e', 'Нерегистрирано по ЗДДС лице под прага', true, 40);

-- ===========================================
-- 5. Create index for better performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_vat_exemption_ubl_category ON vat_exemption_reasons(ubl_category_code);
CREATE INDEX IF NOT EXISTS idx_vat_exemption_ubl_code ON vat_exemption_reasons(ubl_exemption_code);
CREATE INDEX IF NOT EXISTS idx_clients_country_code ON clients(country_code);
