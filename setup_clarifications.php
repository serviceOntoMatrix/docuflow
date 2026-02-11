<?php
/**
 * Setup script for clarifications/chat messages table
 * Run this once to create the necessary database table
 */

require_once __DIR__ . '/config/database.php';

echo "<pre>";
echo "Setting up clarifications table...\n\n";

try {
    $pdo = getDB();
    
    // Check if table exists
    $result = $pdo->query("SHOW TABLES LIKE 'chat_messages'");
    $tableExists = $result->rowCount() > 0;
    
    if ($tableExists) {
        echo "✓ chat_messages table already exists.\n";
    } else {
        echo "Creating chat_messages table...\n";
        
        $sql = "CREATE TABLE `chat_messages` (
          `id` varchar(36) NOT NULL,
          `document_id` varchar(36) NOT NULL,
          `sender_id` varchar(36) NOT NULL,
          `sender_role` enum('client', 'firm', 'accountant') NOT NULL,
          `recipient_role` enum('client', 'firm', 'accountant') NOT NULL,
          `message` text NOT NULL,
          `is_read` tinyint(1) DEFAULT 0,
          `read_at` timestamp NULL DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_chat_messages_document_id` (`document_id`),
          KEY `idx_chat_messages_sender_id` (`sender_id`),
          KEY `idx_chat_messages_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $pdo->exec($sql);
        echo "✓ chat_messages table created successfully!\n";
    }
    
    // Verify the table structure
    echo "\nTable structure:\n";
    $columns = $pdo->query("DESCRIBE chat_messages")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    
    echo "\n✓ Setup complete! You can now use the clarifications feature.\n";
    echo "\nYou can delete this file after running it.\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "</pre>";
?>
