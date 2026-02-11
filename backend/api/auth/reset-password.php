<?php
/**
 * Reset Password Endpoint
 * POST /api/auth/reset-password.php
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$token = trim($input['token'] ?? '');
$newPassword = $input['password'] ?? '';

if (empty($token)) {
    http_response_code(400);
    echo json_encode(['error' => 'Reset token is required']);
    exit;
}

if (empty($newPassword) || strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit;
}

try {
    $db = getDB();
    
    // Find valid reset token
    $stmt = $db->prepare("
        SELECT prt.*, u.id as user_id, u.email
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? 
        AND prt.used_at IS NULL 
        AND prt.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $resetToken = $stmt->fetch();
    
    if (!$resetToken) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset token']);
        exit;
    }
    
    // Hash new password
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update user password
    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$passwordHash, $resetToken['user_id']]);
    
    // Mark token as used
    $stmt = $db->prepare("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?");
    $stmt->execute([$resetToken['id']]);
    
    // Invalidate all existing sessions for this user (force re-login)
    $stmt = $db->prepare("DELETE FROM sessions WHERE user_id = ?");
    $stmt->execute([$resetToken['user_id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Password has been reset successfully. Please sign in with your new password.'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to reset password: ' . $e->getMessage()]);
}

