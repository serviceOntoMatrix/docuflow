<?php
/**
 * Database Configuration
 * DocqFlow PHP Backend
 */

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors, log them instead
ini_set('log_errors', 1);

// Load environment variables
$envPath = __DIR__ . '/../helpers/env.php';
if (!file_exists($envPath)) {
    error_log("Error: env.php not found at: " . $envPath);
    // Try alternative path
    $envPath = __DIR__ . '/../../helpers/env.php';
}

if (file_exists($envPath)) {
    require_once $envPath;
    if (function_exists('loadEnv')) {
        loadEnv();
    } else {
        error_log("Error: loadEnv() function not found after loading env.php");
    }
} else {
    error_log("Error: env.php not found. Using default values.");
}

// Set timezone
$timezone = env('TIMEZONE');
if (!$timezone) {
    error_log("Error: TIMEZONE not set in .env file");
    $timezone = 'UTC'; // Fallback to UTC if not set
}
date_default_timezone_set($timezone);

// Database configuration - all required
$dbHost = env('DB_HOST');
$dbName = env('DB_NAME');
$dbUser = env('DB_USER');
$dbPassword = env('DB_PASSWORD');

if (!$dbHost || !$dbName || !$dbUser) {
    error_log("Error: Database configuration incomplete. Check DB_HOST, DB_NAME, DB_USER in .env");
}

define('DB_HOST', $dbHost ?: '');
define('DB_NAME', $dbName ?: '');
define('DB_USER', $dbUser ?: '');
define('DB_PASSWORD', $dbPassword ?: '');

// JWT Secret - required
$jwtSecret = env('JWT_SECRET');
if (!$jwtSecret) {
    error_log("Error: JWT_SECRET not set in .env file");
}
define('JWT_SECRET', $jwtSecret ?: '');
define('JWT_EXPIRY', (int) (env('JWT_EXPIRY') ?: 604800));

// CORS settings - parse comma-separated string from env
$allowedOriginsStr = env('ALLOWED_ORIGINS');
if (!$allowedOriginsStr) {
    error_log("Error: ALLOWED_ORIGINS not set in .env file");
    $allowedOriginsStr = '';
}
$allowedOrigins = array_map('trim', explode(',', $allowedOriginsStr));
define('ALLOWED_ORIGINS', $allowedOrigins);

// Upload settings
$uploadDir = env('UPLOAD_DIR') ?: 'uploads/';
define('UPLOAD_DIR', strpos($uploadDir, '/') === 0 ? $uploadDir : __DIR__ . '/../' . $uploadDir);
define('MAX_FILE_SIZE', (int) (env('MAX_FILE_SIZE') ?: 10485760));

// Frontend URL for password reset links - required
$frontendUrl = env('FRONTEND_URL');
if (!$frontendUrl) {
    error_log("Error: FRONTEND_URL not set in .env file");
}
define('FRONTEND_URL', $frontendUrl ?: '');

// SMTP Email Configuration
define('SMTP_ENABLED', (env('SMTP_ENABLED') ?: 'true') === 'true');
define('SMTP_HOST', env('SMTP_HOST') ?: '');
define('SMTP_PORT', (int) (env('SMTP_PORT') ?: 587));
define('SMTP_SECURE', env('SMTP_SECURE') ?: 'tls');
define('SMTP_USER', env('SMTP_USER') ?: '');
define('SMTP_PASS', env('SMTP_PASS') ?: '');
define('SMTP_FROM_EMAIL', env('SMTP_FROM_EMAIL') ?: '');
define('SMTP_FROM_NAME', env('SMTP_FROM_NAME') ?: '');

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            if (empty(DB_HOST) || empty(DB_NAME) || empty(DB_USER)) {
                throw new PDOException('Database configuration incomplete. Check DB_HOST, DB_NAME, DB_USER in .env file');
            }
            
            $this->connection = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASSWORD,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
            // Set MySQL session timezone
            $timezone = defined('TIMEZONE') ? TIMEZONE : '+00:00';
            $this->connection->exec("SET time_zone = '" . $timezone . "'");
        } catch (PDOException $e) {
            // Don't output here - let the calling code handle it
            error_log('Database connection failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}

// Helper function to get DB connection
function getDB() {
    try {
        return Database::getInstance()->getConnection();
    } catch (PDOException $e) {
        // Re-throw with a clearer message
        throw new PDOException('Database connection failed. Please check your database configuration in .env file: ' . $e->getMessage());
    }
}
