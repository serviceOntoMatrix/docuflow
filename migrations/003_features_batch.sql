-- ============================================================
-- DocqFlow Migration 003: Features Batch
-- Email prefs, document versioning, categories, 2FA,
-- retention policies, company requests, audit trail
-- ============================================================

-- 1. Email notification preferences per user
CREATE TABLE IF NOT EXISTS email_preferences (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  notify_document_uploaded TINYINT(1) DEFAULT 1,
  notify_document_status_changed TINYINT(1) DEFAULT 1,
  notify_clarification_received TINYINT(1) DEFAULT 1,
  notify_clarification_reply TINYINT(1) DEFAULT 1,
  notify_reminder TINYINT(1) DEFAULT 1,
  notify_new_client_joined TINYINT(1) DEFAULT 1,
  notify_new_accountant_joined TINYINT(1) DEFAULT 1,
  notify_invitation_received TINYINT(1) DEFAULT 1,
  notify_document_posted TINYINT(1) DEFAULT 1,
  notify_system_announcements TINYINT(1) DEFAULT 1,
  email_frequency ENUM('instant','daily_digest','weekly_digest','off') DEFAULT 'instant',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_prefs (user_id),
  CONSTRAINT fk_email_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Document versions (archive old versions when replaced)
CREATE TABLE IF NOT EXISTS document_versions (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100) DEFAULT NULL,
  file_size BIGINT DEFAULT NULL,
  uploaded_by VARCHAR(36) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_doc_versions_doc (document_id),
  KEY idx_doc_versions_num (document_id, version_number),
  CONSTRAINT fk_doc_versions_doc FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_versions_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Document categories
CREATE TABLE IF NOT EXISTS document_categories (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  firm_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_firm_cat (firm_id, name),
  CONSTRAINT fk_doc_cat_firm FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add category_id to documents
ALTER TABLE documents
  ADD COLUMN category_id VARCHAR(36) DEFAULT NULL AFTER company_id,
  ADD KEY idx_documents_category (category_id);

-- 4. Two-Factor Authentication
ALTER TABLE users
  ADD COLUMN totp_secret VARCHAR(64) DEFAULT NULL AFTER avatar_url,
  ADD COLUMN totp_enabled TINYINT(1) DEFAULT 0 AFTER totp_secret,
  ADD COLUMN totp_verified_at TIMESTAMP NULL DEFAULT NULL AFTER totp_enabled;

-- 5. Document retention policies per firm
ALTER TABLE firms
  ADD COLUMN retention_months INT DEFAULT NULL AFTER trial_ends_at,
  ADD COLUMN auto_archive_months INT DEFAULT NULL AFTER retention_months;

-- 6. Company requests (client self-service)
CREATE TABLE IF NOT EXISTS company_requests (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  firm_id VARCHAR(36) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  reason TEXT DEFAULT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by VARCHAR(36) DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  review_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_company_req_client (client_id),
  KEY idx_company_req_firm (firm_id),
  KEY idx_company_req_status (status),
  CONSTRAINT fk_company_req_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_company_req_firm FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  CONSTRAINT fk_company_req_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. Firm-level audit trail (visible to firm owners)
CREATE TABLE IF NOT EXISTS firm_audit_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  firm_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id VARCHAR(36) DEFAULT NULL,
  details JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_firm_audit_firm (firm_id),
  KEY idx_firm_audit_created (created_at),
  CONSTRAINT fk_firm_audit_firm FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  CONSTRAINT fk_firm_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. Seed default document categories for existing firms
INSERT INTO document_categories (id, firm_id, name, color, sort_order)
SELECT UUID(), f.id, 'Invoices', '#3b82f6', 1 FROM firms f
UNION ALL
SELECT UUID(), f.id, 'Receipts', '#10b981', 2 FROM firms f
UNION ALL
SELECT UUID(), f.id, 'Tax Returns', '#f59e0b', 3 FROM firms f
UNION ALL
SELECT UUID(), f.id, 'Bank Statements', '#8b5cf6', 4 FROM firms f
UNION ALL
SELECT UUID(), f.id, 'Other', '#6b7280', 5 FROM firms f;
