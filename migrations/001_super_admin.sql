-- ============================================================
-- DocqFlow Super Admin Migration
-- Adds: super_admin role, plans, usage tracking, audit logs
-- Run this against your MariaDB/MySQL database
-- ============================================================

-- 1. Update user_roles enum to include super_admin
ALTER TABLE user_roles
  MODIFY COLUMN role ENUM('super_admin','firm','accountant','client') NOT NULL;

-- 2. Update invite_tokens role enum
ALTER TABLE invite_tokens
  MODIFY COLUMN role ENUM('super_admin','firm','accountant','client') NOT NULL;

-- 3. Add firm status/plan columns
ALTER TABLE firms
  ADD COLUMN status ENUM('active','suspended','pending') NOT NULL DEFAULT 'active' AFTER phone,
  ADD COLUMN plan VARCHAR(50) DEFAULT 'free' AFTER status,
  ADD COLUMN max_clients INT DEFAULT NULL AFTER plan,
  ADD COLUMN max_accountants INT DEFAULT NULL AFTER max_clients,
  ADD COLUMN max_documents_per_month INT DEFAULT NULL AFTER max_accountants,
  ADD COLUMN max_storage_mb INT DEFAULT NULL AFTER max_documents_per_month,
  ADD COLUMN suspended_at TIMESTAMP NULL DEFAULT NULL AFTER max_storage_mb,
  ADD COLUMN suspended_by VARCHAR(36) NULL DEFAULT NULL AFTER suspended_at,
  ADD COLUMN notes TEXT NULL AFTER suspended_by;

-- 4. Plans table
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  max_clients INT DEFAULT NULL,
  max_accountants INT DEFAULT NULL,
  max_documents_per_month INT DEFAULT NULL,
  max_storage_mb INT DEFAULT NULL,
  price_per_client DECIMAL(10,2) DEFAULT 0.00,
  price_per_document DECIMAL(10,4) DEFAULT 0.0000,
  base_price DECIMAL(10,2) DEFAULT 0.00,
  billing_cycle ENUM('monthly','yearly') DEFAULT 'monthly',
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. Platform settings (global, not per-firm)
CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  setting_type ENUM('string','text','json','boolean','number') DEFAULT 'string',
  category VARCHAR(50) DEFAULT 'general',
  updated_by VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_platform_settings_category (category),
  CONSTRAINT fk_platform_settings_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id VARCHAR(36) DEFAULT NULL,
  details JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_user (user_id),
  KEY idx_audit_logs_action (action),
  KEY idx_audit_logs_entity (entity_type, entity_id),
  KEY idx_audit_logs_created (created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. Usage tracking - monthly snapshots
CREATE TABLE IF NOT EXISTS usage_records (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  firm_id VARCHAR(36) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  clients_count INT DEFAULT 0,
  accountants_count INT DEFAULT 0,
  documents_uploaded INT DEFAULT 0,
  documents_processed INT DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_firm_period (firm_id, period_start),
  KEY idx_usage_records_firm (firm_id),
  KEY idx_usage_records_period (period_start),
  CONSTRAINT fk_usage_records_firm FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. Usage events - real-time granular tracking
CREATE TABLE IF NOT EXISTS usage_events (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  firm_id VARCHAR(36) NOT NULL,
  event_type ENUM(
    'client_added','client_removed',
    'document_uploaded','document_processed',
    'accountant_added','accountant_removed',
    'storage_added','storage_removed'
  ) NOT NULL,
  entity_id VARCHAR(36) DEFAULT NULL,
  delta_value BIGINT DEFAULT 1,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_usage_events_firm (firm_id),
  KEY idx_usage_events_type (event_type),
  KEY idx_usage_events_created (created_at),
  CONSTRAINT fk_usage_events_firm FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. Seed default plans
INSERT INTO plans (id, name, slug, description, max_clients, max_accountants, max_documents_per_month, max_storage_mb, price_per_client, price_per_document, base_price, billing_cycle, is_active, sort_order) VALUES
(UUID(), 'Free', 'free', 'Get started with basic features', 5, 1, 50, 500, 0.00, 0.0000, 0.00, 'monthly', 1, 1),
(UUID(), 'Starter', 'starter', 'For small accounting firms', 25, 3, 500, 5000, 2.00, 0.0500, 29.00, 'monthly', 1, 2),
(UUID(), 'Professional', 'professional', 'For growing firms with more clients', 100, 10, 2000, 20000, 1.50, 0.0300, 79.00, 'monthly', 1, 3),
(UUID(), 'Enterprise', 'enterprise', 'Unlimited usage for large firms', NULL, NULL, NULL, NULL, 1.00, 0.0100, 199.00, 'monthly', 1, 4);

-- 10. Seed platform settings
INSERT INTO platform_settings (id, setting_key, setting_value, setting_type, category) VALUES
(UUID(), 'platform_name', 'DocqFlow', 'string', 'branding'),
(UUID(), 'platform_description', 'Document Management SaaS for Accounting Firms', 'string', 'branding'),
(UUID(), 'support_email', 'support@docqflow.com', 'string', 'contact'),
(UUID(), 'default_plan', 'free', 'string', 'billing'),
(UUID(), 'allow_self_registration', 'true', 'boolean', 'registration'),
(UUID(), 'require_email_verification', 'false', 'boolean', 'registration'),
(UUID(), 'default_theme', 'default', 'string', 'branding');

-- 11. Create Super Admin user
-- Email: superadmin@docqflow.com
-- Password: DocqFlow@Super2026!
-- Bcrypt hash generated with password_hash('DocqFlow@Super2026!', PASSWORD_DEFAULT)
SET @super_admin_id = UUID();
INSERT INTO users (id, email, password_hash, full_name, email_verified_at)
VALUES (@super_admin_id, 'superadmin@docqflow.com', '$2y$10$HVB.UXmmy2JHyervFLtoZuGawKFqiDyNuRViT71woFr/iqvhQjo5S', 'Super Admin', NOW());

INSERT INTO user_roles (id, user_id, role)
VALUES (UUID(), @super_admin_id, 'super_admin');
