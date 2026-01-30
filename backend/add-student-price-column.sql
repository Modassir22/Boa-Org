-- Add student_price column to membership_categories table
-- This script adds the missing student_price column if it doesn't exist

-- Check if column exists and add if missing
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'membership_categories' 
  AND COLUMN_NAME = 'student_price';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE membership_categories ADD COLUMN student_price DECIMAL(10,2) NULL AFTER price',
  'SELECT "Column student_price already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show current table structure
DESCRIBE membership_categories;