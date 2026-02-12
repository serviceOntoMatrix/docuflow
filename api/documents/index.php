<?php
/**
 * Documents API Endpoint
 * GET, POST, PUT /api/documents/index.php
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();

$user = requireAuth();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $clientId = $_GET['client_id'] ?? null;
            $firmId = $_GET['firm_id'] ?? null;
            
            if ($clientId) {
                $stmt = $db->prepare("SELECT * FROM documents WHERE client_id = ? ORDER BY uploaded_at DESC");
                $stmt->execute([$clientId]);
            } elseif ($firmId) {
                // SECURITY: Verify user belongs to this firm
                $authStmt = $db->prepare("
                    SELECT id FROM firms WHERE id = ? AND owner_id = ?
                    UNION
                    SELECT firm_id FROM firm_accountants WHERE firm_id = ? AND accountant_id = ?
                ");
                $authStmt->execute([$firmId, $user['user_id'], $firmId, $user['user_id']]);
                $isSuperAdmin = isset($user['role']) && $user['role'] === 'super_admin';
                if (!$authStmt->fetch() && !$isSuperAdmin) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied to this firm']);
                    exit;
                }
                
                $stmt = $db->prepare("
                    SELECT d.*, 
                           c.company_name as client_company_name,
                           c.user_id as client_user_id, 
                           c.assigned_accountant_id,
                           u.full_name as client_name, 
                           u.email as client_email,
                           acc.full_name as accountant_name,
                           acc.email as accountant_email,
                           comp.company_name,
                           comp.id as company_id
                    FROM documents d
                    JOIN clients c ON d.client_id = c.id
                    JOIN users u ON c.user_id = u.id
                    LEFT JOIN users acc ON c.assigned_accountant_id = acc.id
                    LEFT JOIN companies comp ON d.company_id = comp.id
                    WHERE c.firm_id = ?
                    ORDER BY d.uploaded_at DESC
                ");
                $stmt->execute([$firmId]);
            } else {
                // Get documents for current user's client record
                $stmt = $db->prepare("
                    SELECT d.*, comp.company_name
                    FROM documents d
                    JOIN clients c ON d.client_id = c.id
                    LEFT JOIN companies comp ON d.company_id = comp.id
                    WHERE c.user_id = ?
                    ORDER BY d.uploaded_at DESC
                ");
                $stmt->execute([$user['user_id']]);
            }
            
            $documents = $stmt->fetchAll();
            echo json_encode(['data' => $documents]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            $docId = generateUUID();
            $stmt = $db->prepare("
                INSERT INTO documents (id, client_id, file_name, file_path, file_type, file_size, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $docId,
                $input['client_id'],
                $input['file_name'],
                $input['file_path'],
                $input['file_type'] ?? null,
                $input['file_size'] ?? null,
                $input['notes'] ?? null
            ]);
            
            echo json_encode(['data' => ['id' => $docId]]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $docId = $_GET['id'] ?? $input['id'] ?? null;
            
            if (!$docId) {
                http_response_code(400);
                echo json_encode(['error' => 'Document ID required']);
                exit;
            }
            
            $updates = [];
            $params = [];
            
            if (isset($input['status'])) {
                $updates[] = "status = ?";
                $params[] = $input['status'];
            }
            if (isset($input['notes'])) {
                $updates[] = "notes = ?";
                $params[] = $input['notes'];
            }
            
            if (count($updates) > 0) {
                $params[] = $docId;
                $sql = "UPDATE documents SET " . implode(', ', $updates) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            }
            
            echo json_encode(['data' => ['id' => $docId, 'updated' => true]]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
