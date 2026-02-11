<?php
/**
 * Email Helper Functions
 * Supports both SMTP and PHP mail() function
 */

/**
 * Send invite email via SMTP or mail()
 */
function sendInviteEmail($to, $inviteLink, $inviteType, $firmName = '', $firmId = null) {
    // Get dynamic settings for the firm
    $appName = getFirmSetting($firmId, 'app_name', 'DocqFlow');
    $emailSignature = getFirmSetting($firmId, 'email_signature', 'Best regards,\nThe Team');

    $roleLabel = $inviteType === 'accountant' ? 'Accountant' : 'Client';
    $subject = "You're invited to join " . ($firmName ?: $appName) . " as a " . $roleLabel;

    $htmlContent = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You\'re Invited!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">
                Hello,
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
                You\'ve been invited to join <strong>' . htmlspecialchars($firmName ?: $appName) . '</strong> as a ' . htmlspecialchars($roleLabel) . '.
            </p>
            <p style="font-size: 16px; margin-bottom: 30px;">
                Click the button below to accept your invitation and create your account:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="' . htmlspecialchars($inviteLink) . '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                    Accept Invitation
                </a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This invitation link will expire in 48 hours.
            </p>
            <p style="font-size: 14px; color: #6b7280;">
                If you didn\'t expect this invitation, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                ' . nl2br(htmlspecialchars($emailSignature)) . '
            </p>
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                If the button doesn\'t work, copy and paste this link into your browser:<br>
                <a href="' . htmlspecialchars($inviteLink) . '" style="color: #667eea; word-break: break-all;">' . htmlspecialchars($inviteLink) . '</a>
            </p>
        </div>
    </body>
    </html>
    ';

    return sendEmail($to, $subject, $htmlContent, '', $firmId);
}

/**
 * Send password reset email via SMTP or mail()
 */
function sendPasswordResetEmail($to, $resetLink, $userName = '', $firmId = null) {
    // Get dynamic settings for the firm
    $appName = getFirmSetting($firmId, 'app_name', 'DocqFlow');
    $emailSignature = getFirmSetting($firmId, 'email_signature', 'Best regards,\nThe Team');

    $subject = "Reset Your $appName Password";

    $htmlContent = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">
                Hello' . ($userName ? ' ' . htmlspecialchars($userName) : '') . ',
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
                We received a request to reset your password for your ' . htmlspecialchars($appName) . ' account.
            </p>
            <p style="font-size: 16px; margin-bottom: 30px;">
                Click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="' . htmlspecialchars($resetLink) . '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                    Reset Password
                </a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This password reset link will expire in 1 hour.
            </p>
            <p style="font-size: 14px; color: #6b7280;">
                If you didn\'t request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                ' . nl2br(htmlspecialchars($emailSignature)) . '
            </p>
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                If the button doesn\'t work, copy and paste this link into your browser:<br>
                <a href="' . htmlspecialchars($resetLink) . '" style="color: #667eea; word-break: break-all;">' . htmlspecialchars($resetLink) . '</a>
            </p>
        </div>
    </body>
    </html>
    ';

    return sendEmail($to, $subject, $htmlContent, $userName, $firmId);
}

/**
 * Send email via SMTP
 */
function getFirmSetting($firmId, $key, $default = '') {
    static $settings = [];

    // Create cache key
    $cacheKey = $firmId . '_' . $key;

    if (!isset($settings[$cacheKey])) {
        try {
            $db = getDB();
            $stmt = $db->prepare("
                SELECT setting_value FROM app_settings
                WHERE setting_key = ? AND (firm_id = ? OR (firm_id IS NULL AND ? IS NULL))
                ORDER BY firm_id DESC LIMIT 1
            ");
            $stmt->execute([$key, $firmId, $firmId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $settings[$cacheKey] = $result ? $result['setting_value'] : $default;
        } catch (Exception $e) {
            $settings[$cacheKey] = $default;
        }
    }

    return $settings[$cacheKey];
}

function sendEmail($to, $subject, $htmlContent, $userName = '', $firmId = null) {
    // Get firm-specific SMTP settings
    $smtpEnabled = getFirmSetting($firmId, 'smtp_enabled', 'true') === 'true';

    if ($smtpEnabled) {
        return sendEmailViaSMTP($to, $subject, $htmlContent, $userName, $firmId);
    } else {
        // Fallback to PHP mail() function
        return sendEmailViaMail($to, $subject, $htmlContent);
    }
}

function sendEmailViaSMTP($to, $subject, $htmlContent, $userName = '', $firmId = null) {
    // Get firm-specific SMTP settings, fallback to global constants
    $host = getFirmSetting($firmId, 'smtp_host', SMTP_HOST ?? 'smtp.gmail.com');
    $port = (int) getFirmSetting($firmId, 'smtp_port', SMTP_PORT ?? 587);
    $secure = getFirmSetting($firmId, 'smtp_secure', SMTP_SECURE ?? 'tls');
    $username = getFirmSetting($firmId, 'smtp_user', SMTP_USER ?? '');
    $password = getFirmSetting($firmId, 'smtp_pass', SMTP_PASS ?? '');
    $fromEmail = getFirmSetting($firmId, 'smtp_from_email', SMTP_FROM_EMAIL ?? 'noreply@docuflow.com');
    $fromName = getFirmSetting($firmId, 'email_from_name', SMTP_FROM_NAME ?? 'DocqFlow');
    
    try {
        // Create socket connection
        if ($secure === 'ssl' && $port == 465) {
            $socket = @fsockopen('ssl://' . $host, $port, $errno, $errstr, 30);
        } else {
            $socket = @fsockopen($host, $port, $errno, $errstr, 30);
        }
        
        if (!$socket) {
            error_log("SMTP Connection failed: $errstr ($errno)");
            return false;
        }
        
        // Read server greeting
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '220') {
            fclose($socket);
            error_log("SMTP Error: Invalid greeting - $response");
            return false;
        }
        
        // Send EHLO
        fputs($socket, "EHLO localhost\r\n");
        // Read all EHLO response lines
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') break; // Last line of multi-line response
        }
        
        // STARTTLS for port 587
        if ($port == 587 && $secure == 'tls') {
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket, 515);
            if (substr($response, 0, 3) == '220') {
                // Enable crypto
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    fclose($socket);
                    error_log("SMTP Error: Failed to enable TLS encryption");
                    return false;
                }
                // Send EHLO again after TLS
                fputs($socket, "EHLO localhost\r\n");
                $response = '';
                while ($line = fgets($socket, 515)) {
                    $response .= $line;
                    if (substr($line, 3, 1) == ' ') break;
                }
            } else {
                fclose($socket);
                error_log("SMTP Error: STARTTLS failed - $response");
                return false;
            }
        }
        
        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '334') {
            fclose($socket);
            error_log("SMTP Error: AUTH LOGIN failed - $response");
            return false;
        }
        
        fputs($socket, base64_encode($username) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '334') {
            fclose($socket);
            error_log("SMTP Error: Username rejected - $response");
            return false;
        }
        
        // Remove spaces from password (Gmail app passwords shouldn't have spaces)
        $passwordClean = str_replace(' ', '', $password);
        fputs($socket, base64_encode($passwordClean) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '235') {
            fclose($socket);
            error_log("SMTP Error: Authentication failed - $response");
            error_log("SMTP Debug: Username used: $username");
            return false;
        }
        
        // MAIL FROM
        fputs($socket, "MAIL FROM:<$fromEmail>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            error_log("SMTP Error: MAIL FROM failed - $response");
            return false;
        }
        
        // RCPT TO
        fputs($socket, "RCPT TO:<$to>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            error_log("SMTP Error: RCPT TO failed - $response");
            return false;
        }
        
        // DATA
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '354') {
            fclose($socket);
            error_log("SMTP Error: DATA command failed - $response");
            return false;
        }
        
        // Build email headers and body
        $headers = "From: $fromName <$fromEmail>\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "Content-Transfer-Encoding: base64\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        
        // Encode body in base64 for better compatibility
        $htmlContentEncoded = chunk_split(base64_encode($htmlContent));
        
        $message = $headers . "\r\n" . $htmlContentEncoded . "\r\n.\r\n";
        
        fputs($socket, $message);
        // Read all response lines
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') break;
        }
        
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            error_log("SMTP Error: Message sending failed - $response");
            return false;
        }
        
        // QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        return true;
        
    } catch (Exception $e) {
        error_log("SMTP Exception: " . $e->getMessage());
        return false;
    }
}

/**
 * Send email via PHP mail() function (fallback)
 */
function sendEmailViaMail($to, $subject, $htmlContent) {
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: DocqFlow <noreply@docuflow.com>\r\n";
    $headers .= "Reply-To: noreply@docuflow.com\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Suppress warnings and capture result
    $result = @mail($to, $subject, $htmlContent, $headers);
    
    if (!$result) {
        error_log("PHP mail() function failed. Check SMTP configuration in php.ini or use SMTP settings.");
    }
    
    return $result;
}
