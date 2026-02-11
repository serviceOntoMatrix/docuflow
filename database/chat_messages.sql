-- Chat Messages Table for Document-Based Role-Specific Chat System
-- Each document has its own chat thread with strict role-based communication

DROP TABLE IF EXISTS `chat_messages`;

CREATE TABLE `chat_messages` (
  `id` varchar(36) NOT NULL,
  `document_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `sender_role` enum('client', 'firm', 'accountant') NOT NULL,
  `recipient_role` enum('client', 'firm', 'accountant') NOT NULL,
  `message` text NOT NULL,
  `is_read` boolean DEFAULT false,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_document_id` (`document_id`),
  KEY `idx_chat_messages_sender_id` (`sender_id`),
  KEY `idx_chat_messages_created_at` (`created_at`),
  CONSTRAINT `fk_chat_messages_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat Participants Table to track who has access to document chats
DROP TABLE IF EXISTS `chat_participants`;

CREATE TABLE `chat_participants` (
  `id` varchar(36) NOT NULL,
  `document_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `user_role` enum('client', 'firm', 'accountant') NOT NULL,
  `last_read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_document_user` (`document_id`, `user_id`),
  KEY `idx_chat_participants_document_id` (`document_id`),
  KEY `idx_chat_participants_user_id` (`user_id`),
  CONSTRAINT `fk_chat_participants_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Function to validate if a user can send a message to a specific role
DELIMITER $$

CREATE FUNCTION `can_send_message_to_role`(
  sender_role VARCHAR(20),
  recipient_role VARCHAR(20)
) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  -- Client can only send to Firm
  IF sender_role = 'client' AND recipient_role = 'firm' THEN
    RETURN TRUE;
  END IF;
  
  -- Firm can send to Client and Accountant
  IF sender_role = 'firm' AND (recipient_role = 'client' OR recipient_role = 'accountant') THEN
    RETURN TRUE;
  END IF;
  
  -- Accountant can only send to Firm
  IF sender_role = 'accountant' AND recipient_role = 'firm' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END$$

DELIMITER ;

-- Trigger to automatically add participants when a document is created
DELIMITER $$

CREATE TRIGGER `add_chat_participants_on_document_create`
AFTER INSERT ON `documents`
FOR EACH ROW
BEGIN
  DECLARE client_user_id VARCHAR(36);
  DECLARE firm_owner_id VARCHAR(36);
  DECLARE assigned_accountant_id VARCHAR(36);
  
  -- Get the client's user_id
  SELECT user_id INTO client_user_id FROM clients WHERE id = NEW.client_id;
  
  -- Get the firm owner_id
  SELECT owner_id INTO firm_owner_id FROM firms WHERE id = (SELECT firm_id FROM clients WHERE id = NEW.client_id);
  
  -- Get assigned accountant if exists
  SELECT assigned_accountant_id INTO assigned_accountant_id FROM clients WHERE id = NEW.client_id;
  
  -- Add client as participant
  IF client_user_id IS NOT NULL THEN
    INSERT INTO chat_participants (id, document_id, user_id, user_role)
    VALUES (UUID(), NEW.id, client_user_id, 'client');
  END IF;
  
  -- Add firm owner as participant
  IF firm_owner_id IS NOT NULL THEN
    INSERT INTO chat_participants (id, document_id, user_id, user_role)
    VALUES (UUID(), NEW.id, firm_owner_id, 'firm');
  END IF;
  
  -- Add assigned accountant as participant if exists
  IF assigned_accountant_id IS NOT NULL THEN
    INSERT INTO chat_participants (id, document_id, user_id, user_role)
    VALUES (UUID(), NEW.id, assigned_accountant_id, 'accountant');
  END IF;
END$$

DELIMITER ;
