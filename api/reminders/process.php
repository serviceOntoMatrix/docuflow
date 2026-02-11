<?php
/**
 * Process pending reminders (run via cron every minute or so).
 * Sends due reminders (scheduled_at <= now), marks them sent, and creates the next occurrence for recurring ones.
 *
 * Three ways to call:
 * 1. CLI (recommended for cron): php process.php  (processes all firms; no key needed)
 * 2. Web cron: GET process.php?key=REMINDER_CRON_KEY  (processes all firms)
 * 3. Logged-in: GET/POST with Authorization: Bearer <token>  (processes that user's firm only)
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    setCorsHeaders();
}

$cronKey = $isCli ? '' : ($_GET['key'] ?? '');
$expectedKey = function_exists('env') ? (env('REMINDER_CRON_KEY') ?: '') : (getenv('REMINDER_CRON_KEY') ?: '');
$useCron = $isCli || ($expectedKey !== '' && $cronKey === $expectedKey);

$firmIdFilter = null;
if (!$useCron) {
    $authUser = getAuthUser();
    if (!$authUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $db = getDB();
    $userId = $authUser['user_id'];
    $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $roleRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $role = $roleRow['role'] ?? null;
    if ($role === 'firm') {
        $stmt = $db->prepare("SELECT id FROM firms WHERE owner_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $f = $stmt->fetch(PDO::FETCH_ASSOC);
        $firmIdFilter = $f ? $f['id'] : null;
    } elseif ($role === 'accountant') {
        $stmt = $db->prepare("SELECT firm_id FROM firm_accountants WHERE accountant_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $f = $stmt->fetch(PDO::FETCH_ASSOC);
        $firmIdFilter = $f ? $f['firm_id'] : null;
    }
    if (!$firmIdFilter) {
        http_response_code(403);
        echo json_encode(['error' => 'Only firm or accountant can process reminders']);
        exit;
    }
}

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
    $db = getDB();
    $now = date('Y-m-d H:i:s');

    if ($firmIdFilter !== null) {
        $stmt = $db->prepare("
            SELECT id, firm_id, created_by, recipient_type, recipient_id, recipient_user_id, title, message, scheduled_at, recurrence_type, recurrence_end_at
            FROM reminders
            WHERE status = 'pending' AND scheduled_at <= ? AND firm_id = ?
        ");
        $stmt->execute([$now, $firmIdFilter]);
    } else {
        $stmt = $db->prepare("
            SELECT id, firm_id, created_by, recipient_type, recipient_id, recipient_user_id, title, message, scheduled_at, recurrence_type, recurrence_end_at
            FROM reminders
            WHERE status = 'pending' AND scheduled_at <= ?
        ");
        $stmt->execute([$now]);
    }
    $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $processed = 0;
    foreach ($pending as $r) {
        $notifId = generateUUID();
        $stmt = $db->prepare("
            INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, 0, NOW())
        ");
        $stmt->execute([
            $notifId,
            $r['recipient_user_id'],
            'Reminder: ' . $r['title'],
            $r['message']
        ]);

        $stmt = $db->prepare("UPDATE reminders SET status = 'sent', sent_at = ? WHERE id = ?");
        $stmt->execute([$now, $r['id']]);

        $recurrenceType = $r['recurrence_type'] ?? 'none';
        $recurrenceEndAt = $r['recurrence_end_at'] ?? null;
        if ($recurrenceType !== 'none') {
            $nextAt = getNextScheduledAt($now, $recurrenceType, $recurrenceEndAt);
            if ($nextAt) {
                $nextId = generateUUID();
                $stmt = $db->prepare("
                    INSERT INTO reminders (id, firm_id, created_by, recipient_type, recipient_id, recipient_user_id, title, message, scheduled_at, status, sent_at, recurrence_type, recurrence_end_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
                ");
                $stmt->execute([
                    $nextId,
                    $r['firm_id'],
                    $r['created_by'],
                    $r['recipient_type'],
                    $r['recipient_id'],
                    $r['recipient_user_id'],
                    $r['title'],
                    $r['message'],
                    $nextAt,
                    $recurrenceType,
                    $recurrenceEndAt
                ]);
            }
        }
        $processed++;
    }

    echo json_encode(['success' => true, 'processed' => $processed]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
