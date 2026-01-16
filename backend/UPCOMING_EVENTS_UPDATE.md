# Upcoming Events - Countdown Timer Update

## Changes Made

### Frontend (Admin Panel)
**File:** `boa-connect/src/pages/admin/tabs/UpcomingEventsTab.tsx`

Added new fields in the admin form:
- **Title** (required) - Event title for display
- **Description** - Event description
- **Location** - Event location
- **Start Date** (required) - For countdown timer calculation
- **End Date** - Optional end date
- **Link URL** - Registration form link (optional)

### Frontend (Display)
**File:** `boa-connect/src/components/home/UpcomingEventsCarousel.tsx`

Features:
- Real-time countdown timer (Days, Hours, Minutes, Seconds)
- Event details display (title, date, location, description)
- "Click here to register" button
- Auto-redirect to registration form

### Backend
**File:** `backend/controllers/admin.controller.js`

Updated functions:
- `createUpcomingEvent` - Now accepts: title, description, location, start_date, end_date, image_url, link_url, display_order
- `updateUpcomingEvent` - Updated to handle all new fields

### Database
**Migration File:** `backend/config/update-upcoming-events-table.sql`

New columns added:
- `location` VARCHAR(255)
- `start_date` DATE
- `end_date` DATE
- `link_url` TEXT

## Setup Instructions

### 1. Update Database
Run the migration to add new columns:
```bash
cd backend
update-upcoming-events-table.bat
```

### 2. Restart Backend Server
```bash
cd backend
node server.js
```

### 3. Test Admin Panel
1. Login to admin panel
2. Go to "Upcoming Events" tab
3. Click "Add Event"
4. Fill in all fields including:
   - Event Title
   - Description
   - Location
   - Start Date (for countdown)
   - End Date (optional)
   - Upload Image
   - Link URL (registration form link)
5. Save

### 4. Verify Frontend
1. Go to homepage
2. Check "Upcoming Event" section
3. Verify countdown timer is working (updates every second)
4. Click "Click here to register" button
5. Should redirect to registration form

## Features

### Admin Panel
- ✅ Add/Edit/Delete events with countdown data
- ✅ Set event title, description, location
- ✅ Set start and end dates
- ✅ Upload event images
- ✅ Set registration form link
- ✅ Display order management

### Frontend Display
- ✅ Dynamic heading (Upcoming Event/Events)
- ✅ Real-time countdown timer
- ✅ Event details with icons
- ✅ Event image display
- ✅ Clickable registration button
- ✅ Auto-carousel for multiple events
- ✅ Navigation dots

## Notes
- Countdown timer calculates time until `start_date`
- If `link_url` is not provided, button uses `seminar_id` to generate registration link
- External links open in new tab
- Internal routes navigate within app
- Timer updates every second in real-time
