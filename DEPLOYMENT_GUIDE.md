# Deployment Guide - Share with First Test User

This guide will help you deploy DirectDem to production and share it with your first test user.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Required

Make sure you have these values ready:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- ✅ `OPENAI_API_KEY` - Your OpenAI API key (optional for now, but needed for AI summaries)
- ✅ `CRON_SECRET` - Optional secret for cron job protection

### 2. Database Setup

- ✅ Run `supabase/schema.sql` in your Supabase SQL Editor
- ✅ Run `supabase/admin-schema.sql` if you want admin features
- ✅ Verify tables exist: `bills`, `votes`, `profiles`

### 3. Supabase Configuration

1. **Authentication Settings:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your production URL (e.g., `https://your-app.vercel.app`)
   - Add redirect URL: `https://your-app.vercel.app/auth/callback`

2. **Email Settings:**
   - Supabase free tier includes email sending
   - For production, consider setting up custom SMTP (optional)

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/directdem.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Add Environment Variables:**
   In Vercel project settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   OPENAI_API_KEY=your_openai_key_here
   CRON_SECRET=your-random-secret-here (optional)
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your app will be live at `https://your-app.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? directdem (or your choice)
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
vercel env add CRON_SECRET

# Deploy to production
vercel --prod
```

## ✅ Post-Deployment Steps

### 1. Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your production URL:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

### 2. Test the Deployment

1. **Visit your app:** `https://your-app.vercel.app`
2. **Test authentication:**
   - Click "Kirjaudu" (Login)
   - Enter your email
   - Check email for magic link
   - Click link to authenticate
3. **Test bill viewing:**
   - Browse active bills
   - Click on a bill to see details
4. **Test voting:**
   - Vote on a bill (For/Against/Neutral)
   - Check if vote is saved

### 3. Sync Initial Bills

1. **Option A: Use the sync button in the app**
   - Go to dashboard
   - Click "Synkronoi Eduskunta API:sta" button
   - Wait for bills to sync

2. **Option B: Use the API endpoint**
   ```bash
   curl https://your-app.vercel.app/api/cron/process-bills \
     -H "Authorization: Bearer your-cron-secret"
   ```

## 👤 Share with First Test User

### 1. Create Test User Account

1. Have your test user visit: `https://your-app.vercel.app`
2. They click "Kirjaudu" (Login)
3. Enter their email
4. They check their email for the magic link
5. Click the link to authenticate

### 2. Provide Instructions

Send your test user:

```
Subject: DirectDem - Test Access

Hi!

I'd like you to test DirectDem, a platform for shadow direct democracy.

Access: https://your-app.vercel.app

How to get started:
1. Click "Kirjaudu" (Login) in the sidebar
2. Enter your email address
3. Check your email for a magic link
4. Click the link to authenticate
5. Browse bills and vote!

What to test:
- Can you log in successfully?
- Can you see the list of bills?
- Can you click on a bill to see details?
- Can you vote on a bill?
- Is the AI summary readable?
- Any bugs or issues?

Please share any feedback or issues you encounter.

Thanks!
```

### 3. Monitor Usage

- Check Vercel dashboard for errors
- Check Supabase dashboard → Authentication → Users (to see new signups)
- Check Supabase dashboard → Database → votes table (to see votes)

## 🐛 Troubleshooting

### Issue: "Invalid API key" in production

**Solution:** 
- Check environment variables in Vercel dashboard
- Make sure `NEXT_PUBLIC_` prefix is included
- Redeploy after adding variables

### Issue: Authentication not working

**Solution:**
- Check Supabase redirect URLs include your production URL
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
- Check browser console for errors

### Issue: Bills not showing

**Solution:**
- Make sure you've synced bills (use sync button or API)
- Check Supabase dashboard → Database → bills table
- Verify RLS policies are set correctly

### Issue: AI summaries not generating

**Solution:**
- Check `OPENAI_API_KEY` is set in Vercel
- Check OpenAI quota/billing
- Check server logs in Vercel dashboard

## 📊 Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function execution
- Check error rates

### Supabase Dashboard
- View user signups (Authentication → Users)
- Monitor database usage
- Check API request logs

## 🔒 Security Notes

- ✅ Never commit `.env.local` to git
- ✅ Use environment variables in Vercel (not hardcoded)
- ✅ RLS policies protect user data
- ✅ Supabase anon key is safe for client-side use
- ⚠️ Keep `OPENAI_API_KEY` secret (server-side only)

## 🎉 Next Steps

After your first test user:
1. Gather feedback
2. Fix any critical bugs
3. Add more bills
4. Invite more test users
5. Iterate based on feedback

Good luck! 🚀

