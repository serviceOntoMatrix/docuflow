<?php
/**
 * CORS Headers Handler
 */

function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Validate origin against allowed list
    if (!empty($origin) && defined('ALLOWED_ORIGINS') && in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: " . $origin);
    } elseif (empty($origin)) {
        // Allow same-origin requests (no Origin header)
        header("Access-Control-Allow-Origin: *");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
