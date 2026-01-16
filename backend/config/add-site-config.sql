-- Site Configuration Table
CREATE TABLE IF NOT EXISTS site_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  favicon_url VARCHAR(500),
  logo_url VARCHAR(500),
  hero_circle_image_url VARCHAR(500),
  site_title VARCHAR(255) DEFAULT 'Bihar Ophthalmic Association',
  site_description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO site_config (site_title, site_description) 
VALUES ('Bihar Ophthalmic Association', 'Leading organization for ophthalmology professionals in Bihar')
ON DUPLICATE KEY UPDATE id=id;
