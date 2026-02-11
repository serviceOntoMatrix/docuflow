<?php
/**
 * Document Replacement API
 * POST /api/documents/replace.php
 * 
 * Replaces an old document with a new one and transfers clarification history
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$user = requireAuth();
$db = getDB();

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $oldDocumentId = $input['old_document_id'] ?? null;
    $newDocumentId = $input['new_document_id'] ?? null;
    
    if (!$oldDocumentId || !$newDocumentId) {
        http_response_code(400);
        echo json_encode(['error' => 'Both old_document_id and new_document_id are required']);
        exit;
    }
    
    // Verify user has access to the old document
    $stmt = $db->prepare("
        SELECT d.*, c.user_id as client_user_id, c.assigned_accountant_id
        FROM documents d
        JOIN clients c ON d.client_id = c.id
        WHERE d.id = ?
    ");
    $stmt->execute([$oldDocumentId]);
    $oldDoc = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$oldDoc) {
        http_response_code(404);
        echo json_encode(['error' => 'Old document not found']);
        exit;
    }
    
    // Check if user is the client who owns this document
    if ($user['role'] === 'client' && $oldDoc['client_user_id'] !== $user['user_id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    
    // Verify new document exists
    $stmt = $db->prepare("SELECT * FROM documents WHERE id = ?");
    $stmt->execute([$newDocumentId]);
    $newDoc = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$newDoc) {
        http_response_code(404);
        echo json_encode(['error' => 'New document not found']);
        exit;
    }
    
    $db->beginTransaction();
    
    try {
        // 1. Transfer all chat_messages from old document to new document
        $stmt = $db->prepare("
            UPDATE chat_messages 
            SET document_id = ?
            WHERE document_id = ?
        ");
        $stmt->execute([$newDocumentId, $oldDocumentId]);
        $messagesTransferred = $stmt->rowCount();
        
        // 2. Update notifications to point to new document
        $stmt = $db->prepare("
            UPDATE notifications 
            SET document_id = ?
            WHERE document_id = ?
        ");
        $stmt->execute([$newDocumentId, $oldDocumentId]);
        
        // 3. Set new document status to 'pending' for review
        $stmt = $db->prepare("
            UPDATE documents 
            SET status = 'pending', 
                notes = CONCAT(IFNULL(notes, ''), '\n[Re-uploaded by client - previous document replaced]')
            WHERE id = ?
        ");
        $stmt->execute([$newDocumentId]);
        
        // 4. Delete the old document file if it exists
        $oldFilePath = __DIR__ . '/../../' . $oldDoc['file_path'];
        if (file_exists($oldFilePath)) {
            unlink($oldFilePath);
        }
        
        // 5. Delete the old document record
        $stmt = $db->prepare("DELETE FROM documents WHERE id = ?");
        $stmt->execute([$oldDocumentId]);
        
        // 6. Create notification for accountant about the re-upload
        if ($oldDoc['assigned_accountant_id']) {
            $notifId = generateUUID();
            $stmt = $db->prepare("
                INSERT INTO notifications (id, user_id, title, message, document_id, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, 0, NOW())
            ");
            $stmt->execute([
                $notifId,
                $oldDoc['assigned_accountant_id'],
                'Document Re-uploaded',
                "Client has re-uploaded document \"{$newDoc['file_name']}\" in response to clarification request. Previous clarification history has been preserved.",
                $newDocumentId
            ]);
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'new_document_id' => $newDocumentId,
                'messages_transferred' => $messagesTransferred,
                'old_document_deleted' => true
            ]
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
