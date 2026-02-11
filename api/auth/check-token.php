<?php
/**
 * Check Token Endpoint (for debugging)
 * GET /api/auth/check-token.php?token=xxx
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';

setCorsHeaders();

$token = $_GET['token'] ?? '';

if (empty($token)) {
    echo json_encode(['error' => 'Token parameter required']);
    exit;
}

try {
    $db = getDB();
    
    // Check if table exists
    $stmt = $db->query("SHOW TABLES LIKE 'password_reset_tokens'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo json_encode([
            'error' => 'password_reset_tokens table does not exist',
            'action' => 'Run the database migration: database/password_reset_migration.sql'
        ]);
        exit;
    }
    
    // Find token
    $stmt = $db->prepare("
        SELECT prt.*, u.id as user_id, u.email, u.full_name,
               NOW() as current_time,
               TIMESTAMPDIFF(MINUTE, NOW(), prt.expires_at) as minutes_until_expiry
        FROM password_reset_tokens prt
        LEFT JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ?
    ");
    $stmt->execute([$token]);
    $resetToken = $stmt->fetch();
    
    if (!$resetToken) {
        // Check if any tokens exist
        $stmt = $db->query("SELECT COUNT(*) as count FROM password_reset_tokens");
        $count = $stmt->fetch()['count'];
        
        echo json_encode([
            'found' => false,
            'token_searched' => $token,
            'token_length' => strlen($token),
            'total_tokens_in_db' => $count,
            'message' => 'Token not found in database'
        ]);
        exit;
    }
    
    // Check if expired
    $isExpired = strtotime($resetToken['expires_at']) < time();
    $isUsed = !empty($resetToken['used_at']);
    $isValid = !$isExpired && !$isUsed;
    
    echo json_encode([
        'found' => true,
        'valid' => $isValid,
        'expired' => $isExpired,
        'used' => $isUsed,
        'token' => $resetToken['token'],
        'user_id' => $resetToken['user_id'],
        'user_email' => $resetToken['email'] ?? 'N/A',
        'user_name' => $resetToken['full_name'] ?? 'N/A',
        'created_at' => $resetToken['created_at'],
        'expires_at' => $resetToken['expires_at'],
        'used_at' => $resetToken['used_at'] ?? 'Not used',
        'current_time' => $resetToken['current_time'],
        'minutes_until_expiry' => $resetToken['minutes_until_expiry'],
        'message' => $isValid ? 'Token is valid' : ($isExpired ? 'Token has expired' : 'Token has been used')
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}

