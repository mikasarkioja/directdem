# Admin Dashboard Setup Guide

## Overview

The admin dashboard is available at `/admin` and provides comprehensive metrics and management tools for the DirectDem platform.

## Setup Steps

### 1. Create Profiles Table

Run the SQL script in your Supabase SQL Editor:

```sql
-- See supabase/admin-schema.sql for the full script
```

This will:
- Create a `profiles` table with `is_admin` flag
- Set up Row Level Security (RLS) policies
- Create a trigger to auto-create profiles on user signup
- Add necessary indexes

### 2. Make Yourself an Admin

After signing up, find your user ID from the `auth.users` table, then run:

```sql
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = 'your-user-id-here';
```

Or find your user ID by email:

```sql
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

### 3. Access the Dashboard

Navigate to `/admin` in your browser. If you're not an admin, you'll be redirected to `/`.

## Features

### Overview Page

- **Stat Cards**: Four key metrics
  - Total Verified Users
  - Active Bills
  - Total Votes Cast
  - Average Discrepancy Gap (%)

- **Activity Chart**: Line chart showing votes per day over the last 14 days

- **Deficit Table**: All bills sorted by discrepancy gap
  - Bill Name
  - Parliament Stance (%)
  - Citizen Stance (%)
  - Gap (%) - color-coded red if >20%

### Bills Page

- Full deficit table for bill management

### Users Page

- User management interface (coming soon)

### Reports Page

- Reports and analytics (coming soon)

## Dark Mode

Toggle dark/light mode using the button in the sidebar. The preference is stored in component state (you can enhance this to persist in localStorage if needed).

## Security

- Server-side access control: Only users with `is_admin = TRUE` can access
- Automatic redirect for non-admin users
- All admin actions are protected by server-side checks

## Customization

### Adding New Metrics

Edit `app/actions/admin.ts` to add new statistics:

```typescript
export async function getAdminStats() {
  // Add your new metric here
  return {
    // ... existing metrics
    newMetric: value,
  };
}
```

### Adding New Views

1. Add the view type to `AdminView` in `components/AdminDashboard.tsx`
2. Add a menu item in `components/AdminSidebar.tsx`
3. Add the view content in `components/AdminDashboard.tsx`

## Troubleshooting

### "Unauthorized" Error

- Check that your user has `is_admin = TRUE` in the profiles table
- Verify you're logged in
- Check browser console for errors

### No Data Showing

- Ensure you have bills and votes in the database
- Check that the `get_vote_stats` function exists in Supabase
- Verify RLS policies allow reading the data

### Chart Not Rendering

- Ensure `recharts` is installed: `npm install recharts`
- Check browser console for errors
- Verify data format matches expected structure

## Notes

- The discrepancy gap calculation currently uses mock parliament data (65% for all bills)
- In production, replace this with actual parliament voting records
- The admin dashboard uses high-density layout optimized for data visualization

