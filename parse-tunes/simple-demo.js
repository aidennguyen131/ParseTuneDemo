// Simple demo using direct fetch calls to test the API endpoints
import fetch from 'cross-fetch';

// Constants from the library
const countries = {
    US: 143441,
    DE: 143443,
    GB: 143444
};

const genres = {
    all: 36,
    Games: 6014,
    Education: 6017,
    Utilities: 6002
};

const charts = {
    topFreeIphone: 27,
    topPaidIphone: 30,
    topGrossingIphone: 38
};

// Simple function to fetch top apps
async function fetchTopApps(request) {
    const { genre, chart, country } = request;
    const platform = 29; // iPhone platform
    
    const url = `https://itunes.apple.com/WebObjects/MZStore.woa/wa/viewTop?genreId=${genre}&popId=${chart}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Apple-Store-Front': `${country},${platform}`,
        },
    });
    
    const data = await response.json();
    return data.pageData.segmentedControl.segments[0].pageData.selectedChart.adamIds;
}

// Simple function to search apps
async function searchApps(request) {
    const { searchTerm, country, language } = request;
    
    const url = `https://tools.applemediaservices.com/api/apple-media/apps/${country}/search.json?types=apps&term=${searchTerm}&l=${language}&limit=25&platform=web&additionalPlatforms=iphone,appletv,ipad,mac,watch`;
    
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    
    return data.apps.data.map(a => a.attributes);
}

async function runSimpleDemo() {
    console.log('🚀 Starting simple parse-tunes demo...\n');

    try {
        // Demo 1: Fetch top free iPhone apps in US
        console.log('📱 Demo 1: Fetching top free iPhone apps in US...');
        const topApps = await fetchTopApps({
            genre: genres.all,
            chart: charts.topFreeIphone,
            country: countries.US
        });
        
        console.log(`✅ Found ${topApps.length} apps`);
        console.log('🏆 Top 5 app IDs:', topApps.slice(0, 5));
        console.log('');

        // Demo 2: Search for calculator apps
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

        // Demo 3: Show available countries and genres
        console.log('🌍 Demo 3: Available countries:');
        console.log('   US:', countries.US);
        console.log('   Germany:', countries.DE);
        console.log('   UK:', countries.GB);
        console.log('');

        console.log('📂 Available genres:');
        console.log('   All:', genres.all);
        console.log('   Games:', genres.Games);
        console.log('   Education:', genres.Education);
        console.log('   Utilities:', genres.Utilities);
        console.log('');

        console.log('📊 Available charts:');
        console.log('   Top Free iPhone:', charts.topFreeIphone);
        console.log('   Top Paid iPhone:', charts.topPaidIphone);
        console.log('   Top Grossing iPhone:', charts.topGrossingIphone);

        console.log('\n🎉 Demo completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response text:', await error.response.text());
        }
    }
}

// Run the demo
runSimpleDemo();