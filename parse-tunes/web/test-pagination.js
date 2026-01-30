// Quick test script for pagination
import fetch from 'cross-fetch';

async function testPagination() {
    const baseURL = 'http://localhost:8787';
    
    try {
        console.log('Testing first page...');
        const response1 = await fetch(`${baseURL}/api/top-charts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                country: 143441,
                genre: 6017,
                chart: 38,
                limit: 20,
                offset: 0
            })
        });
        
        const data1 = await response1.json();
        console.log('First page:', {
            appsCount: data1.apps.length,
            hasMore: data1.pagination?.hasMore,
            nextOffset: data1.pagination?.nextOffset,
            total: data1.pagination?.total,
            totalAvailable: data1.pagination?.totalAvailable
        });
        
        if (data1.pagination?.hasMore) {
            console.log('\nTesting second page...');
            const response2 = await fetch(`${baseURL}/api/top-charts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: 143441,
                    genre: 6017,
                    chart: 38,
                    limit: 20,
                    offset: data1.pagination.nextOffset
                })
            });
            
            const data2 = await response2.json();
            console.log('Second page:', {
                appsCount: data2.apps.length,
                hasMore: data2.pagination?.hasMore,
                nextOffset: data2.pagination?.nextOffset,
                firstAppRank: data2.apps[0]?.rank
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testPagination();