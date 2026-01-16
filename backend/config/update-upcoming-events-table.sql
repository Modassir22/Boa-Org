-- Add new columns to upcoming_events table for countdown timer functionality

-- Add location column (if not exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'upcoming_events' 
AND COLUMN_NAME = 'location';

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE upcoming_events ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER description', 
  'SELECT "Column location already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add start_date column (if not exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'upcoming_events' 
AND COLUMN_NAME = 'start_date';

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE upcoming_events ADD COLUMN start_date DATE DEFAULT NULL AFTER location', 
  'SELECT "Column start_date already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add end_date column (if not exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'upcoming_events' 
AND COLUMN_NAME = 'end_date';

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE upcoming_events ADD COLUMN end_date DATE DEFAULT NULL AFTER start_date', 
  'SELECT "Column end_date already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add link_url column (if not exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'upcoming_events' 
AND COLUMN_NAME = 'link_url';

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE upcoming_events ADD COLUMN link_url TEXT DEFAULT NULL AFTER end_date', 
  'SELECT "Column link_url already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

