# Eduskunta API Notes

## The Problem

The Eduskunta API appears to have CORS restrictions or the endpoints have changed. All client-side fetch requests are failing with "Failed to fetch" errors.

## Solutions

### 1. Server-Side Testing (Current Implementation)

I've updated the test page to use a **server action** (`app/actions/test-eduskunta.ts`) which:
- Runs on the server (no CORS restrictions)
- Can access the API directly
- Returns results to the client

**How to use:**
1. Go to `/test-api`
2. Click "Testaa kaikki endpointit"
3. Results will come from server-side requests

### 2. Alternative: Use Mock Data

Since the Eduskunta API is unreliable, you can:
- Continue using mock data for development
- Add bills manually to Supabase
- Use the existing `fetchBills()` function with mock data

### 3. Check Actual API Documentation

The Eduskunta API might:
- Require authentication
- Use a different base URL
- Have changed their endpoint structure
- Use a different format (GraphQL, SPARQL, etc.)

**Resources:**
- https://avoindata.eduskunta.fi/
- https://github.com/eduskunta/avoindata.eduskunta.fi

### 4. Manual Data Entry

For MVP/testing, you can add bills directly to Supabase:

```sql
-- Example: Add a bill manually
INSERT INTO bills (parliament_id, title, summary, status, raw_text)
VALUES (
  'HE 123/2024',
  'Test Lakiesitys',
  'Tämä on testi lakiesitys',
  'voting',
  'Pidempi kuvaus lakiesityksestä...'
);
```

Or use Supabase Dashboard → Table Editor → Insert row

## Next Steps

1. **Test the server-side endpoint tester** at `/test-api`
2. If that works, we can update `lib/eduskunta-api.ts` to use server actions
3. If it doesn't work, the API might be down or require different access
4. For now, continue with manual entry or mock data

## Current Status

- ✅ Server-side test created
- ✅ Test page updated to use server actions
- ⚠️ Client-side requests fail (CORS/network issue)
- 🔄 Waiting for server-side test results

