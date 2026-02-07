-- Check current column type
SHOW COLUMNS FROM elections LIKE 'positions';

-- Fix positions column to JSON type
ALTER TABLE elections 
MODIFY COLUMN positions JSON;

-- Verify the change
SHOW COLUMNS FROM elections LIKE 'positions';

-- Test query to see current data
SELECT id, title, positions FROM elections;
