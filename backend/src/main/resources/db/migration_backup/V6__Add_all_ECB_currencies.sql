-- Add is_active column to currencies table
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Delete existing exchange rates (will be refetched from ECB)
DELETE FROM exchange_rates;

-- Insert/update all ECB supported currencies (using UPSERT to preserve existing references)
-- EUR is the base currency and always active
INSERT INTO currencies (code, name, symbol, is_active) VALUES
    ('EUR', 'Евро', '€', true),
    ('BGN', 'Български лев', 'лв', true),
    ('USD', 'Щатски долар', '$', true),
    ('GBP', 'Британска лира', '£', false),
    ('CHF', 'Швейцарски франк', 'CHF', false),
    ('JPY', 'Японска йена', '¥', false),
    ('AUD', 'Австралийски долар', 'A$', false),
    ('CAD', 'Канадски долар', 'C$', false),
    ('CNY', 'Китайски юан', '¥', false),
    ('HKD', 'Хонконгски долар', 'HK$', false),
    ('INR', 'Индийска рупия', '₹', false),
    ('KRW', 'Южнокорейски вон', '₩', false),
    ('MXN', 'Мексиканско песо', '$', false),
    ('NOK', 'Норвежка крона', 'kr', false),
    ('NZD', 'Новозеландски долар', 'NZ$', false),
    ('PLN', 'Полска злота', 'zł', false),
    ('RON', 'Румънска лея', 'lei', false),
    ('SEK', 'Шведска крона', 'kr', false),
    ('SGD', 'Сингапурски долар', 'S$', false),
    ('TRY', 'Турска лира', '₺', false),
    ('ZAR', 'Южноафрикански ранд', 'R', false),
    ('BRL', 'Бразилски реал', 'R$', false),
    ('CZK', 'Чешка крона', 'Kč', false),
    ('DKK', 'Датска крона', 'kr', false),
    ('HUF', 'Унгарски форинт', 'Ft', false),
    ('IDR', 'Индонезийска рупия', 'Rp', false),
    ('ILS', 'Израелски шекел', '₪', false),
    ('MYR', 'Малайзийски рингит', 'RM', false),
    ('PHP', 'Филипинско песо', '₱', false),
    ('THB', 'Тайландски бат', '฿', false)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    symbol = EXCLUDED.symbol,
    is_active = COALESCE(currencies.is_active, EXCLUDED.is_active);

-- Note: Exchange rates should be synced from ECB using the "Синхронизирай от ЕЦБ" button
-- No hardcoded rates are inserted here
