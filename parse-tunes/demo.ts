// Demo script for parse-tunes library
import { 
    fetchTopApps, 
    fetchAppDetails, 
    searchApps, 
    countries, 
    genres, 
    charts 
} from './src/index.js';

async function runDemo() {
    console.log('🚀 Starting parse-tunes demo...\n');

    try {
        // Demo 1: Fetch top free iPhone apps in US (just first 5)
        console.log('📱 Demo 1: Fetching top free iPhone apps in US...');
        const topApps = await fetchTopApps({
            genre: genres.all,
            chart: charts.topFreeIphone,
            country: countries.US
        });
        
        console.log(`✅ Found ${topApps.length} apps`);
        console.log('🏆 Top 5 app IDs:', topApps.slice(0, 5));
        console.log('');

        // Demo 2: Search for education apps  
        console.log('🔍 Demo 2: Searching for "calculator" apps...');
        const searchResults = await searchApps({
            searchTerm: 'calculator',
            country: 'US',
            language: 'en-US'
        });
        
        console.log(`✅ Found ${searchResults.length} calculator apps`);
        if (searchResults.length > 0) {
            console.log('🧮 First 3 apps:');
            searchResults.slice(0, 3).forEach((app, index) => {
                console.log(`   ${index + 1}. ${app.name} by ${app.artistName}`);
            });
        }
        console.log('');

        // Demo 3: Get details for a specific app (Calculator by Apple)
        console.log('📋 Demo 3: Fetching app details...');
        const appDetails = await fetchAppDetails({
            appId: 1069511488, // Calculator app ID
            platforms: ['iphone'],
            attributes: ['name', 'artistName', 'genreDisplayName'],
            country: 'US',
            language: 'en-US'
        });
        
        console.log('✅ App Details:');
        console.log(`   📱 Name: ${appDetails.name}`);
        console.log(`   👨‍💻 Developer: ${appDetails.artistName}`);
        console.log(`   📂 Genre: ${appDetails.genreDisplayName}`);

        console.log('\n🎉 Demo completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

// Run the demo
runDemo();