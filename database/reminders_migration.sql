-- Reminders table for scheduled notifications
CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(36) PRIMARY KEY,
    firm_id VARCHAR(36) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    recipient_type ENUM('client', 'accountant') NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    recipient_user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status ENUM('pending', 'sent', 'cancelled') DEFAULT 'pending',
    sent_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_scheduled (scheduled_at, status),
    INDEX idx_firm (firm_id),
    INDEX idx_recipient (recipient_user_id)
);
