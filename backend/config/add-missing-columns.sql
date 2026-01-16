-- Add all missing columns to upcoming_events table

-- Add title column (after id)
ALTER TABLE upcoming_events ADD COLUMN title VARCHAR(255) DEFAULT '' AFTER id;

-- Add description column (after title)
ALTER TABLE upcoming_events ADD COLUMN description TEXT DEFAULT NULL AFTER title;

-- Add location column (after description)
ALTER TABLE upcoming_events ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER description;

-- Add start_date column (after location)
ALTER TABLE upcoming_events ADD COLUMN start_date DATE DEFAULT NULL AFTER location;

-- Add end_date column (after start_date)
ALTER TABLE upcoming_events ADD COLUMN end_date DATE DEFAULT NULL AFTER start_date;
