<?php
/**
 * Super Admin - Platform Settings API
 * GET  /api/admin/settings/ - Get all platform settings
 * POST /api/admin/settings/ - Update platform settings
 */

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../helpers/jwt.php';

setCorsHeaders();
$user = requireSuperAdmin();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $db->query("SELECT * FROM platform_settings ORDER BY category, setting_key");
            $settings = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $settings]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !is_array($input)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid data']);
                exit;
            }
            
            $db->beginTransaction();
            
            foreach ($input as $key => $value) {
                $stmt = $db->prepare("SELECT id FROM platform_settings WHERE setting_key = ?");
                $stmt->execute([$key]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    $stmt = $db->prepare("UPDATE platform_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?");
                    $stmt->execute([$value, $user['user_id'], $key]);
                } else {
                    $stmt = $db->prepare("INSERT INTO platform_settings (id, setting_key, setting_value, updated_by) VALUES (?, ?, ?, ?)");
                    $stmt->execute([generateUUID(), $key, $value, $user['user_id']]);
                }
            }
            
            $db->commit();
            
            logAudit($db, $user['user_id'], 'platform_settings_updated', 'settings', null, array_keys($input));
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
