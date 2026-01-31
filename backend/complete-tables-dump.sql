-- =====================================================
-- BOA Complete Database Tables Dump
-- Created for VPS Import
-- =====================================================

-- Set SQL mode and charset
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Set charset
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- =====================================================
-- 1. NEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS `news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample news data
INSERT INTO `news` (`id`, `title`, `content`, `image_url`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Welcome to BOA News Section', 'Stay updated with the latest news and announcements from Ophthalmic Association Of Bihar. This section will feature important updates, event announcements, and other relevant information for our members.', NULL, 'active', NOW(), NOW()),
(2, 'New Membership Benefits Announced', 'We are pleased to announce new benefits for our members including access to exclusive seminars, research publications, and networking opportunities. Contact us for more details about membership upgrades.', NULL, 'active', NOW(), NOW()),
(3, 'Upcoming Seminar Registration Open', 'Registration is now open for our upcoming seminar on advanced ophthalmic procedures. Limited seats available. Register now to secure your spot.', NULL, 'active', NOW(), NOW());

-- =====================================================
-- 2. GALLERY_IMAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS `gallery_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample gallery data
INSERT INTO `gallery_images` (`id`, `title`, `description`, `image_url`, `status`, `created_at`, `updated_at`) VALUES
(1, 'BOA Conference 2024', 'Annual conference of Ophthalmic Association Of Bihar', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop', 'active', NOW(), NOW()),
(2, 'Medical Workshop', 'Advanced ophthalmic procedures workshop', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop', 'active', NOW(), NOW()),
(3, 'Community Outreach', 'Free eye checkup camp in rural areas', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=600&fit=crop', 'active', NOW(), NOW());

-- =====================================================
-- 3. STATS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS `stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stat_key` varchar(100) NOT NULL,
  `stat_value` varchar(50) NOT NULL,
  `stat_label` varchar(100) NOT NULL,
  `stat_icon` varchar(50) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `stat_key` (`stat_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert stats data
INSERT INTO `stats` (`id`, `stat_key`, `stat_value`, `stat_label`, `stat_icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'total_members', '500', 'Active Members', 'Users', 1, 1, NOW(), NOW()),
(2, 'years_of_service', '3', 'Years of Service', 'Calendar', 2, 1, NOW(), NOW()),
(3, 'seminars_conducted', '25', 'Seminars Conducted', 'Award', 3, 1, NOW(), NOW()),
(4, 'districts_covered', '38', 'Districts Covered', 'MapPin', 4, 1, NOW(), NOW());

-- =====================================================
-- AUTO INCREMENT VALUES
-- =====================================================

ALTER TABLE `news` AUTO_INCREMENT = 4;
ALTER TABLE `gallery_images` AUTO_INCREMENT = 4;
ALTER TABLE `stats` AUTO_INCREMENT = 5;

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run to verify)
-- =====================================================

-- SELECT 'NEWS TABLE' as 'TABLE_NAME';
-- SELECT * FROM news;
-- 
-- SELECT 'GALLERY_IMAGES TABLE' as 'TABLE_NAME';
-- SELECT * FROM gallery_images;
-- 
-- SELECT 'STATS TABLE' as 'TABLE_NAME';
-- SELECT * FROM stats;