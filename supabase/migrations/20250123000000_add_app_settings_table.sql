-- Add app_settings table for white-label customization
-- Each firm can have their own custom settings

CREATE TABLE IF NOT EXISTS app_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    firm_id VARCHAR(36) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'text', 'json', 'boolean', 'number') DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_firm_setting (firm_id, setting_key)
);

-- Create index for better performance
CREATE INDEX idx_app_settings_firm_id ON app_settings(firm_id);
CREATE INDEX idx_app_settings_category ON app_settings(category);

-- Insert default settings for all existing firms
INSERT INTO app_settings (firm_id, setting_key, setting_value, setting_type, category, is_public)
SELECT
    f.id as firm_id,
    'app_name' as setting_key,
    'DocqFlow' as setting_value,
    'string' as setting_type,
    'branding' as category,
    TRUE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'app_description' as setting_key,
    'Streamline Your Document Workflow' as setting_value,
    'string' as setting_type,
    'branding' as category,
    TRUE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'company_name' as setting_key,
    f.name as setting_value,
    'string' as setting_type,
    'branding' as category,
    TRUE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'support_email' as setting_key,
    CONCAT(LOWER(REPLACE(f.name, ' ', '')), '@example.com') as setting_value,
    'string' as setting_type,
    'contact' as category,
    TRUE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'hero_title' as setting_key,
    'Streamline Your Document Workflow' as setting_value,
    'string' as setting_type,
    'content' as category,
    TRUE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'hero_subtitle' as setting_key,
    'Connect your clients with your accounting team through a simple, secure document management platform.' as setting_value,
    'text' as setting_type,
    'content' as category,
    TRUE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'features_json' as setting_key,
    '[{"title": "Easy Document Upload", "description": "Clients can snap photos or upload documents directly from their mobile device", "icon": "FileUp"}, {"title": "Team Management", "description": "Firms can assign clients to accountants and track all document workflows", "icon": "Users"}, {"title": "Real-time Notifications", "description": "Stay updated with instant alerts when documents are uploaded or require action", "icon": "Bell"}, {"title": "Secure & Compliant", "description": "Bank-level security ensures your sensitive financial documents are protected", "icon": "Shield"}]' as setting_value,
    'json' as setting_type,
    'content' as category,
    TRUE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'email_from_name' as setting_key,
    f.name as setting_value,
    'string' as setting_type,
    'email' as category,
    FALSE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'email_signature' as setting_key,
    CONCAT('Best regards,\nThe ', f.name, ' Team') as setting_value,
    'text' as setting_type,
    'email' as category,
    FALSE as is_public
FROM firms f
UNION ALL
SELECT
    f.id as firm_id,
    'smtp_enabled' as setting_key,
    'true' as setting_value,
    'boolean' as setting_type,
    'email' as category,
    FALSE as is_public
FROM firms f;

-- Also add a global settings record for the default landing page (firm_id = NULL represents global)
INSERT INTO app_settings (firm_id, setting_key, setting_value, setting_type, category, is_public) VALUES
(NULL, 'app_name', 'DocqFlow', 'string', 'branding', TRUE),
(NULL, 'app_description', 'Streamline Your Document Workflow', 'string', 'branding', TRUE),
(NULL, 'company_name', 'DocqFlow', 'string', 'branding', TRUE),
(NULL, 'hero_title', 'Streamline Your Document Workflow', 'string', 'content', TRUE),
(NULL, 'hero_subtitle', 'Connect your clients with your accounting team through a simple, secure document management platform.', 'text', 'content', TRUE),
(NULL, 'features_json', '[{"title": "Easy Document Upload", "description": "Clients can snap photos or upload documents directly from their mobile device", "icon": "FileUp"}, {"title": "Team Management", "description": "Firms can assign clients to accountants and track all document workflows", "icon": "Users"}, {"title": "Real-time Notifications", "description": "Stay updated with instant alerts when documents are uploaded or require action", "icon": "Bell"}, {"title": "Secure & Compliant", "description": "Bank-level security ensures your sensitive financial documents are protected", "icon": "Shield"}]', 'json', 'content', TRUE);