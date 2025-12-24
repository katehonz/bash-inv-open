-- Add payment method and bank account foreign keys to documents table
ALTER TABLE documents
    ADD COLUMN payment_method_id BIGINT,
    ADD COLUMN bank_account_id BIGINT;

-- Add foreign key constraints
ALTER TABLE documents
    ADD CONSTRAINT fk_documents_payment_method
    FOREIGN KEY (payment_method_id)
    REFERENCES payment_methods(id);

ALTER TABLE documents
    ADD CONSTRAINT fk_documents_bank_account
    FOREIGN KEY (bank_account_id)
    REFERENCES bank_accounts(id);

-- Create indexes for better query performance
CREATE INDEX idx_documents_payment_method ON documents(payment_method_id);
CREATE INDEX idx_documents_bank_account ON documents(bank_account_id);
