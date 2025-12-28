# Supabase Setup Guide

This guide will help you set up Supabase for the DirectDem application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: DirectDem (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the project root:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 4: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

This creates:
- `bills` table (for storing legislative bills)
- `votes` table (for storing user votes)
- Row Level Security (RLS) policies
- Functions for vote statistics
- Indexes for performance

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
3. For production, add your production URL

## Step 6: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if needed (optional)
4. For Magic Link, the default settings work fine

## Step 7: Test the Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)
4. Try to sign in with your email (Magic Link)
5. Check your email for the login link

## Troubleshooting

### "Invalid API key" error
- Make sure your `.env.local` file has the correct values
- Restart your dev server after changing `.env.local`
- Check that you're using the `anon` key, not the `service_role` key

### "relation does not exist" error
- Make sure you ran the SQL schema in Step 4
- Check that the tables exist in **Database** → **Tables**

### Authentication not working
- Check that Email provider is enabled
- Verify redirect URLs are configured correctly
- Check browser console for errors

### RLS errors
- Make sure RLS policies were created (check in **Database** → **Policies`)
- Verify the `get_vote_stats` function exists (check in **Database** → **Functions`)

## Production Deployment

When deploying to production:

1. Update environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Other: Follow your platform's instructions

2. Update Supabase redirect URLs:
   - Add your production URL: `https://yourdomain.com/auth/callback`

3. Consider enabling additional security:
   - Rate limiting
   - Email verification requirements
   - Custom email templates

## Next Steps

- Set up BankID/FTN authentication (future)
- Configure email templates for better UX
- Set up database backups
- Monitor usage in Supabase dashboard

