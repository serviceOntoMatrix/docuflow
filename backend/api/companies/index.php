<?php
/**
 * Companies API Endpoint
 * GET, POST, DELETE /api/companies/index.php
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
            
            if (!$clientId) {
                http_response_code(400);
                echo json_encode(['error' => 'client_id required']);
                exit;
            }
            
            // Verify the client belongs to the user's firm or is the user's own client
            $stmt = $db->prepare("
                SELECT c.firm_id, c.user_id
                FROM clients c
                WHERE c.id = ?
            ");
            $stmt->execute([$clientId]);
            $client = $stmt->fetch();
            
            if (!$client) {
                http_response_code(404);
                echo json_encode(['error' => 'Client not found']);
                exit;
            }
            
            // Check if user is firm owner or the client themselves
            $stmt = $db->prepare("
                SELECT f.owner_id
                FROM firms f
                WHERE f.id = ?
            ");
            $stmt->execute([$client['firm_id']]);
            $firm = $stmt->fetch();
            
            $isOwner = $firm && $firm['owner_id'] === $user['user_id'];
            $isClient = $client['user_id'] === $user['user_id'];
            
            if (!$isOwner && !$isClient) {
                http_response_code(403);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }
            
            // Get companies for this client with assigned accountant info (if assigned_accountant_id exists on companies)
            $stmt = $db->prepare("
                SELECT c.id, c.client_id, c.company_name, c.created_at, c.updated_at,
                       c.assigned_accountant_id,
                       u.full_name AS accountant_full_name,
                       u.email AS accountant_email
                FROM companies c
                LEFT JOIN users u ON c.assigned_accountant_id = u.id
                WHERE c.client_id = ?
                ORDER BY c.created_at DESC
            ");
            $stmt->execute([$clientId]);
            $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['data' => $companies]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $clientId = $input['client_id'] ?? null;
            $companyName = $input['company_name'] ?? null;
            
            if (!$clientId || !$companyName) {
                http_response_code(400);
                echo json_encode(['error' => 'client_id and company_name required']);
                exit;
            }
            
            // Verify authorization (same as GET)
            $stmt = $db->prepare("
                SELECT c.firm_id, c.user_id
                FROM clients c
                WHERE c.id = ?
            ");
            $stmt->execute([$clientId]);
            $client = $stmt->fetch();
            
            if (!$client) {
                http_response_code(404);
                echo json_encode(['error' => 'Client not found']);
                exit;
            }
            
            $stmt = $db->prepare("
                SELECT f.owner_id
                FROM firms f
                WHERE f.id = ?
            ");
            $stmt->execute([$client['firm_id']]);
            $firm = $stmt->fetch();
            
            $isOwner = $firm && $firm['owner_id'] === $user['user_id'];
            $isClient = $client['user_id'] === $user['user_id'];
            
            if (!$isOwner && !$isClient) {
                http_response_code(403);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }
            
            // Create company
            $companyId = generateUUID();
            $stmt = $db->prepare("
                INSERT INTO companies (id, client_id, company_name)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$companyId, $clientId, $companyName]);
            
            echo json_encode(['data' => ['id' => $companyId]]);
            break;
            
        case 'DELETE':
            $companyId = $_GET['id'] ?? null;
            
            if (!$companyId) {
                http_response_code(400);
                echo json_encode(['error' => 'Company ID required']);
                exit;
            }
            
            // Verify authorization
            $stmt = $db->prepare("
                SELECT c.client_id, cl.firm_id, cl.user_id
                FROM companies c
                JOIN clients cl ON c.client_id = cl.id
                WHERE c.id = ?
            ");
            $stmt->execute([$companyId]);
            $company = $stmt->fetch();
            
            if (!$company) {
                http_response_code(404);
                echo json_encode(['error' => 'Company not found']);
                exit;
            }
            
            $stmt = $db->prepare("
                SELECT f.owner_id
                FROM firms f
                WHERE f.id = ?
            ");
            $stmt->execute([$company['firm_id']]);
            $firm = $stmt->fetch();
            
            $isOwner = $firm && $firm['owner_id'] === $user['user_id'];
            $isClient = $company['user_id'] === $user['user_id'];
            
            if (!$isOwner && !$isClient) {
                http_response_code(403);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }
            
            // Delete company
            $stmt = $db->prepare("DELETE FROM companies WHERE id = ?");
            $stmt->execute([$companyId]);
            
            echo json_encode(['data' => ['id' => $companyId, 'deleted' => true]]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

