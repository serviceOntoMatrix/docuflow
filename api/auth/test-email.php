<?php
/**
 * Test Email Endpoint
 * POST /api/auth/test-email.php
 * Use this to test your SMTP configuration
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/email.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$testEmail = trim($input['email'] ?? '');

if (empty($testEmail) || !filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid email address is required']);
    exit;
}

// Check SMTP configuration
$smtpConfigured = defined('SMTP_ENABLED') && SMTP_ENABLED && 
                  defined('SMTP_HOST') && !empty(SMTP_HOST) &&
                  defined('SMTP_USER') && !empty(SMTP_USER) &&
                  defined('SMTP_PASS') && !empty(SMTP_PASS);

if (!$smtpConfigured) {
    echo json_encode([
        'error' => 'SMTP not configured',
        'config' => [
            'SMTP_ENABLED' => defined('SMTP_ENABLED') ? SMTP_ENABLED : 'not defined',
            'SMTP_HOST' => defined('SMTP_HOST') ? SMTP_HOST : 'not defined',
            'SMTP_USER' => defined('SMTP_USER') ? (empty(SMTP_USER) ? 'empty' : 'set') : 'not defined',
            'SMTP_PASS' => defined('SMTP_PASS') ? (empty(SMTP_PASS) ? 'empty' : 'set') : 'not defined',
        ]
    ]);
    exit;
}

// Generate a test reset link
require_once __DIR__ . '/../../helpers/env.php';
$frontendUrl = defined('FRONTEND_URL') ? FRONTEND_URL : env('FRONTEND_URL');
if (!$frontendUrl) {
    http_response_code(500);
    echo json_encode(['error' => 'FRONTEND_URL not set in .env file']);
    exit;
}
$testLink = rtrim($frontendUrl, '/') . '/reset-password?token=test-token-123';

// Send test email
$result = sendPasswordResetEmail($testEmail, $testLink, 'Test User');

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Test email sent successfully!',
        'config' => [
            'SMTP_HOST' => SMTP_HOST,
            'SMTP_PORT' => defined('SMTP_PORT') ? SMTP_PORT : 587,
            'SMTP_USER' => SMTP_USER,
            'SMTP_FROM_EMAIL' => defined('SMTP_FROM_EMAIL') ? SMTP_FROM_EMAIL : 'not set',
        ],
        'note' => 'Check your inbox (and spam folder) for the test email.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send test email. Check PHP error logs for details.',
        'config' => [
            'SMTP_HOST' => SMTP_HOST,
            'SMTP_PORT' => defined('SMTP_PORT') ? SMTP_PORT : 587,
            'SMTP_USER' => SMTP_USER,
            'SMTP_FROM_EMAIL' => defined('SMTP_FROM_EMAIL') ? SMTP_FROM_EMAIL : 'not set',
        ],
        'tip' => 'Check C:\\xampp\\php\\logs\\php_error_log for detailed error messages'
    ]);
}

