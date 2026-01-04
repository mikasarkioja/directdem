# DirectDem - Civic Command Center

A sophisticated Next.js 15 application for Direct Democracy, Gamification, and Civic Engagement.

## 🚀 Vision
DirectDem is a "Civic Command Center" that empowers citizens by bringing transparency to legislation, enabling virtual party formation, and hosting AI-driven debates.

## 🏛️ Features
- **Eduskuntavahti**: Real-time Finnish Parliament bill monitoring with AI Selkokieli summaries.
- **Kuntavahti**: Local decision tracking for Espoo and Helsinki.
- **Democratic DNA**: Visualized citizen profiling based on voting behavior (Radar Charts).
- **Virtual Parties**: Form factions with like-minded citizens and grow your collective impact.
- **The Agora**: Live AI Debate arena with real-time fact-checking.
- **MP Profiler**: Data-driven analysis of MPs' voting records and compatibility matching.
- **Hjallis Demo**: Compare your political DNA with Harri Harkimo and other MPs.

## 🛠️ Technical Overview
Detailed documentation for recreating the entire platform can be found in the **[SYSTEM_BLUEPRINT.md](./SYSTEM_BLUEPRINT.md)**.

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (Auth, PG, RLS)
- **AI**: GPT-4o-mini (AI SDK)
- **UI**: Tailwind CSS, Framer Motion, Recharts
- **Icons**: Lucide React

## 📦 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Supabase Setup:**
   - Run SQL scripts from the `supabase/` folder.
   - Configure environment variables in `.env.local`.

3. **Data Sync:**
   - Run `npm run fetch-eduskunta-data` to populate bills and MP data.
   - Run `npm run analyze-mp-dna` to generate MP profiles.

4. **Run Dev:**
   ```bash
   npm run dev
   ```

## 📜 Documentation Files
- [SYSTEM_BLUEPRINT.md](./SYSTEM_BLUEPRINT.md) - Master technical guide.
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database configuration.
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - Login and Magic Links.
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Vercel deployment.

## ⚖️ License
MIT


