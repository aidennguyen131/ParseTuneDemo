// Demo script for parse-tunes library
import fetch from 'cross-fetch';

// Import the built library
import { 
    fetchTopApps, 
    fetchAppDetails, 
    searchApps, 
    countries, 
    genres, 
    charts 
} from './src/index.ts';

async function runDemo() {
    console.log('🚀 Starting parse-tunes demo...\n');

    try {
        // Demo 1: Fetch top free iPhone apps in US
        console.log('📱 Demo 1: Fetching top 10 free iPhone apps in US...');
        const topApps = await fetchTopApps({
            genre: genres.all,
            chart: charts.topFreeIphone,
            country: countries.US
        });
        
        console.log(`✅ Found ${topApps.length} apps`);
        console.log('🏆 Top 10 app IDs:', topApps.slice(0, 10));
        console.log('');

        // Demo 2: Search for education apps
        console.log('🔍 Demo 2: Searching for "education" apps...');
        const searchResults = await searchApps({
            searchTerm: 'education',
            country: 'US',
            language: 'en-US'
        });
        
        console.log(`✅ Found ${searchResults.length} education apps`);
        if (searchResults.length > 0) {
            console.log('📚 First 3 apps:');
            searchResults.slice(0, 3).forEach((app, index) => {
                console.log(`   ${index + 1}. ${app.name} by ${app.artistName}`);
            });
        }
        console.log('');

        // Demo 3: Get details for a specific app (Instagram)
        console.log('📋 Demo 3: Fetching Instagram app details...');
        const appDetails = await fetchAppDetails({
            appId: 389801252, // Instagram app ID
            platforms: ['iphone'],
            attributes: ['name', 'artistName', 'description', 'userRating', 'genreDisplayName'],
            country: 'US',
            language: 'en-US'
        });
        
        console.log('✅ App Details:');
        console.log(`   📱 Name: ${appDetails.name}`);
        console.log(`   👨‍💻 Developer: ${appDetails.artistName}`);
        console.log(`   📂 Genre: ${appDetails.genreDisplayName}`);
        if (appDetails.userRating) {
            console.log(`   ⭐ Rating: ${appDetails.userRating.value}/5 (${appDetails.userRating.ratingCount} reviews)`);
        }
        if (appDetails.description) {
            const shortDesc = appDetails.description.standard.substring(0, 100) + '...';
            console.log(`   📝 Description: ${shortDesc}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the demo
runDemo();