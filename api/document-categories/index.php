<?php
/**
 * Document Categories API
 * GET    - List categories for user's firm
 * POST   - Create category (firm owner only)
 * PUT    - Update category
 * DELETE - Delete category
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();
$user = requireAuth();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Determine firm_id from user
$firmId = $_GET['firm_id'] ?? null;
if (!$firmId) {
    // Try to find firm from user
    $stmt = $db->prepare("SELECT id FROM firms WHERE owner_id = ?");
    $stmt->execute([$user['user_id']]);
    $firm = $stmt->fetch();
    if ($firm) $firmId = $firm['id'];
    else {
        $stmt = $db->prepare("SELECT firm_id FROM firm_accountants WHERE accountant_id = ?");
        $stmt->execute([$user['user_id']]);
        $fa = $stmt->fetch();
        if ($fa) $firmId = $fa['firm_id'];
        else {
            $stmt = $db->prepare("SELECT firm_id FROM clients WHERE user_id = ?");
            $stmt->execute([$user['user_id']]);
            $cl = $stmt->fetch();
            if ($cl) $firmId = $cl['firm_id'];
        }
    }
}

if (!$firmId) {
    http_response_code(400);
    echo json_encode(['error' => 'Could not determine firm']);
    exit;
}

try {
    switch ($method) {
        case 'GET':
            $stmt = $db->prepare("SELECT * FROM document_categories WHERE firm_id = ? ORDER BY sort_order, name");
            $stmt->execute([$firmId]);
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = generateUUID();
            $stmt = $db->prepare("INSERT INTO document_categories (id, firm_id, name, color, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $firmId, $input['name'], $input['color'] ?? '#3b82f6', $input['sort_order'] ?? 0]);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $catId = $_GET['id'] ?? $input['id'] ?? null;
            if (!$catId) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }
            $updates = []; $params = [];
            if (isset($input['name'])) { $updates[] = "name = ?"; $params[] = $input['name']; }
            if (isset($input['color'])) { $updates[] = "color = ?"; $params[] = $input['color']; }
            if (isset($input['sort_order'])) { $updates[] = "sort_order = ?"; $params[] = $input['sort_order']; }
            if (count($updates) > 0) {
                $params[] = $catId; $params[] = $firmId;
                $stmt = $db->prepare("UPDATE document_categories SET " . implode(', ', $updates) . " WHERE id = ? AND firm_id = ?");
                $stmt->execute($params);
            }
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $catId = $_GET['id'] ?? null;
            if (!$catId) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }
            $db->prepare("UPDATE documents SET category_id = NULL WHERE category_id = ?")->execute([$catId]);
            $db->prepare("DELETE FROM document_categories WHERE id = ? AND firm_id = ?")->execute([$catId, $firmId]);
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
