# Testing Eduskunta API

## Quick Test

I've created a test page to help you find the correct Eduskunta API endpoint.

### Option 1: Use the Test Page

1. **Navigate to**: `http://localhost:3000/test-api`
2. Click **"Testaa kaikki endpointit"** (Test all endpoints)
3. Review the results to see which endpoints work

### Option 2: Test in Browser Console

Open browser console (F12) and run:

```javascript
// Test a specific endpoint
fetch('https://avoindata.eduskunta.fi/api/v1/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Option 3: Use curl (Terminal)

```bash
# Test root API
curl https://avoindata.eduskunta.fi/api/v1/

# Test documents endpoint
curl "https://avoindata.eduskunta.fi/api/v1/documents?limit=5"
```

## Common Eduskunta API Endpoints

Based on typical REST API patterns, try these:

1. **Root/Index**: `https://avoindata.eduskunta.fi/api/v1/`
2. **Documents**: `https://avoindata.eduskunta.fi/api/v1/documents`
3. **Search**: `https://avoindata.eduskunta.fi/api/v1/search/documents`
4. **Tables**: `https://avoindata.eduskunta.fi/api/v1/tables/`

## Finding the Right Endpoint

The Eduskunta API might use:
- **Siren format** (hypermedia API)
- **REST API** with query parameters
- **GraphQL** endpoint
- **SPARQL** (triplestore queries)

### Check API Documentation

1. Visit: https://avoindata.eduskunta.fi/
2. Look for API documentation
3. Check GitHub: https://github.com/eduskunta/avoindata.eduskunta.fi

### What to Look For

When testing endpoints, check:
- **Status 200**: Endpoint exists
- **Response structure**: How data is organized
- **Field names**: What fields are available (titleFi, abstractFi, etc.)
- **Filtering**: How to filter by type (HE = Hallituksen esitys)

## Manual Bill Entry (Temporary Solution)

While testing the API, you can add bills manually to Supabase:

1. Go to Supabase Dashboard → **Table Editor** → **bills**
2. Click **Insert** → **Insert row**
3. Fill in:
   - `parliament_id`: "HE 123/2024"
   - `title`: "Lakiesityksen nimi"
   - `summary`: "Lyhyt kuvaus"
   - `status`: "voting"
   - `raw_text`: "Pidempi kuvaus"

## Once You Find the Correct Endpoint

Update `lib/eduskunta-api.ts` with the working endpoint and response structure.

