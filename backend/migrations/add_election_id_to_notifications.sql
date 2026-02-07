-- Add election_id column to notifications table
ALTER TABLE notifications 
ADD COLUMN election_id INT NULL AFTER seminar_id,
ADD FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
