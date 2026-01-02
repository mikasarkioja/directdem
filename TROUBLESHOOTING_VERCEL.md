# Vercel Production Error Troubleshooting

## Error: "An error occurred in the Server Components render"

This error typically occurs when:
1. **Missing environment variables** in Vercel
2. **Supabase connection issues** in production
3. **Server component errors** that are hidden in production

## Quick Fix Steps

### 1. Check Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and verify:

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `OPENAI_API_KEY` - For AI summarization (optional but recommended)
- `CRON_SECRET` - For cron jobs (optional)

**How to find Supabase credentials:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Verify Environment Variables Are Set

In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Make sure all variables are set for **Production**, **Preview**, and **Development**
4. **Important**: After adding/updating variables, you need to **redeploy** your app

### 3. Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to "Functions" tab
4. Look for error logs - they will show the actual error message

### 4. Test Locally First

**Why test locally?**
- Local development shows **full error messages**
- Production hides error details for security

**Steps:**
1. Make sure `.env.local` has all required variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   OPENAI_API_KEY=your-openai-key
   ```

2. Run locally:
   ```bash
   npm run dev
   ```

3. Check the terminal for error messages
4. Fix any errors locally first
5. Then deploy to Vercel

### 5. Common Issues and Solutions

#### Issue: "Missing Supabase environment variables"
**Solution:**
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel
- Redeploy after adding variables

#### Issue: "Supabase connection timeout"
**Solution:**
- Check if your Supabase project is active (not paused)
- Verify the URL is correct (no trailing slash)
- Check Supabase dashboard for any service issues

#### Issue: "Route couldn't be rendered statically"
**Solution:**
- This is **normal** for dynamic routes that use `cookies()`
- The route will be server-rendered, which is expected
- No action needed

#### Issue: "Profile doesn't exist" errors
**Solution:**
- Make sure you've run the SQL schema in Supabase
- Check that the `profiles` table exists
- Verify RLS policies are set up correctly

### 6. Debugging Production Errors

Since production hides error details, you can:

1. **Add temporary logging** (remove after debugging):
   ```typescript
   // In app/page.tsx or app/actions/auth.ts
   console.error("[DEBUG] Error details:", error);
   ```

2. **Check Vercel Function Logs**:
   - Vercel Dashboard → Your Project → Functions
   - Look for console.error messages

3. **Use Vercel's Error Tracking**:
   - Enable error tracking in Vercel settings
   - Check the Errors tab in your dashboard

### 7. Redeploy After Fixes

After fixing environment variables or code:
1. Push changes to GitHub
2. Vercel will auto-deploy
3. Or manually trigger: Vercel Dashboard → Deployments → Redeploy

## Current Status

✅ **Fixed in code:**
- Added error handling in `app/page.tsx` (won't crash on getUser error)
- Added error handling in `app/actions/auth.ts` (graceful fallback)
- Added environment variable validation in `lib/supabase/server.ts`

⚠️ **Action needed:**
- Verify environment variables in Vercel
- Redeploy after adding variables

## Next Steps

1. ✅ Check Vercel environment variables
2. ✅ Redeploy if variables were missing
3. ✅ Check Vercel logs for specific error
4. ✅ Test locally if issue persists


