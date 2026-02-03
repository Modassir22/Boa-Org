-- Add payment_type column to membership_registrations table
ALTER TABLE membership_registrations 
ADD COLUMN payment_type VARCHAR(50) DEFAULT NULL AFTER membership_type;

-- Update existing records to extract payment_type from membership_type
UPDATE membership_registrations 
SET payment_type = CASE 
  WHEN membership_type LIKE '%(Student)%' THEN 'Student'
  WHEN membership_type LIKE '%(Passout)%' THEN 'Passout'
  ELSE NULL
END;

-- Clean up membership_type to remove subcategory
UPDATE membership_registrations 
SET membership_type = REPLACE(REPLACE(membership_type, ' (Student)', ''), ' (Passout)', '');

-- Verify the changes
SELECT id, membership_type, payment_type, email 
FROM membership_registrations 
ORDER BY created_at DESC 
LIMIT 10;
