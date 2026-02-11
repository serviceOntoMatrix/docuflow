-- Migration: Add support for multiple companies per client
-- This creates a separate companies table and allows clients to have multiple companies

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    client_id VARCHAR(36) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client_id (client_id)
);

-- Migrate existing company_name from clients to companies table
INSERT INTO companies (id, client_id, company_name, created_at, updated_at)
SELECT UUID(), id, company_name, created_at, updated_at
FROM clients
WHERE company_name IS NOT NULL AND company_name != '';

-- Add company_id to documents table to track which company a document belongs to
ALTER TABLE documents
ADD COLUMN company_id VARCHAR(36) NULL,
ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
ADD INDEX idx_company_id (company_id);

-- Note: The clients.company_name column is kept for backward compatibility
-- but new companies should be added via the companies table

