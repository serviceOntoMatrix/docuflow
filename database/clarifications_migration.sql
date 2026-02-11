-- Clarifications/Chat Messages Table Migration
-- Run this SQL to create the chat_messages table for clarification history

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` varchar(36) NOT NULL,
  `document_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `sender_role` enum('client', 'firm', 'accountant') NOT NULL,
  `recipient_role` enum('client', 'firm', 'accountant') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_document_id` (`document_id`),
  KEY `idx_chat_messages_sender_id` (`sender_id`),
  KEY `idx_chat_messages_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add foreign keys if they don't exist (will fail silently if they already exist)
-- Note: Run these separately if needed
-- ALTER TABLE `chat_messages` ADD CONSTRAINT `fk_chat_messages_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `chat_messages` ADD CONSTRAINT `fk_chat_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
