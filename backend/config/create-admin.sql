-- Create Admin User
USE boa_connect;

-- Insert admin user
-- Email: Modassir
-- Password: admin123
INSERT INTO users (
  title, 
  first_name, 
  surname, 
  email, 
  password, 
  mobile, 
  gender, 
  dob,
  role, 
  is_active
) VALUES (
  'mr',
  'Modassir',
  'Admin',
  'Modassir',
  '$2b$10$V6ceA53/WUJU1HbCw3wMGOd4ajXj4rzTbCC7DHtOz7q/Mu2XxBvXy',
  '9999999999',
  'male',
  '1990-01-01',
  'admin',
  TRUE
);

-- Get the admin user ID
SET @admin_id = LAST_INSERT_ID();

-- Insert address for admin
INSERT INTO addresses (
  user_id,
  house,
  street,
  city,
  state,
  country,
  pin_code
) VALUES (
  @admin_id,
  'Admin Office',
  'BOA Headquarters',
  'Patna',
  'Bihar',
  'India',
  '800001'
);

-- Display admin credentials
SELECT 
  'Admin user created successfully!' as message,
  'Modassir' as username,
  'admin123' as password,
  'Login at /login and access admin panel' as instructions;

SELECT * FROM users WHERE role = 'admin';
