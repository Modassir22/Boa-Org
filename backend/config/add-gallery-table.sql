-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type ENUM('image', 'video') DEFAULT 'image',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample gallery items
INSERT INTO gallery (title, description, url, type, display_order) VALUES
('Annual Conference 2024', 'Highlights from our annual ophthalmology conference', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'image', 1),
('CME Workshop', 'Hands-on training session on advanced surgical techniques', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', 'image', 2),
('Community Eye Camp', 'Free eye screening camp in rural Bihar', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800', 'image', 3),
('Seminar Presentation', 'Expert presentation on retinal disorders', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800', 'image', 4),
('Award Ceremony', 'Recognizing excellence in ophthalmology', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', 'image', 5),
('Team Meeting', 'BOA committee planning session', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', 'image', 6);
