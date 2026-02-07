-- ============================================
-- HOSTING DATABASE SETUP - RUN KAREIN YE SQL
-- ============================================
-- Ye file hosting me database setup karne ke liye hai
-- Sabhi queries ko ek ek karke run karein

-- ============================================
-- STEP 1: Elections Tables Create Karein
-- ============================================

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  html_content LONGTEXT,
  pdf_url VARCHAR(500),
  image_url VARCHAR(500),
  eligible_members VARCHAR(100) DEFAULT 'Life Member',
  deadline DATE NOT NULL,
  voting_date DATE NOT NULL,
  voting_time VARCHAR(100),
  voting_venue VARCHAR(255),
  contact_mobile VARCHAR(20),
  positions JSON,  -- JSON array: ["President", "Vice President", "Secretary", "Treasurer"]
  form_type VARCHAR(50) DEFAULT 'Nomination Form',
  status ENUM('draft', 'active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Election submissions table
CREATE TABLE IF NOT EXISTS election_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  election_id INT NOT NULL,
  position VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  life_membership_no VARCHAR(50),
  designation VARCHAR(255),
  qualification VARCHAR(255),
  working_place VARCHAR(255),
  age INT,
  sex ENUM('Male', 'Female', 'Other'),
  mobile VARCHAR(20) NOT NULL,
  address TEXT,
  email VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
);

-- ============================================
-- STEP 2: Indexes Create Karein (Performance ke liye)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_election_status ON elections(status);
CREATE INDEX IF NOT EXISTS idx_election_deadline ON elections(deadline);
CREATE INDEX IF NOT EXISTS idx_submission_election ON election_submissions(election_id);
CREATE INDEX IF NOT EXISTS idx_submission_status ON election_submissions(status);

-- ============================================
-- STEP 3: Notifications Table Me Election Support Add Karein
-- ============================================

-- Check karein ki election_id column already exist karta hai ya nahi
-- Agar error aaye "Duplicate column name" to skip kar dein
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS election_id INT NULL AFTER seminar_id;

-- Foreign key add karein
ALTER TABLE notifications 
ADD CONSTRAINT fk_notification_election 
FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;

-- ============================================
-- STEP 4: Existing Elections Table Update Karein (Agar Already Exist Karta Hai)
-- ============================================

-- Agar elections table already exist karta hai to ye columns add karein
-- Agar error aaye "Duplicate column name" to skip kar dein

ALTER TABLE elections 
ADD COLUMN IF NOT EXISTS html_content LONGTEXT AFTER description;

ALTER TABLE elections 
ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500) AFTER html_content;

ALTER TABLE elections 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) AFTER pdf_url;

-- Positions column ko JSON type me convert karein
ALTER TABLE elections 
MODIFY COLUMN positions JSON;

-- ============================================
-- STEP 5: Notification Titles Ko Election Titles Se Sync Karein
-- ============================================

-- Ye query sabhi election notifications ke titles ko update kar degi
-- Taaki vo elections table se match karein
UPDATE notifications 
SET title = (SELECT title FROM elections WHERE id = notifications.election_id)
WHERE type = 'election' AND election_id IS NOT NULL;

-- ============================================
-- VERIFICATION QUERIES (Check karne ke liye)
-- ============================================

-- Elections table check karein
SELECT 'Elections Table' as TableName, COUNT(*) as RecordCount FROM elections;

-- Election submissions check karein
SELECT 'Election Submissions' as TableName, COUNT(*) as RecordCount FROM election_submissions;

-- Election notifications check karein
SELECT 'Election Notifications' as TableName, COUNT(*) as RecordCount 
FROM notifications WHERE type = 'election';

-- Columns check karein
SHOW COLUMNS FROM elections;
SHOW COLUMNS FROM election_submissions;
SHOW COLUMNS FROM notifications;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Agar koi query error de "Duplicate column" ya "Duplicate key" to skip kar dein
-- 2. Sabhi queries ko ek ek karke run karein
-- 3. Verification queries se check karein ki sab kuch sahi se create hua hai
-- 4. Agar notifications table me election_id column already hai to ALTER TABLE skip kar dein
-- ============================================
