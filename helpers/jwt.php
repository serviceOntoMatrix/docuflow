<?php
/**
 * Simple JWT Helper Functions
 */

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    
    $base64Header = base64UrlEncode($header);
    $base64Payload = base64UrlEncode(json_encode($payload));
    
    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $base64Signature = base64UrlEncode($signature);
    
    return "$base64Header.$base64Payload.$base64Signature";
}

function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    [$base64Header, $base64Payload, $base64Signature] = $parts;
    
    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $expectedSignature = base64UrlEncode($signature);
    
    if (!hash_equals($expectedSignature, $base64Signature)) {
        return false;
    }
    
    $payload = json_decode(base64UrlDecode($base64Payload), true);
    
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

function getAuthUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    $payload = verifyJWT($token);
    
    if (!$payload || !isset($payload['user_id'])) {
        return null;
    }
    
    return $payload;
}

function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    return $user;
}

/**
 * Require super_admin role. Returns the user payload or exits with 403.
 */
function requireSuperAdmin() {
    $user = requireAuth();
    if (!isset($user['role']) || $user['role'] !== 'super_admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Super Admin access required']);
        exit;
    }
    return $user;
}

/**
 * Check if the current user is a firm member (owner or accountant).
 * Returns true if the user belongs to the firm, false otherwise.
 * Super admins always return true.
 */
function isUserInFirm($db, $userId, $firmId, $userRole = null) {
    if ($userRole === 'super_admin') return true;
    
    $stmt = $db->prepare("
        SELECT id FROM firms WHERE id = ? AND owner_id = ?
        UNION
        SELECT firm_id FROM firm_accountants WHERE firm_id = ? AND accountant_id = ?
        UNION
        SELECT firm_id FROM clients WHERE firm_id = ? AND user_id = ?
    ");
    $stmt->execute([$firmId, $userId, $firmId, $userId, $firmId, $userId]);
    return (bool)$stmt->fetch();
}

/**
 * Log an audit event.
 */
function logAudit($db, $userId, $action, $entityType = null, $entityId = null, $details = null) {
    try {
        $stmt = $db->prepare("
            INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            generateUUID(),
            $userId,
            $action,
            $entityType,
            $entityId,
            $details ? json_encode($details) : null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    } catch (Exception $e) {
        error_log('Audit log failed: ' . $e->getMessage());
    }
}

/**
 * Record a usage event for a firm.
 */
function trackUsage($db, $firmId, $eventType, $entityId = null, $deltaValue = 1, $metadata = null) {
    try {
        $stmt = $db->prepare("
            INSERT INTO usage_events (id, firm_id, event_type, entity_id, delta_value, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            generateUUID(),
            $firmId,
            $eventType,
            $entityId,
            $deltaValue,
            $metadata ? json_encode($metadata) : null
        ]);
    } catch (Exception $e) {
        error_log('Usage tracking failed: ' . $e->getMessage());
    }
}

function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
