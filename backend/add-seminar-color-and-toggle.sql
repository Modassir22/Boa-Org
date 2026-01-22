-- Add color and online_registration fields to seminars table
ALTER TABLE seminars 
ADD COLUMN color VARCHAR(20) DEFAULT '#0B3C5D',
ADD COLUMN online_registration_enabled BOOLEAN DEFAULT true;

