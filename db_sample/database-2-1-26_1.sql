-- -------------------------------
-- Table: users
-- -------------------------------
CREATE TABLE users (
  id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  email_verified_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB;

-- -------------------------------
-- Table: user_roles
-- -------------------------------
CREATE TABLE user_roles (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('firm','accountant','client') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_role (user_id, role),
  KEY idx_user_roles_user_id (user_id),
  CONSTRAINT user_roles_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------
-- Table: firms
-- -------------------------------
CREATE TABLE firms (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(36) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_firms_owner_id (owner_id),
  CONSTRAINT firms_ibfk_1 FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------
-- Table: clients
-- -------------------------------
CREATE TABLE clients (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  firm_id VARCHAR(36) NOT NULL,
  company_name VARCHAR(255),
  assigned_accountant_id VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_clients_user_id (user_id),
  KEY idx_clients_firm_id (firm_id),
  KEY idx_clients_accountant_id (assigned_accountant_id),
  CONSTRAINT clients_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT clients_ibfk_2 FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  CONSTRAINT clients_ibfk_3 FOREIGN KEY (assigned_accountant_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------
-- Table: documents
-- -------------------------------
CREATE TABLE documents (
  id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  status ENUM('pending','posted','clarification_needed','resend_requested') DEFAULT 'pending',
  notes TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_documents_client_id (client_id),
  CONSTRAINT documents_ibfk_1 FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------
-- Table: firm_accountants
-- -------------------------------
CREATE TABLE firm_accountants (
  id VARCHAR(36) NOT NULL,
  firm_id VARCHAR(36) NOT NULL,
  accountant_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_firm_accountant (firm_id, accountant_id),
  KEY idx_firm_accountants_firm_id (firm_id),
  KEY idx_firm_accountants_accountant_id (accountant_id),
  CONSTRAINT firm_accountants_ibfk_1 FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  CONSTRAINT firm_accountants_ibfk_2 FOREIGN KEY (accountant_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------
-- Table: invite_tokens
-- -------------------------------
CREATE TABLE invite_tokens (
  id VARCHAR(36) NOT NULL,
  token VARCHAR(64) NOT NULL,
  firm_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('firm','accountant','client') NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY token (token),
  KEY idx_invite_tokens_token (token),
  KEY firm_id (firm_id),
  KEY created_by (created_by),
  CONSTRAINT invite_tokens_ibfk_1 FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  CONSTRAINT invite_tokens_ibfk_2 FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------
-- Table: password_reset_tokens
-- -------------------------------
CREATE TABLE password_reset_tokens (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY token (token),
  KEY idx_user_id (user_id),
  KEY idx_expires_at (expires_at),
  CONSTRAINT password_reset_tokens_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------
-- Table: sessions
-- -------------------------------
CREATE TABLE sessions (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY token (token),
  KEY idx_sessions_user_id (user_id),
  CONSTRAINT sessions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------
-- Table: notifications
-- -------------------------------
CREATE TABLE notifications (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  document_id VARCHAR(36) DEFAULT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_id (user_id),
  KEY document_id (document_id),
  CONSTRAINT notifications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_ibfk_2 FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB;
