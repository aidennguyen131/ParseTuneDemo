#!/usr/bin/env node

// Test script for the new Charts V2 API endpoints
import fetch from 'cross-fetch';

const API_BASE = 'http://localhost:8787/api';

async function testChartsV2() {
    console.log('🧪 Testing Parse-Tunes Charts V2 API\n');
    
    try {
        // Test 1: Get available chart types
        console.log('📋 1. Getting available chart types...');
        const chartTypesResponse = await fetch(`${API_BASE}/chart-types`);
        const chartTypesData = await chartTypesResponse.json();
        
        if (chartTypesData.success) {
            console.log(`✅ Found ${chartTypesData.chartTypes.length} chart types:`);
            chartTypesData.chartTypes.forEach(chart => {
                console.log(`   - ${chart.displayName} (${chart.name})`);
            });
        } else {
            console.log('❌ Failed to get chart types:', chartTypesData.error);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 2: Get FreeAppsV2 chart (the newly discovered endpoint)
        console.log('📱 2. Testing FreeAppsV2 chart (newly discovered endpoint)...');
        const freeAppsResponse = await fetch(`${API_BASE}/charts-v2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chartType: 'FreeAppsV2',
                limit: 10,
                maxFetch: 50 // Fetch 50 IDs from iTunes, show top 10
            })
        });
        
        const freeAppsData = await freeAppsResponse.json();
        
        if (freeAppsData.success) {
            console.log(`✅ Top ${freeAppsData.apps.length} Free Apps (V2):`);
            freeAppsData.apps.forEach(app => {
                console.log(`   ${app.rank}. ${app.name} by ${app.artistName}`);
                console.log(`      Rating: ${app.rating?.toFixed(1) || 'N/A'} (${app.ratingCount?.toLocaleString() || 0} reviews)`);
                console.log(`      Price: $${app.price} | Genre: ${app.genre}`);
                console.log('');
            });
            
            console.log(`📊 Pagination info:`);
            console.log(`   Total available: ${freeAppsData.pagination.totalAvailable}`);
            console.log(`   Has more: ${freeAppsData.pagination.hasMore}`);
        } else {
            console.log('❌ Failed to get free apps:', freeAppsData.error);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 3: Get Paid Applications chart
        console.log('💰 3. Testing PaidApplications chart...');
        const paidAppsResponse = await fetch(`${API_BASE}/charts-v2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chartType: 'PaidApplications',
                limit: 5
            })
        });
        
        const paidAppsData = await paidAppsResponse.json();
        
        if (paidAppsData.success) {
            console.log(`✅ Top ${paidAppsData.apps.length} Paid Apps:`);
            paidAppsData.apps.forEach(app => {
                console.log(`   ${app.rank}. ${app.name} - $${app.price}`);
                console.log(`      by ${app.artistName} | ${app.genre}`);
                console.log('');
            });
        } else {
            console.log('❌ Failed to get paid apps:', paidAppsData.error);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 4: Test with different parameters
        console.log('🎮 4. Testing with Games genre...');
        const gamesResponse = await fetch(`${API_BASE}/charts-v2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chartType: 'FreeAppsV2',
                genre: 6014, // Games genre
                limit: 5
            })
        });
        
        const gamesData = await gamesResponse.json();
        
        if (gamesData.success) {
            console.log(`✅ Top ${gamesData.apps.length} Free Games:`);
            gamesData.apps.forEach(app => {
                console.log(`   ${app.rank}. ${app.name}`);
                console.log(`      by ${app.artistName} | Rating: ${app.rating?.toFixed(1) || 'N/A'}`);
            });
        } else {
            console.log('❌ Failed to get games:', gamesData.error);
        }
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
testChartsV2();