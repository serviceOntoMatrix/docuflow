-- ============================================================
-- DocqFlow Migration 002: Per-Firm Custom Pricing + Announcements
-- ============================================================

-- 1. Add custom pricing override columns to firms
-- When set, these override the plan defaults for that specific firm
ALTER TABLE firms
  ADD COLUMN custom_base_price DECIMAL(10,2) DEFAULT NULL AFTER notes,
  ADD COLUMN custom_price_per_client DECIMAL(10,2) DEFAULT NULL AFTER custom_base_price,
  ADD COLUMN custom_price_per_document DECIMAL(10,4) DEFAULT NULL AFTER custom_price_per_client,
  ADD COLUMN billing_notes TEXT DEFAULT NULL AFTER custom_price_per_document,
  ADD COLUMN last_billed_at TIMESTAMP NULL DEFAULT NULL AFTER billing_notes,
  ADD COLUMN billing_status ENUM('active','overdue','exempt','trial') DEFAULT 'active' AFTER last_billed_at,
  ADD COLUMN trial_ends_at TIMESTAMP NULL DEFAULT NULL AFTER billing_status;

-- 2. Announcements table for super admin to broadcast to firms
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','warning','critical','maintenance') DEFAULT 'info',
  target ENUM('all','firms','accountants','clients') DEFAULT 'all',
  is_active TINYINT(1) DEFAULT 1,
  starts_at TIMESTAMP NULL DEFAULT NULL,
  ends_at TIMESTAMP NULL DEFAULT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_announcements_active (is_active, starts_at, ends_at),
  CONSTRAINT fk_announcements_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Billing history / invoice snapshots
CREATE TABLE IF NOT EXISTS billing_records (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  firm_id VARCHAR(36) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  plan_slug VARCHAR(50) DEFAULT 'free',
  base_price DECIMAL(10,2) DEFAULT 0.00,
  clients_count INT DEFAULT 0,
  price_per_client DECIMAL(10,2) DEFAULT 0.00,
  client_charge DECIMAL(10,2) DEFAULT 0.00,
  documents_count INT DEFAULT 0,
  price_per_document DECIMAL(10,4) DEFAULT 0.0000,
  document_charge DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('draft','invoiced','paid','overdue','waived') DEFAULT 'draft',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_firm_period_billing (firm_id, period_start),
  KEY idx_billing_firm (firm_id),
  KEY idx_billing_status (status),
  CONSTRAINT fk_billing_firm FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
