-- Create stats table for dynamic Our Impact section
CREATE TABLE IF NOT EXISTS stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stat_key VARCHAR(100) NOT NULL UNIQUE,
  stat_value VARCHAR(50) NOT NULL,
  stat_label VARCHAR(100) NOT NULL,
  stat_icon VARCHAR(50) NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default stats data
INSERT INTO stats (stat_key, stat_value, stat_label, stat_icon, display_order) VALUES
('total_members', '500', 'Active Members', 'Users', 1),
('years_of_service', '3', 'Years of Service', 'Calendar', 2),
('seminars_conducted', '25', 'Seminars Conducted', 'Award', 3),
('districts_covered', '38', 'Districts Covered', 'MapPin', 4)
ON DUPLICATE KEY UPDATE 
  stat_value = VALUES(stat_value),
  stat_label = VALUES(stat_label),
  updated_at = CURRENT_TIMESTAMP;