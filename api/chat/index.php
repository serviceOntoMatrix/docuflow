<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();

// Get authenticated user
$user = requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$documentId = $_GET['document_id'] ?? null;

switch ($method) {
    case 'GET':
        if ($documentId) {
            // Get messages for a specific document
            getMessages($pdo, $documentId, $user);
        } else {
            // Get all chat threads for the user
            getChatThreads($pdo, $user);
        }
        break;
        
    case 'POST':
        sendMessage($pdo, $user);
        break;
        
    case 'PUT':
        markAsRead($pdo, $user);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getMessages($pdo, $documentId, $user) {
    // Check if user has access to this document
    if (!hasDocumentAccess($pdo, $documentId, $user['id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            cm.*,
            u.full_name as sender_name,
            u.email as sender_email,
            d.file_name as document_name
        FROM chat_messages cm
        JOIN users u ON cm.sender_id = u.id
        JOIN documents d ON cm.document_id = d.id
        WHERE cm.document_id = ?
        ORDER BY cm.created_at ASC
    ");
    
    $stmt->execute([$documentId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Mark messages as read for this user
    markMessagesAsRead($pdo, $documentId, $user['id']);
    
    echo json_encode(['data' => $messages]);
}

function getChatThreads($pdo, $user) {
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            d.id as document_id,
            d.file_name as document_name,
            d.status as document_status,
            c.company_name,
            MAX(cm.created_at) as last_message_at,
            COUNT(CASE WHEN cm.is_read = false AND cm.sender_id != ? THEN 1 END) as unread_count
        FROM documents d
        JOIN chat_participants cp ON d.id = cp.document_id
        LEFT JOIN chat_messages cm ON d.id = cm.document_id
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE cp.user_id = ?
        GROUP BY d.id, d.file_name, d.status, c.company_name
        ORDER BY last_message_at DESC NULLS LAST
    ");
    
    $stmt->execute([$user['id'], $user['id']]);
    $threads = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['data' => $threads]);
}

function sendMessage($pdo, $user) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['document_id']) || !isset($data['message']) || !isset($data['recipient_role'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    $documentId = $data['document_id'];
    $message = trim($data['message']);
    $recipientRole = $data['recipient_role'];
    
    if (empty($message)) {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        return;
    }
    
    // Check if user has access to this document
    if (!hasDocumentAccess($pdo, $documentId, $user['id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    // Validate role-based messaging rules
    if (!canSendMessageToRole($user['role'], $recipientRole)) {
        http_response_code(403);
        echo json_encode(['error' => 'You cannot send messages to this role']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Generate UUID and insert message
        $messageId = generateUuid();
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (id, document_id, sender_id, sender_role, recipient_role, message)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$messageId, $documentId, $user['id'], $user['role'], $recipientRole, $message]);
        
        // Ensure recipient is a participant
        ensureRecipientIsParticipant($pdo, $documentId, $recipientRole);
        
        // Create notification for recipient
        createChatNotification($pdo, $documentId, $recipientRole, $user['full_name'], $message);
        
        $pdo->commit();
        
        echo json_encode([
            'data' => [
                'id' => $messageId,
                'document_id' => $documentId,
                'message' => $message,
                'sender_role' => $user['role'],
                'recipient_role' => $recipientRole,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to send message']);
    }
}

function markAsRead($pdo, $user) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['document_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Document ID required']);
        return;
    }
    
    $documentId = $data['document_id'];
    
    // Mark messages as read for this user
    markMessagesAsRead($pdo, $documentId, $user['id']);
    
    echo json_encode(['data' => ['success' => true]]);
}

function hasDocumentAccess($pdo, $documentId, $userId) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM chat_participants 
        WHERE document_id = ? AND user_id = ?
    ");
    
    $stmt->execute([$documentId, $userId]);
    return $stmt->fetchColumn() > 0;
}

function canSendMessageToRole($senderRole, $recipientRole) {
    // Client can only send to Firm
    if ($senderRole === 'client' && $recipientRole === 'firm') {
        return true;
    }
    
    // Firm can send to Client and Accountant
    if ($senderRole === 'firm' && in_array($recipientRole, ['client', 'accountant'])) {
        return true;
    }
    
    // Accountant can only send to Firm
    if ($senderRole === 'accountant' && $recipientRole === 'firm') {
        return true;
    }
    
    return false;
}

function markMessagesAsRead($pdo, $documentId, $userId) {
    $stmt = $pdo->prepare("
        UPDATE chat_messages 
        SET is_read = true, read_at = NOW()
        WHERE document_id = ? AND sender_id != ? AND is_read = false
    ");
    
    $stmt->execute([$documentId, $userId]);
    
    // Update participant's last_read_at
    $stmt = $pdo->prepare("
        UPDATE chat_participants 
        SET last_read_at = NOW()
        WHERE document_id = ? AND user_id = ?
    ");
    
    $stmt->execute([$documentId, $userId]);
}

function ensureRecipientIsParticipant($pdo, $documentId, $recipientRole) {
    // Get users with the recipient role who have access to this document
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO chat_participants (id, document_id, user_id, user_role)
        SELECT UUID(), ?, u.id, ?
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role = ?
        AND (
            (ur.role = 'client' AND u.id IN (SELECT user_id FROM clients WHERE id = (SELECT client_id FROM documents WHERE id = ?)))
            OR (ur.role = 'firm' AND u.id IN (SELECT owner_id FROM firms WHERE id = (SELECT firm_id FROM clients WHERE id = (SELECT client_id FROM documents WHERE id = ?))))
            OR (ur.role = 'accountant' AND u.id IN (SELECT assigned_accountant_id FROM clients WHERE id = (SELECT client_id FROM documents WHERE id = ?) AND assigned_accountant_id IS NOT NULL))
        )
    ");
    
    $stmt->execute([$documentId, $recipientRole, $recipientRole, $documentId, $documentId, $documentId]);
}

function createChatNotification($pdo, $documentId, $recipientRole, $senderName, $message) {
    // Get recipient users
    $stmt = $pdo->prepare("
        SELECT DISTINCT u.id
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN chat_participants cp ON u.id = cp.user_id
        WHERE ur.role = ? AND cp.document_id = ?
    ");
    
    $stmt->execute([$recipientRole, $documentId]);
    $recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Create notifications for each recipient
    $notificationStmt = $pdo->prepare("
        INSERT INTO notifications (id, user_id, title, message, document_id, is_read)
        VALUES (UUID(), ?, ?, ?, ?, false)
    ");
    
    $title = "New Message from {$senderName}";
    $messagePreview = strlen($message) > 50 ? substr($message, 0, 50) . '...' : $message;
    
    foreach ($recipients as $recipientId) {
        $notificationStmt->execute([$recipientId, $title, $messagePreview, $documentId]);
    }
}
?>
