-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('guidelines', 'forms', 'presentations', 'publications') NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size VARCHAR(50),
  downloads_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample resources
INSERT INTO resources (title, description, category, file_url, file_type, file_size, downloads_count, display_order) VALUES
('Cataract Surgery Guidelines 2024', 'Comprehensive guidelines for modern cataract surgery techniques', 'guidelines', 'https://example.com/cataract-guidelines.pdf', 'PDF', '2.5 MB', 245, 1),
('Diabetic Retinopathy Management Protocol', 'Evidence-based protocol for diabetic retinopathy screening and treatment', 'guidelines', 'https://example.com/diabetic-retinopathy.pdf', 'PDF', '1.8 MB', 189, 2),
('Patient Consent Form', 'Standard consent form for ophthalmic procedures', 'forms', 'https://example.com/consent-form.docx', 'DOCX', '125 KB', 567, 3),
('Membership Application Form', 'BOA membership application form template', 'forms', 'https://example.com/membership-form.pdf', 'PDF', '450 KB', 423, 4),
('CME Attendance Certificate Template', 'Template for CME program attendance certificates', 'forms', 'https://example.com/cme-certificate.docx', 'DOCX', '200 KB', 156, 5),
('Advances in Glaucoma Treatment', 'Presentation from Annual Conference 2023', 'presentations', 'https://example.com/glaucoma-presentation.pptx', 'PPTX', '8.5 MB', 312, 6),
('Pediatric Ophthalmology Updates', 'Latest updates in pediatric eye care', 'presentations', 'https://example.com/pediatric-updates.pptx', 'PPTX', '6.2 MB', 198, 7),
('BOA Newsletter - January 2024', 'Monthly newsletter with latest updates and news', 'publications', 'https://example.com/newsletter-jan-2024.pdf', 'PDF', '3.2 MB', 278, 8),
('Research Paper: Corneal Transplant Outcomes', 'Study on corneal transplant success rates in Bihar', 'publications', 'https://example.com/corneal-research.pdf', 'PDF', '1.5 MB', 134, 9),
('Annual Report 2023', 'BOA Annual Report for the year 2023', 'publications', 'https://example.com/annual-report-2023.pdf', 'PDF', '4.8 MB', 456, 10);
