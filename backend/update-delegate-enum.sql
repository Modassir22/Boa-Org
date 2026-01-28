-- Update the delegate_type ENUM to replace 'boa-member' with 'life-member'
ALTER TABLE registrations MODIFY COLUMN delegate_type ENUM('life-member', 'non-boa-member', 'accompanying-person') NOT NULL;