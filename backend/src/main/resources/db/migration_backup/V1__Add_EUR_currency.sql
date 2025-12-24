-- Add EUR currency if it doesn't exist
INSERT INTO currencies (code, name, symbol)
VALUES ('EUR', 'EUR', NULL)
ON CONFLICT (code) DO NOTHING;

-- Add EUR exchange rate for all dates where we have other rates
INSERT INTO exchange_rates (base_currency, rate, rate_date, currency_code)
SELECT DISTINCT 'EUR', 1.0, rate_date, 'EUR'
FROM exchange_rates
WHERE NOT EXISTS (
    SELECT 1 FROM exchange_rates er
    WHERE er.currency_code = 'EUR' AND er.rate_date = exchange_rates.rate_date
);

-- Update all exchange rates to use EUR as base currency
UPDATE exchange_rates SET base_currency = 'EUR' WHERE base_currency != 'EUR';

-- Update BGN rate to correct EUR conversion (1 BGN = 0.511290323 EUR)
UPDATE exchange_rates
SET rate = 0.511290323
WHERE currency_code = 'BGN';

-- Update USD rate to typical EUR conversion (approximate)
UPDATE exchange_rates
SET rate = 0.93
WHERE currency_code = 'USD';
