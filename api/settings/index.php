<?php
/**
 * App Settings API
 * GET /api/settings/public - Get public settings for frontend (global or firm-specific)
 * GET /api/settings - Get all settings for current user's firm (firm owners only)
 * POST /api/settings - Update settings for current user's firm (firm owners only)
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
$endpoint = end($request);
$isPublic = isset($_GET['public']) || $endpoint === 'public';

// Handle different endpoints
if ($isPublic) {
    handlePublicSettings();
} else {
    // Check authentication for private endpoints
    $user = requireAuth();
    handleSettings($method, $user);
}

function handlePublicSettings() {
    try {
        $db = getDB();
        $firmId = null;

        // Check if a specific firm ID is requested via query parameter
        if (isset($_GET['firm_id']) && !empty($_GET['firm_id'])) {
            $firmId = $_GET['firm_id'];
        }

        // Get public settings - first try firm-specific, then fall back to global
        $stmt = $db->prepare("
            SELECT setting_key, setting_value, setting_type
            FROM app_settings
            WHERE is_public = TRUE
            AND (firm_id = ? OR (firm_id IS NULL AND ? IS NULL))
            ORDER BY firm_id DESC, created_at DESC
        ");
        $stmt->execute([$firmId, $firmId]);
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Remove duplicates (firm-specific overrides global)
        $uniqueSettings = [];
        foreach ($settings as $setting) {
            if (!isset($uniqueSettings[$setting['setting_key']])) {
                $uniqueSettings[$setting['setting_key']] = $setting;
            }
        }

        // Convert values based on type
        $formattedSettings = [];
        foreach ($uniqueSettings as $setting) {
            $value = $setting['setting_value'];

            switch ($setting['setting_type']) {
                case 'boolean':
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    break;
                case 'number':
                    $value = (float) $value;
                    break;
                case 'json':
                    $value = json_decode($value, true);
                    break;
            }

            $formattedSettings[$setting['setting_key']] = $value;
        }

        echo json_encode([
            'success' => true,
            'settings' => $formattedSettings
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch settings: ' . $e->getMessage()]);
    }
}

function handleSettings($method, $user) {
    try {
        // Get user's firm
        $userId = $user['user_id'] ?? $user['id'] ?? null;
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $firm = getUserFirm($userId);
        if (!$firm) {
            http_response_code(403);
            echo json_encode(['error' => 'User is not associated with a firm']);
            return;
        }

        // Check if user is the firm owner
        if ($firm['owner_id'] !== $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'Only firm owners can manage settings']);
            return;
        }

        switch ($method) {
            case 'GET':
                getFirmSettings($firm['id']);
                break;
            case 'POST':
                updateFirmSettings($firm['id']);
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    }
}

function getFirmSettings($firmId) {
    try {
        $db = getDB();
        $stmt = $db->prepare("
            SELECT id, setting_key, setting_value, setting_type, category, is_public, created_at, updated_at
            FROM app_settings
            WHERE firm_id = ?
            ORDER BY category, setting_key
        ");
        $stmt->execute([$firmId]);
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'settings' => $settings,
            'firm_id' => $firmId
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch settings']);
    }
}

// Branding keys (like firm name) – visible to all accountants and clients under the firm
function isPublicBrandingKey($key) {
    $publicKeys = ['app_name', 'company_name', 'support_email', 'theme_color'];
    return in_array($key, $publicKeys, true);
}

function updateFirmSettings($firmId) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !is_array($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid data format']);
            return;
        }

        $db = getDB();
        $db->beginTransaction();

        foreach ($data as $key => $value) {
            $isPublic = isPublicBrandingKey($key);
            // Check if setting exists
            $stmt = $db->prepare("
                SELECT id FROM app_settings
                WHERE firm_id = ? AND setting_key = ?
            ");
            $stmt->execute([$firmId, $key]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Update existing setting (keep branding keys public so clients/accountants get them)
                $stmt = $db->prepare("
                    UPDATE app_settings
                    SET setting_value = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE firm_id = ? AND setting_key = ?
                ");
                $stmt->execute([$value, $isPublic ? 1 : 0, $firmId, $key]);
            } else {
                // Insert new setting
                $stmt = $db->prepare("
                    INSERT INTO app_settings
                    (firm_id, setting_key, setting_value, setting_type, category, is_public)
                    VALUES (?, ?, ?, 'string', 'general', ?)
                ");
                $stmt->execute([$firmId, $key, $value, $isPublic ? 1 : 0]);
            }
        }

        $db->commit();

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update settings']);
    }
}

function getUserFirm($userId) {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, owner_id FROM firms WHERE owner_id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?>