# Authentication Troubleshooting Guide

## Problem: No Feedback When Clicking "Kirjaudu" and No Email Received

### Step 1: Check Environment Variables

The most common issue is missing or incorrect Supabase configuration.

1. **Check if `.env.local` exists:**
   ```bash
   # In your project root, verify the file exists
   ls -la .env.local
   # Or on Windows:
   dir .env.local
   ```

2. **Verify the contents of `.env.local`:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: 
   - The values must start with `NEXT_PUBLIC_` (this is required for Next.js)
   - No quotes around the values
   - No spaces around the `=` sign
   - Restart your dev server after changing `.env.local`

### Step 2: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try to sign in again
4. Look for error messages

Common errors you might see:
- `Supabase configuration missing` - Environment variables not set
- `Invalid API key` - Wrong Supabase key
- `Network error` - Can't reach Supabase

### Step 3: Verify Supabase Configuration

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Check Authentication Settings**:
   - Go to **Authentication** → **Providers**
   - Make sure **Email** is enabled
   - Check that "Confirm email" is OFF (for Magic Link)

3. **Check URL Configuration**:
   - Go to **Authentication** → **URL Configuration**
   - **Site URL**: Should be `http://localhost:3000` (for dev)
   - **Redirect URLs**: Should include `http://localhost:3000/auth/callback`

### Step 4: Check Supabase Email Settings

1. In Supabase Dashboard, go to **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. For development, Supabase uses their default email service
4. Check **Rate Limits** - Free tier has limits on emails per hour

### Step 5: Test Supabase Connection

Create a test file to verify your Supabase connection:

```typescript
// test-supabase.ts (temporary file, delete after testing)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl ? "Set ✓" : "Missing ✗");
console.log("Supabase Key:", supabaseKey ? "Set ✓" : "Missing ✗");

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client created successfully");
}
```

### Step 6: Check Network Tab

1. Open Developer Tools → Network tab
2. Try to sign in
3. Look for a request to `supabase.co/auth/v1/otp`
4. Check the response:
   - **200 OK**: Request succeeded, email should be sent
   - **400 Bad Request**: Check the error message
   - **401 Unauthorized**: Wrong API key
   - **Network error**: Connection issue

### Step 7: Common Issues and Solutions

#### Issue: "Invalid API key"
**Solution**: 
- Double-check you're using the `anon` key, not `service_role`
- Make sure there are no extra spaces or quotes
- Restart dev server

#### Issue: "Email rate limit exceeded"
**Solution**:
- Wait 1 hour
- Or upgrade your Supabase plan
- Or configure custom SMTP

#### Issue: "Email not enabled"
**Solution**:
- Go to Supabase Dashboard → Authentication → Providers
- Enable Email provider
- Save changes

#### Issue: Environment variables not loading
**Solution**:
1. Stop your dev server (Ctrl+C)
2. Delete `.next` folder: `rm -rf .next` (or `rmdir /s .next` on Windows)
3. Restart: `npm run dev`

### Step 8: Enable Debug Mode

The updated Auth component now logs to console. Check your browser console for:
- "Attempting to sign in with email: ..."
- "Magic link sent successfully" or error messages
- "Supabase configuration missing" if env vars aren't set

### Step 9: Manual Test in Supabase Dashboard

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Try to manually send a test email (if available)
3. This helps verify if the issue is with Supabase or your app

### Step 10: Check Email Provider

If using a custom email (Gmail, etc.):
- Check spam folder
- Verify email address is correct
- Check if your email provider is blocking Supabase emails

## Quick Checklist

- [ ] `.env.local` file exists in project root
- [ ] Environment variables are set correctly
- [ ] Dev server was restarted after changing `.env.local`
- [ ] Supabase Email provider is enabled
- [ ] Redirect URLs are configured in Supabase
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API call
- [ ] Checked spam folder for email

## Still Not Working?

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard → **Logs** → **Auth Logs**
   - Look for failed authentication attempts

2. **Verify Project Status**:
   - Make sure your Supabase project is active
   - Check if you've exceeded free tier limits

3. **Test with a Different Email**:
   - Some email providers block automated emails
   - Try a different email address

4. **Check Next.js Version**:
   - Make sure you're using Next.js 15
   - Run `npm list next` to check

## Getting Help

If none of these work, provide:
1. Browser console errors
2. Network tab response
3. Supabase dashboard logs
4. Your `.env.local` structure (without actual keys!)

