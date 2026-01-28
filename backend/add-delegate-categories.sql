-- Add delegate categories for active seminar

-- First, get the active seminar ID
-- Replace 1 with your actual seminar ID if different

-- Insert delegate categories
INSERT INTO delegate_categories (seminar_id, name, label, requires_membership, is_enabled, display_order) VALUES
(1, 'life-member', 'Life Member', 1, 1, 1),
(1, 'non-member', 'Non Member', 0, 1, 2),
(1, 'student', 'Student', 0, 1, 3),
(1, 'spouse', 'Spouse', 0, 1, 4),
(1, 'trade', 'Trade', 0, 1, 5);

-- Verify
SELECT * FROM delegate_categories WHERE seminar_id = 1;
