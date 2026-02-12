<?php
/**
 * Super Admin - Users Management API
 * GET    /api/admin/users/ - List all users
 * PUT    /api/admin/users/?id=X - Update user
 * DELETE /api/admin/users/?id=X - Delete user
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
            $search = $_GET['search'] ?? '';
            $role = $_GET['role'] ?? '';
            $firmId = $_GET['firm_id'] ?? '';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
            $offset = ($page - 1) * $perPage;
            
            $where = [];
            $params = [];
            
            if ($search) {
                $where[] = "(u.email LIKE ? OR u.full_name LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            if ($role) {
                $where[] = "ur.role = ?";
                $params[] = $role;
            }
            if ($firmId) {
                $where[] = "(f.id = ? OR fa.firm_id = ? OR cl.firm_id = ?)";
                $params[] = $firmId;
                $params[] = $firmId;
                $params[] = $firmId;
            }
            
            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // Count
            $countSql = "
                SELECT COUNT(DISTINCT u.id) as total 
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN firms f ON f.owner_id = u.id
                LEFT JOIN firm_accountants fa ON fa.accountant_id = u.id
                LEFT JOIN clients cl ON cl.user_id = u.id
                $whereClause
            ";
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($params);
            $total = (int)$countStmt->fetch()['total'];
            
            // Fetch
            $params[] = $perPage;
            $params[] = $offset;
            $stmt = $db->prepare("
                SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.email_verified_at, u.created_at, u.updated_at,
                       ur.role,
                       COALESCE(f.name, f2.name, f3.name) as firm_name,
                       COALESCE(f.id, f2.id, f3.id) as firm_id
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN firms f ON f.owner_id = u.id
                LEFT JOIN firm_accountants fa ON fa.accountant_id = u.id
                LEFT JOIN firms f2 ON fa.firm_id = f2.id
                LEFT JOIN clients cl ON cl.user_id = u.id
                LEFT JOIN firms f3 ON cl.firm_id = f3.id
                $whereClause
                GROUP BY u.id
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute($params);
            $users = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'data' => $users,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => ceil($total / $perPage)
                ]
            ]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = $_GET['id'] ?? $input['id'] ?? null;
            
            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                exit;
            }
            
            $auditDetails = [];
            
            // Reset password
            if (isset($input['new_password'])) {
                $hash = password_hash($input['new_password'], PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
                $stmt->execute([$hash, $userId]);
                $auditDetails['action'] = 'password_reset';
                
                // Invalidate all sessions
                $stmt = $db->prepare("DELETE FROM sessions WHERE user_id = ?");
                $stmt->execute([$userId]);
            }
            
            // Update user details
            $updates = [];
            $params = [];
            if (isset($input['full_name'])) { $updates[] = "full_name = ?"; $params[] = $input['full_name']; }
            if (isset($input['email'])) { $updates[] = "email = ?"; $params[] = $input['email']; $auditDetails['email'] = $input['email']; }
            if (isset($input['phone'])) { $updates[] = "phone = ?"; $params[] = $input['phone']; }
            
            if (count($updates) > 0) {
                $params[] = $userId;
                $stmt = $db->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
            }
            
            // Update role
            if (isset($input['role'])) {
                $stmt = $db->prepare("UPDATE user_roles SET role = ? WHERE user_id = ?");
                $stmt->execute([$input['role'], $userId]);
                $auditDetails['role'] = $input['role'];
            }
            
            logAudit($db, $user['user_id'], 'user_updated', 'user', $userId, $auditDetails);
            
            echo json_encode(['success' => true, 'data' => ['id' => $userId]]);
            break;
            
        case 'DELETE':
            $userId = $_GET['id'] ?? null;
            
            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                exit;
            }
            
            // Prevent deleting yourself
            if ($userId === $user['user_id']) {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot delete your own account']);
                exit;
            }
            
            $stmt = $db->prepare("SELECT email, full_name FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $targetUser = $stmt->fetch();
            
            if (!$targetUser) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                exit;
            }
            
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            
            logAudit($db, $user['user_id'], 'user_deleted', 'user', $userId, ['email' => $targetUser['email']]);
            
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
