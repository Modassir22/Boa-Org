-- Simple migration to add new columns to upcoming_events table
-- Run this if the complex version doesn't work

ALTER TABLE upcoming_events ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER description;
ALTER TABLE upcoming_events ADD COLUMN start_date DATE DEFAULT NULL AFTER location;
ALTER TABLE upcoming_events ADD COLUMN end_date DATE DEFAULT NULL AFTER start_date;
ALTER TABLE upcoming_events ADD COLUMN link_url TEXT DEFAULT NULL AFTER end_date;
