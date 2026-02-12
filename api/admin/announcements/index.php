<?php
/**
 * Super Admin - Announcements API
 * GET    - List announcements
 * POST   - Create announcement
 * PUT    - Update announcement
 * DELETE - Delete announcement
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
            $stmt = $db->query("
                SELECT a.*, u.full_name as created_by_name, u.email as created_by_email
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                ORDER BY a.created_at DESC
            ");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = generateUUID();
            $stmt = $db->prepare("
                INSERT INTO announcements (id, title, message, type, target, is_active, starts_at, ends_at, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $input['title'],
                $input['message'],
                $input['type'] ?? 'info',
                $input['target'] ?? 'all',
                $input['is_active'] ?? 1,
                $input['starts_at'] ?? null,
                $input['ends_at'] ?? null,
                $user['user_id'],
            ]);
            logAudit($db, $user['user_id'], 'announcement_created', 'announcement', $id, ['title' => $input['title']]);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $_GET['id'] ?? $input['id'] ?? null;
            if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }
            
            $updates = []; $params = [];
            foreach (['title', 'message', 'type', 'target', 'starts_at', 'ends_at'] as $f) {
                if (isset($input[$f])) { $updates[] = "$f = ?"; $params[] = $input[$f]; }
            }
            if (array_key_exists('is_active', $input)) { $updates[] = "is_active = ?"; $params[] = $input['is_active'] ? 1 : 0; }
            
            if (count($updates) > 0) {
                $params[] = $id;
                $stmt = $db->prepare("UPDATE announcements SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
            }
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }
            $db->prepare("DELETE FROM announcements WHERE id = ?")->execute([$id]);
            logAudit($db, $user['user_id'], 'announcement_deleted', 'announcement', $id, null);
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
