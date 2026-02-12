<?php
/**
 * Super Admin - Audit Logs API
 * GET /api/admin/audit/ - List audit logs with filters
 */

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../helpers/jwt.php';

setCorsHeaders();
$user = requireSuperAdmin();
$db = getDB();

try {
    $search = $_GET['search'] ?? '';
    $action = $_GET['action'] ?? '';
    $entityType = $_GET['entity_type'] ?? '';
    $userId = $_GET['user_id'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
    $offset = ($page - 1) * $perPage;
    
    $where = [];
    $params = [];
    
    if ($search) {
        $where[] = "(al.action LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    if ($action) {
        $where[] = "al.action = ?";
        $params[] = $action;
    }
    if ($entityType) {
        $where[] = "al.entity_type = ?";
        $params[] = $entityType;
    }
    if ($userId) {
        $where[] = "al.user_id = ?";
        $params[] = $userId;
    }
    
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Count
    $countParams = $params;
    $countStmt = $db->prepare("
        SELECT COUNT(*) as total 
        FROM audit_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        $whereClause
    ");
    $countStmt->execute($countParams);
    $total = (int)$countStmt->fetch()['total'];
    
    // Fetch
    $params[] = $perPage;
    $params[] = $offset;
    $stmt = $db->prepare("
        SELECT al.*, u.email as user_email, u.full_name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        $whereClause
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute($params);
    $logs = $stmt->fetchAll();
    
    // Get distinct actions for filter dropdown
    $actionsStmt = $db->query("SELECT DISTINCT action FROM audit_logs ORDER BY action");
    $actions = array_column($actionsStmt->fetchAll(), 'action');
    
    echo json_encode([
        'success' => true,
        'data' => $logs,
        'actions' => $actions,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
