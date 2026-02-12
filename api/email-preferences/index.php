<?php
/**
 * Email Notification Preferences API
 * GET  - Get current user's preferences
 * POST - Update current user's preferences
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();
$user = requireAuth();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$userId = $user['user_id'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $db->prepare("SELECT * FROM email_preferences WHERE user_id = ?");
            $stmt->execute([$userId]);
            $prefs = $stmt->fetch();
            
            if (!$prefs) {
                // Return defaults
                $prefs = [
                    'notify_document_uploaded' => 1,
                    'notify_document_status_changed' => 1,
                    'notify_clarification_received' => 1,
                    'notify_clarification_reply' => 1,
                    'notify_reminder' => 1,
                    'notify_new_client_joined' => 1,
                    'notify_new_accountant_joined' => 1,
                    'notify_invitation_received' => 1,
                    'notify_document_posted' => 1,
                    'notify_system_announcements' => 1,
                    'email_frequency' => 'instant',
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $prefs]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            $fields = [
                'notify_document_uploaded', 'notify_document_status_changed',
                'notify_clarification_received', 'notify_clarification_reply',
                'notify_reminder', 'notify_new_client_joined',
                'notify_new_accountant_joined', 'notify_invitation_received',
                'notify_document_posted', 'notify_system_announcements',
            ];
            
            // Check if record exists
            $stmt = $db->prepare("SELECT id FROM email_preferences WHERE user_id = ?");
            $stmt->execute([$userId]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                $updates = [];
                $params = [];
                foreach ($fields as $f) {
                    if (array_key_exists($f, $input)) {
                        $updates[] = "$f = ?";
                        $params[] = $input[$f] ? 1 : 0;
                    }
                }
                if (isset($input['email_frequency'])) {
                    $updates[] = "email_frequency = ?";
                    $params[] = $input['email_frequency'];
                }
                if (count($updates) > 0) {
                    $params[] = $userId;
                    $stmt = $db->prepare("UPDATE email_preferences SET " . implode(', ', $updates) . " WHERE user_id = ?");
                    $stmt->execute($params);
                }
            } else {
                $cols = ['id', 'user_id'];
                $vals = [generateUUID(), $userId];
                $placeholders = ['?', '?'];
                
                foreach ($fields as $f) {
                    $cols[] = $f;
                    $vals[] = isset($input[$f]) ? ($input[$f] ? 1 : 0) : 1;
                    $placeholders[] = '?';
                }
                $cols[] = 'email_frequency';
                $vals[] = $input['email_frequency'] ?? 'instant';
                $placeholders[] = '?';
                
                $stmt = $db->prepare("INSERT INTO email_preferences (" . implode(',', $cols) . ") VALUES (" . implode(',', $placeholders) . ")");
                $stmt->execute($vals);
            }
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
