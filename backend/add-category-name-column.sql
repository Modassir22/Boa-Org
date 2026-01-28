-- Add category_name column to store the original delegate category name
ALTER TABLE registrations ADD COLUMN category_name VARCHAR(100) AFTER delegate_type;