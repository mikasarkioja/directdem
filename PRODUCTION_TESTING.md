# Production Testing Checklist

Use this checklist to verify your production deployment works correctly.

## 🔗 Step 1: Basic Access

- [ ] **Visit your production URL**: `https://your-app.vercel.app`
- [ ] **Page loads without errors** (no blank screen)
- [ ] **No console errors** (press F12 → Console tab)
- [ ] **Styling looks correct** (Nordic theme, proper layout)

## 🔐 Step 2: Authentication

- [ ] **Click "Kirjaudu" (Login) button** in the sidebar
- [ ] **Enter your email address**
- [ ] **Click "Lähetä magic link"**
- [ ] **See success message**: "Tarkista sähköpostisi..."
- [ ] **Check your email** for the magic link
- [ ] **Click the magic link** in the email
- [ ] **Redirected back to the app** and logged in
- [ ] **Sidebar shows your email** and "Kirjaudu ulos" (Logout) button

**If authentication fails:**
- Check Supabase redirect URLs are set correctly
- Check environment variables in Vercel dashboard
- Check browser console for errors

## 📋 Step 3: Bills Display

- [ ] **See list of bills** in the main content area
- [ ] **Bills show titles** and parliament IDs (e.g., "HE 187/2025 vp")
- [ ] **Can click on a bill** to open the detail view
- [ ] **Bill detail modal opens** correctly

**If no bills show:**
- Click "Synkronoi Eduskunta API:sta" button
- Wait for sync to complete
- Refresh the page

## 📄 Step 4: Bill Details

- [ ] **Bill title displays** correctly
- [ ] **Parliament ID shows** (e.g., "HE 187/2025 vp")
- [ ] **Summary/abstract displays** (if available)
- [ ] **Comparison Mirror component** shows (Parliament vs Citizen votes)
- [ ] **Voting section** is visible (if logged in)

## 🤖 Step 5: AI Summary (Optional - if OpenAI key is set)

- [ ] **See "Generoi AI-tiivistelmä" button** (if no summary exists)
- [ ] **Click the button** to generate summary
- [ ] **See progress messages** ("Haetaan lakia tekstiä...", "Teen selkokielistä tiivistelmää...")
- [ ] **Summary appears** and streams in
- [ ] **Summary is readable** and in Finnish (selkokieli)

**Note:** If OpenAI quota is exceeded, you'll see an error message instead.

## 🗳️ Step 6: Voting

- [ ] **Logged in** (required for voting)
- [ ] **Click on a bill** to open details
- [ ] **See voting buttons**: "Puolesta" (For), "Neutraali" (Neutral), "Vastaan" (Against)
- [ ] **Click "Puolesta"** (For)
- [ ] **Button highlights** to show your vote
- [ ] **Vote statistics update** (if other votes exist)
- [ ] **Change vote** to "Vastaan" (Against)
- [ ] **Vote updates** correctly
- [ ] **Refresh page** - your vote persists

## 📊 Step 7: Vote Statistics

- [ ] **After voting**, see vote counts update
- [ ] **Comparison Mirror** shows updated citizen vote percentage
- [ ] **Discrepancy gap** calculates correctly
- [ ] **If gap > 20%**, see warning message

## 🔄 Step 8: Bill Sync

- [ ] **Click "Synkronoi Eduskunta API:sta"** button
- [ ] **See loading state** (button shows spinner)
- [ ] **Wait for sync to complete** (may take 30-60 seconds)
- [ ] **See success message** or updated bill count
- [ ] **New bills appear** in the list (if available from API)

## 📱 Step 9: Mobile Responsiveness

- [ ] **Open on mobile device** or resize browser to mobile width
- [ ] **Layout adapts** to mobile (single column)
- [ ] **Sticky voting bar** appears at bottom on mobile
- [ ] **Can vote** using mobile voting bar
- [ ] **Text is readable** on mobile
- [ ] **Buttons are large enough** to tap easily

## 🚪 Step 10: Logout

- [ ] **Click "Kirjaudu ulos"** (Logout) button
- [ ] **Logged out successfully**
- [ ] **Redirected or page refreshes**
- [ ] **Can't vote** when logged out (shows login prompt)

## 🔍 Step 11: Error Handling

- [ ] **Try to access** `/admin` page (should redirect if not admin)
- [ ] **Check browser console** for any errors
- [ ] **Check Vercel logs** (Vercel Dashboard → Your Project → Logs)

## 📝 Step 12: Performance

- [ ] **Page loads** in under 3 seconds
- [ ] **No long loading spinners** (except for AI summary generation)
- [ ] **Images/icons load** correctly
- [ ] **No broken links** or missing assets

## ✅ Final Checks

- [ ] **All core features work**: Auth, Bills, Voting, Summaries
- [ ] **No critical errors** in console or logs
- [ ] **User experience is smooth**
- [ ] **Ready to share with test user**

## 🐛 If Something Doesn't Work

### Check Vercel Dashboard:
1. Go to Vercel Dashboard → Your Project
2. Check **"Deployments"** tab for build errors
3. Check **"Logs"** tab for runtime errors
4. Check **"Settings" → "Environment Variables"** are set correctly

### Check Supabase Dashboard:
1. Go to Supabase Dashboard → Your Project
2. Check **"Authentication" → "Users"** (to see if signups work)
3. Check **"Database" → "Tables"** (to see if votes are saved)
4. Check **"Logs"** for API errors

### Check Browser Console:
1. Press F12 → Console tab
2. Look for red error messages
3. Share errors with developer or check documentation

## 🎉 Success Criteria

Your production deployment is working if:
- ✅ Users can sign up and log in
- ✅ Bills are displayed
- ✅ Users can vote on bills
- ✅ Votes are saved and displayed
- ✅ No critical errors

**Ready to share!** 🚀


