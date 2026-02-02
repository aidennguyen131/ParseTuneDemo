// Express server for Parse-Tunes Web Demo
import express from 'express';
import cors from 'cors';
import fetch from 'cross-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Constants from parse-tunes
const countries = {
    US: 143441,
    DE: 143443,
    GB: 143444,
    VN: 143471,
    JP: 143462,
    KR: 143466,
    CN: 143465
};

const genres = {
    all: 36,
    Games: 6014,
    Education: 6017,
    Utilities: 6002,
    'Health & Fitness': 6013,
    'Photo & Video': 6008,
    Entertainment: 6016,
    Finance: 6015,
    Productivity: 6007
};

const charts = {
    topFreeIphone: 27,
    topPaidIphone: 30,
    topGrossingIphone: 38,
    topFreeIpad: 44,
    topPaidIpad: 45,
    topGrossingIpad: 46
};

// New iTunes Charts API endpoints (MZStoreServices)
const chartTypes = {
    appsByRevenue: 'AppsByRevenue',
    freeApplications: 'FreeApplications',
    freeAppleTVApps: 'FreeAppleTVApps',
    paidAppleTVApps: 'PaidAppleTVApps',
    freeAppsV2: 'FreeAppsV2',
    paidIpadApplications: 'PaidIpadApplications',
    ipadAppsByRevenue: 'IpadAppsByRevenue',
    freeIpadApplications: 'FreeIpadApplications',
    paidApplications: 'PaidApplications',
    appleTVAppsByRevenue: 'AppleTVAppsByRevenue',
    applications: 'Applications',
    freeMacAppsV2: 'FreeMacAppsV2'
};

// Helper function to fetch top apps (legacy MZStore API)
async function fetchTopApps(request) {
    const { genre, chart, country } = request;
    const ipadCharts = [44, 45, 46]; // iPad chart IDs
    const platform = ipadCharts.includes(chart) ? 30 : 29;

    const url = `https://itunes.apple.com/WebObjects/MZStore.woa/wa/viewTop?genreId=${genre}&popId=${chart}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Apple-Store-Front': `${country},${platform}`,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.pageData.segmentedControl.segments[0].pageData.selectedChart.adamIds;
}

// Helper function to fetch charts from new MZStoreServices API
async function fetchChartsV2(request) {
    const { chartType, genre = 36, country = 'us', limit = 100 } = request;

    // Validate chart type
    if (!Object.values(chartTypes).includes(chartType)) {
        throw new Error(`Invalid chart type: ${chartType}`);
    }

    const url = `https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/charts?cc=${country}&g=${genre}&name=${chartType}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.resultIds || [];
}

// Helper function to get app info from iTunes lookup API
async function getAppInfo(appIds, limit = 200) {
    // iTunes lookup API has a limit of ~200 IDs per request
    const maxIds = Math.min(limit, 200);
    const idsToFetch = Array.isArray(appIds) ? appIds.slice(0, maxIds) : [appIds];

    // Split into chunks of 50 to avoid URL length limits
    const chunks = [];
    for (let i = 0; i < idsToFetch.length; i += 50) {
        chunks.push(idsToFetch.slice(i, i + 50));
    }

    const allResults = [];

    for (const chunk of chunks) {
        const idsString = chunk.join(',');
        const url = `https://itunes.apple.com/lookup?id=${idsString}&country=US&entity=software`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allResults.push(...data.results);

        // Add small delay between requests to be respectful to API
        if (chunks.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return allResults;
}

// Helper function to search apps
async function searchApps(request) {
    const { searchTerm, country = 'US', language = 'en-US' } = request;

    // Use iTunes Search API - maximum limit is 200
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=${country}&entity=software&limit=200`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
}

// API Routes

// Get top charts
app.post('/api/top-charts', async (req, res) => {
    try {
        const { country, genre, chart, limit = 20, offset = 0 } = req.body;

        console.log(`Fetching top charts: country=${country}, genre=${genre}, chart=${chart}, limit=${limit}, offset=${offset}`);

        // Fetch app IDs
        const appIds = await fetchTopApps({ country, genre, chart });
        console.log(`Found ${appIds.length} app IDs`);

        // Get detailed info for up to 200 apps (or less if not available)
        const maxAppsToFetch = Math.min(200, appIds.length);
        console.log(`Attempting to fetch ${maxAppsToFetch} apps from ${appIds.length} total`);
        const appDetails = await getAppInfo(appIds.slice(0, maxAppsToFetch), maxAppsToFetch);
        console.log(`Got details for ${appDetails.length} apps`);

        // Create a map to preserve ranking order
        const appDetailsMap = new Map();
        appDetails.forEach(app => {
            appDetailsMap.set(app.trackId.toString(), app);
        });

        // Format all apps in correct ranking order
        const allFormattedApps = appIds.slice(0, maxAppsToFetch).map((appId, index) => {
            const app = appDetailsMap.get(appId.toString());
            if (!app) return null;

            return {
                id: app.trackId,
                name: app.trackName,
                artistName: app.artistName,
                artistId: app.artistId,
                genre: app.primaryGenreName,
                rating: app.averageUserRating,
                ratingCount: app.userRatingCount,
                price: app.price,
                artwork: app.artworkUrl100,
                url: app.trackViewUrl,
                rank: index + 1
            };
        }).filter(app => app !== null);

        // Apply pagination
        const startIndex = Math.max(0, offset);
        const endIndex = Math.min(allFormattedApps.length, startIndex + limit);
        const paginatedApps = allFormattedApps.slice(startIndex, endIndex);

        // Check if there are more apps available beyond what we fetched
        const totalFetched = allFormattedApps.length;
        const totalAvailable = appIds.length;
        const currentEnd = offset + paginatedApps.length;
        const hasMore = currentEnd < Math.min(totalAvailable, 200); // Max 200 apps

        console.log(`Pagination debug: totalFetched=${totalFetched}, totalAvailable=${totalAvailable}, currentEnd=${currentEnd}, hasMore=${hasMore}`);

        res.json({
            success: true,
            apps: paginatedApps,
            total: appIds.length, // For backward compatibility
            pagination: {
                total: totalFetched,
                totalAvailable: totalAvailable,
                limit: limit,
                offset: offset,
                hasMore: hasMore,
                nextOffset: hasMore ? currentEnd : null
            }
        });

    } catch (error) {
        console.error('Error in /api/top-charts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get charts using new MZStoreServices API
app.post('/api/charts-v2', async (req, res) => {
    try {
        const { chartType, genre = 36, country = 'us', limit = 25, offset = 0, maxFetch = 100 } = req.body;

        console.log(`Fetching charts v2: chartType=${chartType}, genre=${genre}, country=${country}, limit=${limit}, offset=${offset}`);

        // Validate required parameters
        if (!chartType) {
            return res.status(400).json({
                success: false,
                error: 'chartType is required'
            });
        }

        // Fetch app IDs from charts API
        const appIds = await fetchChartsV2({ chartType, genre, country, limit: maxFetch });
        console.log(`Found ${appIds.length} app IDs from charts API`);

        if (appIds.length === 0) {
            return res.json({
                success: true,
                apps: [],
                pagination: {
                    total: 0,
                    totalAvailable: 0,
                    limit: limit,
                    offset: offset,
                    hasMore: false,
                    nextOffset: null
                }
            });
        }

        // Get detailed info for the apps (up to 200 max due to iTunes lookup API limits)
        const maxAppsToFetch = Math.min(200, appIds.length);
        console.log(`Attempting to fetch details for ${maxAppsToFetch} apps from ${appIds.length} total`);
        const appDetails = await getAppInfo(appIds.slice(0, maxAppsToFetch), maxAppsToFetch);
        console.log(`Got details for ${appDetails.length} apps`);

        // Create a map to preserve ranking order
        const appDetailsMap = new Map();
        appDetails.forEach(app => {
            appDetailsMap.set(app.trackId.toString(), app);
        });

        // Format all apps in correct ranking order
        const allFormattedApps = appIds.slice(0, maxAppsToFetch).map((appId, index) => {
            const app = appDetailsMap.get(appId.toString());
            if (!app) return null;

            return {
                id: app.trackId,
                name: app.trackName,
                artistName: app.artistName,
                artistId: app.artistId,
                genre: app.primaryGenreName,
                rating: app.averageUserRating,
                ratingCount: app.userRatingCount,
                price: app.price,
                artwork: app.artworkUrl100,
                url: app.trackViewUrl,
                rank: index + 1
            };
        }).filter(app => app !== null);

        // Apply pagination
        const startIndex = Math.max(0, offset);
        const endIndex = Math.min(allFormattedApps.length, startIndex + limit);
        const paginatedApps = allFormattedApps.slice(startIndex, endIndex);

        // Check if there are more apps available beyond what we fetched
        const totalFetched = allFormattedApps.length;
        const totalAvailable = appIds.length;
        const currentEnd = offset + paginatedApps.length;
        const hasMore = currentEnd < Math.min(totalAvailable, 200); // Max 200 apps

        console.log(`Pagination debug: totalFetched=${totalFetched}, totalAvailable=${totalAvailable}, currentEnd=${currentEnd}, hasMore=${hasMore}`);

        res.json({
            success: true,
            apps: paginatedApps,
            chartInfo: {
                chartType: chartType,
                genre: genre,
                country: country
            },
            pagination: {
                total: totalFetched,
                totalAvailable: totalAvailable,
                limit: limit,
                offset: offset,
                hasMore: hasMore,
                nextOffset: hasMore ? currentEnd : null
            }
        });

    } catch (error) {
        console.error('Error in /api/charts-v2:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Search apps
app.post('/api/search', async (req, res) => {
    try {
        const { searchTerm, country, language, limit = 25, offset = 0 } = req.body;

        console.log(`Searching apps: term="${searchTerm}", country=${country}, limit=${limit}, offset=${offset}`);

        // Search for apps (iTunes Search API has its own limit of ~200 results)
        const searchResults = await searchApps({ searchTerm, country, language });
        console.log(`Found ${searchResults.length} search results`);

        // Format all results
        const allFormattedApps = searchResults.map(app => ({
            id: app.trackId,
            name: app.trackName,
            artistName: app.artistName,
            artistId: app.artistId,
            genre: app.primaryGenreName,
            rating: app.averageUserRating,
            ratingCount: app.userRatingCount,
            price: app.price,
            artwork: app.artworkUrl100,
            url: app.trackViewUrl,
            description: app.description
        }));

        // Apply pagination
        const startIndex = Math.max(0, offset);
        const endIndex = Math.min(allFormattedApps.length, startIndex + limit);
        const paginatedApps = allFormattedApps.slice(startIndex, endIndex);

        res.json({
            success: true,
            apps: paginatedApps,
            pagination: {
                total: allFormattedApps.length,
                limit: limit,
                offset: offset,
                hasMore: endIndex < allFormattedApps.length,
                nextOffset: endIndex < allFormattedApps.length ? endIndex : null
            }
        });

    } catch (error) {
        console.error('Error in /api/search:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get available chart types
app.get('/api/chart-types', (req, res) => {
    try {
        const availableCharts = Object.entries(chartTypes).map(([key, value]) => ({
            id: key,
            name: value,
            displayName: value.replace(/([A-Z])/g, ' $1').trim() // Convert camelCase to readable format
        }));

        res.json({
            success: true,
            chartTypes: availableCharts,
            legacy: {
                description: "Legacy chart IDs for /api/top-charts endpoint",
                charts: Object.entries(charts).map(([key, value]) => ({
                    id: key,
                    chartId: value
                }))
            }
        });

    } catch (error) {
        console.error('Error in /api/chart-types:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get app details
app.post('/api/app-details', async (req, res) => {
    try {
        const { appId } = req.body;

        console.log(`Fetching app details for ID: ${appId}`);

        // Get app details
        const appDetails = await getAppInfo([appId]);

        if (appDetails.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'App not found'
            });
        }

        const app = appDetails[0];
        console.log(`Got details for app: ${app.trackName}`);

        // Format the response
        const formattedApp = {
            id: app.trackId,
            name: app.trackName,
            artistName: app.artistName,
            artistId: app.artistId,
            genre: app.primaryGenreName,
            rating: app.averageUserRating,
            ratingCount: app.userRatingCount,
            price: app.price,
            artwork: app.artworkUrl512 || app.artworkUrl100,
            url: app.trackViewUrl,
            description: app.description,
            releaseNotes: app.releaseNotes,
            version: app.version,
            releaseDate: app.currentVersionReleaseDate,
            size: app.fileSizeBytes,
            contentRating: app.contentAdvisoryRating,
            languages: app.languageCodesISO2A,
            screenshots: app.screenshotUrls,
            ipadScreenshots: app.ipadScreenshotUrls,
            supportedDevices: app.supportedDevices,
            minimumOsVersion: app.minimumOsVersion,
            bundleId: app.bundleId
        };

        res.json({
            success: true,
            app: formattedApp
        });

    } catch (error) {
        console.error('Error in /api/app-details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper function to fetch SensorTower data
async function fetchSensorTowerData(appId, country = 'US') {
    try {
        const url = `https://app.sensortower.com/api/ios/apps/${appId}?country=${country}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`SensorTower API error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the data we need
        return {
            downloads: data.worldwide_last_month_downloads?.value || null,
            revenue: data.worldwide_last_month_revenue?.value || null,
            revenueUnit: data.worldwide_last_month_revenue?.currency || 'USD'
        };

    } catch (error) {
        console.error(`Error fetching SensorTower data for app ${appId}:`, error);
        return {
            downloads: null,
            revenue: null,
            revenueUnit: 'USD',
            error: error.message
        };
    }
}

// Get SensorTower data for specific apps
app.post('/api/sensortower-data', async (req, res) => {
    try {
        const { appIds, country = 'US' } = req.body;

        if (!appIds || !Array.isArray(appIds)) {
            return res.status(400).json({
                success: false,
                error: 'appIds array is required'
            });
        }

        console.log(`Fetching SensorTower data for ${appIds.length} apps`);

        // Fetch SensorTower data for each app
        const sensorTowerPromises = appIds.map(async (appId) => {
            const sensorTowerData = await fetchSensorTowerData(appId, country);
            return {
                appId: appId,
                ...sensorTowerData
            };
        });

        // Wait for all requests to complete
        const sensorTowerResults = await Promise.all(sensorTowerPromises);

        // Create a map for easy lookup
        const sensorTowerMap = {};
        sensorTowerResults.forEach(result => {
            sensorTowerMap[result.appId] = result;
        });

        res.json({
            success: true,
            data: sensorTowerMap,
            total: appIds.length
        });

    } catch (error) {
        console.error('Error in /api/sensortower-data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Parse-Tunes API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Parse-Tunes Web Demo Server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to: http://localhost:${PORT}`);
    console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  POST /api/top-charts - Get top app charts (legacy API, supports limit & offset for pagination)');
    console.log('  POST /api/charts-v2 - Get app charts using new MZStoreServices API (supports limit & offset)');
    console.log('  GET  /api/chart-types - List all available chart types for charts-v2 endpoint');
    console.log('  POST /api/search - Search for apps (supports limit & offset for pagination)');
    console.log('  POST /api/app-details - Get detailed app information');
    console.log('  POST /api/sensortower-data - Get SensorTower analytics data for apps');
    console.log('  GET  /api/health - Health check');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

export default app;
