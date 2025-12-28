# DirectDem - Shadow Direct Democracy Platform

A production-ready Next.js 15 application that enables citizens to vote on legislative bills and compare their sentiment with parliamentary reality.

## Features

- **Authentication**: Magic Link email login via Supabase Auth
- **Active Bills**: View legislative bills fetched from Eduskunta API
- **AI Summaries**: Citizen-friendly plain-language summaries of complex legal texts
- **Voting System**: Vote on bills (For/Against/Neutral) with real-time statistics
- **Comparison Mirror**: Visualize the gap between citizen votes and parliamentary positions
- **Bulletin Board**: Shareable cards with bill summaries
- **Row Level Security**: Secure database with RLS policies

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Link)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A Supabase account ([sign up here](https://supabase.com))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create a Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Get your API keys

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Project Structure

```
├── app/
│   ├── actions/          # Server actions (bills, votes, auth)
│   ├── auth/             # Auth callback route
│   └── layout.tsx        # Root layout
├── components/
│   ├── Auth.tsx          # Authentication component
│   ├── VoteButton.tsx    # Voting interface
│   ├── ComparisonMirror.tsx  # Democracy mirror visualization
│   ├── BulletinBoard.tsx # Shareable summary cards
│   └── ...
├── lib/
│   ├── supabase/         # Supabase client setup
│   ├── ai-summary.ts     # AI summary generation
│   ├── eduskunta-api.ts  # Finnish Parliament API
│   └── summary-parser.ts # Parse AI summaries
└── supabase/
    └── schema.sql        # Database schema with RLS
```

## Database Schema

- **bills**: Stores legislative bills from Eduskunta API
- **votes**: Stores user votes with RLS (users can only see their own votes)
- **vote_aggregates**: Public view for aggregate statistics
- **get_vote_stats()**: Function to calculate vote statistics

## Key Features Explained

### Authentication
- Magic Link email authentication
- Secure session management via Supabase
- Ready for BankID/FTN integration (future)

### Voting System
- Users can vote: For, Against, or Neutral
- Real-time vote statistics
- RLS ensures privacy (users only see their own votes)
- Aggregate results visible to everyone

### AI Summaries
- Converts complex legal text to plain Finnish (selkokieli)
- Structured format: Topic → Changes → Impact
- Ready for OpenAI/Anthropic integration

### Comparison Mirror
- Visualizes gap between citizen votes and parliament
- Highlights significant discrepancies (>20%)
- Shows party breakdown

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

- Set environment variables in your platform's settings
- Update Supabase redirect URLs to your production domain
- Run `npm run build` to test locally first

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own votes
- Aggregate statistics are public
- Secure authentication via Supabase
- Environment variables for sensitive data

## Future Enhancements

- BankID/FTN authentication
- Real-time vote updates
- Email notifications for bill updates
- Advanced analytics dashboard
- Mobile app

## License

MIT

## Support

For setup help, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)


