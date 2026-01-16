# Site Configuration Setup

## Database Setup

Run this SQL script to create the site_config table:

```bash
mysql -u root -p boa_connect < backend/config/add-site-config.sql
```

Or manually run the SQL:

```sql
USE boa_connect;

CREATE TABLE IF NOT EXISTS site_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  favicon_url VARCHAR(500),
  logo_url VARCHAR(500),
  hero_circle_image_url VARCHAR(500),
  site_title VARCHAR(255) DEFAULT 'Bihar Ophthalmic Association',
  site_description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_config (site_title, site_description) 
VALUES ('Bihar Ophthalmic Association', 'Leading organization for ophthalmology professionals in Bihar')
ON DUPLICATE KEY UPDATE id=id;
```

## Features

The Site Configuration tab in admin panel allows you to manage:

1. **Favicon** - Small icon in browser tabs (32x32px or 64x64px recommended)
2. **Logo** - Main logo in navbar (transparent PNG recommended)
3. **Hero Circle Image** - Circular image in hero section (square image recommended)
4. **Site Title** - Website title
5. **Site Description** - Brief description of the organization

## Usage

1. Login to admin panel: `/admin-login`
2. Navigate to "Site Config" tab
3. Upload images or paste URLs
4. Click "Save Configuration"

## API Endpoints

- `GET /api/site-config` - Public endpoint to fetch site configuration
- `GET /api/admin/site-config` - Admin endpoint (requires auth)
- `PUT /api/admin/site-config` - Update configuration (requires admin auth)
