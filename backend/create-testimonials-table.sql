-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  image_url TEXT,
  testimonial TEXT NOT NULL,
  rating INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample testimonials
INSERT INTO testimonials (name, designation, organization, testimonial, rating, display_order) VALUES
('Dr. Rajesh Kumar', 'Senior Ophthalmologist', 'Patna Eye Hospital', 'BOA has been instrumental in advancing ophthalmology practices in Bihar. The seminars and workshops are world-class.', 5, 1),
('Dr. Priya Sharma', 'Eye Surgeon', 'Nalanda Medical College', 'Being a member of BOA has helped me stay updated with the latest developments in eye care. Highly recommended!', 5, 2),
('Dr. Amit Singh', 'Consultant Ophthalmologist', 'Gaya Eye Care Center', 'The networking opportunities and knowledge sharing at BOA events are invaluable for professional growth.', 5, 3);
