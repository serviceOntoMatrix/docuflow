<?php
/**
 * Environment Variables Helper
 * Loads environment variables from .env file
 */

function loadEnv($envFile = null) {
    if ($envFile === null) {
        // Try to find .env file in project root
        $envFile = __DIR__ . '/../.env';
        
        // If not found, try parent directory
        if (!file_exists($envFile)) {
            $envFile = __DIR__ . '/../../.env';
        }
    }
    
    if (!file_exists($envFile)) {
        // Silently fail if .env doesn't exist - use defaults
        return false;
    }
    
    // Check if file is readable
    if (!is_readable($envFile)) {
        error_log("Warning: .env file exists but is not readable: " . $envFile);
        return false;
    }
    
    $lines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    if ($lines === false) {
        error_log("Warning: Failed to read .env file: " . $envFile);
        return false;
    }
    
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }
            
            // Set environment variable if not already set
            if (!getenv($key)) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
    
    return true;
}

/**
 * Get environment variable with optional default value
 */
function env($key, $default = null) {
    // Check getenv first
    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }
    
    // Check $_ENV
    if (isset($_ENV[$key])) {
        return $_ENV[$key];
    }
    
    // Check $_SERVER
    if (isset($_SERVER[$key])) {
        return $_SERVER[$key];
    }
    
    return $default;
}
