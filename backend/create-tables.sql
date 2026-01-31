-- Create News Table
CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500) NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample News Data
INSERT IGNORE INTO news (id, title, content, status) VALUES
(1, 'Welcome to BOA News Section', 'Stay updated with the latest news and announcements from Ophthalmic Association Of Bihar. This section will feature important updates, event announcements, and other relevant information for our members.', 'active'),
(2, 'New Membership Benefits Announced', 'We are pleased to announce new benefits for our members including access to exclusive seminars, research publications, and networking opportunities. Contact us for more details about membership upgrades.', 'active');

-- Insert Sample Gallery Data
INSERT IGNORE INTO gallery_images (id, title, description, image_url, status) VALUES
(1, 'BOA Annual Conference 2024', 'Annual conference held in Patna with distinguished guests and members', 'https://via.placeholder.com/800x600/0B3C5D/FFFFFF?text=BOA+Conference+2024', 'active'),
(2, 'Eye Care Camp - Rural Bihar', 'Free eye care camp organized in rural areas of Bihar', 'https://via.placeholder.com/800x600/C9A227/FFFFFF?text=Eye+Care+Camp', 'active');