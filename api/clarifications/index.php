<?php
/**
 * Clarifications API Endpoint
 * GET, POST /api/clarifications/index.php
 */

// Enable error reporting - show ALL errors for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers first
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Custom error handler to return JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    die(json_encode([
        'error' => 'PHP Error: ' . $errstr,
        'file' => basename($errfile),
        'line' => $errline
    ]));
});

// Custom exception handler
set_exception_handler(function($e) {
    http_response_code(500);
    die(json_encode([
        'error' => 'Exception: ' . $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]));
});

try {
    require_once __DIR__ . '/../../config/database.php';
    require_once __DIR__ . '/../../helpers/jwt.php';

    // Get authenticated user
    $authUser = getAuthUser();
    if (!$authUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // Get database connection
    $pdo = getDB();

    // Get full user data including full_name
    $userStmt = $pdo->prepare("SELECT id, email, full_name FROM users WHERE id = ?");
    $userStmt->execute([$authUser['user_id']]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found in database']);
        exit;
    }

    $user = [
        'id' => $authUser['user_id'],
        'email' => $authUser['email'],
        'role' => $authUser['role'],
        'full_name' => $userData['full_name'] ?? $authUser['email']
    ];

    $method = $_SERVER['REQUEST_METHOD'];
    $documentId = $_GET['document_id'] ?? null;

    switch ($method) {
        case 'GET':
            if ($documentId) {
                getClarificationMessages($pdo, $documentId, $user);
            } else {
                getClarificationDocuments($pdo, $user);
            }
            break;
            
        case 'POST':
            sendClarification($pdo, $user);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

function getClarificationMessages($pdo, $documentId, $user) {
    // Verify user has access to this document
    if (!hasDocumentAccess($pdo, $documentId, $user)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied to this document']);
        return;
    }
    
    $role = $user['role'];
    
    // Get clarification messages for this document based on role
    // - Accountant sees ALL messages (both to firm and client)
    // - Firm sees only messages where firm is sender or recipient
    // - Client sees only messages where client is sender or recipient
    if ($role === 'accountant') {
        // Accountant sees all messages for this document
        $stmt = $pdo->prepare("
            SELECT 
                cm.id,
                cm.document_id,
                cm.sender_id,
                cm.sender_role,
                cm.recipient_role,
                cm.message,
                cm.is_read,
                cm.created_at,
                u.full_name as sender_name,
                u.email as sender_email
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.id
            WHERE cm.document_id = ?
            ORDER BY cm.created_at ASC
        ");
        $stmt->execute([$documentId]);
    } else {
        // Firm/Client only see messages where they are sender or recipient
        $stmt = $pdo->prepare("
            SELECT 
                cm.id,
                cm.document_id,
                cm.sender_id,
                cm.sender_role,
                cm.recipient_role,
                cm.message,
                cm.is_read,
                cm.created_at,
                u.full_name as sender_name,
                u.email as sender_email
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.id
            WHERE cm.document_id = ?
            AND (cm.sender_role = ? OR cm.recipient_role = ?)
            ORDER BY cm.created_at ASC
        ");
        $stmt->execute([$documentId, $role, $role]);
    }
    
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Mark messages as read for this user (messages not sent by them)
    $updateStmt = $pdo->prepare("
        UPDATE chat_messages 
        SET is_read = 1, read_at = NOW()
        WHERE document_id = ? 
        AND sender_id != ? 
        AND is_read = 0
        AND recipient_role = ?
    ");
    $updateStmt->execute([$documentId, $user['id'], $user['role']]);
    
    echo json_encode(['data' => $messages]);
}

function getClarificationDocuments($pdo, $user) {
    // Get documents with clarification messages based on user role
    $role = $user['role'];
    
    if ($role === 'accountant') {
        // Accountant sees documents assigned to them with clarification status
        $stmt = $pdo->prepare("
            SELECT DISTINCT
                d.id,
                d.file_name,
                d.status,
                d.notes,
                d.uploaded_at,
                d.client_id,
                c.company_name,
                u.full_name as client_name,
                u.email as client_email,
                (SELECT COUNT(*) FROM chat_messages cm WHERE cm.document_id = d.id AND cm.sender_id != ? AND cm.is_read = 0 AND cm.recipient_role = 'accountant') as unread_count,
                (SELECT MAX(created_at) FROM chat_messages cm WHERE cm.document_id = d.id) as last_message_at
            FROM documents d
            JOIN clients c ON d.client_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE c.assigned_accountant_id = ?
            AND (d.status = 'clarification_needed' OR d.status = 'resend_requested' 
                 OR EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.document_id = d.id))
            ORDER BY last_message_at IS NULL, last_message_at DESC
        ");
        $stmt->execute([$user['id'], $user['id']]);
    } elseif ($role === 'firm') {
        // Firm owner sees ONLY documents that have messages sent TO them or FROM them
        $stmt = $pdo->prepare("
            SELECT DISTINCT
                d.id,
                d.file_name,
                d.status,
                d.notes,
                d.uploaded_at,
                d.client_id,
                co.company_name,
                u.full_name as client_name,
                u.email as client_email,
                acc.full_name as accountant_name,
                c.assigned_accountant_id,
                (SELECT COUNT(*) FROM chat_messages cm WHERE cm.document_id = d.id AND cm.sender_id != ? AND cm.is_read = 0 AND cm.recipient_role = 'firm') as unread_count,
                (SELECT MAX(created_at) FROM chat_messages cm WHERE cm.document_id = d.id AND (cm.sender_role = 'firm' OR cm.recipient_role = 'firm')) as last_message_at
            FROM documents d
            JOIN clients c ON d.client_id = c.id
            JOIN users u ON c.user_id = u.id
            LEFT JOIN companies co ON d.company_id = co.id
            LEFT JOIN users acc ON c.assigned_accountant_id = acc.id
            JOIN firms f ON c.firm_id = f.id
            WHERE f.owner_id = ?
            AND EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.document_id = d.id AND (cm.sender_role = 'firm' OR cm.recipient_role = 'firm'))
            ORDER BY last_message_at IS NULL, last_message_at DESC
        ");
        $stmt->execute([$user['id'], $user['id']]);
    } else {
        // Client sees ONLY documents that have messages sent TO them or FROM them
        $stmt = $pdo->prepare("
            SELECT DISTINCT
                d.id,
                d.file_name,
                d.status,
                d.notes,
                d.uploaded_at,
                d.client_id,
                co.company_name,
                (SELECT COUNT(*) FROM chat_messages cm WHERE cm.document_id = d.id AND cm.sender_id != ? AND cm.is_read = 0 AND cm.recipient_role = 'client') as unread_count,
                (SELECT MAX(created_at) FROM chat_messages cm WHERE cm.document_id = d.id AND (cm.sender_role = 'client' OR cm.recipient_role = 'client')) as last_message_at
            FROM documents d
            JOIN clients c ON d.client_id = c.id
            LEFT JOIN companies co ON d.company_id = co.id
            WHERE c.user_id = ?
            AND EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.document_id = d.id AND (cm.sender_role = 'client' OR cm.recipient_role = 'client'))
            ORDER BY last_message_at IS NULL, last_message_at DESC
        ");
        $stmt->execute([$user['id'], $user['id']]);
    }
    
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['data' => $documents]);
}

function sendClarification($pdo, $user) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['document_id']) || !isset($data['message']) || !isset($data['recipient_role'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: document_id, message, recipient_role']);
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
    
    // Validate recipient role
    if (!in_array($recipientRole, ['client', 'firm', 'accountant'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid recipient role']);
        return;
    }
    
    // Verify user has access to this document
    if (!hasDocumentAccess($pdo, $documentId, $user)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied to this document']);
        return;
    }
    
    // Validate message direction based on role
    $senderRole = $user['role'];
    
    // Clarification rules:
    // - Accountant can send to client or firm
    // - Client can only reply to accountant
    // - Firm can only reply to accountant
    if ($senderRole === 'client' && $recipientRole !== 'accountant') {
        http_response_code(403);
        echo json_encode(['error' => 'Clients can only send clarifications to accountants']);
        return;
    }
    
    if ($senderRole === 'firm' && $recipientRole !== 'accountant') {
        http_response_code(403);
        echo json_encode(['error' => 'Firms can only send clarifications to accountants']);
        return;
    }
    
    if ($senderRole === 'accountant' && !in_array($recipientRole, ['client', 'firm'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Accountants can only send clarifications to clients or firms']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Generate UUID and insert message
        $messageId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (id, document_id, sender_id, sender_role, recipient_role, message, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
        ");
        
        $stmt->execute([$messageId, $documentId, $user['id'], $senderRole, $recipientRole, $message]);
        
        // Get document info for notification
        $docStmt = $pdo->prepare("
            SELECT d.file_name, d.client_id, c.user_id as client_user_id, c.assigned_accountant_id, c.firm_id
            FROM documents d
            JOIN clients c ON d.client_id = c.id
            WHERE d.id = ?
        ");
        $docStmt->execute([$documentId]);
        $docInfo = $docStmt->fetch(PDO::FETCH_ASSOC);
        
        // Create notification for recipient
        $recipientUserId = null;
        $notificationTitle = "Clarification Message";
        
        if ($recipientRole === 'client') {
            $recipientUserId = $docInfo['client_user_id'];
            $notificationTitle = "Clarification Request from Accountant";
        } elseif ($recipientRole === 'accountant') {
            $recipientUserId = $docInfo['assigned_accountant_id'];
            $notificationTitle = "Clarification Reply from " . ucfirst($senderRole);
        } elseif ($recipientRole === 'firm') {
            // Get firm owner
            $firmStmt = $pdo->prepare("SELECT owner_id FROM firms WHERE id = ?");
            $firmStmt->execute([$docInfo['firm_id']]);
            $recipientUserId = $firmStmt->fetchColumn();
            $notificationTitle = "Clarification Request from Accountant";
        }
        
        if ($recipientUserId) {
            $notifId = generateUUID();
            $notifStmt = $pdo->prepare("
                INSERT INTO notifications (id, user_id, title, message, document_id, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, 0, NOW())
            ");
            
            $messagePreview = strlen($message) > 100 ? substr($message, 0, 100) . '...' : $message;
            $notifMessage = "Regarding \"{$docInfo['file_name']}\": {$messagePreview}";
            
            $notifStmt->execute([$notifId, $recipientUserId, $notificationTitle, $notifMessage, $documentId]);
        }
        
        // If this is an initial clarification from accountant, update document status
        if ($senderRole === 'accountant' && !isset($data['is_reply'])) {
            $updateStmt = $pdo->prepare("UPDATE documents SET status = 'clarification_needed', notes = ? WHERE id = ?");
            $updateStmt->execute([$message, $documentId]);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'data' => [
                'id' => $messageId,
                'document_id' => $documentId,
                'sender_id' => $user['id'],
                'sender_role' => $senderRole,
                'sender_name' => $user['full_name'],
                'recipient_role' => $recipientRole,
                'message' => $message,
                'is_read' => false,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to send clarification: ' . $e->getMessage()]);
    }
}

function hasDocumentAccess($pdo, $documentId, $user) {
    $role = $user['role'];
    $userId = $user['id'];
    
    if ($role === 'client') {
        // Client can access their own documents
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM documents d
            JOIN clients c ON d.client_id = c.id
            WHERE d.id = ? AND c.user_id = ?
        ");
        $stmt->execute([$documentId, $userId]);
    } elseif ($role === 'accountant') {
        // Accountant can access documents of clients assigned to them
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM documents d
            JOIN clients c ON d.client_id = c.id
            WHERE d.id = ? AND c.assigned_accountant_id = ?
        ");
        $stmt->execute([$documentId, $userId]);
    } elseif ($role === 'firm') {
        // Firm owner can access all documents from their firm
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM documents d
            JOIN clients c ON d.client_id = c.id
            JOIN firms f ON c.firm_id = f.id
            WHERE d.id = ? AND f.owner_id = ?
        ");
        $stmt->execute([$documentId, $userId]);
    } else {
        return false;
    }
    
    return $stmt->fetchColumn() > 0;
}

// Use generateUUID() from jwt.php helper
?>
