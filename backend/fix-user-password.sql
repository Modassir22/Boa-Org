-- Fix password for BOA/LM/0016/2023
UPDATE users 
SET password = '$2a$10$m6ahrF90cO8w3GM5EmapSOEs.i003v3xJNng.rrh4NaZ77UKQgwcu' 
WHERE membership_no = 'BOA/LM/0016/2023';

SELECT membership_no, LENGTH(password) as pwd_length, LEFT(password, 30) as pwd_preview 
FROM users 
WHERE membership_no = 'BOA/LM/0016/2023';
