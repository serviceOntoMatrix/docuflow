-- Migration: Add assigned_accountant_id to companies so each company can have its own assigned accountant
-- Run this after companies table exists

ALTER TABLE companies
ADD COLUMN assigned_accountant_id VARCHAR(36) NULL AFTER company_name,
ADD CONSTRAINT fk_companies_assigned_accountant
  FOREIGN KEY (assigned_accountant_id) REFERENCES users(id) ON DELETE SET NULL,
ADD INDEX idx_companies_assigned_accountant (assigned_accountant_id);

-- Optional: copy client-level assignment to all their companies (one-time backfill)
UPDATE companies c
JOIN clients cl ON c.client_id = cl.id
SET c.assigned_accountant_id = cl.assigned_accountant_id
WHERE cl.assigned_accountant_id IS NOT NULL AND c.assigned_accountant_id IS NULL;
