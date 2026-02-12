<?php
/**
 * Company Requests API (Client self-service)
 * GET  - List requests (firm owner sees all for firm, client sees own)
 * POST - Create request (client)
 * PUT  - Approve/reject request (firm owner)
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();
$user = requireAuth();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$userId = $user['user_id'];
$role = $user['role'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($role === 'firm') {
                // Firm owner: see all requests for their firm
                $stmt = $db->prepare("
                    SELECT cr.*, u.full_name as client_name, u.email as client_email
                    FROM company_requests cr
                    JOIN clients c ON cr.client_id = c.id
                    JOIN users u ON c.user_id = u.id
                    JOIN firms f ON cr.firm_id = f.id
                    WHERE f.owner_id = ?
                    ORDER BY cr.created_at DESC
                ");
                $stmt->execute([$userId]);
            } else {
                // Client: see own requests
                $stmt = $db->prepare("
                    SELECT cr.*
                    FROM company_requests cr
                    JOIN clients c ON cr.client_id = c.id
                    WHERE c.user_id = ?
                    ORDER BY cr.created_at DESC
                ");
                $stmt->execute([$userId]);
            }
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            // Client creates a request
            $stmt = $db->prepare("SELECT id, firm_id FROM clients WHERE user_id = ?");
            $stmt->execute([$userId]);
            $client = $stmt->fetch();
            if (!$client) { http_response_code(400); echo json_encode(['error' => 'Client record not found']); exit; }
            
            $id = generateUUID();
            $stmt = $db->prepare("INSERT INTO company_requests (id, client_id, firm_id, company_name, reason) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $client['id'], $client['firm_id'], $input['company_name'], $input['reason'] ?? null]);
            
            // Notify firm owner
            $firmStmt = $db->prepare("SELECT owner_id FROM firms WHERE id = ?");
            $firmStmt->execute([$client['firm_id']]);
            $firm = $firmStmt->fetch();
            if ($firm) {
                $notifStmt = $db->prepare("INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)");
                $notifStmt->execute([generateUUID(), $firm['owner_id'], 'New Company Request', "A client has requested to add company: {$input['company_name']}"]);
            }
            
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $reqId = $_GET['id'] ?? $input['id'] ?? null;
            if (!$reqId) { http_response_code(400); echo json_encode(['error' => 'Request ID required']); exit; }
            
            $status = $input['status'] ?? null; // 'approved' or 'rejected'
            if (!in_array($status, ['approved', 'rejected'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Status must be approved or rejected']);
                exit;
            }
            
            // Get the request
            $stmt = $db->prepare("SELECT * FROM company_requests WHERE id = ?");
            $stmt->execute([$reqId]);
            $req = $stmt->fetch();
            if (!$req) { http_response_code(404); echo json_encode(['error' => 'Request not found']); exit; }
            
            $db->beginTransaction();
            
            // Update request
            $stmt = $db->prepare("UPDATE company_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ? WHERE id = ?");
            $stmt->execute([$status, $userId, $input['review_notes'] ?? null, $reqId]);
            
            // If approved, create the company
            if ($status === 'approved') {
                $companyId = generateUUID();
                $stmt = $db->prepare("INSERT INTO companies (id, client_id, company_name) VALUES (?, ?, ?)");
                $stmt->execute([$companyId, $req['client_id'], $req['company_name']]);
            }
            
            // Notify client
            $clientStmt = $db->prepare("SELECT user_id FROM clients WHERE id = ?");
            $clientStmt->execute([$req['client_id']]);
            $client = $clientStmt->fetch();
            if ($client) {
                $msg = $status === 'approved'
                    ? "Your request to add company \"{$req['company_name']}\" has been approved!"
                    : "Your request to add company \"{$req['company_name']}\" was declined." . ($input['review_notes'] ? " Reason: {$input['review_notes']}" : "");
                $notifStmt = $db->prepare("INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)");
                $notifStmt->execute([generateUUID(), $client['user_id'], "Company Request " . ucfirst($status), $msg]);
            }
            
            $db->commit();
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
