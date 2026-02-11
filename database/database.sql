-- -------------------------------
-- Table structure for table `clients`
-- -------------------------------
CREATE TABLE `clients` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `firm_id` varchar(36) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `assigned_accountant_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_clients_firm_id` (`firm_id`),
  KEY `idx_clients_user_id` (`user_id`),
  KEY `idx_clients_accountant_id` (`assigned_accountant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `companies`
-- -------------------------------
CREATE TABLE `companies` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client_id` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `documents`
-- -------------------------------
CREATE TABLE `documents` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` text NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `status` enum('pending','posted','clarification_needed','resend_requested') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_documents_client_id` (`client_id`),
  KEY `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `firms`
-- -------------------------------
CREATE TABLE `firms` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `owner_id` varchar(36) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_firms_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `firm_accountants`
-- -------------------------------
CREATE TABLE `firm_accountants` (
  `id` varchar(36) NOT NULL,
  `firm_id` varchar(36) NOT NULL,
  `accountant_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_firm_accountant` (`firm_id`,`accountant_id`),
  KEY `idx_firm_accountants_firm_id` (`firm_id`),
  KEY `idx_firm_accountants_accountant_id` (`accountant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `invite_tokens`
-- -------------------------------
CREATE TABLE `invite_tokens` (
  `id` varchar(36) NOT NULL,
  `token` varchar(36) NOT NULL,
  `firm_id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('firm','accountant','client') NOT NULL,
  `created_by` varchar(36) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `firm_id` (`firm_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_invite_tokens_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `notifications`
-- -------------------------------
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `document_id` varchar(36) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  KEY `idx_notifications_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `password_reset_tokens`
-- -------------------------------
CREATE TABLE `password_reset_tokens` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(36) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `sessions`
-- -------------------------------
CREATE TABLE `sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `users`
-- -------------------------------
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -------------------------------
-- Table structure for table `user_roles`
-- -------------------------------
CREATE TABLE `user_roles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('firm','accountant','client') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
