<?php
/**
 * Super Admin - Plans Management API
 * GET  /api/admin/plans/ - List all plans
 * POST /api/admin/plans/ - Create a plan
 * PUT  /api/admin/plans/?id=X - Update a plan
 * DELETE /api/admin/plans/?id=X - Delete a plan
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
                SELECT p.*, 
                       (SELECT COUNT(*) FROM firms f WHERE f.plan = p.slug) as firms_count
                FROM plans p
                ORDER BY p.sort_order ASC, p.created_at ASC
            ");
            $plans = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $plans]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            $id = generateUUID();
            $stmt = $db->prepare("
                INSERT INTO plans (id, name, slug, description, max_clients, max_accountants, max_documents_per_month, max_storage_mb, price_per_client, price_per_document, base_price, billing_cycle, is_active, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $input['name'],
                $input['slug'],
                $input['description'] ?? null,
                $input['max_clients'] ?? null,
                $input['max_accountants'] ?? null,
                $input['max_documents_per_month'] ?? null,
                $input['max_storage_mb'] ?? null,
                $input['price_per_client'] ?? 0,
                $input['price_per_document'] ?? 0,
                $input['base_price'] ?? 0,
                $input['billing_cycle'] ?? 'monthly',
                $input['is_active'] ?? 1,
                $input['sort_order'] ?? 0,
            ]);
            
            logAudit($db, $user['user_id'], 'plan_created', 'plan', $id, ['name' => $input['name']]);
            
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $planId = $_GET['id'] ?? $input['id'] ?? null;
            
            if (!$planId) {
                http_response_code(400);
                echo json_encode(['error' => 'Plan ID required']);
                exit;
            }
            
            $updates = [];
            $params = [];
            $fields = ['name', 'slug', 'description', 'max_clients', 'max_accountants', 'max_documents_per_month', 'max_storage_mb', 'price_per_client', 'price_per_document', 'base_price', 'billing_cycle', 'is_active', 'sort_order'];
            
            foreach ($fields as $field) {
                if (array_key_exists($field, $input)) {
                    $updates[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (count($updates) > 0) {
                $params[] = $planId;
                $stmt = $db->prepare("UPDATE plans SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
                logAudit($db, $user['user_id'], 'plan_updated', 'plan', $planId, $input);
            }
            
            echo json_encode(['success' => true, 'data' => ['id' => $planId]]);
            break;
            
        case 'DELETE':
            $planId = $_GET['id'] ?? null;
            if (!$planId) {
                http_response_code(400);
                echo json_encode(['error' => 'Plan ID required']);
                exit;
            }
            
            $stmt = $db->prepare("DELETE FROM plans WHERE id = ?");
            $stmt->execute([$planId]);
            logAudit($db, $user['user_id'], 'plan_deleted', 'plan', $planId, null);
            
            echo json_encode(['success' => true, 'data' => ['deleted' => true]]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
