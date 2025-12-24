ALTER TABLE documents RENAME COLUMN subtotal_amount_bgn TO subtotal_amount_base_currency;
ALTER TABLE documents RENAME COLUMN vat_amount_bgn TO vat_amount_base_currency;
ALTER TABLE documents RENAME COLUMN total_amount_with_vat_bgn TO total_amount_with_vat_base_currency;
ALTER TABLE documents ADD COLUMN exchange_rate_date DATE;
