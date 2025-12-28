# Pre-Deployment Checklist

Use this checklist before deploying to production.

## ✅ Environment Setup

- [ ] Supabase project created
- [ ] Supabase database schema run (`supabase/schema.sql`)
- [ ] Admin schema run (`supabase/admin-schema.sql`) - if using admin features
- [ ] Supabase API keys copied (URL and anon key)
- [ ] OpenAI API key ready (optional, but needed for AI summaries)
- [ ] `.env.local` file created locally (for testing)

## ✅ Supabase Configuration

- [ ] Email authentication enabled in Supabase
- [ ] Site URL configured in Supabase (will update to production URL after deploy)
- [ ] Redirect URLs configured (will update to production URL after deploy)
- [ ] RLS policies verified (users can only see their own votes)

## ✅ Code Quality

- [ ] No console errors in browser
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] Authentication works locally
- [ ] Bills can be synced locally
- [ ] Voting works locally
- [ ] AI summaries generate (if OpenAI key is set)

## ✅ Security

- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] No API keys committed to git
- [ ] RLS policies are active in Supabase

## ✅ Deployment

- [ ] Code pushed to GitHub (or ready to push)
- [ ] Vercel account created
- [ ] Environment variables list ready:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY` (optional)
  - `CRON_SECRET` (optional)

## ✅ Post-Deployment

- [ ] Production URL added to Supabase redirect URLs
- [ ] Test authentication in production
- [ ] Test bill viewing in production
- [ ] Test voting in production
- [ ] Sync initial bills
- [ ] Test user can log in

## 📝 Notes

- OpenAI quota issue: You'll need to fix the quota before AI summaries work in production
- First sync: You may want to manually sync bills after deployment
- Test user: Prepare instructions for your first test user

---

**Ready to deploy?** Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

