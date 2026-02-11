##########################################
-- DocqFlow MySQL Database Schema
-- Compatible with MySQL 5.7+ (XAMPP)
-- UUIDs generated via triggers
##########################################

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DELIMITER $$
CREATE TRIGGER before_insert_users
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('firm', 'accountant', 'client') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role)
);

DELIMITER $$
CREATE TRIGGER before_insert_user_roles
BEFORE INSERT ON user_roles
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DELIMITER $$
CREATE TRIGGER before_insert_sessions
BEFORE INSERT ON sessions
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- Firms table
CREATE TABLE IF NOT EXISTS firms (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

DELIMITER $$
CREATE TRIGGER before_insert_firms
BEFORE INSERT ON firms
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- Firm accountants junction table
CREATE TABLE IF NOT EXISTS firm_accountants (
    id VARCHAR(36) PRIMARY KEY,
    firm_id VARCHAR(36) NOT NULL,
    accountant_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
    FOREIGN KEY (accountant_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_firm_accountant (firm_id, accountant_id)
);

DELIMITER $$
CREATE TRIGGER before_insert_firm_accountants
BEFORE INSERT ON firm_accountants
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    firm_id VARCHAR(36) NOT NULL,
    company_name VARCHAR(255),
    assigned_accountant_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_accountant_id) REFERENCES users(id) ON DELETE SET NULL
);

DELIMITER $$
CREATE TRIGGER before_insert_clients
BEFORE INSERT ON clients
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    status ENUM('pending', 'posted', 'clarification_needed', 'resend_requested') DEFAULT 'pending',
    notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

DELIMITER $$
CREATE TRIGGER before_insert_documents
BEFORE INSERT ON documents
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- Invite tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(36) NOT NULL UNIQUE,
    firm_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('firm', 'accountant', 'client') NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

DELIMITER $$
CREATE TRIGGER before_insert_invite_tokens
BEFORE INSERT ON invite_tokens
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    document_id VARCHAR(36),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);

DELIMITER $$
CREATE TRIGGER before_insert_notifications
BEFORE INSERT ON notifications
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;

-- Indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_firms_owner_id ON firms(owner_id);
CREATE INDEX idx_firm_accountants_firm_id ON firm_accountants(firm_id);
CREATE INDEX idx_firm_accountants_accountant_id ON firm_accountants(accountant_id);
CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_accountant_id ON clients(assigned_accountant_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
