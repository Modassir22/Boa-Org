-- Create membership categories table
CREATE TABLE IF NOT EXISTS membership_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Briefcase',
  price DECIMAL(10,2) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  features TEXT NOT NULL,
  is_recommended BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default membership categories
INSERT INTO membership_categories (title, icon, price, duration, features, is_recommended, display_order) VALUES
('Life Membership', 'Briefcase', 10000.00, 'One-time payment', 
'["Lifetime access to all BOA benefits","Free entry to all conferences","Voting rights in elections","Certificate of Life Membership","Priority registration for events"]', 
TRUE, 1),

('Annual Membership', 'CreditCard', 2000.00, 'Per year', 
'["One year access to BOA benefits","Discounted conference registration","Access to member directory","Newsletter subscription","Renewable annually"]', 
FALSE, 2),

('Student Membership', 'GraduationCap', 500.00, 'Per year', 
'["For ophthalmology residents","Access to CME programs","Mentorship opportunities","Discounted event registration","Valid student ID required"]', 
FALSE, 3);
