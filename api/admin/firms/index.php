<?php
/**
 * Super Admin - Firms Management API
 * GET    /api/admin/firms/ - List all firms (with filters, pagination)
 * PUT    /api/admin/firms/?id=X - Update firm (suspend, change plan, etc.)
 * DELETE /api/admin/firms/?id=X - Delete firm
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
            $firmId = $_GET['id'] ?? null;
            
            if ($firmId) {
                // Single firm detail
                $stmt = $db->prepare("
                    SELECT f.*,
                           u.email as owner_email, u.full_name as owner_name,
                           (SELECT COUNT(*) FROM clients c WHERE c.firm_id = f.id) as clients_count,
                           (SELECT COUNT(*) FROM firm_accountants fa WHERE fa.firm_id = f.id) as accountants_count,
                           (SELECT COUNT(*) FROM documents d JOIN clients c2 ON d.client_id = c2.id WHERE c2.firm_id = f.id) as documents_count,
                           (SELECT COALESCE(SUM(d2.file_size), 0) FROM documents d2 JOIN clients c3 ON d2.client_id = c3.id WHERE c3.firm_id = f.id) as storage_bytes
                    FROM firms f
                    JOIN users u ON f.owner_id = u.id
                    WHERE f.id = ?
                ");
                $stmt->execute([$firmId]);
                $firm = $stmt->fetch();
                
                if (!$firm) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Firm not found']);
                    exit;
                }
                
                echo json_encode(['success' => true, 'data' => $firm]);
            } else {
                // List all firms with filters
                $search = $_GET['search'] ?? '';
                $status = $_GET['status'] ?? '';
                $plan = $_GET['plan'] ?? '';
                $page = max(1, (int)($_GET['page'] ?? 1));
                $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
                $offset = ($page - 1) * $perPage;
                
                $where = [];
                $params = [];
                
                if ($search) {
                    $where[] = "(f.name LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                if ($status) {
                    $where[] = "f.status = ?";
                    $params[] = $status;
                }
                if ($plan) {
                    $where[] = "f.plan = ?";
                    $params[] = $plan;
                }
                
                $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
                
                // Count total
                $countStmt = $db->prepare("SELECT COUNT(*) as total FROM firms f JOIN users u ON f.owner_id = u.id $whereClause");
                $countStmt->execute($params);
                $total = (int)$countStmt->fetch()['total'];
                
                // Fetch firms
                $params[] = $perPage;
                $params[] = $offset;
                $stmt = $db->prepare("
                    SELECT f.*,
                           u.email as owner_email, u.full_name as owner_name,
                           (SELECT COUNT(*) FROM clients c WHERE c.firm_id = f.id) as clients_count,
                           (SELECT COUNT(*) FROM firm_accountants fa WHERE fa.firm_id = f.id) as accountants_count,
                           (SELECT COUNT(*) FROM documents d JOIN clients c2 ON d.client_id = c2.id WHERE c2.firm_id = f.id) as documents_count,
                           (SELECT COALESCE(SUM(d2.file_size), 0) FROM documents d2 JOIN clients c3 ON d2.client_id = c3.id WHERE c3.firm_id = f.id) as storage_bytes
                    FROM firms f
                    JOIN users u ON f.owner_id = u.id
                    $whereClause
                    ORDER BY f.created_at DESC
                    LIMIT ? OFFSET ?
                ");
                $stmt->execute($params);
                $firms = $stmt->fetchAll();
                
                echo json_encode([
                    'success' => true,
                    'data' => $firms,
                    'pagination' => [
                        'total' => $total,
                        'page' => $page,
                        'per_page' => $perPage,
                        'total_pages' => ceil($total / $perPage)
                    ]
                ]);
            }
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $firmId = $_GET['id'] ?? $input['id'] ?? null;
            
            if (!$firmId) {
                http_response_code(400);
                echo json_encode(['error' => 'Firm ID required']);
                exit;
            }
            
            $updates = [];
            $params = [];
            $auditDetails = [];
            
            if (isset($input['status'])) {
                $updates[] = "status = ?";
                $params[] = $input['status'];
                $auditDetails['status'] = $input['status'];
                
                if ($input['status'] === 'suspended') {
                    $updates[] = "suspended_at = NOW()";
                    $updates[] = "suspended_by = ?";
                    $params[] = $user['user_id'];
                } elseif ($input['status'] === 'active') {
                    $updates[] = "suspended_at = NULL";
                    $updates[] = "suspended_by = NULL";
                }
            }
            if (isset($input['plan'])) {
                $updates[] = "plan = ?";
                $params[] = $input['plan'];
                $auditDetails['plan'] = $input['plan'];
            }
            if (array_key_exists('max_clients', $input)) {
                $updates[] = "max_clients = ?";
                $params[] = $input['max_clients'];
            }
            if (array_key_exists('max_accountants', $input)) {
                $updates[] = "max_accountants = ?";
                $params[] = $input['max_accountants'];
            }
            if (array_key_exists('max_documents_per_month', $input)) {
                $updates[] = "max_documents_per_month = ?";
                $params[] = $input['max_documents_per_month'];
            }
            if (array_key_exists('max_storage_mb', $input)) {
                $updates[] = "max_storage_mb = ?";
                $params[] = $input['max_storage_mb'];
            }
            if (isset($input['notes'])) {
                $updates[] = "notes = ?";
                $params[] = $input['notes'];
            }
            if (isset($input['name'])) {
                $updates[] = "name = ?";
                $params[] = $input['name'];
                $auditDetails['name'] = $input['name'];
            }
            // Custom pricing overrides (per-firm)
            if (array_key_exists('custom_base_price', $input)) {
                $updates[] = "custom_base_price = ?";
                $params[] = $input['custom_base_price'];
                $auditDetails['custom_base_price'] = $input['custom_base_price'];
            }
            if (array_key_exists('custom_price_per_client', $input)) {
                $updates[] = "custom_price_per_client = ?";
                $params[] = $input['custom_price_per_client'];
                $auditDetails['custom_price_per_client'] = $input['custom_price_per_client'];
            }
            if (array_key_exists('custom_price_per_document', $input)) {
                $updates[] = "custom_price_per_document = ?";
                $params[] = $input['custom_price_per_document'];
                $auditDetails['custom_price_per_document'] = $input['custom_price_per_document'];
            }
            if (isset($input['billing_notes'])) {
                $updates[] = "billing_notes = ?";
                $params[] = $input['billing_notes'];
            }
            if (isset($input['billing_status'])) {
                $updates[] = "billing_status = ?";
                $params[] = $input['billing_status'];
                $auditDetails['billing_status'] = $input['billing_status'];
            }
            if (array_key_exists('trial_ends_at', $input)) {
                $updates[] = "trial_ends_at = ?";
                $params[] = $input['trial_ends_at'];
            }
            
            if (count($updates) > 0) {
                $params[] = $firmId;
                $sql = "UPDATE firms SET " . implode(', ', $updates) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                
                logAudit($db, $user['user_id'], 'firm_updated', 'firm', $firmId, $auditDetails);
            }
            
            echo json_encode(['success' => true, 'data' => ['id' => $firmId]]);
            break;
            
        case 'DELETE':
            $firmId = $_GET['id'] ?? null;
            
            if (!$firmId) {
                http_response_code(400);
                echo json_encode(['error' => 'Firm ID required']);
                exit;
            }
            
            // Get firm name for audit
            $stmt = $db->prepare("SELECT name FROM firms WHERE id = ?");
            $stmt->execute([$firmId]);
            $firm = $stmt->fetch();
            
            if (!$firm) {
                http_response_code(404);
                echo json_encode(['error' => 'Firm not found']);
                exit;
            }
            
            // Delete firm (cascades to clients, documents, etc.)
            $stmt = $db->prepare("DELETE FROM firms WHERE id = ?");
            $stmt->execute([$firmId]);
            
            logAudit($db, $user['user_id'], 'firm_deleted', 'firm', $firmId, ['name' => $firm['name']]);
            
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
