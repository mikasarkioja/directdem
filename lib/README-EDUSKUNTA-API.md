# Eduskunta API Integration

## Overview

The `lib/eduskunta-api.ts` file provides functions to fetch real legislative bills from the Finnish Parliament's open data API.

## API Endpoint

The Finnish Parliament provides an open data API at:
- **Base URL**: `https://avoindata.eduskunta.fi/api/v1/`
- **Documentation**: https://avoindata.eduskunta.fi/

## Functions

### `getLatestBills(limit?: number)`

Fetches the latest Government Proposals (Hallituksen esitykset - HE) from the Eduskunta API.

**Parameters:**
- `limit` (optional): Number of bills to fetch (default: 10)

**Returns:**
- `Promise<EduskuntaIssue[]>`: Array of parliamentary issues

**Example:**
```typescript
import { getLatestBills } from "@/lib/eduskunta-api";

const bills = await getLatestBills(5);
```

### `getBillById(parliamentId: string)`

Fetches a single bill by its Parliament ID (e.g., "HE 123/2024").

**Parameters:**
- `parliamentId`: The Parliament document ID

**Returns:**
- `Promise<EduskuntaIssue | null>`: The bill issue or null if not found

**Example:**
```typescript
import { getBillById } from "@/lib/eduskunta-api";

const bill = await getBillById("HE 140/2024");
```

## Using Real API Data

To enable fetching from the real Eduskunta API, update your `app/actions/bills.ts`:

```typescript
// In fetchBills function, change:
export async function fetchBills(useRealAPI: boolean = true): Promise<Bill[]> {
  // ... rest of the code
}
```

Or call it with the parameter:
```typescript
const bills = await fetchBills(true);
```

## API Response Structure

The Eduskunta API uses a Siren/JSON format. The fetcher handles various possible response structures:

- `data.results`
- `data.data`
- `data.items`
- Direct array

Field mappings:
- `titleFi` or `title` → title
- `abstractFi` or `abstract` → abstract
- `documentId` or `id` → parliamentId
- `stage` or `status` → status (mapped to our format)

## Status Mapping

The API status is mapped to our internal format:
- "hyväksytty" / "passed" → `passed`
- "hylätty" / "rejected" → `rejected`
- "käsittelyssä" / "active" / "pending" → `active`
- Default → `pending`

## Error Handling

The functions return empty arrays or null on errors to prevent app crashes. Errors are logged to the console.

## Caching

API responses are cached for 1 hour using Next.js's `next: { revalidate: 3600 }` option.

## Mock Data

When using real API data, the system still generates mock data for:
- **Citizen Pulse**: Based on keywords in the bill content
- **Political Reality**: Default party positions (in production, this would come from voting records)

## Production Considerations

1. **Rate Limiting**: The API may have rate limits. Consider implementing request throttling.

2. **Error Tracking**: Log errors to a service like Sentry for monitoring.

3. **Data Enrichment**: 
   - Fetch actual voting records for political reality
   - Integrate with polling services for citizen pulse
   - Fetch full bill text for AI summarization

4. **API Changes**: The Eduskunta API structure may change. Monitor and update field mappings as needed.

5. **Testing**: Test with real API responses to ensure field mappings work correctly.

## Testing the API

You can test the API directly:

```bash
curl "https://avoindata.eduskunta.fi/api/v1/search/documents?type=HE&limit=5"
```

Or use the Next.js API route in development:
```typescript
// In a component or API route
const bills = await getLatestBills(5);
console.log(bills);
```

