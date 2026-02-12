<?php
/**
 * Firm-Level Audit Trail API
 * GET - List audit logs for the current user's firm
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();
$user = requireAuth();
$db = getDB();
$userId = $user['user_id'];

// Determine firm_id
$stmt = $db->prepare("SELECT id FROM firms WHERE owner_id = ?");
$stmt->execute([$userId]);
$firm = $stmt->fetch();
if (!$firm) {
    $stmt = $db->prepare("SELECT firm_id FROM firm_accountants WHERE accountant_id = ?");
    $stmt->execute([$userId]);
    $fa = $stmt->fetch();
    if ($fa) $firm = ['id' => $fa['firm_id']];
}
if (!$firm) { http_response_code(403); echo json_encode(['error' => 'No firm found']); exit; }

$firmId = $firm['id'];

try {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
    $offset = ($page - 1) * $perPage;

    $countStmt = $db->prepare("SELECT COUNT(*) as total FROM firm_audit_logs WHERE firm_id = ?");
    $countStmt->execute([$firmId]);
    $total = (int)$countStmt->fetch()['total'];

    $stmt = $db->prepare("
        SELECT fal.*, u.email as user_email, u.full_name as user_name
        FROM firm_audit_logs fal
        LEFT JOIN users u ON fal.user_id = u.id
        WHERE fal.firm_id = ?
        ORDER BY fal.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$firmId, $perPage, $offset]);

    echo json_encode([
        'success' => true,
        'data' => $stmt->fetchAll(),
        'pagination' => ['total' => $total, 'page' => $page, 'per_page' => $perPage, 'total_pages' => ceil($total / $perPage)]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
