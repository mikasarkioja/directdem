# Daily Bill Processing Cron Job

This project includes a Vercel Cron Job that automatically fetches and processes the latest bills every morning at 06:00.

## How It Works

1. **Schedule**: Runs daily at 06:00 UTC (Cron: `0 6 * * *`)
   - Note: Vercel cron jobs run in UTC timezone
   - 06:00 UTC = 08:00 EET (Eastern European Time) / 09:00 EEST (Eastern European Summer Time)
   - To change the time, modify the schedule in `vercel.json`
2. **Fetches**: Latest 5 bills from Eduskunta API
3. **Syncs**: Bills are upserted into Supabase database
4. **Processes**: Each bill is processed through AI to generate citizen-friendly summaries
5. **Stores**: Summaries are saved to the database

## Setup

### 1. Vercel Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-bills",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### 2. Environment Variables

Add to your `.env.local` (for local testing) and Vercel project settings:

```env
# Optional: Secret to protect cron endpoint (Vercel adds this automatically in production)
CRON_SECRET=your-secret-key-here

# Required: OpenAI API key for AI summaries
OPENAI_API_KEY=your-openai-api-key

# Required: Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel will automatically:
- Detect the `vercel.json` cron configuration
- Set up the cron job
- Add the authorization header automatically

## Testing Locally

You can test the cron endpoint manually:

```bash
# Using curl
curl http://localhost:3000/api/cron/process-bills \
  -H "Authorization: Bearer your-cron-secret"

# Or visit in browser (if CRON_SECRET is not set in development)
http://localhost:3000/api/cron/process-bills
```

## Monitoring

The cron job returns detailed results:

```json
{
  "success": true,
  "message": "Processed 3 bills, skipped 2",
  "billsFetched": 5,
  "billsProcessed": 3,
  "billsSkipped": 2,
  "errors": [],
  "startTime": "2024-01-15T06:00:00.000Z",
  "endTime": "2024-01-15T06:02:30.000Z",
  "durationMs": 150000
}
```

## Viewing Cron Logs

1. Go to your Vercel dashboard
2. Navigate to your project
3. Click on "Functions" → "Cron Jobs"
4. View execution logs and history

## Manual Trigger

You can also trigger the cron job manually from Vercel dashboard:
1. Go to Functions → Cron Jobs
2. Click on the cron job
3. Click "Trigger Now"

## Troubleshooting

### Cron job not running
- Check Vercel dashboard for cron job status
- Verify `vercel.json` is in the root directory
- Ensure the project is deployed (not just in preview)

### Bills not being processed
- Check Vercel function logs
- Verify OpenAI API key is set
- Check Supabase connection
- Ensure bills exist in Eduskunta API

### Rate limiting
- The cron job includes a 1-second delay between AI calls
- If you hit OpenAI rate limits, increase the delay in the code

## Cost Considerations

- **Vercel Cron**: Free on Hobby plan (limited executions)
- **OpenAI API**: ~$0.01-0.05 per bill summary (using gpt-4o-mini)
- **Supabase**: Free tier includes generous database usage

For 5 bills daily:
- Monthly OpenAI cost: ~$1.50 - $7.50
- Vercel: Free (if within limits)

