-- Elections table
CREATE TABLE IF NOT EXISTS elections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  eligible_members VARCHAR(100) DEFAULT 'Life Member',
  deadline DATE NOT NULL,
  voting_date DATE NOT NULL,
  voting_time VARCHAR(100),
  voting_venue VARCHAR(255),
  contact_mobile VARCHAR(20),
  positions TEXT, -- JSON array of positions like ["President", "Vice President", "Secretary", "Treasurer"]
  form_type VARCHAR(50) DEFAULT 'Nomination Form',
  status ENUM('draft', 'active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Election nominations/submissions table
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

-- Add indexes for better performance
CREATE INDEX idx_election_status ON elections(status);
CREATE INDEX idx_election_deadline ON elections(deadline);
CREATE INDEX idx_submission_election ON election_submissions(election_id);
CREATE INDEX idx_submission_status ON election_submissions(status);
