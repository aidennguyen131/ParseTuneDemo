# iTunes MZStoreServices Charts API Discovery Summary

## What You Discovered

You found a new iTunes API endpoint that was referenced in the genre response (#3):

```
https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/charts?cc=us&g=36&name=FreeAppsV2
```

## What This Endpoint Returns

The endpoint returns a simple JSON structure with app IDs in ranking order:

```json
{
  "resultIds": [
    "6448311069",  // ChatGPT
    "6746533451",  // UpScrolled  
    "6446901002",  // Threads
    "1673567402",  // Freecash
    "6477489729",  // Google Gemini
    // ... up to 100+ more app IDs
  ]
}
```

## Key Parameters

| Parameter | Description | Default | Max Value |
|-----------|-------------|---------|-----------|
| `cc` | Country code | `us` | Any 2-letter code |
| `g` | Genre ID | `36` (All) | Various genre IDs |
| `name` | Chart type name | Required | See chart types below |
| `limit` | Number of results | `5` | `200` (discovered by trial) |

## Available Chart Types

From the genre response, you discovered these 12 chart types:

1. **`AppsByRevenue`** - Top grossing apps
2. **`FreeApplications`** - Top free apps  
3. **`FreeAppleTVApps`** - Top free Apple TV apps
4. **`PaidAppleTVApps`** - Top paid Apple TV apps
5. **`FreeAppsV2`** - Top free apps (V2) ⭐ **The one you initially found**
6. **`PaidIpadApplications`** - Top paid iPad apps
7. **`IpadAppsByRevenue`** - Top grossing iPad apps
8. **`FreeIpadApplications`** - Top free iPad apps
9. **`PaidApplications`** - Top paid apps
10. **`AppleTVAppsByRevenue`** - Top grossing Apple TV apps
11. **`Applications`** - General applications chart
12. **`FreeMacAppsV2`** - Top free Mac apps (V2)

## What Makes This Special

### Advantages over Legacy API:
1. **Simpler Structure**: Just returns app IDs, no complex nested JSON
2. **Named Parameters**: Use readable names like `FreeAppsV2` instead of numeric chart IDs
3. **Higher Limits**: Can get up to 200 results vs legacy API limitations
4. **More Chart Types**: 12 chart types vs 6 in legacy API
5. **Consistent Format**: Same response structure across all chart types

### How It Works:
1. **Step 1**: Call MZStoreServices to get ranked app IDs
2. **Step 2**: Use iTunes Lookup API to get detailed app information
3. **Step 3**: Combine data while preserving ranking order

## Implementation in Parse-Tunes

I've added this discovery to your parse-tunes project:

### New API Endpoints:
- `GET /api/chart-types` - Lists all available chart types
- `POST /api/charts-v2` - Fetches charts using the new API

### Features Added:
- ✅ Support for all 12 chart types
- ✅ Configurable limits (up to 200)
- ✅ Pagination support
- ✅ Country and genre filtering
- ✅ Detailed app information enrichment
- ✅ Comprehensive error handling

### Test Results:
```
✅ FreeAppsV2: ChatGPT, UpScrolled, Threads, Freecash, Google Gemini...
✅ PaidApplications: Minecraft ($6.99), Geometry Dash ($2.99), Heads Up! ($1.99)...
✅ Games Genre: NYT Crossplay, Block Blast, Solitaire Associations...
```

## Technical Details

### Response Time: ~5-15 seconds (includes app detail enrichment)
### Rate Limits: Respectful delays between iTunes Lookup API calls
### Error Handling: Validates chart types, handles API failures gracefully
### Data Quality: Preserves exact ranking order from iTunes

## Usage Examples

### Get Top 10 Free Apps (V2):
```bash
curl -X POST "http://localhost:8787/api/charts-v2" \
  -H "Content-Type: application/json" \
  -d '{"chartType": "FreeAppsV2", "limit": 10}'
```

### Get Top 5 Paid Apps:
```bash
curl -X POST "http://localhost:8787/api/charts-v2" \
  -H "Content-Type: application/json" \
  -d '{"chartType": "PaidApplications", "limit": 5}'
```

### Get Free Games:
```bash
curl -X POST "http://localhost:8787/api/charts-v2" \
  -H "Content-Type: application/json" \
  -d '{"chartType": "FreeAppsV2", "genre": 6014, "limit": 10}'
```

## Files Created/Updated:

1. **`server.js`** - Added new endpoints and chart fetching logic
2. **`CHARTS_V2_API.md`** - Complete API documentation
3. **`test-charts-v2.js`** - Comprehensive test script
4. **`DISCOVERY_SUMMARY.md`** - This summary document
5. **`README.md`** - Updated with discovery announcement

Your discovery has significantly expanded the capabilities of the parse-tunes library! 🎉