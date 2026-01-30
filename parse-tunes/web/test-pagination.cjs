// Quick test script for pagination
const https = require('https');
const http = require('http');

function makeRequest(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function testPagination() {
    const baseURL = 'http://localhost:8787';
    
    try {
        console.log('Testing first page...');
        const data1 = await makeRequest(`${baseURL}/api/top-charts`, {
            country: 143441,
            genre: 6017,
            chart: 38,
            limit: 20,
            offset: 0
        });
        
        console.log('First page:', {
            appsCount: data1.apps.length,
            hasMore: data1.pagination?.hasMore,
            nextOffset: data1.pagination?.nextOffset,
            total: data1.pagination?.total,
            totalAvailable: data1.pagination?.totalAvailable
        });
        
        if (data1.pagination?.hasMore) {
            console.log('\nTesting second page...');
            const data2 = await makeRequest(`${baseURL}/api/top-charts`, {
                country: 143441,
                genre: 6017,
                chart: 38,
                limit: 20,
                offset: data1.pagination.nextOffset
            });
            
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