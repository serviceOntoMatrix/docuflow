<?php
/**
 * Reminders API Endpoint
 * GET, POST, DELETE /api/reminders/index.php
 * POST: send_option = 'now' | 'schedule', scheduled_at (ISO), recurrence_type = 'none'|'daily'|'weekly'|'monthly', recurrence_end_at (optional)
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();

$user = requireAuth();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Compute next occurrence for recurring reminder. Returns Y-m-d H:i:s or null.
 */
function getNextScheduledAt($fromDateTime, $recurrenceType, $recurrenceEndAt = null) {
    $from = new DateTime($fromDateTime);
    $end = $recurrenceEndAt ? new DateTime($recurrenceEndAt) : null;
    switch ($recurrenceType) {
        case 'daily':
            $from->modify('+1 day');
            break;
        case 'weekly':
            $from->modify('+7 days');
            break;
        case 'monthly':
            $from->modify('+1 month');
            break;
        default:
            return null;
    }
    if ($end && $from > $end) {
        return null;
    }
    return $from->format('Y-m-d H:i:s');
}

try {
    switch ($method) {
        case 'GET':
            $firmId = $_GET['firm_id'] ?? null;
            $userId = $user['user_id'];

            if ($firmId) {
                // Get reminders for a firm (firm/accountant view)
                $stmt = $db->prepare("
                    SELECT r.*, 
                           u.full_name as recipient_name,
                           u.email as recipient_email
                    FROM reminders r
                    LEFT JOIN users u ON r.recipient_user_id = u.id
                    WHERE r.firm_id = ?
                    ORDER BY r.created_at DESC
                ");
                $stmt->execute([$firmId]);
                $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                // Get reminders for the current user as recipient (client view). Include firm name and, when sent by firm, client's assigned accountant name.
                $stmt = $db->prepare("
                    SELECT r.id, r.firm_id, r.created_by, r.recipient_type, r.title, r.message, r.sent_at, r.created_at,
                           f.name as firm_name,
                           sender.full_name as sender_name,
                           acc.full_name as assigned_accountant_name,
                           (SELECT 1 FROM firm_accountants fa WHERE fa.firm_id = r.firm_id AND fa.accountant_id = r.created_by LIMIT 1) as is_from_accountant
                    FROM reminders r
                    LEFT JOIN firms f ON f.id = r.firm_id
                    LEFT JOIN users sender ON sender.id = r.created_by
                    LEFT JOIN clients c ON c.id = r.recipient_id AND c.user_id = r.recipient_user_id
                    LEFT JOIN users acc ON acc.id = c.assigned_accountant_id
                    WHERE r.recipient_user_id = ? AND r.recipient_type = 'client' AND r.status = 'sent'
                    ORDER BY r.sent_at DESC
                ");
                $stmt->execute([$userId]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $reminders = array_map(function ($row) {
                    $row['sender_type'] = !empty($row['is_from_accountant']) ? 'accountant' : 'firm';
                    $row['recipient_name'] = null;
                    $row['recipient_email'] = null;
                    if ($row['sender_type'] === 'firm' && !empty($row['assigned_accountant_name'])) {
                        $row['accountant_name'] = $row['assigned_accountant_name'];
                    } elseif ($row['sender_type'] === 'accountant') {
                        $row['accountant_name'] = $row['sender_name'];
                    } else {
                        $row['accountant_name'] = null;
                    }
                    unset($row['is_from_accountant'], $row['assigned_accountant_name']);
                    return $row;
                }, $rows);
            }

            echo json_encode(['data' => $reminders]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            $requiredFields = ['firm_id', 'recipient_type', 'recipient_id', 'recipient_user_id', 'title', 'message'];
            foreach ($requiredFields as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    exit;
                }
            }

            $sendOption = isset($input['send_option']) ? $input['send_option'] : 'now';
            $recurrenceType = isset($input['recurrence_type']) && in_array($input['recurrence_type'], ['none', 'daily', 'weekly', 'monthly'], true)
                ? $input['recurrence_type'] : 'none';
            $recurrenceEndAt = !empty($input['recurrence_end_at']) ? $input['recurrence_end_at'] : null;
            if ($recurrenceEndAt) {
                $recurrenceEndAt = date('Y-m-d H:i:s', strtotime($recurrenceEndAt));
            }

            $now = date('Y-m-d H:i:s');
            $scheduledAt = $now;
            $status = 'sent';
            $sentAt = $now;

            if ($sendOption === 'schedule') {
                if (empty($input['scheduled_at'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'scheduled_at is required when send_option is schedule']);
                    exit;
                }
                $scheduledAt = date('Y-m-d H:i:s', strtotime($input['scheduled_at']));
                if (strtotime($scheduledAt) <= time()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'scheduled_at must be in the future']);
                    exit;
                }
                $status = 'pending';
                $sentAt = null;
            } else {
                if (!empty($input['scheduled_at'])) {
                    $scheduledAt = date('Y-m-d H:i:s', strtotime($input['scheduled_at']));
                }
            }

            $reminderId = generateUUID();

            $stmt = $db->prepare("
                INSERT INTO reminders (id, firm_id, created_by, recipient_type, recipient_id, recipient_user_id, title, message, scheduled_at, status, sent_at, recurrence_type, recurrence_end_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $reminderId,
                $input['firm_id'],
                $user['user_id'],
                $input['recipient_type'],
                $input['recipient_id'],
                $input['recipient_user_id'],
                $input['title'],
                $input['message'],
                $scheduledAt,
                $status,
                $sentAt,
                $recurrenceType,
                $recurrenceEndAt
            ]);

            if ($status === 'sent') {
                $notifId = generateUUID();
                $stmt = $db->prepare("
                    INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
                    VALUES (?, ?, ?, ?, 0, NOW())
                ");
                $stmt->execute([
                    $notifId,
                    $input['recipient_user_id'],
                    'Reminder: ' . $input['title'],
                    $input['message']
                ]);
            }

            if ($status === 'sent' && $recurrenceType !== 'none') {
                $nextAt = getNextScheduledAt($now, $recurrenceType, $recurrenceEndAt);
                if ($nextAt) {
                    $nextId = generateUUID();
                    $stmt = $db->prepare("
                        INSERT INTO reminders (id, firm_id, created_by, recipient_type, recipient_id, recipient_user_id, title, message, scheduled_at, status, sent_at, recurrence_type, recurrence_end_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
                    ");
                    $stmt->execute([
                        $nextId,
                        $input['firm_id'],
                        $user['user_id'],
                        $input['recipient_type'],
                        $input['recipient_id'],
                        $input['recipient_user_id'],
                        $input['title'],
                        $input['message'],
                        $nextAt,
                        $recurrenceType,
                        $recurrenceEndAt
                    ]);
                }
            }

            echo json_encode([
                'data' => [
                    'id' => $reminderId,
                    'status' => $status,
                    'sent_at' => $sentAt,
                    'scheduled_at' => $scheduledAt
                ]
            ]);
            break;
            
        case 'DELETE':
            $reminderId = $_GET['id'] ?? null;
            
            if ($reminderId) {
                $stmt = $db->prepare("DELETE FROM reminders WHERE id = ?");
                $stmt->execute([$reminderId]);
            }
            
            echo json_encode(['data' => ['deleted' => true]]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
