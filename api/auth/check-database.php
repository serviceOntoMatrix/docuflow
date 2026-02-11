<?php
/**
 * Database Check Endpoint
 * GET /api/auth/check-database.php
 * Checks if password_reset_tokens table exists and shows recent tokens
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';

setCorsHeaders();

try {
    $db = getDB();
    
    // Check if table exists
    $stmt = $db->query("SHOW TABLES LIKE 'password_reset_tokens'");
    $tableExists = $stmt->rowCount() > 0;
    
    $result = [
        'database_connected' => true,
        'table_exists' => $tableExists,
    ];
    
    if ($tableExists) {
        // Get table structure
        $stmt = $db->query("DESCRIBE password_reset_tokens");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result['table_structure'] = $columns;
        
        // Get recent tokens (last 5)
        $stmt = $db->query("
            SELECT prt.*, u.email, u.full_name,
                   NOW() as current_time,
                   TIMESTAMPDIFF(MINUTE, NOW(), prt.expires_at) as minutes_until_expiry
            FROM password_reset_tokens prt
            LEFT JOIN users u ON prt.user_id = u.id
            ORDER BY prt.created_at DESC
            LIMIT 5
        ");
        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result['recent_tokens'] = $tokens;
        $result['token_count'] = count($tokens);
    } else {
        $result['message'] = 'Table does not exist. Run the migration: database/password_reset_migration.sql';
        $result['migration_sql'] = file_get_contents(__DIR__ . '/../../database/password_reset_migration.sql');
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage(),
        'database_connected' => false
    ], JSON_PRETTY_PRINT);
}

