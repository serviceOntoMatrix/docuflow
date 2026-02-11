<?php
/**
 * User Login Endpoint
 * POST /api/auth/login.php
 */

// Suppress any output that might break JSON
ob_start();

// Set headers first to prevent any output before JSON
header('Content-Type: application/json; charset=UTF-8');

try {
    require_once __DIR__ . '/../../config/database.php';
    require_once __DIR__ . '/../../config/cors.php';
    require_once __DIR__ . '/../../helpers/jwt.php';
    
    // Clear any output buffer
    ob_clean();
    
    setCorsHeaders();
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Configuration error: ' . $e->getMessage()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

try {
    // Check if database constants are set
    if (!defined('DB_HOST') || !defined('DB_NAME') || !defined('DB_USER')) {
        throw new Exception('Database configuration not loaded. Please check your .env file.');
    }
    
    $db = getDB();
    
    // Get user
    $stmt = $db->prepare("
        SELECT u.*, ur.role 
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id 
        WHERE u.email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    
    // Check if JWT_EXPIRY is defined
    if (!defined('JWT_EXPIRY')) {
        http_response_code(500);
        echo json_encode(['error' => 'JWT_EXPIRY not configured']);
        exit;
    }
    
    // Generate session token
    $token = generateJWT([
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role']
    ]);
    
    // Store session
    $sessionId = generateUUID();
    $expiresAt = date('Y-m-d H:i:s', time() + JWT_EXPIRY);
    $stmt = $db->prepare("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)");
    $stmt->execute([$sessionId, $user['id'], $token, $expiresAt]);
    
    echo json_encode([
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'phone' => $user['phone'],
            'avatar_url' => $user['avatar_url']
        ],
        'session' => [
            'access_token' => $token,
            'expires_at' => $expiresAt
        ],
        'role' => $user['role']
    ]);
    
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
} catch (Error $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
}
