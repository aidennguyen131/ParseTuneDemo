// Working demo for parse-tunes functionality
import fetch from 'cross-fetch';

// Constants from the library
const countries = {
    US: 143441,
    DE: 143443,
    GB: 143444,
    VN: 143471
};

const genres = {
    all: 36,
    Games: 6014,
    Education: 6017,
    Utilities: 6002,
    'Health & Fitness': 6013,
    'Photo & Video': 6008,
    Entertainment: 6016
};

const charts = {
    topFreeIphone: 27,
    topPaidIphone: 30,
    topGrossingIphone: 38,
    topFreeIpad: 44,
    topPaidIpad: 45,
    topGrossingIpad: 46
};

// Function to fetch top apps (this one works!)
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

// Function to get app basic info from iTunes lookup API
async function getAppInfo(appIds) {
    const idsString = appIds.slice(0, 5).join(','); // Get first 5 apps
    const url = `https://itunes.apple.com/lookup?id=${idsString}&country=US`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.results;
}

async function runWorkingDemo() {
    console.log('🚀 Starting working parse-tunes demo...\n');

    try {
        // Demo 1: Top Free iPhone Apps in US
        console.log('📱 Demo 1: Top Free iPhone Apps in US');
        console.log('=' .repeat(50));
        
        const topFreeUS = await fetchTopApps({
            genre: genres.all,
            chart: charts.topFreeIphone,
            country: countries.US
        });
        
        console.log(`✅ Found ${topFreeUS.length} apps`);
        
        // Get details for top 5 apps
        const appDetails = await getAppInfo(topFreeUS);
        console.log('\n🏆 Top 5 Free iPhone Apps:');
        appDetails.forEach((app, index) => {
            console.log(`   ${index + 1}. ${app.trackName} by ${app.artistName}`);
            console.log(`      Genre: ${app.primaryGenreName} | Price: $${app.price}`);
            console.log(`      Rating: ${app.averageUserRating || 'N/A'} (${app.userRatingCount || 0} reviews)`);
            console.log('');
        });

        // Demo 2: Top Games in Germany
        console.log('🎮 Demo 2: Top Free Games in Germany');
        console.log('=' .repeat(50));
        
        const topGamesDE = await fetchTopApps({
            genre: genres.Games,
            chart: charts.topFreeIphone,
            country: countries.DE
        });
        
        console.log(`✅ Found ${topGamesDE.length} games`);
        console.log('🏆 Top 5 Game IDs:', topGamesDE.slice(0, 5));
        console.log('');

        // Demo 3: Top Paid Apps in UK
        console.log('💰 Demo 3: Top Paid iPhone Apps in UK');
        console.log('=' .repeat(50));
        
        const topPaidUK = await fetchTopApps({
            genre: genres.all,
            chart: charts.topPaidIphone,
            country: countries.GB
        });
        
        console.log(`✅ Found ${topPaidUK.length} paid apps`);
        console.log('🏆 Top 5 Paid App IDs:', topPaidUK.slice(0, 5));
        console.log('');

        // Demo 4: Education Apps in Vietnam
        console.log('📚 Demo 4: Top Education Apps in Vietnam');
        console.log('=' .repeat(50));
        
        const topEducationVN = await fetchTopApps({
            genre: genres.Education,
            chart: charts.topFreeIphone,
            country: countries.VN
        });
        
        console.log(`✅ Found ${topEducationVN.length} education apps`);
        console.log('🏆 Top 5 Education App IDs:', topEducationVN.slice(0, 5));
        console.log('');

        // Demo 5: Show library capabilities
        console.log('🛠️  Demo 5: Library Capabilities');
        console.log('=' .repeat(50));
        
        console.log('🌍 Supported Countries:');
        Object.entries(countries).forEach(([code, id]) => {
            console.log(`   ${code}: ${id}`);
        });
        console.log('');

        console.log('📂 Supported Genres:');
        Object.entries(genres).forEach(([name, id]) => {
            console.log(`   ${name}: ${id}`);
        });
        console.log('');

        console.log('📊 Supported Charts:');
        Object.entries(charts).forEach(([name, id]) => {
            console.log(`   ${name}: ${id}`);
        });

        console.log('\n🎉 All demos completed successfully!');
        console.log('\n💡 This demonstrates the core functionality of parse-tunes:');
        console.log('   - Fetching top app charts by country, genre, and chart type');
        console.log('   - Supporting multiple countries and regions');
        console.log('   - Accessing both free and paid app rankings');
        console.log('   - Getting app IDs that can be used for detailed app information');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the demo
runWorkingDemo();