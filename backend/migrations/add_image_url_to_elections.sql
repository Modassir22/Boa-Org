-- Add image_url, html_content, and pdf_url columns to elections table
ALTER TABLE elections 
ADD COLUMN html_content LONGTEXT AFTER description,
ADD COLUMN pdf_url VARCHAR(500) AFTER html_content,
ADD COLUMN image_url VARCHAR(500) AFTER pdf_url;

-- Update positions column to JSON type if it's TEXT
ALTER TABLE elections 
MODIFY COLUMN positions JSON;
