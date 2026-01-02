# Party Stance Engine

## Overview

The PartyStanceEngine analyzes Finnish parliamentary committee reports (mietintö) to determine party stances on legislative bills. It uses AI to identify reservations (vastalause) and maps them to party positions.

## Features

### 1. Data Fetching
- Fetches mietintö (Committee Report) documents from Eduskunta API
- Searches for documents related to a specific bill (HE)
- Extracts document content for analysis

### 2. Stance Analysis
- **Government Parties** (KOK, PS, RKP, KD): Default to "PRO" unless they have a reservation
- **Opposition Parties** (SDP, KESK, VIH, VAS): Default to "ABSTAIN" unless they have a reservation
- Uses AI to identify which parties signed reservations in the mietintö

### 3. AI-Powered Reservation Detection
- Scans mietintö text for "Vastalause" (Reservations)
- Uses OpenAI GPT-4o-mini to identify:
  - Which parties signed which reservation
  - Whether the reservation is "AGAINST" or "ABSTAIN"
- Returns structured JSON with party stances

### 4. UI Integration
- **Party Spectrum Bar**: Horizontal visualization showing:
  - Party positions (colored dots with party abbreviations)
  - Citizen Pulse indicator (blue vertical line)
  - Color-coded stance indicators (green=PRO, red=AGAINST, gray=ABSTAIN)
- Integrated into `ComparisonMirror` component
- Automatically loads when viewing a bill detail

## Files Created

### `lib/party-stances.ts`
Main engine with:
- `analyzePartyStances()` - Main analysis function
- `fetchMietinto()` - Fetches committee reports
- `identifyReservations()` - AI-powered reservation detection
- `PARTY_INFO` - Party metadata (colors, names, abbreviations)

### `app/actions/party-stances.ts`
Server action wrapper for client-side calls

### Updated `components/ComparisonMirror.tsx`
- Added Party Spectrum bar visualization
- Automatic loading of party stances when `billId` and `parliamentId` are provided
- Shows party positions relative to Citizen Pulse

## Usage

The engine is automatically called when viewing a bill detail:

```typescript
<ComparisonMirror
  parliamentVote={politicalForPercent}
  citizenVote={citizenVote}
  billName={bill.title}
  billId={bill.id}
  parliamentId={bill.parliamentId}
/>
```

The component will:
1. Automatically fetch party stances from mietintö
2. Display them in a horizontal Party Spectrum bar
3. Show Citizen Pulse indicator for comparison

## Party Information

| Party | Short Name | Color | Default Stance |
|-------|-----------|-------|----------------|
| KOK | Kansallinen Kokoomus | Blue (#0066CC) | PRO (Government) |
| PS | Perussuomalaiset | Gold (#FFD700) | PRO (Government) |
| RKP | Ruotsalainen kansanpuolue | Gold (#FFD700) | PRO (Government) |
| KD | Kristillisdemokraatit | Blue (#0066CC) | PRO (Government) |
| SDP | Suomen Sosialidemokraattinen Puolue | Red (#E31E24) | ABSTAIN (Opposition) |
| KESK | Suomen Keskusta | Green (#00AA44) | ABSTAIN (Opposition) |
| VIH | Vihreät | Green (#61B64A) | ABSTAIN (Opposition) |
| VAS | Vasemmistoliitto | Red (#C41E3A) | ABSTAIN (Opposition) |

## How It Works

1. **Fetch Mietintö**: Searches Eduskunta API for committee reports related to the bill
2. **Check for Reservations**: Scans text for "Vastalause" keyword
3. **AI Analysis**: If reservations found, uses AI to identify:
   - Which parties signed
   - Type of reservation (AGAINST or ABSTAIN)
4. **Stance Mapping**: Maps parties to stances:
   - Government parties → PRO (unless reservation)
   - Opposition with AGAINST reservation → AGAINST
   - Opposition with ABSTAIN reservation → ABSTAIN
   - Opposition without reservation → ABSTAIN (default)

## Limitations

- Requires OpenAI API key for AI analysis
- Mietintö documents may not always be available
- AI analysis may not be 100% accurate (confidence scores provided)
- Falls back to default stances if mietintö not found

## Future Enhancements

- Cache party stances in database
- Support for multiple mietintö documents
- More sophisticated stance detection
- Historical stance tracking
- Party logo images instead of colored dots


