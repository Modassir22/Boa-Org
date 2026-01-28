-- Add missing columns to user_certificates table
ALTER TABLE user_certificates 
ADD COLUMN expiry_date DATE NULL AFTER issued_date,
ADD COLUMN certificate_type VARCHAR(50) DEFAULT 'membership' AFTER description;