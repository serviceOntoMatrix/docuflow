<?php
/**
 * Forgot Password Endpoint
 * POST /api/auth/forgot-password.php
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';
require_once __DIR__ . '/../../helpers/email.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid email address is required']);
    exit;
}

try {
    $db = getDB();
    
    // Check if user exists
    $stmt = $db->prepare("SELECT id, email, full_name FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    // Always return success to prevent email enumeration
    // But only send email if user exists
    if ($user) {
        // Invalidate any existing reset tokens for this user
        $stmt = $db->prepare("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL");
        $stmt->execute([$user['id']]);
        
        // Generate new reset token
        $tokenId = generateUUID();
        $token = generateUUID();
        // Use DATE_ADD with NOW() to ensure consistent timezone handling
        // Set expiry to 1 hour from now
        $stmt = $db->prepare("
            INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
            VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
        ");
        $stmt->execute([$tokenId, $user['id'], $token]);
        
        // Generate reset link
        // Get the frontend URL from config
        require_once __DIR__ . '/../../helpers/env.php';
        $frontendUrl = defined('FRONTEND_URL') ? FRONTEND_URL : env('FRONTEND_URL');
        if (!$frontendUrl) {
            error_log("Error: FRONTEND_URL not set in .env file");
            // Still return success to prevent email enumeration, but log error
        }
        $resetLink = $frontendUrl ? rtrim($frontendUrl, '/') . '/reset-password?token=' . $token : '';

        // Get user's firm ID
        $firmId = null;
        $firmStmt = $db->prepare("
            SELECT f.id FROM firms f
            INNER JOIN clients c ON f.id = c.firm_id
            WHERE c.user_id = ?
            UNION
            SELECT f.id FROM firms f
            INNER JOIN firm_accountants fa ON f.id = fa.firm_id
            WHERE fa.accountant_id = ?
            UNION
            SELECT id FROM firms WHERE owner_id = ?
        ");
        $firmStmt->execute([$user['id'], $user['id'], $user['id']]);
        $firm = $firmStmt->fetch(PDO::FETCH_ASSOC);
        if ($firm) {
            $firmId = $firm['id'];
        }

        // Send email
        $emailSent = sendPasswordResetEmail($user['email'], $resetLink, $user['full_name'], $firmId);
        
        // Log email sending result for debugging
        if (!$emailSent) {
            error_log("Failed to send password reset email to: " . $user['email']);
        } else {
            error_log("Password reset email sent successfully to: " . $user['email']);
        }
    }
    
    // Always return success message (security best practice)
    echo json_encode([
        'success' => true,
        'message' => 'If an account with that email exists, a password reset link has been sent.'
    ]);
    
} catch (Exception $e) {
    // Still return success to prevent email enumeration
    error_log('Password reset error: ' . $e->getMessage());
    echo json_encode([
        'success' => true,
        'message' => 'If an account with that email exists, a password reset link has been sent.'
    ]);
}

