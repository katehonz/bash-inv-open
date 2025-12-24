-- Add paid_at column to documents table for tracking payment date
ALTER TABLE documents ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
