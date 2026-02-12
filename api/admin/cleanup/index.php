<?php
/**
 * Super Admin - Session & Token Cleanup API
 * POST /api/admin/cleanup/ - Purge expired sessions, tokens, etc.
 */
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../helpers/jwt.php';

setCorsHeaders();
$user = requireSuperAdmin();
$db = getDB();

try {
    $results = [];
    
    // Clean expired sessions
    $stmt = $db->prepare("DELETE FROM sessions WHERE expires_at < NOW()");
    $stmt->execute();
    $results['expired_sessions'] = $stmt->rowCount();
    
    // Clean used invite tokens older than 30 days
    $stmt = $db->prepare("DELETE FROM invite_tokens WHERE used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
    $stmt->execute();
    $results['old_used_invites'] = $stmt->rowCount();
    
    // Clean expired unused invite tokens
    $stmt = $db->prepare("DELETE FROM invite_tokens WHERE used_at IS NULL AND expires_at < NOW()");
    $stmt->execute();
    $results['expired_invites'] = $stmt->rowCount();
    
    // Clean used password reset tokens older than 7 days
    $stmt = $db->prepare("DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");
    $stmt->execute();
    $results['old_reset_tokens'] = $stmt->rowCount();
    
    // Clean expired unused password reset tokens
    $stmt = $db->prepare("DELETE FROM password_reset_tokens WHERE used_at IS NULL AND expires_at < NOW()");
    $stmt->execute();
    $results['expired_reset_tokens'] = $stmt->rowCount();
    
    $totalCleaned = array_sum($results);
    
    logAudit($db, $user['user_id'], 'system_cleanup', 'system', null, $results);
    
    echo json_encode([
        'success' => true,
        'data' => $results,
        'total_cleaned' => $totalCleaned,
        'message' => "Cleaned $totalCleaned records"
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
