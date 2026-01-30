# iTunes Charts V2 API Documentation

This document describes the new Charts V2 API endpoints that utilize the iTunes MZStoreServices API for accessing app charts.

## Overview

The Charts V2 API provides access to iTunes app charts using the newly discovered MZStoreServices endpoint:
```
https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/charts
```

This endpoint returns app IDs in ranking order, which are then enriched with detailed app information using the iTunes lookup API.

## Key Differences from Legacy API

| Feature | Legacy API (`/api/top-charts`) | Charts V2 API (`/api/charts-v2`) |
|---------|-------------------------------|-----------------------------------|
| Data Source | MZStore.woa/wa/viewTop | MZStoreServices.woa/ws/charts |
| Chart Types | 6 predefined chart IDs | 12+ named chart types |
| Max Results | 200 apps | Up to 200 apps (configurable fetch limit) |
| Parameters | Numeric genre/chart IDs | Named chart types |
| Response Format | Legacy structure | Enhanced with chart info |

## Available Endpoints

### 1. Get Chart Types
**GET** `/api/chart-types`

Returns all available chart types for the Charts V2 API.

**Response:**
```json
{
  "success": true,
  "chartTypes": [
    {
      "id": "freeAppsV2",
      "name": "FreeAppsV2",
      "displayName": "Free Apps V2"
    }
    // ... more chart types
  ],
  "legacy": {
    "description": "Legacy chart IDs for /api/top-charts endpoint",
    "charts": [...]
  }
}
```

### 2. Get Charts V2
**POST** `/api/charts-v2`

Fetches app charts using the new MZStoreServices API.

**Request Body:**
```json
{
  "chartType": "FreeAppsV2",    // Required: Chart type name
  "genre": 36,                  // Optional: Genre ID (default: 36 = All)
  "country": "us",              // Optional: Country code (default: "us")
  "limit": 25,                  // Optional: Number of apps to return (default: 25)
  "offset": 0,                  // Optional: Pagination offset (default: 0)
  "maxFetch": 100               // Optional: Max IDs to fetch from iTunes (default: 100)
}
```

**Response:**
```json
{
  "success": true,
  "apps": [
    {
      "id": 6448311069,
      "name": "ChatGPT",
      "artistName": "OpenAI OpCo, LLC",
      "genre": "Productivity",
      "rating": 4.85673,
      "ratingCount": 5360945,
      "price": 0,
      "artwork": "https://...",
      "url": "https://...",
      "rank": 1
    }
    // ... more apps
  ],
  "chartInfo": {
    "chartType": "FreeAppsV2",
    "genre": 36,
    "country": "us"
  },
  "pagination": {
    "total": 100,
    "totalAvailable": 100,
    "limit": 25,
    "offset": 0,
    "hasMore": true,
    "nextOffset": 25
  }
}
```

## Available Chart Types

| Chart Type | Description |
|------------|-------------|
| `AppsByRevenue` | Top grossing apps |
| `FreeApplications` | Top free apps |
| `FreeAppleTVApps` | Top free Apple TV apps |
| `PaidAppleTVApps` | Top paid Apple TV apps |
| `FreeAppsV2` | Top free apps (V2) - **Newly discovered!** |
| `PaidIpadApplications` | Top paid iPad apps |
| `IpadAppsByRevenue` | Top grossing iPad apps |
| `FreeIpadApplications` | Top free iPad apps |
| `PaidApplications` | Top paid apps |
| `AppleTVAppsByRevenue` | Top grossing Apple TV apps |
| `Applications` | General applications chart |
| `FreeMacAppsV2` | Top free Mac apps (V2) |

## Genre IDs

Common genre IDs that can be used with the `genre` parameter:

| Genre | ID |
|-------|-------|
| All | 36 |
| Games | 6014 |
| Education | 6017 |
| Utilities | 6002 |
| Health & Fitness | 6013 |
| Photo & Video | 6008 |
| Entertainment | 6016 |
| Finance | 6015 |
| Productivity | 6007 |

## Country Codes

Use standard 2-letter country codes:
- `us` - United States
- `gb` - United Kingdom  
- `de` - Germany
- `jp` - Japan
- `kr` - South Korea
- `cn` - China
- `vn` - Vietnam

## Usage Examples

### Get Top 10 Free Apps (V2)
```bash
curl -X POST "http://localhost:8787/api/charts-v2" \
  -H "Content-Type: application/json" \
  -d '{
    "chartType": "FreeAppsV2",
    "limit": 10
  }'
```

### Get Top 5 Paid Games
```bash
curl -X POST "http://localhost:8787/api/charts-v2" \
  -H "Content-Type: application/json" \
  -d '{
    "chartType": "PaidApplications",
    "genre": 6014,
    "limit": 5
  }'
```

### Get German App Store Charts
```bash
curl -X POST "http://localhost:8787/api/charts-v2" \
  -H "Content-Type: application/json" \
  -d '{
    "chartType": "FreeAppsV2",
    "country": "de",
    "limit": 20
  }'
```

## Pagination

The API supports pagination with `limit` and `offset` parameters:

```json
{
  "limit": 25,
  "offset": 50,
  "chartType": "FreeAppsV2"
}
```

The response includes pagination metadata:
- `total`: Number of apps fetched and processed
- `totalAvailable`: Total apps available from iTunes
- `hasMore`: Whether more results are available
- `nextOffset`: Offset for the next page (null if no more results)

## Rate Limiting & Best Practices

1. **Fetch Limits**: Use `maxFetch` parameter to control how many app IDs are fetched from iTunes (max 200)
2. **Pagination**: Use reasonable `limit` values (25-50) for better performance
3. **Caching**: Consider caching results as charts don't change frequently
4. **Error Handling**: Always check the `success` field in responses

## Error Responses

```json
{
  "success": false,
  "error": "Invalid chart type: InvalidType"
}
```

Common errors:
- `chartType is required` - Missing required chartType parameter
- `Invalid chart type: [type]` - Unknown chart type provided
- `HTTP error! status: [code]` - iTunes API error

## Testing

Run the included test script to verify all functionality:

```bash
node test-charts-v2.js
```

This will test all chart types, pagination, and different parameters.