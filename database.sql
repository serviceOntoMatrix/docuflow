-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: docuflow
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_settings` (
  `id` varchar(36) NOT NULL,
  `firm_id` varchar(36) DEFAULT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','text','json','boolean','number') DEFAULT 'string',
  `category` varchar(50) DEFAULT 'general',
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_firm_setting` (`firm_id`,`setting_key`),
  KEY `idx_app_settings_firm_id` (`firm_id`),
  KEY `idx_app_settings_category` (`category`),
  CONSTRAINT `app_settings_ibfk_1` FOREIGN KEY (`firm_id`) REFERENCES `firms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_settings`
--

LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;
INSERT INTO `app_settings` VALUES ('','55e93251-9f56-4836-a568-531e0ae02131','theme_color','#bcac76','string','general',1,'2026-02-11 05:21:59','2026-02-11 05:21:59'),('2dc09451-00c0-11f1-820f-30560f0848b5','31ad2456-08c1-4650-ac83-609bd23a9124','theme_color','#3965f9','string','general',1,'2026-02-03 05:21:22','2026-02-11 05:18:54'),('35df122c-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','app_name','Harri\'s Firm','string','branding',1,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('35e71d25-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','app_description','Streamline Your Document Workflow','string','branding',0,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('35ee05cc-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','company_name','harri\'s Firm','string','branding',1,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('35f383ed-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','support_email','harri\'sfirm@example.com','string','contact',1,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('35f571f1-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','hero_title','Streamline Your Document Workflow','string','content',0,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('35f7418b-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','hero_subtitle','Connect your clients with your accounting team through a simple, secure document management platform.','text','content',0,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('35f90bc2-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','features_json','[{\"title\": \"Easy Document Upload\", \"description\": \"Clients can snap photos or upload documents directly from their mobile device\", \"icon\": \"FileUp\"}, {\"title\": \"Team Management\", \"description\": \"Firms can assign clients to accountants and track all document workflows\", \"icon\": \"Users\"}, {\"title\": \"Real-time Notifications\", \"description\": \"Stay updated with instant alerts when documents are uploaded or require action\", \"icon\": \"Bell\"}, {\"title\": \"Secure & Compliant\", \"description\": \"Bank-level security ensures your sensitive financial documents are protected\", \"icon\": \"Shield\"}]','json','content',0,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('35faffb8-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','email_from_name','harri\'s Firm','string','email',0,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('35fcbf23-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','email_signature','Best regards,\nThe harri\'s Firm Team','text','email',0,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('3605167f-f832-11f0-9a78-94280abc92a5','31ad2456-08c1-4650-ac83-609bd23a9124','smtp_enabled','true','boolean','email',0,'2026-01-23 08:04:58','2026-02-11 05:18:54'),('360e6d56-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','app_name','DocqFlow','string','branding',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('3617a80e-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','app_description','Streamline Your Document Workflow','string','branding',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('36196a09-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','company_name','test\'s Firm','string','branding',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('361b5b73-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','support_email','test\'sfirm@example.com','string','contact',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('361d2738-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','hero_title','Streamline Your Document Workflow','string','content',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('361ef3c9-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','hero_subtitle','Connect your clients with your accounting team through a simple, secure document management platform.','text','content',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('3620deea-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','features_json','[{\"title\": \"Easy Document Upload\", \"description\": \"Clients can snap photos or upload documents directly from their mobile device\", \"icon\": \"FileUp\"}, {\"title\": \"Team Management\", \"description\": \"Firms can assign clients to accountants and track all document workflows\", \"icon\": \"Users\"}, {\"title\": \"Real-time Notifications\", \"description\": \"Stay updated with instant alerts when documents are uploaded or require action\", \"icon\": \"Bell\"}, {\"title\": \"Secure & Compliant\", \"description\": \"Bank-level security ensures your sensitive financial documents are protected\", \"icon\": \"Shield\"}]','json','content',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('3622acdb-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','email_from_name','test\'s Firm','string','email',0,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('3624a169-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','email_signature','Best regards,\nThe test\'s Firm Team','text','email',0,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('36266903-f832-11f0-9a78-94280abc92a5','89d91054-ce2f-4edb-8dfc-9993af2e3d37','smtp_enabled','true','boolean','email',0,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('3628342c-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','app_name','DocqFlow','string','branding',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('362a27e0-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','app_description','Streamline Your Document Workflow','string','branding',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('363250c4-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','company_name','test\'s Firm','string','branding',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('36343eff-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','support_email','test\'sfirm@example.com','string','contact',1,'2026-01-23 08:04:58','2026-01-23 08:04:58'),('36360e36-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','hero_title','Streamline Your Document Workflow','string','content',1,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('3637d729-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','hero_subtitle','Connect your clients with your accounting team through a simple, secure document management platform.','text','content',1,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('3639c055-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','features_json','[{\"title\": \"Easy Document Upload\", \"description\": \"Clients can snap photos or upload documents directly from their mobile device\", \"icon\": \"FileUp\"}, {\"title\": \"Team Management\", \"description\": \"Firms can assign clients to accountants and track all document workflows\", \"icon\": \"Users\"}, {\"title\": \"Real-time Notifications\", \"description\": \"Stay updated with instant alerts when documents are uploaded or require action\", \"icon\": \"Bell\"}, {\"title\": \"Secure & Compliant\", \"description\": \"Bank-level security ensures your sensitive financial documents are protected\", \"icon\": \"Shield\"}]','json','content',1,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('363b93e7-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','email_from_name','test\'s Firm','string','email',0,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('363da77e-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','email_signature','Best regards,\nThe test\'s Firm Team','text','email',0,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('363f7a6c-f832-11f0-9a78-94280abc92a5','ed056875-fda5-45db-8c95-160a0afa38e1','smtp_enabled','true','boolean','email',0,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('36416b7a-f832-11f0-9a78-94280abc92a5',NULL,'app_name','DocqFlow','string','branding',1,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('36433231-f832-11f0-9a78-94280abc92a5',NULL,'app_description','Streamline Your Document Workflow','string','branding',1,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('3644ffec-f832-11f0-9a78-94280abc92a5',NULL,'company_name','DocqFlow','string','branding',1,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('3646f2c0-f832-11f0-9a78-94280abc92a5',NULL,'hero_title','Streamline Your Document Workflow','string','content',1,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('3648bb6b-f832-11f0-9a78-94280abc92a5',NULL,'hero_subtitle','Connect your clients with your accounting team through a simple, secure document management platform.','text','content',1,'2026-01-23 08:04:59','2026-01-23 08:04:59'),('364aaaea-f832-11f0-9a78-94280abc92a5',NULL,'features_json','[{\"title\": \"Easy Document Upload\", \"description\": \"Clients can snap photos or upload documents directly from their mobile device\", \"icon\": \"FileUp\"}, {\"title\": \"Team Management\", \"description\": \"Firms can assign clients to accountants and track all document workflows\", \"icon\": \"Users\"}, {\"title\": \"Real-time Notifications\", \"description\": \"Stay updated with instant alerts when documents are uploaded or require action\", \"icon\": \"Bell\"}, {\"title\": \"Secure & Compliant\", \"description\": \"Bank-level security ensures your sensitive financial documents are protected\", \"icon\": \"Shield\"}]','json','content',1,'2026-01-23 08:04:59','2026-01-23 08:04:59');
/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_messages` (
  `id` varchar(36) NOT NULL,
  `document_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `sender_role` enum('client','firm','accountant') NOT NULL,
  `recipient_role` enum('client','firm','accountant') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_document_id` (`document_id`),
  KEY `idx_chat_messages_sender_id` (`sender_id`),
  KEY `idx_chat_messages_created_at` (`created_at`),
  CONSTRAINT `fk_chat_messages_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES ('094105f4-1419-49d8-90c9-c49c0ef64815','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','client','hi client only message',1,'2026-01-23 05:28:33','2026-01-23 05:23:13','2026-01-23 05:28:33'),('17a50b71-ee55-48b5-b2cc-23024ea2d5ff','fd2e2d14-50ef-4ca5-ad75-e06251026fa5','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','client','noo',1,'2026-01-23 06:51:16','2026-01-23 06:50:53','2026-01-23 06:53:45'),('477238d5-250b-4652-b84a-aadba26803c6','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','firm','hi firm only message',1,'2026-01-23 05:29:14','2026-01-23 05:28:24','2026-01-23 05:29:14'),('5a6c94fa-89ea-4275-a5b4-607ceb92715f','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','client','hi client only message - new',1,'2026-01-23 05:28:53','2026-01-23 05:28:47','2026-01-23 05:28:53'),('5b2af76b-d238-4a90-a28f-b4dd5ce63605','fd2e2d14-50ef-4ca5-ad75-e06251026fa5','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','firm','dadasd',1,'2026-01-23 06:53:29','2026-01-23 06:51:27','2026-01-23 06:53:45'),('5df959db-afb2-441e-87fb-d8101884f51f','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','firm','hi firm only message',1,'2026-01-23 05:29:14','2026-01-23 05:23:34','2026-01-23 05:29:14'),('8d22e150-77f4-4881-a50a-0e80533133ad','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','firm','hi firm only message',1,'2026-01-23 05:29:14','2026-01-23 05:23:09','2026-01-23 05:29:14'),('8eac4582-237b-40fe-93f3-8960bd831456','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','firm','hi firm only message - new',1,'2026-01-23 05:29:35','2026-01-23 05:29:30','2026-01-23 05:29:35'),('9fc21c59-0d90-475d-b187-91a58d6f6ea0','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','client','hi client only message',1,'2026-01-23 05:28:33','2026-01-23 05:19:45','2026-01-23 05:28:33'),('aea83d7f-575d-4f9e-8da7-1dd5d411ef48','fd2e2d14-50ef-4ca5-ad75-e06251026fa5','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','firm','swdqaewdd',1,'2026-01-23 06:53:29','2026-01-23 06:53:17','2026-01-23 06:53:45'),('bc36abad-f4cf-4c7c-a68d-c2f7f0aa58f8','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','client','hi client only message',1,'2026-01-23 05:28:33','2026-01-23 05:26:34','2026-01-23 05:28:33'),('bef33712-8a3c-40d1-b179-058ec6e64c9f','fd2e2d14-50ef-4ca5-ad75-e06251026fa5','111800bf-1036-4200-b759-9b6ab28f2eed','client','accountant','[Re-uploaded document] weqw',1,'2026-01-23 06:53:57','2026-01-23 06:53:45','2026-01-23 06:53:57'),('d6f891f5-6852-4bc4-b6ba-db0340eb74b1','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','firm','hi firm only message',1,'2026-01-23 05:29:14','2026-01-23 05:20:18','2026-01-23 05:29:14'),('d7f9f3c3-f124-4406-8b5c-be196eb4179a','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','111800bf-1036-4200-b759-9b6ab28f2eed','client','accountant','hhh (1 file attached)',1,'2026-02-11 06:52:27','2026-01-23 06:48:06','2026-02-11 06:52:27'),('e6f1b0ac-c203-469e-bb08-2e52a3d7d7bc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','firm','hi firm only message',1,'2026-01-23 05:29:14','2026-01-23 05:26:18','2026-01-23 05:29:14');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_participants`
--

DROP TABLE IF EXISTS `chat_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_participants` (
  `id` varchar(36) NOT NULL,
  `document_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `user_role` enum('client','firm','accountant') NOT NULL,
  `last_read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_document_user` (`document_id`,`user_id`),
  KEY `idx_chat_participants_document_id` (`document_id`),
  KEY `idx_chat_participants_user_id` (`user_id`),
  CONSTRAINT `fk_chat_participants_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_participants`
--

LOCK TABLES `chat_participants` WRITE;
/*!40000 ALTER TABLE `chat_participants` DISABLE KEYS */;
INSERT INTO `chat_participants` VALUES ('428ec0a8-f828-11f0-9a78-94280abc92a5','fd2e2d14-50ef-4ca5-ad75-e06251026fa5','111800bf-1036-4200-b759-9b6ab28f2eed','client',NULL,'2026-01-23 06:53:44','2026-01-23 06:53:44'),('42cf6ff1-f828-11f0-9a78-94280abc92a5','fd2e2d14-50ef-4ca5-ad75-e06251026fa5','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','firm',NULL,'2026-01-23 06:53:44','2026-01-23 06:53:44'),('ddcebcf8-f2ba-11f0-a131-3a33530523a0','a165f777-ebe1-44c8-83aa-87336e149a20','163e4d29-1ab0-4a79-be78-993525831e6d','client',NULL,'2026-01-16 09:08:04','2026-01-16 09:08:04'),('dde92840-f2ba-11f0-a131-3a33530523a0','a165f777-ebe1-44c8-83aa-87336e149a20','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','firm',NULL,'2026-01-16 09:08:04','2026-01-16 09:08:04'),('ddeb19aa-f2ba-11f0-a131-3a33530523a0','a165f777-ebe1-44c8-83aa-87336e149a20','b99ff798-9895-43e1-8204-8d1eadc72142','accountant',NULL,'2026-01-16 09:08:04','2026-01-16 09:08:04'),('ddf5d526-f2ba-11f0-a131-3a33530523a0','08fa3717-5abb-492b-89c0-04009a11265f','111800bf-1036-4200-b759-9b6ab28f2eed','client',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05'),('ddf77384-f2ba-11f0-a131-3a33530523a0','08fa3717-5abb-492b-89c0-04009a11265f','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','firm',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05'),('ddf96633-f2ba-11f0-a131-3a33530523a0','08fa3717-5abb-492b-89c0-04009a11265f','b99ff798-9895-43e1-8204-8d1eadc72142','accountant',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05'),('ddfb4e50-f2ba-11f0-a131-3a33530523a0','68fc4246-0fd0-4635-8259-8816f9f2bc16','111800bf-1036-4200-b759-9b6ab28f2eed','client',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05'),('ddfd207b-f2ba-11f0-a131-3a33530523a0','68fc4246-0fd0-4635-8259-8816f9f2bc16','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','firm',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05'),('ddfee6c0-f2ba-11f0-a131-3a33530523a0','68fc4246-0fd0-4635-8259-8816f9f2bc16','b99ff798-9895-43e1-8204-8d1eadc72142','accountant',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05'),('de072a6d-f2ba-11f0-a131-3a33530523a0','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','111800bf-1036-4200-b759-9b6ab28f2eed','client',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05'),('de08f70d-f2ba-11f0-a131-3a33530523a0','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','firm',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05'),('de0ac34f-f2ba-11f0-a131-3a33530523a0','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','b99ff798-9895-43e1-8204-8d1eadc72142','accountant',NULL,'2026-01-16 09:08:05','2026-01-16 09:08:05');
/*!40000 ALTER TABLE `chat_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  KEY `idx_clients_accountant_id` (`assigned_accountant_id`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clients_ibfk_2` FOREIGN KEY (`firm_id`) REFERENCES `firms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clients_ibfk_3` FOREIGN KEY (`assigned_accountant_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES ('2607a668-b767-41cc-aa1c-a22cbf2a673e','163e4d29-1ab0-4a79-be78-993525831e6d','31ad2456-08c1-4650-ac83-609bd23a9124','abc','b99ff798-9895-43e1-8204-8d1eadc72142','2025-12-24 07:50:29','2025-12-24 07:51:32'),('314238df-607c-4266-bf73-65a2ae0110f0','48b216a1-d3b3-4829-b514-c5f529d9dee3','31ad2456-08c1-4650-ac83-609bd23a9124','abc','27202e3f-8149-490f-8499-c95253b7a9ba','2025-12-30 07:14:00','2026-01-02 05:23:14'),('e482fc32-d2b1-407b-a9f3-c9eebc98edc1','111800bf-1036-4200-b759-9b6ab28f2eed','31ad2456-08c1-4650-ac83-609bd23a9124','abc','b99ff798-9895-43e1-8204-8d1eadc72142','2026-01-02 04:00:02','2026-01-06 03:26:04');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `companies` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `assigned_accountant_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_companies_assigned_accountant` (`assigned_accountant_id`),
  CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_companies_assigned_accountant` FOREIGN KEY (`assigned_accountant_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES ('96491bbc-e799-11f0-82c5-30560f0848b5','2607a668-b767-41cc-aa1c-a22cbf2a673e','abc','b99ff798-9895-43e1-8204-8d1eadc72142','2025-12-24 07:50:29','2026-02-03 04:24:18'),('96492cdf-e799-11f0-82c5-30560f0848b5','314238df-607c-4266-bf73-65a2ae0110f0','abc','27202e3f-8149-490f-8499-c95253b7a9ba','2025-12-30 07:14:00','2026-02-03 04:24:18'),('96492da7-e799-11f0-82c5-30560f0848b5','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','abc','b99ff798-9895-43e1-8204-8d1eadc72142','2026-01-02 04:00:02','2026-02-03 04:24:18'),('cc17dbe7-1b3d-4248-bdba-74b5d7c1a38e','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','bbb','b99ff798-9895-43e1-8204-8d1eadc72142','2026-01-02 05:12:31','2026-02-03 04:24:18'),('e45f1ef7-b919-445c-9123-8038c2ca3ab3','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','ccc','b99ff798-9895-43e1-8204-8d1eadc72142','2026-01-02 05:12:35','2026-02-03 04:24:18'),('e82aeae0-cc01-4742-980d-787b67601a7c','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','abac','b99ff798-9895-43e1-8204-8d1eadc72142','2026-01-02 05:12:13','2026-02-03 04:24:18');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversations` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `participants` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `conversation_type` enum('direct','group','document_related') DEFAULT 'direct',
  `document_id` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `last_message_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_conversations_created_by` (`created_by`),
  KEY `idx_conversations_document` (`document_id`),
  KEY `idx_conversations_last_message` (`last_message_at`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES ('3c96e29e-06c4-4d21-b909-07fe49df19a9','Test Conversation','[{\"id\":\"111800bf-1036-4200-b759-9b6ab28f2eed\",\"role\":\"participant\"},{\"id\":\"163e4d29-1ab0-4a79-be78-993525831e6d\",\"role\":\"participant\"}]','direct',NULL,'111800bf-1036-4200-b759-9b6ab28f2eed','2026-01-16 07:43:52','2026-01-16 07:43:52','2026-01-16 07:43:52'),('8725b866-55bf-473c-a3d6-a4790d6ff614','Test Conversation','[{\"id\":\"111800bf-1036-4200-b759-9b6ab28f2eed\",\"role\":\"participant\"},{\"id\":\"163e4d29-1ab0-4a79-be78-993525831e6d\",\"role\":\"participant\"}]','direct',NULL,'111800bf-1036-4200-b759-9b6ab28f2eed','2026-01-16 07:40:18','2026-01-16 07:40:15','2026-01-16 07:40:18'),('ca33c75b-2d78-4480-8d5f-07f2f05fd16f','Test Conversation','[{\"id\":\"111800bf-1036-4200-b759-9b6ab28f2eed\",\"role\":\"participant\"},{\"id\":\"163e4d29-1ab0-4a79-be78-993525831e6d\",\"role\":\"participant\"}]','direct',NULL,'111800bf-1036-4200-b759-9b6ab28f2eed','2026-01-14 06:33:44','2026-01-14 06:33:42','2026-01-14 06:33:44');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` text NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `status` enum('pending','posted','clarification_needed','resend_requested') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `clarification_messages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_documents_client_id` (`client_id`),
  KEY `idx_company_id` (`company_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES ('08fa3717-5abb-492b-89c0-04009a11265f','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','Balance-Sheet-Example.pdf','uploads/2026/01/4122bc56-1e54-4c18-8944-9aae399927a0.pdf','application/pdf',497278,'clarification_needed','wqweqweqweqw','[{\"sender_id\":\"test-user-id\",\"sender_role\":\"accountant\",\"recipient_type\":\"client\",\"message\":\"This is a test message\",\"created_at\":\"2026-01-14T07:34:23+01:00\"},{\"sender_id\":\"b99ff798-9895-43e1-8204-8d1eadc72142\",\"sender_role\":\"accountant\",\"recipient_type\":\"client\",\"message\":\"adsdadas\",\"created_at\":\"2026-01-16T07:46:19.124Z\"}]','2026-01-02 05:19:58','2026-01-23 04:22:28','cc17dbe7-1b3d-4248-bdba-74b5d7c1a38e'),('68fc4246-0fd0-4635-8259-8816f9f2bc16','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','Balance-Sheet-Example.pdf','uploads/2026/01/78e326ec-a397-4019-afcc-34cec5f02b99.pdf','application/pdf',497278,'pending','hi','[]','2026-01-02 05:13:47','2026-01-23 04:19:25',NULL),('a165f777-ebe1-44c8-83aa-87336e149a20','2607a668-b767-41cc-aa1c-a22cbf2a673e','Ontomatrix Property Sheet.pdf','uploads/2025/12/d84e1a5f-07a6-4336-9810-8ce12129d304.pdf','application/pdf',211237,'posted','','[]','2025-12-24 07:50:44','2026-01-06 06:12:18',NULL),('a34dd5e1-b902-48ff-857d-a4d2bc3be5ae','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','ChatGPT Image Jan 5, 2026, 12_37_43 PM.png','uploads/2026/01/84a36546-9749-4b9c-b09b-7bc416b133a4.png','image/png',1561072,'clarification_needed','hi firm only message - new','[{\"sender_id\":\"291cb463-afa9-4dfd-b0d5-77a98e1bd85a\",\"sender_role\":\"firm\",\"recipient_type\":\"accountant\",\"message\":\"dsfsdfsdf\",\"created_at\":\"2026-01-16T08:00:20.643Z\"},{\"sender_id\":\"b99ff798-9895-43e1-8204-8d1eadc72142\",\"sender_role\":\"accountant\",\"recipient_type\":\"firm\",\"message\":\"wecwdeweqweqwecqweqw\",\"created_at\":\"2026-01-16T08:00:36.956Z\"}]','2026-01-06 08:26:36','2026-01-23 05:29:30','cc17dbe7-1b3d-4248-bdba-74b5d7c1a38e'),('fd2e2d14-50ef-4ca5-ad75-e06251026fa5','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','Untitleddesign29.jpeg','uploads/2026/01/36f0a7b8-c11d-4dc1-ba6e-a93f1cb20e5a.jpeg','image/jpeg',100124,'pending','\n[Re-uploaded by client - previous document replaced]',NULL,'2026-01-23 06:53:44','2026-01-23 06:53:45',NULL);
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `add_chat_participants_on_document_create` AFTER INSERT ON `documents` FOR EACH ROW BEGIN

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

        END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `firm_accountants`
--

DROP TABLE IF EXISTS `firm_accountants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `firm_accountants` (
  `id` varchar(36) NOT NULL,
  `firm_id` varchar(36) NOT NULL,
  `accountant_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_firm_accountant` (`firm_id`,`accountant_id`),
  KEY `idx_firm_accountants_firm_id` (`firm_id`),
  KEY `idx_firm_accountants_accountant_id` (`accountant_id`),
  CONSTRAINT `firm_accountants_ibfk_1` FOREIGN KEY (`firm_id`) REFERENCES `firms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `firm_accountants_ibfk_2` FOREIGN KEY (`accountant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firm_accountants`
--

LOCK TABLES `firm_accountants` WRITE;
/*!40000 ALTER TABLE `firm_accountants` DISABLE KEYS */;
INSERT INTO `firm_accountants` VALUES ('a5267534-58c9-453d-9e84-ac31f45f1779','31ad2456-08c1-4650-ac83-609bd23a9124','27202e3f-8149-490f-8499-c95253b7a9ba','2026-01-02 03:30:43'),('d3f134a4-31a8-44b6-b6db-dd69dd9b6fc6','31ad2456-08c1-4650-ac83-609bd23a9124','b99ff798-9895-43e1-8204-8d1eadc72142','2025-12-23 06:18:58');
/*!40000 ALTER TABLE `firm_accountants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `firms`
--

DROP TABLE IF EXISTS `firms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `firms` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `owner_id` varchar(36) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_firms_owner_id` (`owner_id`),
  CONSTRAINT `firms_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firms`
--

LOCK TABLES `firms` WRITE;
/*!40000 ALTER TABLE `firms` DISABLE KEYS */;
INSERT INTO `firms` VALUES ('1ade022c-8b4b-48ca-9b52-982995706b99','sajeev\'s Firm','5f2061aa-50fe-47ab-b9ee-52db871c7ffc',NULL,NULL,'2026-01-23 08:49:38','2026-01-23 08:49:38'),('31ad2456-08c1-4650-ac83-609bd23a9124','harri\'s Firm','291cb463-afa9-4dfd-b0d5-77a98e1bd85a',NULL,NULL,'2025-12-23 05:41:15','2025-12-23 05:41:15'),('55e93251-9f56-4836-a568-531e0ae02131','New Firm\'s Firm','fd7c1164-839a-4a0b-8054-5983a8388521',NULL,NULL,'2026-02-11 05:21:45','2026-02-11 05:21:45'),('89d91054-ce2f-4edb-8dfc-9993af2e3d37','test\'s Firm','dc637423-fd4c-4453-924d-b8549df8475d',NULL,NULL,'2025-12-23 10:08:49','2025-12-23 10:08:49'),('ed056875-fda5-45db-8c95-160a0afa38e1','test\'s Firm','e5e61f6b-0fea-41b3-9cc6-88a730c5dcc4',NULL,NULL,'2025-12-26 03:18:41','2025-12-26 03:18:41');
/*!40000 ALTER TABLE `firms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invite_tokens`
--

DROP TABLE IF EXISTS `invite_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  KEY `idx_invite_tokens_token` (`token`),
  CONSTRAINT `invite_tokens_ibfk_1` FOREIGN KEY (`firm_id`) REFERENCES `firms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invite_tokens_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invite_tokens`
--

LOCK TABLES `invite_tokens` WRITE;
/*!40000 ALTER TABLE `invite_tokens` DISABLE KEYS */;
INSERT INTO `invite_tokens` VALUES ('008abe99-37e7-41da-b9e1-a86e066564af','9cd3e224-8410-4fb0-968f-3f75fbf5523c','31ad2456-08c1-4650-ac83-609bd23a9124','vekonag207@cameltok.com','accountant','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2026-01-03 22:59:15',NULL,'2026-01-02 03:29:15'),('029391ba-12d8-4902-aa21-8b21b0f09ae5','193eaf98-a73c-4de5-8c9a-007693506cac','31ad2456-08c1-4650-ac83-609bd23a9124','lemonappservice@gmail.com','client','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-25 01:28:04',NULL,'2025-12-23 05:58:04'),('087f4b94-4e31-406c-a926-b46d308a6de4','8be1ed5b-8a51-48d5-b22a-1d6065ca9b0d','31ad2456-08c1-4650-ac83-609bd23a9124','yocej39905@fftube.com','client','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-24 07:50:30','2025-12-24 07:50:30','2025-12-24 07:49:43'),('08d0f5f1-cc4a-4c7e-8733-f6f101d2bddd','e4731424-42f1-4fe3-9d8c-8cedf235d48d','31ad2456-08c1-4650-ac83-609bd23a9124','lemonappservice@gmail.com','client','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-23 06:07:35','2025-12-23 06:07:35','2025-12-23 06:07:07'),('2d1331dc-1159-484b-a42b-76a88b342c51','06ef9e09-c470-4523-b40e-acdf86edfefd','31ad2456-08c1-4650-ac83-609bd23a9124','lemonappservice@gmail.com','client','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-25 01:33:13',NULL,'2025-12-23 06:03:13'),('2e3cd627-e295-46f8-b45b-2c1adb08b283','6d2767c7-5bd5-4bb4-944c-ef3dab199ae7','31ad2456-08c1-4650-ac83-609bd23a9124','sameedha@ontomatrix.com','accountant','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-25 05:17:03',NULL,'2025-12-23 09:47:03'),('3a836b6d-dfa9-4e10-aff4-576025739a8a','48ca0f40-6109-47b5-b4dd-1296839ffcfe','31ad2456-08c1-4650-ac83-609bd23a9124','service@ontomatrix.com','accountant','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-26 02:28:20',NULL,'2025-12-24 06:58:20'),('7c35aee9-49d2-41fe-a0e8-a7fa6d8bed7e','30955675-4d4f-496f-96b9-101430c62ce7','31ad2456-08c1-4650-ac83-609bd23a9124','vekonag207@cameltok.com','client','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-30 07:14:00','2025-12-30 07:14:00','2025-12-30 07:13:32'),('8e5ebc67-eece-46bd-a155-6ac4bbf8faa4','c0af26e1-454b-4520-8245-3f0379b3ff2f','31ad2456-08c1-4650-ac83-609bd23a9124','kebiniw227@cameltok.com','accountant','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2026-01-02 03:30:43','2026-01-02 03:30:43','2026-01-02 03:30:11'),('a0856fe1-c1e5-4042-acd7-e3cc5bfa86bd','b9bc3522-ba02-4ecb-aee5-bee58f656298','31ad2456-08c1-4650-ac83-609bd23a9124','riraset121@cameltok.com','client','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2026-01-02 04:00:02','2026-01-02 04:00:02','2026-01-02 03:59:40'),('b173dc09-3eb8-4c6c-82e8-e0aa5fac9dc9','bc5df910-d3ce-463c-a14c-f7c0ea124444','31ad2456-08c1-4650-ac83-609bd23a9124','lemonappservice@gmail.com','accountant','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-23 06:10:56','2025-12-23 06:10:56','2025-12-23 06:09:58'),('eaaea1bd-d1b7-49c9-b2b9-28220b5befda','bf902e01-b6de-4514-a603-77fd7ed4a2ec','31ad2456-08c1-4650-ac83-609bd23a9124','lemonappservice@gmail.com','accountant','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-23 06:18:58','2025-12-23 06:18:58','2025-12-23 06:18:45'),('ed18ea38-14ff-42b1-aa43-2cab23a4adf4','abaf591d-4071-4a84-93e3-7d5430ad0465','31ad2456-08c1-4650-ac83-609bd23a9124','lemonappservice@gmail.com','accountant','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','2025-12-25 01:38:32',NULL,'2025-12-23 06:08:32');
/*!40000 ALTER TABLE `invite_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_attachments`
--

DROP TABLE IF EXISTS `message_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `message_attachments` (
  `id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` text NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_message_attachments_message` (`message_id`),
  CONSTRAINT `message_attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_attachments`
--

LOCK TABLES `message_attachments` WRITE;
/*!40000 ALTER TABLE `message_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_reads`
--

DROP TABLE IF EXISTS `message_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `message_reads` (
  `id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_message_user_read` (`message_id`,`user_id`),
  KEY `idx_message_reads_message` (`message_id`),
  KEY `idx_message_reads_user` (`user_id`),
  CONSTRAINT `message_reads_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_reads`
--

LOCK TABLES `message_reads` WRITE;
/*!40000 ALTER TABLE `message_reads` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_reads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_templates`
--

DROP TABLE IF EXISTS `message_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `message_templates` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'general',
  `template_type` enum('clarification','response','status','general') DEFAULT 'general',
  `subject` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_message_templates_type` (`template_type`),
  KEY `idx_message_templates_category` (`category`),
  CONSTRAINT `message_templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_templates`
--

LOCK TABLES `message_templates` WRITE;
/*!40000 ALTER TABLE `message_templates` DISABLE KEYS */;
INSERT INTO `message_templates` VALUES ('5817e799-f2ae-11f0-a131-3a33530523a0','Clarification Request','workflow','clarification','Clarification Needed','I need additional information regarding {document_name}. Please provide: {specific_requirements}',NULL,NULL,1,'2026-01-16 07:38:26'),('5819371a-f2ae-11f0-a131-3a33530523a0','Document Approved','workflow','status','Document Approved','Your document \"{document_name}\" has been approved and processed successfully.',NULL,NULL,1,'2026-01-16 07:38:26'),('58193835-f2ae-11f0-a131-3a33530523a0','Document Rejected','workflow','status','Document Requires Revision','Your document \"{document_name}\" requires revision. Please review the following feedback: {feedback}',NULL,NULL,1,'2026-01-16 07:38:26'),('581938f3-f2ae-11f0-a131-3a33530523a0','Client Response Acknowledgment','communication','response','Thank you for your response','Thank you for your response regarding \"{document_name}\". We have received your message and will review it shortly.',NULL,NULL,1,'2026-01-16 07:38:26'),('58193989-f2ae-11f0-a131-3a33530523a0','General Inquiry','communication','general','General Inquiry','I have a question regarding: {topic}',NULL,NULL,0,'2026-01-16 07:38:26'),('64a73c71-f10e-11f0-9eed-f83dc63604a0','Clarification Request','workflow','clarification','Clarification Needed','I need additional information regarding {document_name}. Please provide: {specific_requirements}',NULL,NULL,1,'2026-01-14 06:00:56'),('64a75660-f10e-11f0-9eed-f83dc63604a0','Document Approved','workflow','status','Document Approved','Your document \"{document_name}\" has been approved and processed successfully.',NULL,NULL,1,'2026-01-14 06:00:56'),('64a7570d-f10e-11f0-9eed-f83dc63604a0','Document Rejected','workflow','status','Document Requires Revision','Your document \"{document_name}\" requires revision. Please review the following feedback: {feedback}',NULL,NULL,1,'2026-01-14 06:00:56'),('64a75781-f10e-11f0-9eed-f83dc63604a0','Client Response Acknowledgment','communication','response','Thank you for your response','Thank you for your response regarding \"{document_name}\". We have received your message and will review it shortly.',NULL,NULL,1,'2026-01-14 06:00:56'),('64a757f6-f10e-11f0-9eed-f83dc63604a0','General Inquiry','communication','general','General Inquiry','I have a question regarding: {topic}',NULL,NULL,0,'2026-01-14 06:00:56'),('6cbb2065-f10e-11f0-9eed-f83dc63604a0','Clarification Request','workflow','clarification','Clarification Needed','I need additional information regarding {document_name}. Please provide: {specific_requirements}',NULL,NULL,1,'2026-01-14 06:01:10'),('6cbb3b55-f10e-11f0-9eed-f83dc63604a0','Document Approved','workflow','status','Document Approved','Your document \"{document_name}\" has been approved and processed successfully.',NULL,NULL,1,'2026-01-14 06:01:10'),('6cbb3c18-f10e-11f0-9eed-f83dc63604a0','Document Rejected','workflow','status','Document Requires Revision','Your document \"{document_name}\" requires revision. Please review the following feedback: {feedback}',NULL,NULL,1,'2026-01-14 06:01:10'),('6cbb3c83-f10e-11f0-9eed-f83dc63604a0','Client Response Acknowledgment','communication','response','Thank you for your response','Thank you for your response regarding \"{document_name}\". We have received your message and will review it shortly.',NULL,NULL,1,'2026-01-14 06:01:10'),('6cbb3ce1-f10e-11f0-9eed-f83dc63604a0','General Inquiry','communication','general','General Inquiry','I have a question regarding: {topic}',NULL,NULL,0,'2026-01-14 06:01:10');
/*!40000 ALTER TABLE `message_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` varchar(36) NOT NULL,
  `conversation_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `recipient_id` varchar(36) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `message_type` enum('text','system','clarification','response','status_update') DEFAULT 'text',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `status` enum('sent','delivered','read') DEFAULT 'sent',
  `parent_message_id` varchar(36) DEFAULT NULL,
  `document_id` varchar(36) DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_messages_conversation` (`conversation_id`),
  KEY `idx_messages_sender` (`sender_id`),
  KEY `idx_messages_recipient` (`recipient_id`),
  KEY `idx_messages_parent` (`parent_message_id`),
  KEY `idx_messages_document` (`document_id`),
  KEY `idx_messages_created` (`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`),
  CONSTRAINT `messages_ibfk_4` FOREIGN KEY (`parent_message_id`) REFERENCES `messages` (`id`),
  CONSTRAINT `messages_ibfk_5` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES ('50638d9b-e670-491b-a4f8-b0cb3ab69854','3c96e29e-06c4-4d21-b909-07fe49df19a9','111800bf-1036-4200-b759-9b6ab28f2eed','163e4d29-1ab0-4a79-be78-993525831e6d',NULL,'This is a test message from the API test script','text','normal','sent',NULL,NULL,NULL,NULL,'2026-01-16 07:43:52','2026-01-16 07:43:52'),('5f20a391-fedb-4269-b812-95165e25d37c','ca33c75b-2d78-4480-8d5f-07f2f05fd16f','111800bf-1036-4200-b759-9b6ab28f2eed','163e4d29-1ab0-4a79-be78-993525831e6d',NULL,'This is a test message from the API test script','text','normal','sent',NULL,NULL,NULL,NULL,'2026-01-14 06:33:44','2026-01-14 06:33:44'),('63285598-7df8-4abb-a954-35acaf3aa476','8725b866-55bf-473c-a3d6-a4790d6ff614','111800bf-1036-4200-b759-9b6ab28f2eed','163e4d29-1ab0-4a79-be78-993525831e6d',NULL,'This is a test message from the API test script','text','normal','sent',NULL,NULL,NULL,NULL,'2026-01-16 07:40:18','2026-01-16 07:40:18');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_conversation_last_message` AFTER INSERT ON `messages` FOR EACH ROW BEGIN

            UPDATE conversations

            SET last_message_at = NEW.created_at,

                updated_at = NEW.created_at

            WHERE id = NEW.conversation_id;

        END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  KEY `idx_notifications_user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('0d1899d8-e33e-4eda-8140-c73fd3041914','111800bf-1036-4200-b759-9b6ab28f2eed','Document clarification needed','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: cccccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-14 06:05:33'),('0ec52fee-0faa-4647-8fa7-76810a629739','111800bf-1036-4200-b759-9b6ab28f2eed','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": adawdaw','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-14 06:48:50'),('11779905-3b84-4964-bfa2-dcdb37b3ab30','111800bf-1036-4200-b759-9b6ab28f2eed','Reminder: asdasd','asdasdas',NULL,1,'2026-02-11 05:04:52'),('11d6b840-a732-4cf0-9e42-6c8401fa521f','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": Firm Owner\n\n','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 07:01:55'),('179b6eea-0ed2-4e50-9e2a-beb70abfcf65','111800bf-1036-4200-b759-9b6ab28f2eed','Reminder: time11.34','time11.34',NULL,0,'2026-02-11 06:04:05'),('19a184cd-7983-4c69-868f-01332ee23cf1','111800bf-1036-4200-b759-9b6ab28f2eed','Document clarification needed','Clarification needed for Balance-Sheet-Example.pdf: CHECK THIS','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-23 04:20:35'),('1a714071-5a34-48d1-87fa-0b93ac33093c','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi client only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 05:15:11'),('1a9c7ddc-2426-4ae0-9cca-44b39d982c42','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Document Clarification Request - aaa','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: cccccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 04:18:46'),('1f5d055b-1aab-4c0d-a544-6c84a622e985','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification for Balance-Sheet-Example.pdf (Client)','Clarification needed for Balance-Sheet-Example.pdf: its not clear, do you have different document\n','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:25:52'),('2031216e-1a21-4695-aefa-c6faaa93b98e','b99ff798-9895-43e1-8204-8d1eadc72142','Reminder: ASDASDA','ASDASDASD',NULL,1,'2026-01-06 07:40:27'),('213cb3cb-389f-4fa7-a848-1d163f514f78','111800bf-1036-4200-b759-9b6ab28f2eed','Document clarification needed','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: cccccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-14 06:14:21'),('22b3b73f-2be7-478f-871b-24bf082308be','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": firm','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:05:53'),('26617356-5ba5-4139-974d-09a78000bc16','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi firm only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:23:34'),('2ac11c80-a8d8-4c48-b0f4-b6ccab775030','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi client only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 05:23:13'),('2de059f6-2be3-47ef-aa8f-b6c576be6beb','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": ttttttt','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:01:55'),('2ee92b16-294f-4900-a6ca-8f3e1bceff3b','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Request Needs Revision','Your clarification request for \"Balance-Sheet-Example.pdf\" needs revision. Feedback: dsfdsf',NULL,1,'2026-01-23 05:04:40'),('2ef88bce-a38d-42e9-b83e-42f42dfd1693','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"CasuarinaTreetheHotel.jpg\": swdqaewdd','fd2e2d14-50ef-4ca5-ad75-e06251026fa5',0,'2026-01-23 06:53:17'),('2f79cff1-d7f7-45fa-be61-a87a2f869ffb','b99ff798-9895-43e1-8204-8d1eadc72142','Client Response','Client responded regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": wqdeqw','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 04:22:19'),('30b823f2-89e4-42d6-bd57-b39eeccd25ab','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Document Clarification Request - aaa','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: fdasfdasfdf','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 04:19:42'),('32635843-a7f9-4ef0-8510-cd4b247d2d7a','111800bf-1036-4200-b759-9b6ab28f2eed','Document clarification needed','Clarification needed for Balance-Sheet-Example.pdf: hihhi','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:23:50'),('38898017-7622-4551-9ad6-d8ee80211641','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Client Joined','aaa has joined your firm (abc).',NULL,0,'2026-01-02 04:00:02'),('39255970-beaf-4385-9d4b-97256c53a148','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Request Needs Revision','Your clarification request for \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\" needs revision. Feedback: wqe',NULL,1,'2026-01-23 06:53:27'),('3c9ae329-62f1-4923-95fb-940d1366f0f9','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": asdasdasd','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:04:15'),('3f7dd024-28d6-4ea5-a48d-9801294cfdcf','b99ff798-9895-43e1-8204-8d1eadc72142','Reminder: aaa','aaa',NULL,1,'2026-01-23 05:54:17'),('41a4df73-6c4a-4324-b74f-af6743f2bcfe','b99ff798-9895-43e1-8204-8d1eadc72142','New Message from Client','Client sent a message regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": oh okay','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-14 06:36:14'),('41c0a4f8-3933-435e-a781-566504ef698f','b99ff798-9895-43e1-8204-8d1eadc72142','Client Response','Client responded regarding \"Balance-Sheet-Example.pdf\": wqweqweqweqw','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-23 04:22:29'),('44649684-66ec-4d36-9db2-00d2cf03ddb1','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": Firm Owner','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 06:53:37'),('4484d877-4177-4c5b-9f8d-44703ca90203','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi firm only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:15:28'),('46b6b250-c61b-4eeb-a1ed-712a2978881f','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Document Clarification Request - aaa','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: cccccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 08:47:15'),('489f91ba-e36b-421f-af31-e29c7962702b','b99ff798-9895-43e1-8204-8d1eadc72142','Response from Firm','Firm responded to clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": 3rfaerfadesrasf','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-16 07:06:52'),('4978867b-c2ff-47a9-a4f2-d555259d8e93','b99ff798-9895-43e1-8204-8d1eadc72142','Client Response','Client responded regarding \"Balance-Sheet-Example.pdf\": ok what','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:14:45'),('4cdc81a6-4bd5-4101-a94e-0b3e1c1fa2b2','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": asdasdas','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:03:59'),('4fb6b197-7760-41ff-8163-638727b7912c','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Reply from Client','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hhh (1 file attached)','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 06:48:06'),('50cb6d9e-6ff9-4e0c-a369-6b48da0f27d4','b99ff798-9895-43e1-8204-8d1eadc72142','Response from Firm','Firm responded to clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": qdqesqw','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-16 07:14:12'),('518de77a-a32c-436e-99b5-c5bee0a03596','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Reviewed','Your clarification request for \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\" has been reviewed by the firm',NULL,1,'2026-01-23 04:19:22'),('5362a26f-90c8-4405-a10d-c5cae2fb8539','b99ff798-9895-43e1-8204-8d1eadc72142','Response from Firm','Firm responded to clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": dsfsdfsdf','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-16 08:00:20'),('544217ab-7c70-4a68-abe9-54a537ad394a','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": asdasd','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 05:03:51'),('5702ac11-a99f-4925-9471-313f015614e9','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification for Balance-Sheet-Example.pdf (Client)','Clarification needed for Balance-Sheet-Example.pdf: test','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:08:36'),('57726e81-9843-4780-9f40-81287f47818c','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": client','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 05:05:47'),('5855293c-3cb8-4170-8635-51079d6ada72','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": asdasdasdas','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:01:41'),('5c726576-feec-431f-b5fc-c73806ee71b3','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi client only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 05:26:34'),('5e749f47-045c-4193-89d5-816ecb825d35','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": asdasdasd','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:55:20'),('5fe91564-560d-4df2-8fc3-bd98424cdf6e','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": axdasdasdasd','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:45:42'),('612e6322-9026-45f0-adda-540b952b5496','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Client Joined','test has joined your firm (abc).',NULL,0,'2025-12-30 07:14:00'),('62145bdf-a9b7-4aa9-b269-a55f199659d7','b99ff798-9895-43e1-8204-8d1eadc72142','Client Response','Client responded regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": swdd','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 04:21:56'),('62eade11-3361-440d-bb44-fd4bfbee609c','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi firm only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:26:19'),('6368c6b2-6394-4833-8405-e1a840b1755d','111800bf-1036-4200-b759-9b6ab28f2eed','Reminder: time 11.25','time 11.25',NULL,1,'2026-02-11 05:58:11'),('64592478-3557-42cf-9004-b4899bcc15f2','111800bf-1036-4200-b759-9b6ab28f2eed','Document clarification needed','Clarification needed for Balance-Sheet-Example.pdf: TIME','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:39:49'),('65ec39b4-780b-4416-a53d-2d008124b640','b99ff798-9895-43e1-8204-8d1eadc72142','Client Response','Client responded regarding \"Balance-Sheet-Example.pdf\": hi','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:33:32'),('68e09480-08ef-41f5-9430-9bc7192c5b23','b99ff798-9895-43e1-8204-8d1eadc72142','Reply to Clarification Request','Regarding your clarification request for \"Balance-Sheet-Example.pdf\": okay 123456','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-14 05:47:41'),('6f1eafbe-1a3a-4bf4-9ea0-fa3702327630','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Document Clarification Request - aaa','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: cccccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-14 06:14:28'),('6f5e0123-318e-4496-ae25-704651c72a5e','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Reviewed','Your clarification request for \"Balance-Sheet-Example.pdf\" has been reviewed by the firm',NULL,1,'2026-01-23 04:19:24'),('722aae2b-0bcf-43ba-a7e6-30e75ab7537c','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": asdasdasdasds','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:02:00'),('72823e76-ac45-4f25-8635-4c482933878c','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi firm only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:28:24'),('73703956-2f47-4f56-b3e2-0369e374a5f5','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Document Clarification Request - aaa','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: ccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-14 05:56:04'),('7439a0f2-b9e5-47f7-a0fc-45fd65501682','b99ff798-9895-43e1-8204-8d1eadc72142','Reminder: TTTTT','TTTT',NULL,1,'2026-01-06 08:06:38'),('7522cadc-3409-4d6c-b7bd-bc1fdba7777c','163e4d29-1ab0-4a79-be78-993525831e6d','Document posted','Your document has been posted successfully','a165f777-ebe1-44c8-83aa-87336e149a20',0,'2025-12-24 07:58:38'),('756b5aaa-937b-4ac9-8e84-4ed57909f6f4','b99ff798-9895-43e1-8204-8d1eadc72142','Response from Firm','Firm responded to clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": edfaefed','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-16 07:02:30'),('784137db-c97d-42bd-9852-0865314849dd','b99ff798-9895-43e1-8204-8d1eadc72142','New Message from Client','Client sent a message regarding \"Balance-Sheet-Example.pdf\": ttt','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:59:38'),('7ca50927-9651-4a59-8dfd-29234939ff76','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": 4444','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:02:35'),('7ffb675c-aae1-461b-88c6-f3c3b336a5cc','b99ff798-9895-43e1-8204-8d1eadc72142','New Message from Client','Client sent a message regarding \"Balance-Sheet-Example.pdf\": aaaaa','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:12:31'),('83d47ea0-8cfa-497c-80cb-24f2f945e156','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification for Balance-Sheet-Example.pdf (Client)','Clarification needed for Balance-Sheet-Example.pdf: hi','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:41:32'),('845b71b2-43a1-45a8-8671-881c38770dae','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": wdasdqaw','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-14 06:34:44'),('8a4df357-f977-46d7-84bc-420376057b0c','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": adasdasdas','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:48:46'),('8c9f740b-20c9-49c0-9907-958fa4231b5a','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification for Balance-Sheet-Example.pdf (Client)','Clarification needed for Balance-Sheet-Example.pdf: test','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:07:01'),('91cc1b79-a4a0-4150-8aae-ad0b649ad885','b99ff798-9895-43e1-8204-8d1eadc72142','Reminder: aaa','aaa',NULL,1,'2026-01-23 05:53:47'),('95f6ba03-07d8-48e1-920b-2632db3f1360','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi firm only message - new','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:29:30'),('9ad39fbe-e68a-4f5e-8519-b4c7787ff6c1','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Document Clarification Request - aaa','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: cccccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-14 06:20:04'),('9e2574b6-192e-426f-baf1-1e92ed780d55','b99ff798-9895-43e1-8204-8d1eadc72142','Reply to Clarification Request','Regarding your clarification request for \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": asdasdas','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 04:19:59'),('a39a0d4d-af2d-4b79-aaa2-f6bf5cf51341','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": dasdasdas','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:03:21'),('a5730239-5e25-4a53-80ef-f33dcdc5615f','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Reviewed','Your clarification request for \"Balance-Sheet-Example.pdf\" has been reviewed by the firm',NULL,1,'2026-01-23 04:19:25'),('a6fb6a8a-4007-4b8c-ae0c-4be105a07ec5','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": WEWCeqe','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 07:14:43'),('a702343a-ae1f-4996-b9f6-8dc336857b20','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi firm only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:20:18'),('a871bf7f-c2c6-4012-b40e-a5bd9d0c076f','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification Request from Accountant','Regarding \"CasuarinaTreetheHotel.jpg\": noo','fd2e2d14-50ef-4ca5-ad75-e06251026fa5',1,'2026-01-23 06:50:53'),('ad1a1d1f-117c-4c75-b825-08f3b5e0afab','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification for Balance-Sheet-Example.pdf (Client)','Clarification needed for Balance-Sheet-Example.pdf: ok will check\n','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:28:57'),('ad580365-fa02-4674-b074-998a15246419','b99ff798-9895-43e1-8204-8d1eadc72142','Client Response','Client responded regarding \"Balance-Sheet-Example.pdf\": ok will check\n','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:26:23'),('af5288f8-1fee-4905-a71c-dbfea151b730','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": adfadadasdasdasd','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 07:06:05'),('afe89dec-bff4-4d14-8f56-d48d59736a73','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Request Needs Revision','Your clarification request for \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\" needs revision. Feedback: dfsfsf',NULL,1,'2026-01-23 06:54:39'),('b0f9d6cf-327f-45ce-95ba-c9d0163c364b','b99ff798-9895-43e1-8204-8d1eadc72142','Reply to Clarification Request','Regarding your clarification request for \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": rgdrfegterg','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-14 06:08:14'),('b1611de6-0884-4291-960f-ce42d5ea99fc','b99ff798-9895-43e1-8204-8d1eadc72142','Reminder: ascascdd','dasdasda',NULL,1,'2026-01-23 05:53:48'),('b5eaae2e-b7bc-42ec-a213-ae9a66061b43','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Request Needs Revision','Your clarification request for \"Balance-Sheet-Example.pdf\" needs revision. Feedback: aASA',NULL,1,'2026-01-06 07:35:49'),('b60a085e-b0f7-4a7b-a469-9382da709396','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi client only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 05:19:45'),('b761aef5-d0bd-463a-be7a-f096dc4d4381','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"CasuarinaTreetheHotel.jpg\": dadasd','fd2e2d14-50ef-4ca5-ad75-e06251026fa5',0,'2026-01-23 06:51:27'),('b78eb44a-3323-43be-90f8-2e3a15220d95','b99ff798-9895-43e1-8204-8d1eadc72142','Reminder: asdas','dasdasdas',NULL,1,'2026-01-23 05:59:41'),('b938a8ee-2a01-4ef5-87db-f3bda5647297','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": asdasdasd','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:46:48'),('c0fa31c6-be07-4444-914e-199aa0395a78','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": aaaa','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-14 06:40:58'),('c2970285-b1d6-43cd-b7e2-582926de7eec','111800bf-1036-4200-b759-9b6ab28f2eed','Document clarification needed','Clarification needed for Balance-Sheet-Example.pdf: hi','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:22:44'),('c331f908-b947-4c9c-9f73-711efb8cd1a0','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": sasdasdadas','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:05:37'),('c3b87146-0bf2-42b8-99bd-c89700ef33fd','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": sdadsdads','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:53:28'),('c4e22841-1c2b-43be-a614-083c8111b255','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": zxccxzcz','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:05:54'),('c56a62ab-e10a-4d60-9a48-bc27a84e4070','b99ff798-9895-43e1-8204-8d1eadc72142','Reply to Clarification Request','Regarding your clarification request for \"Balance-Sheet-Example.pdf\": qweqwe','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 07:29:27'),('c6b4ee5b-1e19-4443-b97f-53e1c260beb7','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": asdqaswdqwdeqw','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 07:08:15'),('c835f0bb-5dca-421e-ad15-cb61e4d79cf4','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": Firm Owner','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 06:43:45'),('ca0478f3-8b94-44fe-a62b-04b66f4938a2','b99ff798-9895-43e1-8204-8d1eadc72142','Reminder: sadasds','asdasdasdas',NULL,1,'2026-01-23 05:37:40'),('cb200b72-16e1-415b-9dbf-ac5f24e8c1a2','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Accountant Joined','aaa has joined your firm.',NULL,0,'2026-01-02 03:30:43'),('cf8d7a38-dcfb-4b74-a28e-eb6091550ba1','163e4d29-1ab0-4a79-be78-993525831e6d','New Message from Accountant','Accountant sent a message regarding \"Ontomatrix Property Sheet.pdf\": adasdasd','a165f777-ebe1-44c8-83aa-87336e149a20',0,'2026-01-14 06:28:08'),('d36435c3-fc53-4b20-9c09-44cc8d749480','b99ff798-9895-43e1-8204-8d1eadc72142','Client Response','Client responded regarding \"Balance-Sheet-Example.pdf\": CHECK THIS (1 file attached)','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 08:26:37'),('d53ccf76-0e51-4ee7-809d-a369fdb197f3','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": qwdqwdeqw','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:56:43'),('d87931d6-a3de-4218-8a2f-81b64d21d8d9','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Reply from Client','Regarding \"Untitleddesign29.jpeg\": [Re-uploaded document] weqw','fd2e2d14-50ef-4ca5-ad75-e06251026fa5',1,'2026-01-23 06:53:45'),('dadcedd9-9eaf-47b7-b15f-d2a155b687ba','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification for Balance-Sheet-Example.pdf (Client)','Clarification needed for Balance-Sheet-Example.pdf: test','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 05:33:13'),('df8cda72-925d-46f5-ab4f-c6d2f632c9c8','111800bf-1036-4200-b759-9b6ab28f2eed','Reminder: asdasd','asdasd',NULL,1,'2026-02-11 05:50:48'),('e0225859-52f5-4147-909f-0e4d9c91c26d','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Document Clarification Request - aaa','Clarification needed for Balance-Sheet-Example.pdf: hihhi','08fa3717-5abb-492b-89c0-04009a11265f',0,'2026-01-06 07:24:18'),('e3ac690d-20c3-4305-a33f-d53c79142b83','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": sdasdasdfasrvewrvewrvewrvewrewrewrqvw','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 07:04:56'),('e859ba20-3140-4cfe-b102-8858891a52fd','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": acaaadas','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:07:24'),('ea308bc1-cdb2-47d1-9685-c2ffdc32fa5c','b99ff798-9895-43e1-8204-8d1eadc72142','Clarification Reply from Firm','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": ssfdsfdsf','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 05:04:52'),('ec67af07-e39e-4e8e-982d-5ba3de41a290','b99ff798-9895-43e1-8204-8d1eadc72142','Document Re-uploaded','Client has re-uploaded document \"Untitleddesign29.jpeg\" in response to clarification request. Previous clarification history has been preserved.','fd2e2d14-50ef-4ca5-ad75-e06251026fa5',1,'2026-01-23 06:53:45'),('ecefc17d-8fa8-47d7-a198-01819433a49f','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi firm only message','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-23 05:23:09'),('ed25879c-2852-41a5-b176-96b05b44c628','111800bf-1036-4200-b759-9b6ab28f2eed','Reminder: time11.32','time11.32',NULL,0,'2026-02-11 06:02:26'),('f32722fe-c11a-48bc-82a0-50ec74c2e357','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": wecwdeweqweqwecqweqw','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 08:00:37'),('f486188f-fdad-4d35-bf1f-e638d61d6854','111800bf-1036-4200-b759-9b6ab28f2eed','Clarification Request from Accountant','Regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": hi client only message - new','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-23 05:28:48'),('f748ea7f-a927-4abe-b502-78e863fff05e','111800bf-1036-4200-b759-9b6ab28f2eed','Document clarification needed','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: cccccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-16 08:51:04'),('f889e1e2-dbb8-4972-a4ff-0a3ea96d8dc2','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','Document Clarification Request - aaa','Clarification needed for ChatGPT Image Jan 5, 2026, 12_37_43 PM.png: cccccc','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-14 06:01:35'),('f8f57536-07cd-4f23-b160-c8a90923d92c','111800bf-1036-4200-b759-9b6ab28f2eed','New Message from Accountant','Accountant sent a message regarding \"Balance-Sheet-Example.pdf\": asdasdasdasdas','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-06 06:59:47'),('f98c3495-40f4-462e-bf53-2f7beb2009d5','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": ewwwewe','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 07:55:26'),('fde6177d-7f06-4688-a48b-b9f8864cbddc','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": Firm Owner','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',0,'2026-01-16 06:49:55'),('fe9a8919-7204-451e-9274-b1e760542ef2','111800bf-1036-4200-b759-9b6ab28f2eed','New Clarification from Accountant','Accountant sent a clarification regarding \"ChatGPT Image Jan 5, 2026, 12_37_43 PM.png\": Client (aaa)','a34dd5e1-b902-48ff-857d-a4d2bc3be5ae',1,'2026-01-16 06:43:38'),('fefca633-a2fe-47fa-aeb2-3fb7f6d5adfb','111800bf-1036-4200-b759-9b6ab28f2eed','New Clarification from Accountant','Accountant sent a clarification regarding \"Balance-Sheet-Example.pdf\": adsdadas','08fa3717-5abb-492b-89c0-04009a11265f',1,'2026-01-16 07:46:19');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES ('07705a4a-d480-4118-a0a8-b840056589dc','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','7df18c8b-6b15-4a07-84fb-90a2c43c870e','2026-01-02 03:47:37','2026-01-02 03:47:37','2026-01-02 03:44:49'),('12d16f10-bdab-4449-a759-3da9f6b6b10c','fd7c1164-839a-4a0b-8054-5983a8388521','5927d6ce-6426-4633-a1aa-e686ab50d654','2026-02-11 05:37:43','2026-02-11 05:37:43','2026-02-11 05:34:54'),('39153b63-840d-4aec-b7f1-3ee226758e0f','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','893856f8-ad87-427f-ba06-b0ac66a100d0','2026-01-02 03:44:49','2026-01-02 03:44:49','2026-01-02 03:41:46'),('3b804121-81d5-437a-9ca7-9bec1dfab582','fd7c1164-839a-4a0b-8054-5983a8388521','6e5cd70d-fb2a-4960-adfc-2c79860919cd','2026-02-11 06:37:44',NULL,'2026-02-11 05:37:44'),('4cc527c6-be9e-41ba-80e8-fc3fe347860d','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','d8cc6745-15e0-409e-90c9-63a2e9c2f046','2026-01-02 03:53:41','2026-01-02 03:53:41','2026-01-02 03:53:27'),('8a4019ac-b5b8-4af2-9467-78cf7a34b346','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','4060c739-067b-49a8-aa75-1257137b104a','2026-02-11 05:02:05','2026-02-11 05:02:05','2026-02-11 05:00:15'),('8c5a0aa9-5e08-4a1c-b990-abe0b79f7bee','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','79891e43-6166-4eef-9e02-2aae2ea26f67','2026-01-02 03:49:31','2026-01-02 03:49:31','2026-01-02 03:49:18'),('d56e8a82-db1d-46a6-b4d2-39a296998268','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','918f24e0-6f52-46fe-94f2-3bd406633a38','2026-01-23 06:02:36','2026-01-23 06:02:36','2026-01-23 05:40:52'),('d8f99515-abe5-484b-907b-8b40a6cfda84','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','f655d706-2a7e-4770-b7c4-25423614e77f','2026-02-11 06:02:06',NULL,'2026-02-11 05:02:06'),('de72a113-c2a8-4c2e-871b-01e83d5612ff','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','3eb70f49-b2a9-4c63-bde0-44b3097e1ffa','2026-01-23 06:02:52','2026-01-23 06:02:52','2026-01-23 06:02:36');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminders`
--

DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reminders` (
  `id` varchar(36) NOT NULL,
  `firm_id` varchar(36) NOT NULL,
  `created_by` varchar(36) NOT NULL,
  `recipient_type` enum('client','accountant') NOT NULL,
  `recipient_id` varchar(36) NOT NULL,
  `recipient_user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `status` enum('pending','sent','cancelled') DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `recurrence_type` varchar(20) NOT NULL DEFAULT 'none',
  `recurrence_end_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scheduled` (`scheduled_at`,`status`),
  KEY `idx_firm` (`firm_id`),
  KEY `idx_recipient` (`recipient_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminders`
--

LOCK TABLES `reminders` WRITE;
/*!40000 ALTER TABLE `reminders` DISABLE KEYS */;
INSERT INTO `reminders` VALUES ('081cb013-e69b-4efd-9c5a-0212113e0e47','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','client','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','111800bf-1036-4200-b759-9b6ab28f2eed','asdasd','asdasdas','2026-02-11 10:34:51','sent','2026-02-11 10:34:51','2026-02-11 05:04:51','2026-02-11 05:04:51','none',NULL),('0ddce011-64a6-4e42-bc3d-e3e3f663a0a8','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','accountant','b99ff798-9895-43e1-8204-8d1eadc72142','b99ff798-9895-43e1-8204-8d1eadc72142','aaa','aaa','2026-01-23 11:21:00','sent','2026-01-23 11:23:47','2026-01-23 05:50:14','2026-01-23 05:53:47','none',NULL),('0e340472-7215-40ba-af5f-893ad19326e3','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','client','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','111800bf-1036-4200-b759-9b6ab28f2eed','time11.34','time11.34','2026-02-11 11:34:00','sent','2026-02-11 11:34:05','2026-02-11 06:03:59','2026-02-11 06:04:06','none',NULL),('3243c97c-7a40-4f87-ae3b-a6c5e41f5a9b','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','client','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','111800bf-1036-4200-b759-9b6ab28f2eed','asdasd','asdasd','2026-02-11 11:20:48','sent','2026-02-11 11:20:48','2026-02-11 05:50:48','2026-02-11 05:50:48','none',NULL),('580829b1-2c52-4fc6-b9a7-1c992b145ad3','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','accountant','b99ff798-9895-43e1-8204-8d1eadc72142','b99ff798-9895-43e1-8204-8d1eadc72142','asdas','dasdasdas','2026-01-23 11:29:41','sent','2026-01-23 11:29:41','2026-01-23 05:59:41','2026-01-23 05:59:41','none',NULL),('80dfc511-a300-403e-86fc-81cf166ff437','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','accountant','b99ff798-9895-43e1-8204-8d1eadc72142','b99ff798-9895-43e1-8204-8d1eadc72142','aaa','aaa','2026-01-23 11:25:00','sent','2026-01-23 11:24:16','2026-01-23 05:54:16','2026-01-23 05:54:16','none',NULL),('a0b04120-470d-45a8-91ea-b8c647fd3e57','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','client','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','111800bf-1036-4200-b759-9b6ab28f2eed','time11.32','time11.32','2026-02-11 11:32:00','sent','2026-02-11 11:32:26','2026-02-11 06:01:03','2026-02-11 06:02:26','none',NULL),('d30ed208-8ced-4ceb-9073-282122ce7bdd','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','accountant','b99ff798-9895-43e1-8204-8d1eadc72142','b99ff798-9895-43e1-8204-8d1eadc72142','ascascdd','dasdasda','2026-01-23 11:17:00','sent','2026-01-23 11:23:48','2026-01-23 05:47:20','2026-01-23 05:53:48','none',NULL),('eed61328-ec7f-404e-8f8f-f0f6ce31c2e6','31ad2456-08c1-4650-ac83-609bd23a9124','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','client','e482fc32-d2b1-407b-a9f3-c9eebc98edc1','111800bf-1036-4200-b759-9b6ab28f2eed','time 11.25','time 11.25','2026-02-11 11:25:00','sent','2026-02-11 11:28:11','2026-02-11 05:53:08','2026-02-11 05:58:11','none',NULL);
/*!40000 ALTER TABLE `reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_sessions_user_id` (`user_id`),
  KEY `idx_sessions_token` (`token`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('17e3811e-8fa0-4d23-b95d-9af5f4fd7722','163e4d29-1ab0-4a79-be78-993525831e6d','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTYzZTRkMjktMWFiMC00YTc5LWJlNzgtOTkzNTI1ODMxZTZkIiwiZW1haWwiOiJ5b2NlajM5OTA1QGZmdHViZS5jb20iLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY2NTYyNjI5LCJleHAiOjE3NjcxNjc0Mjl9.ibXS6mmiBmBEhDDepDLcFAg_qAz-Q2nZS0I575uY2G8','2025-12-31 03:20:29','2025-12-24 07:50:29'),('1a315db8-73bf-427a-a4ee-17d90bae2f77','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMjkxY2I0NjMtYWZhOS00ZGZkLWIwZDUtNzdhOThlMWJkODVhIiwiZW1haWwiOiJoYXJyaXNhZ2FyQG9udG9tYXRyaXguY29tIiwicm9sZSI6ImZpcm0iLCJpYXQiOjE3NjkxNTA3NjcsImV4cCI6MTc2OTc1NTU2N30.rx4r3w-0mXUToXtcJXm0turGDMdKqvx9khv7CJuarLk','2026-01-30 06:46:07','2026-01-23 06:46:07'),('2019d38c-47cb-418e-94b7-1fd8ccbecef1','b99ff798-9895-43e1-8204-8d1eadc72142','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYjk5ZmY3OTgtOTg5NS00M2UxLTgyMDQtOGQxZWFkYzcyMTQyIiwiZW1haWwiOiJsZW1vbmFwcHNlcnZpY2VAZ21haWwuY29tIiwicm9sZSI6ImFjY291bnRhbnQiLCJpYXQiOjE3NjczMjc2MDksImV4cCI6MTc2NzkzMjQwOX0.28yA1vHRngXhbyuKPWCCueiWxyzZozVDW3S4oniKoZs','2026-01-08 23:50:09','2026-01-02 04:20:09'),('412e24b0-f446-47c1-b4a3-8481505e364d','b99ff798-9895-43e1-8204-8d1eadc72142','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYjk5ZmY3OTgtOTg5NS00M2UxLTgyMDQtOGQxZWFkYzcyMTQyIiwiZW1haWwiOiJsZW1vbmFwcHNlcnZpY2VAZ21haWwuY29tIiwicm9sZSI6ImFjY291bnRhbnQiLCJpYXQiOjE3Njc2ODM4NjMsImV4cCI6MTc2ODI4ODY2M30.ol8DoA8_ZbOTtMCJr0QySCZ2syKCVEfDUo2bY55yAL0','2026-01-13 02:47:43','2026-01-06 07:17:43'),('50b8ef09-38a2-4428-99c2-6028c82508d1','b99ff798-9895-43e1-8204-8d1eadc72142','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYjk5ZmY3OTgtOTg5NS00M2UxLTgyMDQtOGQxZWFkYzcyMTQyIiwiZW1haWwiOiJsZW1vbmFwcHNlcnZpY2VAZ21haWwuY29tIiwicm9sZSI6ImFjY291bnRhbnQiLCJpYXQiOjE3NjcxNDkzOTcsImV4cCI6MTc2Nzc1NDE5N30.3ybmb46vIRGN8jZ63BGUClk_MQx74y3Jf-5STM0vnc8','2026-01-06 22:19:57','2025-12-31 02:49:57'),('5af51719-b2cc-498c-ad30-7117c3e567ec','111800bf-1036-4200-b759-9b6ab28f2eed','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTExODAwYmYtMTAzNi00MjAwLWI3NTktOWI2YWIyOGYyZWVkIiwiZW1haWwiOiJyaXJhc2V0MTIxQGNhbWVsdG9rLmNvbSIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3NjkxNDYyNjEsImV4cCI6MTc2OTc1MTA2MX0.8bprAWJGdl7LsgXJhG0MmiaZHdFVcrEXvC7JrzNbgfo','2026-01-30 01:01:01','2026-01-23 05:31:01'),('653ab735-ea2d-421e-aaa8-eb9ad67515a6','111800bf-1036-4200-b759-9b6ab28f2eed','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTExODAwYmYtMTAzNi00MjAwLWI3NTktOWI2YWIyOGYyZWVkIiwiZW1haWwiOiJyaXJhc2V0MTIxQGNhbWVsdG9rLmNvbSIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3Njc2ODc0NTcsImV4cCI6MTc2ODI5MjI1N30.nOOki3tnhrFI0H6-eAx0uqhSoVn1Z4GIykzVl_blhZo','2026-01-13 03:47:37','2026-01-06 08:17:37'),('7d9a7827-c179-4cf6-b0a6-616e71e50042','b99ff798-9895-43e1-8204-8d1eadc72142','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYjk5ZmY3OTgtOTg5NS00M2UxLTgyMDQtOGQxZWFkYzcyMTQyIiwiZW1haWwiOiJsZW1vbmFwcHNlcnZpY2VAZ21haWwuY29tIiwicm9sZSI6ImFjY291bnRhbnQiLCJpYXQiOjE3Njc2ODI1MTEsImV4cCI6MTc2ODI4NzMxMX0.RGRWZ_jeQLRk0mZFyj4fi04oflEt7uPi9Cy_hHE-3uI','2026-01-13 02:25:11','2026-01-06 06:55:11'),('7db46f4b-de61-4ae3-a710-10b615aeedc1','b99ff798-9895-43e1-8204-8d1eadc72142','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYjk5ZmY3OTgtOTg5NS00M2UxLTgyMDQtOGQxZWFkYzcyMTQyIiwiZW1haWwiOiJsZW1vbmFwcHNlcnZpY2VAZ21haWwuY29tIiwicm9sZSI6ImFjY291bnRhbnQiLCJpYXQiOjE3Njc3NzI2NTAsImV4cCI6MTc2ODM3NzQ1MH0.ol2O-MKncMgo3Fjljtlfw71SPvMC61ufKz37fvC5Ps4','2026-01-14 03:27:30','2026-01-07 07:57:30'),('84520002-76e2-40ae-9963-3ff162fbe9cf','111800bf-1036-4200-b759-9b6ab28f2eed','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTExODAwYmYtMTAzNi00MjAwLWI3NTktOWI2YWIyOGYyZWVkIiwiZW1haWwiOiJyaXJhc2V0MTIxQGNhbWVsdG9rLmNvbSIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3Njc2ODQyMTYsImV4cCI6MTc2ODI4OTAxNn0.nRTOfnzCuSBofGgAjgo7-hZ9VXjt-mYRe0PDMtpVWAk','2026-01-13 02:53:36','2026-01-06 07:23:36'),('ca98edd8-057d-4e17-8b52-988b4b2c3521','111800bf-1036-4200-b759-9b6ab28f2eed','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTExODAwYmYtMTAzNi00MjAwLWI3NTktOWI2YWIyOGYyZWVkIiwiZW1haWwiOiJyaXJhc2V0MTIxQGNhbWVsdG9rLmNvbSIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3NjkxNTEwNzEsImV4cCI6MTc2OTc1NTg3MX0.4cGyP-OqhWnyD3r0pbe-r03OpmUiUozrPS21bu9S_-E','2026-01-30 06:51:11','2026-01-23 06:51:11'),('db99016e-ae0d-40b0-b043-04a12d54fa1f','27202e3f-8149-490f-8499-c95253b7a9ba','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMjcyMDJlM2YtODE0OS00OTBmLTg0OTktYzk1MjUzYjdhOWJhIiwiZW1haWwiOiJrZWJpbml3MjI3QGNhbWVsdG9rLmNvbSIsInJvbGUiOiJhY2NvdW50YW50IiwiaWF0IjoxNzY3MzI0NjQzLCJleHAiOjE3Njc5Mjk0NDN9.lkbU8LvjXW3v7iBGUj3x3J0YDsIx6caFK19XLqqwxEI','2026-01-08 23:00:43','2026-01-02 03:30:43'),('ed9dc4cb-f3f3-499d-8b4a-6ced8eb4fb50','163e4d29-1ab0-4a79-be78-993525831e6d','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTYzZTRkMjktMWFiMC00YTc5LWJlNzgtOTkzNTI1ODMxZTZkIiwiZW1haWwiOiJ5b2NlajM5OTA1QGZmdHViZS5jb20iLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY2NTYzMTEyLCJleHAiOjE3NjcxNjc5MTJ9.v1cVuCwk8KR-tdRkKDyEzBAuSBTjHCo3XFqnUNuL9r4','2025-12-31 03:28:32','2025-12-24 07:58:32'),('eec12f2d-136e-4b12-a7fa-931df9fb0372','b99ff798-9895-43e1-8204-8d1eadc72142','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYjk5ZmY3OTgtOTg5NS00M2UxLTgyMDQtOGQxZWFkYzcyMTQyIiwiZW1haWwiOiJsZW1vbmFwcHNlcnZpY2VAZ21haWwuY29tIiwicm9sZSI6ImFjY291bnRhbnQiLCJpYXQiOjE3Njc2NzY0OTgsImV4cCI6MTc2ODI4MTI5OH0.ysWyPCG2aUX-Vg2uuI-kceKK6JdgQ_iS0d4OkckTuVU','2026-01-13 00:44:58','2026-01-06 05:14:58'),('fc007da8-a13a-4ab1-96c5-18400f7e5172','b99ff798-9895-43e1-8204-8d1eadc72142','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYjk5ZmY3OTgtOTg5NS00M2UxLTgyMDQtOGQxZWFkYzcyMTQyIiwiZW1haWwiOiJsZW1vbmFwcHNlcnZpY2VAZ21haWwuY29tIiwicm9sZSI6ImFjY291bnRhbnQiLCJpYXQiOjE3Njc2ODExMzYsImV4cCI6MTc2ODI4NTkzNn0.2ums_pYANDD79ckV5TuLjBIHm_IiByB8hEgpmq2eWSA','2026-01-13 02:02:16','2026-01-06 06:32:16'),('fe994d79-f646-4086-9a27-6c0ca3aeca1d','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMjkxY2I0NjMtYWZhOS00ZGZkLWIwZDUtNzdhOThlMWJkODVhIiwiZW1haWwiOiJoYXJyaXNhZ2FyQG9udG9tYXRyaXguY29tIiwicm9sZSI6ImZpcm0iLCJpYXQiOjE3NjkxNjQ2OTMsImV4cCI6MTc2OTc2OTQ5M30.zD3-9xwfz1vZPG9fOCSluzm9PHHbO7w7pWFYpDCZHBs','2026-01-30 10:38:13','2026-01-23 10:38:13');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('firm','accountant','client') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_role` (`user_id`,`role`),
  KEY `idx_user_roles_user_id` (`user_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES ('0d6ee343-a2fe-4862-a43f-4bdd76809bcf','5f2061aa-50fe-47ab-b9ee-52db871c7ffc','firm','2026-01-23 08:49:38'),('28b8729d-926a-428b-8c08-80866b7fe933','291cb463-afa9-4dfd-b0d5-77a98e1bd85a','firm','2025-12-23 05:41:15'),('66d9ec56-8e63-4c1a-8848-3a9adb69a96b','27202e3f-8149-490f-8499-c95253b7a9ba','accountant','2026-01-02 03:30:43'),('9bebc40a-789f-40e9-a00f-aa6a8a3a5a91','163e4d29-1ab0-4a79-be78-993525831e6d','client','2025-12-24 07:50:29'),('a3e72176-5c91-4992-884b-e9b7ba37ee5c','fd7c1164-839a-4a0b-8054-5983a8388521','firm','2026-02-11 05:21:45'),('a40c6ff6-1614-47ff-979c-88884207209a','48b216a1-d3b3-4829-b514-c5f529d9dee3','client','2025-12-30 07:14:00'),('a5b8c7d6-a37c-4446-9380-073508cd5505','e5e61f6b-0fea-41b3-9cc6-88a730c5dcc4','firm','2025-12-26 03:18:41'),('d699179c-dee8-4556-ae7e-50da6febd68e','111800bf-1036-4200-b759-9b6ab28f2eed','client','2026-01-02 04:00:02'),('d8267cf4-6576-4dcb-a710-b0c5e2b1cf99','dc637423-fd4c-4453-924d-b8549df8475d','firm','2025-12-23 10:08:49'),('ea28a841-001b-4981-bfc4-49b90b7eb9d9','b99ff798-9895-43e1-8204-8d1eadc72142','accountant','2025-12-23 06:18:57');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('111800bf-1036-4200-b759-9b6ab28f2eed','riraset121@cameltok.com','$2y$10$P4qTOV6LTw9Gvso0l8.ujetULccjOq5eKsWaHRxalE0XrSylw8KuG','aaa',NULL,NULL,'2026-01-02 04:00:02','2026-01-02 04:00:02','2026-01-02 04:00:02'),('163e4d29-1ab0-4a79-be78-993525831e6d','yocej39905@fftube.com','$2y$10$Wh13ygYAxYwkx1I.wvRjV.AFLT1EXIsThg0elYBBw0Iiv9f.fmBw6','test',NULL,NULL,'2025-12-24 07:50:29','2025-12-24 07:50:29','2025-12-24 07:50:29'),('27202e3f-8149-490f-8499-c95253b7a9ba','kebiniw227@cameltok.com','$2y$10$SS3ATCn/.W1O7Np016ItjugYalx8.clglwXWXQF/GgHqbdl9T7fGy','aaa',NULL,NULL,'2026-01-02 03:30:42','2026-01-02 03:30:42','2026-01-02 03:30:42'),('291cb463-afa9-4dfd-b0d5-77a98e1bd85a','harrisagar@ontomatrix.com','$2y$10$hhzf95mqyv.wGziqQEEhMutZkspdaG3CCLleZECGGZLmmnrh3Km5y','harri',NULL,NULL,'2025-12-23 05:41:15','2025-12-23 05:41:15','2026-01-23 06:02:52'),('48b216a1-d3b3-4829-b514-c5f529d9dee3','vekonag207@cameltok.com','$2y$10$cbpFwK4FjWvC3ujNKBbh0.cG3So4Vi/oiFkbDdzHCS/cOsurz8zr.','test',NULL,NULL,'2025-12-30 07:14:00','2025-12-30 07:14:00','2025-12-30 07:14:00'),('5f2061aa-50fe-47ab-b9ee-52db871c7ffc','admin@ontomatrix.com','$2y$10$Pp/D4lck/O97XiI1PLIv/OdHYb7kYj70rR0.sUkN3RCrgVSBwq7yC','sajeev',NULL,NULL,'2026-01-23 08:49:38','2026-01-23 08:49:38','2026-01-23 08:49:38'),('b99ff798-9895-43e1-8204-8d1eadc72142','lemonappservice@gmail.com','$2y$10$v2TMkfSJujm2ba4tRFo3juBYC/DrBXU63tBRnaq/T5B.skBEkZnuC','harri',NULL,NULL,'2025-12-23 06:18:57','2025-12-23 06:18:57','2025-12-30 07:10:05'),('dc637423-fd4c-4453-924d-b8549df8475d','mathurshana@ontomatrix.com','$2y$10$EMps3F.WITe7p746KtU8auAhKYBlWlqxyTSS6IskvY5t1opNgqmLG','test',NULL,NULL,'2025-12-23 10:08:48','2025-12-23 10:08:48','2025-12-23 10:08:48'),('e5e61f6b-0fea-41b3-9cc6-88a730c5dcc4','tahifov351@arugy.com','$2y$10$hzGU.FLpFH2XyrB8raliU.gnOVr5Vfy7J/JmHkKdZi1UPmQYR4VaW','test',NULL,NULL,'2025-12-26 03:18:41','2025-12-26 03:18:41','2025-12-26 03:18:41'),('fd7c1164-839a-4a0b-8054-5983a8388521','yojihi5730@deposin.com','$2y$10$TRY2bCBr3YAkYWMIITvzHunvdwYChkvdEWs9XwS7YHU6lNa41GTFu','New Firm',NULL,NULL,'2026-02-11 05:21:45','2026-02-11 05:21:45','2026-02-11 05:21:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-11 12:25:18
