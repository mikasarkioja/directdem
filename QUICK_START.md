# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings** → **API** and copy:
   - Project URL
   - anon/public key
4. In Supabase dashboard, go to **SQL Editor**
5. Copy and paste the entire contents of `supabase/schema.sql`
6. Click "Run"

### 3. Configure Environment

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run the App
```bash
npm run dev
```

### 5. Test It Out

1. Open [http://localhost:3000](http://localhost:3000)
2. Enter your email in the sidebar to sign in
3. Check your email for the Magic Link
4. Click the link to authenticate
5. Browse bills and vote!

## ✅ What's Working

- ✅ Magic Link authentication
- ✅ Bill fetching from Eduskunta API (with Supabase sync)
- ✅ AI-generated citizen-friendly summaries
- ✅ Voting system (For/Against/Neutral)
- ✅ Real-time vote statistics
- ✅ Comparison Mirror (citizen vs parliament)
- ✅ Bulletin Board (shareable cards)
- ✅ Row Level Security (users can only see their own votes)

## 📝 Next Steps

- Add more bills by syncing from Eduskunta API
- Customize email templates in Supabase
- Deploy to Vercel/Netlify
- Add BankID authentication (future)

## 🐛 Troubleshooting

**"Invalid API key"**: Check your `.env.local` file and restart the dev server

**"relation does not exist"**: Make sure you ran the SQL schema in Supabase

**Auth not working**: Check Supabase redirect URLs in Authentication settings

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed troubleshooting.

