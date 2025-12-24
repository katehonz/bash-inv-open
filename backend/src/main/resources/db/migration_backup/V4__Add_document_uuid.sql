-- Add UUID column to documents table
ALTER TABLE documents ADD COLUMN document_uuid VARCHAR(36);

-- Generate UUIDs for existing documents
UPDATE documents SET document_uuid = gen_random_uuid()::text WHERE document_uuid IS NULL;

-- Make column NOT NULL and add unique constraint
ALTER TABLE documents ALTER COLUMN document_uuid SET NOT NULL;
ALTER TABLE documents ADD CONSTRAINT uk_document_uuid UNIQUE (document_uuid);
