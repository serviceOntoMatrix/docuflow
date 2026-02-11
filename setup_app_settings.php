<?php
/**
 * Setup App Settings Migration
 * Run this script to add the app_settings table for white-label customization
 */

require_once 'config/database.php';

try {
    $db = getDB();

    echo "Setting up app_settings table...\n";

    // Create the app_settings table
    $sql = "
    CREATE TABLE IF NOT EXISTS app_settings (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        firm_id VARCHAR(36) NULL,
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
    ";

    $db->exec($sql);
    echo "✓ Created app_settings table\n";

    // Create indexes
    $db->exec("CREATE INDEX IF NOT EXISTS idx_app_settings_firm_id ON app_settings(firm_id);");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);");
    echo "✓ Created indexes\n";

    // Insert default settings for all existing firms
    $firms = $db->query("SELECT id, name FROM firms")->fetchAll(PDO::FETCH_ASSOC);

    if (count($firms) > 0) {
        echo "Inserting default settings for " . count($firms) . " firms...\n";

        foreach ($firms as $firm) {
            $settings = [
                ['app_name', 'DocqFlow', 'string', 'branding', true],
                ['app_description', 'Streamline Your Document Workflow', 'string', 'branding', true],
                ['company_name', $firm['name'], 'string', 'branding', true],
                ['support_email', strtolower(str_replace(' ', '', $firm['name'])) . '@example.com', 'string', 'contact', true],
                ['hero_title', 'Streamline Your Document Workflow', 'string', 'content', true],
                ['hero_subtitle', 'Connect your clients with your accounting team through a simple, secure document management platform.', 'text', 'content', true],
                ['features_json', '[{"title": "Easy Document Upload", "description": "Clients can snap photos or upload documents directly from their mobile device", "icon": "FileUp"}, {"title": "Team Management", "description": "Firms can assign clients to accountants and track all document workflows", "icon": "Users"}, {"title": "Real-time Notifications", "description": "Stay updated with instant alerts when documents are uploaded or require action", "icon": "Bell"}, {"title": "Secure & Compliant", "description": "Bank-level security ensures your sensitive financial documents are protected", "icon": "Shield"}]', 'json', 'content', true],
                ['email_from_name', $firm['name'], 'string', 'email', false],
                ['email_signature', "Best regards,\nThe " . $firm['name'] . " Team", 'text', 'email', false],
                ['smtp_enabled', 'true', 'boolean', 'email', false]
            ];

            foreach ($settings as $setting) {
                $stmt = $db->prepare("
                    INSERT IGNORE INTO app_settings
                    (firm_id, setting_key, setting_value, setting_type, category, is_public)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$firm['id'], $setting[0], $setting[1], $setting[2], $setting[3], $setting[4]]);
            }
        }
        echo "✓ Inserted default settings for all firms\n";
    }

    // Insert global settings for the landing page (firm_id = NULL)
    $globalSettings = [
        ['app_name', 'DocqFlow', 'string', 'branding', true],
        ['app_description', 'Streamline Your Document Workflow', 'string', 'branding', true],
        ['company_name', 'DocqFlow', 'string', 'branding', true],
        ['hero_title', 'Streamline Your Document Workflow', 'string', 'content', true],
        ['hero_subtitle', 'Connect your clients with your accounting team through a simple, secure document management platform.', 'text', 'content', true],
        ['features_json', '[{"title": "Easy Document Upload", "description": "Clients can snap photos or upload documents directly from their mobile device", "icon": "FileUp"}, {"title": "Team Management", "description": "Firms can assign clients to accountants and track all document workflows", "icon": "Users"}, {"title": "Real-time Notifications", "description": "Stay updated with instant alerts when documents are uploaded or require action", "icon": "Bell"}, {"title": "Secure & Compliant", "description": "Bank-level security ensures your sensitive financial documents are protected", "icon": "Shield"}]', 'json', 'content', true]
    ];

    foreach ($globalSettings as $setting) {
        $stmt = $db->prepare("
            INSERT IGNORE INTO app_settings
            (firm_id, setting_key, setting_value, setting_type, category, is_public)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([null, $setting[0], $setting[1], $setting[2], $setting[3], $setting[4]]);
    }

    echo "✓ Inserted global settings\n";
    echo "✅ App settings setup completed successfully!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>