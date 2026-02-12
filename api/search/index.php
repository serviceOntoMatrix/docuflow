<?php
/**
 * Advanced Search API
 * GET /api/search/?q=term&type=all|documents|messages|notifications
 * Searches across documents, clarification messages, and notifications for the current user
 */
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();
$user = requireAuth();
$db = getDB();
$userId = $user['user_id'];
$role = $user['role'] ?? '';
$q = trim($_GET['q'] ?? '');
$type = $_GET['type'] ?? 'all';
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));

if (strlen($q) < 2) {
    echo json_encode(['success' => true, 'data' => ['documents' => [], 'messages' => [], 'notifications' => []]]);
    exit;
}

$searchTerm = "%$q%";
$results = ['documents' => [], 'messages' => [], 'notifications' => []];

try {
    // Search documents
    if ($type === 'all' || $type === 'documents') {
        if ($role === 'firm') {
            $stmt = $db->prepare("
                SELECT d.id, d.file_name, d.status, d.notes, d.uploaded_at, d.company_id,
                       comp.company_name, u.full_name as client_name
                FROM documents d
                JOIN clients c ON d.client_id = c.id
                JOIN firms f ON c.firm_id = f.id
                LEFT JOIN companies comp ON d.company_id = comp.id
                LEFT JOIN users u ON c.user_id = u.id
                WHERE f.owner_id = ? AND (d.file_name LIKE ? OR d.notes LIKE ? OR comp.company_name LIKE ?)
                ORDER BY d.uploaded_at DESC LIMIT ?
            ");
            $stmt->execute([$userId, $searchTerm, $searchTerm, $searchTerm, $limit]);
        } elseif ($role === 'accountant') {
            $stmt = $db->prepare("
                SELECT d.id, d.file_name, d.status, d.notes, d.uploaded_at,
                       comp.company_name, u.full_name as client_name
                FROM documents d
                JOIN clients c ON d.client_id = c.id AND c.assigned_accountant_id = ?
                LEFT JOIN companies comp ON d.company_id = comp.id
                LEFT JOIN users u ON c.user_id = u.id
                WHERE d.file_name LIKE ? OR d.notes LIKE ? OR comp.company_name LIKE ?
                ORDER BY d.uploaded_at DESC LIMIT ?
            ");
            $stmt->execute([$userId, $searchTerm, $searchTerm, $searchTerm, $limit]);
        } else {
            $stmt = $db->prepare("
                SELECT d.id, d.file_name, d.status, d.notes, d.uploaded_at,
                       comp.company_name
                FROM documents d
                JOIN clients c ON d.client_id = c.id AND c.user_id = ?
                LEFT JOIN companies comp ON d.company_id = comp.id
                WHERE d.file_name LIKE ? OR d.notes LIKE ? OR comp.company_name LIKE ?
                ORDER BY d.uploaded_at DESC LIMIT ?
            ");
            $stmt->execute([$userId, $searchTerm, $searchTerm, $searchTerm, $limit]);
        }
        $results['documents'] = $stmt->fetchAll();
    }

    // Search chat messages
    if ($type === 'all' || $type === 'messages') {
        $stmt = $db->prepare("
            SELECT cm.id, cm.message, cm.sender_role, cm.recipient_role, cm.created_at,
                   d.file_name as document_name, d.id as document_id
            FROM chat_messages cm
            JOIN chat_participants cp ON cm.document_id = cp.document_id AND cp.user_id = ?
            JOIN documents d ON cm.document_id = d.id
            WHERE cm.message LIKE ?
            ORDER BY cm.created_at DESC LIMIT ?
        ");
        $stmt->execute([$userId, $searchTerm, $limit]);
        $results['messages'] = $stmt->fetchAll();
    }

    // Search notifications
    if ($type === 'all' || $type === 'notifications') {
        $stmt = $db->prepare("
            SELECT id, title, message, is_read, created_at, document_id
            FROM notifications
            WHERE user_id = ? AND (title LIKE ? OR message LIKE ?)
            ORDER BY created_at DESC LIMIT ?
        ");
        $stmt->execute([$userId, $searchTerm, $searchTerm, $limit]);
        $results['notifications'] = $stmt->fetchAll();
    }

    $totalResults = count($results['documents']) + count($results['messages']) + count($results['notifications']);
    echo json_encode(['success' => true, 'data' => $results, 'total' => $totalResults]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
