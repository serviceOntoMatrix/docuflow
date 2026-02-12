<?php
/**
 * Invite Tokens API Endpoint
 * GET, POST, PUT /api/invites/index.php
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';
require_once __DIR__ . '/../../helpers/email.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

try {
    switch ($method) {
        case 'GET':
            $token = $_GET['token'] ?? null;
            
            if ($token) {
                // Public: validate token
                $stmt = $db->prepare("
                    SELECT it.*, f.name as firm_name, f.owner_id as firm_owner_id
                    FROM invite_tokens it
                    JOIN firms f ON it.firm_id = f.id
                    WHERE it.token = ? AND it.used_at IS NULL AND it.expires_at > NOW()
                ");
                $stmt->execute([$token]);
                $invite = $stmt->fetch();
                
                if (!$invite) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Invalid or expired invite']);
                    exit;
                }
                
                echo json_encode(['data' => $invite]);
            } else {
                // Protected: list invites for firm
                $user = requireAuth();
                
                $stmt = $db->prepare("
                    SELECT it.* FROM invite_tokens it
                    JOIN firms f ON it.firm_id = f.id
                    WHERE f.owner_id = ?
                    ORDER BY it.created_at DESC
                ");
                $stmt->execute([$user['user_id']]);
                $invites = $stmt->fetchAll();
                
                echo json_encode(['data' => $invites]);
            }
            break;
            
        case 'POST':
            $user = requireAuth();
            $input = json_decode(file_get_contents('php://input'), true);
            
            // SECURITY: Verify user owns the firm they're creating invites for
            $authStmt = $db->prepare("SELECT id FROM firms WHERE id = ? AND owner_id = ?");
            $authStmt->execute([$input['firm_id'], $user['user_id']]);
            $isSuperAdmin = isset($user['role']) && $user['role'] === 'super_admin';
            if (!$authStmt->fetch() && !$isSuperAdmin) {
                http_response_code(403);
                echo json_encode(['error' => 'You can only create invites for your own firm']);
                exit;
            }
            
            $inviteId = generateUUID();
            $token = generateUUID();
            $expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));
            
            $stmt = $db->prepare("
                INSERT INTO invite_tokens (id, token, firm_id, email, role, created_by, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $inviteId,
                $token,
                $input['firm_id'],
                $input['email'],
                $input['role'],
                $user['user_id'],
                $expiresAt
            ]);
            
            // Get firm name for email
            $firmStmt = $db->prepare("SELECT name FROM firms WHERE id = ?");
            $firmStmt->execute([$input['firm_id']]);
            $firm = $firmStmt->fetch();
            $firmName = $firm ? $firm['name'] : '';
            
            // Generate invite link
            $frontendUrl = defined('FRONTEND_URL') ? FRONTEND_URL : env('FRONTEND_URL');
            if (!$frontendUrl) {
                error_log("Error: FRONTEND_URL not set in .env file");
                http_response_code(500);
                echo json_encode(['error' => 'Frontend URL not configured']);
                exit;
            }
            $inviteLink = rtrim($frontendUrl, '/') . '/invite?token=' . $token;
            
            // Send invite email
            $emailSent = sendInviteEmail(
                $input['email'],
                $inviteLink,
                $input['role'],
                $firmName,
                $input['firm_id']
            );
            
            if (!$emailSent) {
                error_log("Failed to send invite email to: " . $input['email']);
            }
            
            echo json_encode([
                'data' => [
                    'id' => $inviteId,
                    'token' => $token,
                    'expires_at' => $expiresAt
                ]
            ]);
            break;
            
        case 'PUT':
            // Mark token as used
            $user = requireAuth();
            $input = json_decode(file_get_contents('php://input'), true);
            $token = $_GET['token'] ?? $input['token'] ?? null;
            
            if (!$token) {
                http_response_code(400);
                echo json_encode(['error' => 'Token required']);
                exit;
            }
            
            $stmt = $db->prepare("
                UPDATE invite_tokens SET used_at = NOW()
                WHERE token = ? AND used_at IS NULL AND expires_at > NOW()
            ");
            $stmt->execute([$token]);
            
            echo json_encode(['data' => ['used' => true]]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
