// Parse-Tunes Web Demo Application
class ParseTunesDemo {
    constructor() {
        this.baseURL = ''; // Relative path for production
        this.stats = {
            totalApps: 0,
            totalSearches: 0,
            totalDetails: 0,
            countriesExplored: new Set()
        };

        // Pagination state
        this.pagination = {
            charts: {
                offset: 0,
                limit: 200,
                hasMore: false,
                currentParams: null
            },
            chartsV2: {
                offset: 0,
                limit: 25,
                hasMore: false,
                currentParams: null
            },
            search: {
                offset: 0,
                limit: 25,
                hasMore: false,
                currentParams: null
            }
        };

        // Charts V2 state
        this.chartsV2 = {
            availableTypes: [],
            selectedType: null
        };

        this.init();
    }

    init() {
        this.updateStats();
        this.showSection('charts-v2'); // Start with the new Charts V2 section
        this.loadChartTypes();
    }

    // Update analytics stats
    updateStats() {
        document.getElementById('total-apps').textContent = this.stats.totalApps;
        document.getElementById('total-searches').textContent = this.stats.totalSearches;
        document.getElementById('total-details').textContent = this.stats.totalDetails;
        document.getElementById('countries-explored').textContent = this.stats.countriesExplored.size;
    }

    // Show/hide sections
    showSection(sectionId, targetElement = null) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        document.getElementById(sectionId).classList.remove('hidden');

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        if (targetElement) {
            targetElement.classList.remove('border-transparent', 'text-gray-500');
            targetElement.classList.add('border-blue-500', 'text-blue-600');
        }
    }

    // Fetch top charts
    async fetchTopCharts(loadMore = false) {
        const country = document.getElementById('country-select').value;
        const genre = document.getElementById('genre-select').value;
        const chart = document.getElementById('chart-select').value;

        // Reset pagination if not loading more
        if (!loadMore) {
            this.pagination.charts.offset = 0;
            this.pagination.charts.currentParams = { country: parseInt(country), genre: parseInt(genre), chart: parseInt(chart) };
        }

        // Show loading
        if (!loadMore) {
            document.getElementById('charts-loading').classList.remove('hidden');
            document.getElementById('charts-results').classList.add('hidden');
        } else {
            document.getElementById('charts-load-more-loading').classList.remove('hidden');
            document.getElementById('charts-load-more-btn').classList.add('hidden');
        }

        try {
            const requestBody = {
                ...this.pagination.charts.currentParams,
                limit: this.pagination.charts.limit,
                offset: this.pagination.charts.offset
            };

            const response = await fetch(`${this.baseURL}/api/top-charts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayTopCharts(data, loadMore);

            // Update pagination state
            this.pagination.charts.hasMore = data.pagination ? data.pagination.hasMore : false;
            this.pagination.charts.offset = data.pagination ? (data.pagination.nextOffset || this.pagination.charts.offset) : this.pagination.charts.offset;

            // Update stats
            this.stats.totalApps += data.apps.length;
            this.stats.countriesExplored.add(country);
            this.updateStats();

        } catch (error) {
            console.error('Error fetching top charts:', error);
            this.showError('Failed to fetch top charts. Make sure the server is running.');
        } finally {
            document.getElementById('charts-loading').classList.add('hidden');
            document.getElementById('charts-load-more-loading').classList.add('hidden');
            document.getElementById('charts-load-more-btn').classList.remove('hidden');
        }
    }

    // Display top charts results
    async displayTopCharts(data, append = false) {
        const resultsDiv = document.getElementById('charts-results');
        const gridDiv = document.getElementById('charts-grid');
        const countSpan = document.getElementById('charts-count');
        const loadMoreDiv = document.getElementById('charts-load-more');

        // Update count
        const currentCount = append ? gridDiv.children.length : 0;
        const totalShowing = currentCount + data.apps.length;
        const totalAvailable = data.pagination ? data.pagination.totalAvailable : (data.total || data.apps.length);
        countSpan.textContent = `${totalShowing} of ${totalAvailable} apps`;

        // Clear grid if not appending
        if (!append) {
            gridDiv.innerHTML = '';
        }

        // Check if we need to fetch SensorTower data for apps 195-200
        const currentOffset = data.pagination ? data.pagination.offset : 0;
        const appsWithSensorTower = [...data.apps];

        // If we're showing apps in the 195-200 range, fetch SensorTower data
        const appsInRange = data.apps.filter((app, index) => {
            const globalRank = currentOffset + index + 1;
            return globalRank >= 195 && globalRank <= 200;
        });

        if (appsInRange.length > 0) {
            console.log(`Fetching SensorTower data for ${appsInRange.length} apps in range 195-200`);

            // Show loading indicator for SensorTower data
            const sensorTowerLoadingDiv = document.createElement('div');
            sensorTowerLoadingDiv.className = 'text-center py-4 bg-purple-50 rounded-lg mb-4';
            sensorTowerLoadingDiv.innerHTML = `
                <i class="fas fa-spinner loading text-purple-600 mr-2"></i>
                <span class="text-purple-700">Fetching SensorTower analytics data...</span>
            `;
            if (!append) {
                resultsDiv.appendChild(sensorTowerLoadingDiv);
            }

            const appIds = appsInRange.map(app => app.id);
            const countrySelect = document.getElementById('country-select');
            const countryCode = countrySelect.options[countrySelect.selectedIndex].text.match(/🇺🇸|🇩🇪|🇬🇧|🇻🇳|🇯🇵|🇰🇷|🇨🇳/);
            const countryMap = { '🇺🇸': 'US', '🇩🇪': 'DE', '🇬🇧': 'GB', '🇻🇳': 'VN', '🇯🇵': 'JP', '🇰🇷': 'KR', '🇨🇳': 'CN' };
            const country = countryMap[countryCode?.[0]] || 'US';

            const sensorTowerData = await this.fetchSensorTowerData(appIds, country);

            // Attach SensorTower data to apps
            appsWithSensorTower.forEach((app, index) => {
                const globalRank = currentOffset + index + 1;
                if (globalRank >= 195 && globalRank <= 200 && sensorTowerData[app.id]) {
                    app.sensorTower = sensorTowerData[app.id];
                }
            });

            // Remove loading indicator
            if (sensorTowerLoadingDiv.parentElement) {
                sensorTowerLoadingDiv.remove();
            }
        }

        const appsHTML = appsWithSensorTower.map(app => this.createAppCard(app, 'blue')).join('');
        gridDiv.innerHTML += appsHTML;

        // Show/hide load more button
        if (data.pagination && data.pagination.hasMore) {
            loadMoreDiv.classList.remove('hidden');
        } else {
            loadMoreDiv.classList.add('hidden');
        }

        resultsDiv.classList.remove('hidden');
    }

    // Search apps
    async searchApps(loadMore = false) {
        const searchTerm = document.getElementById('search-term').value.trim();

        if (!searchTerm && !loadMore) {
            alert('Please enter a search term');
            return;
        }

        // Reset pagination if not loading more
        if (!loadMore) {
            this.pagination.search.offset = 0;
            this.pagination.search.currentParams = { searchTerm, country: 'US', language: 'en-US' };
        }

        // Show loading
        if (!loadMore) {
            document.getElementById('search-loading').classList.remove('hidden');
            document.getElementById('search-results').classList.add('hidden');
        } else {
            document.getElementById('search-load-more-loading').classList.remove('hidden');
            document.getElementById('search-load-more-btn').classList.add('hidden');
        }

        try {
            const requestBody = {
                ...this.pagination.search.currentParams,
                limit: this.pagination.search.limit,
                offset: this.pagination.search.offset
            };

            const response = await fetch(`${this.baseURL}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displaySearchResults(data, loadMore);

            // Update pagination state
            this.pagination.search.hasMore = data.pagination ? data.pagination.hasMore : false;
            this.pagination.search.offset = data.pagination ? (data.pagination.nextOffset || this.pagination.search.offset) : this.pagination.search.offset;

            // Update stats
            if (!loadMore) {
                this.stats.totalSearches++;
            }
            this.updateStats();

        } catch (error) {
            console.error('Error searching apps:', error);
            this.showError('Failed to search apps. Make sure the server is running.');
        } finally {
            document.getElementById('search-loading').classList.add('hidden');
            document.getElementById('search-load-more-loading').classList.add('hidden');
            document.getElementById('search-load-more-btn').classList.remove('hidden');
        }
    }

    // Display search results
    displaySearchResults(data, append = false) {
        const resultsDiv = document.getElementById('search-results');
        const gridDiv = document.getElementById('search-grid');
        const countSpan = document.getElementById('search-count');
        const loadMoreDiv = document.getElementById('search-load-more');

        // Update count
        const currentCount = append ? gridDiv.children.length : 0;
        const totalShowing = currentCount + data.apps.length;
        countSpan.textContent = `${totalShowing} of ${data.pagination.total} results`;

        // Clear grid if not appending
        if (!append) {
            gridDiv.innerHTML = '';
        }

        const appsHTML = data.apps.map(app => this.createAppCard(app, 'green')).join('');
        gridDiv.innerHTML += appsHTML;

        // Show/hide load more button
        if (data.pagination && data.pagination.hasMore) {
            loadMoreDiv.classList.remove('hidden');
        } else {
            loadMoreDiv.classList.add('hidden');
        }

        resultsDiv.classList.remove('hidden');
    }

    // Fetch app details
    async fetchAppDetails() {
        const appId = document.getElementById('app-id').value.trim();

        if (!appId) {
            alert('Please enter an App ID');
            return;
        }

        await this.fetchAppDetailsById(appId);
    }

    // Fetch app details by ID
    async fetchAppDetailsById(appId) {
        // Show loading
        document.getElementById('details-loading').classList.remove('hidden');
        document.getElementById('details-results').classList.add('hidden');

        try {
            const response = await fetch(`${this.baseURL}/api/app-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ appId: parseInt(appId) })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayAppDetails(data);

            // Update stats
            this.stats.totalDetails++;
            this.updateStats();

            // Switch to app details section if not already there
            if (document.getElementById('app-details').classList.contains('hidden')) {
                this.showSection('app-details');
                // Update navigation manually since event.target won't be available
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('border-blue-500', 'text-blue-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });
                document.querySelectorAll('.nav-btn')[2].classList.remove('border-transparent', 'text-gray-500');
                document.querySelectorAll('.nav-btn')[2].classList.add('border-blue-500', 'text-blue-600');
            }

        } catch (error) {
            console.error('Error fetching app details:', error);
            this.showError('Failed to fetch app details. Make sure the server is running.');
        } finally {
            document.getElementById('details-loading').classList.add('hidden');
        }
    }

    // Display app details
    displayAppDetails(data) {
        const resultsDiv = document.getElementById('details-results');
        const infoDiv = document.getElementById('app-info');

        const app = data.app;

        infoDiv.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <div class="flex items-start mb-6">
                        ${app.artwork ? `<img src="${app.artwork}" alt="${app.name}" class="w-20 h-20 rounded-lg mr-4 shadow-md">` : ''}
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">${app.name}</h3>
                            <p class="text-lg text-gray-600 mb-1">by ${app.artistName}</p>
                            <p class="text-sm text-gray-500">App ID: ${app.id}</p>
                        </div>
                    </div>
                    
                    ${app.description ? `
                        <div class="mb-6">
                            <h4 class="font-semibold text-gray-800 mb-2">Description</h4>
                            <p class="text-gray-600 leading-relaxed">${app.description.substring(0, 500)}${app.description.length > 500 ? '...' : ''}</p>
                        </div>
                    ` : ''}
                    
                    ${app.releaseNotes ? `
                        <div class="mb-6">
                            <h4 class="font-semibold text-gray-800 mb-2">What's New</h4>
                            <p class="text-gray-600">${app.releaseNotes.substring(0, 300)}${app.releaseNotes.length > 300 ? '...' : ''}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div>
                    <div class="bg-white rounded-lg border p-4">
                        <h4 class="font-semibold text-gray-800 mb-4">App Information</h4>
                        
                        ${app.rating ? `
                            <div class="mb-4">
                                <div class="flex items-center mb-1">
                                    <div class="flex text-yellow-400">
                                        ${this.generateStars(app.rating)}
                                    </div>
                                    <span class="ml-2 font-medium">${app.rating}</span>
                                </div>
                                <p class="text-sm text-gray-600">${app.ratingCount || 0} ratings</p>
                            </div>
                        ` : ''}
                        
                        <div class="space-y-3 text-sm">
                            ${app.genre ? `<div><span class="font-medium">Category:</span> ${app.genre}</div>` : ''}
                            ${app.price !== undefined ? `<div><span class="font-medium">Price:</span> ${app.price === 0 ? 'Free' : '$' + app.price}</div>` : ''}
                            ${app.version ? `<div><span class="font-medium">Version:</span> ${app.version}</div>` : ''}
                            ${app.releaseDate ? `<div><span class="font-medium">Updated:</span> ${new Date(app.releaseDate).toLocaleDateString()}</div>` : ''}
                            ${app.size ? `<div><span class="font-medium">Size:</span> ${this.formatFileSize(app.size)}</div>` : ''}
                            ${app.contentRating ? `<div><span class="font-medium">Age Rating:</span> ${app.contentRating}</div>` : ''}
                            ${app.languages ? `<div><span class="font-medium">Languages:</span> ${app.languages.slice(0, 3).join(', ')}${app.languages.length > 3 ? '...' : ''}</div>` : ''}
                        </div>
                        
                        ${app.url ? `
                            <div class="mt-4">
                                <a href="${app.url}" target="_blank" 
                                   class="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition duration-200">
                                    <i class="fas fa-external-link-alt mr-2"></i>View in App Store
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        resultsDiv.classList.remove('hidden');
    }

    // Generate star rating display
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    // Create app card HTML
    createAppCard(app, colorTheme = 'blue') {
        const themeColors = {
            blue: {
                button: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
                rank: 'text-blue-600'
            },
            green: {
                button: 'bg-green-100 hover:bg-green-200 text-green-700',
                rank: 'text-green-600'
            },
            orange: {
                button: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
                rank: 'text-orange-600'
            }
        };

        const colors = themeColors[colorTheme] || themeColors.blue;

        // SensorTower data section
        const sensorTowerSection = app.sensorTower ? `
            <div class="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                <div class="flex items-center mb-1">
                    <i class="fas fa-chart-line text-purple-600 mr-1 text-xs"></i>
                    <span class="text-xs font-medium text-purple-700">SensorTower Data</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <span class="text-gray-600">Downloads:</span>
                        <div class="font-medium text-purple-700">${this.formatNumber(app.sensorTower.downloads)}</div>
                    </div>
                    <div>
                        <span class="text-gray-600">Revenue:</span>
                        <div class="font-medium text-purple-700">${this.formatCurrency(app.sensorTower.revenue, app.sensorTower.revenueUnit)}</div>
                    </div>
                </div>
                ${app.sensorTower.error ? `<div class="text-xs text-red-600 mt-1">⚠️ ${app.sensorTower.error}</div>` : ''}
            </div>
        ` : '';

        return `
            <div class="bg-gray-50 rounded-lg p-4 card-hover fade-in">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        ${app.rank ? `<h4 class="font-semibold ${colors.rank} mb-1">#${app.rank}</h4>` : ''}
                        <p class="text-sm text-gray-600">App ID: ${app.id}</p>
                    </div>
                    <button onclick="demo.fetchAppDetailsById('${app.id}')" 
                            class="${colors.button} px-3 py-1 rounded text-sm transition duration-200">
                        <i class="fas fa-info mr-1"></i>Details
                    </button>
                </div>
                ${app.name ? `<p class="font-medium text-gray-800 mb-1">${app.name}</p>` : ''}
                ${app.artistName ? `<p class="text-sm text-gray-600 mb-1">by ${app.artistName}</p>` : ''}
                ${app.genre ? `<p class="text-xs text-gray-500 mb-2">${app.genre}</p>` : ''}
                ${app.price !== undefined ? `<p class="text-sm font-medium ${app.price === 0 ? 'text-green-600' : 'text-blue-600'} mb-2">${app.price === 0 ? 'Free' : '$' + app.price}</p>` : ''}
                ${app.rating ? `
                    <div class="flex items-center mb-2">
                        <div class="flex text-yellow-400">
                            ${this.generateStars(app.rating)}
                        </div>
                        <span class="text-sm text-gray-600 ml-2">${app.rating} (${app.ratingCount || 0})</span>
                    </div>
                ` : ''}
                ${sensorTowerSection}
                ${app.artwork ? `
                    <div class="mt-3">
                        <img src="${app.artwork}" alt="${app.name}" class="w-12 h-12 rounded-lg object-cover">
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Format number for display (e.g., 10000 -> 10K)
    formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        if (num === 0) return '0';

        const absNum = Math.abs(num);

        if (absNum >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (absNum >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (absNum >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toString();
        }
    }

    // Format currency
    formatCurrency(cents, currency = 'USD') {
        if (cents === null || cents === undefined) return 'N/A';
        const dollars = cents / 100;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(dollars);
    }

    // Fetch SensorTower data for apps
    async fetchSensorTowerData(appIds, country = 'US') {
        try {
            const response = await fetch(`${this.baseURL}/api/sensortower-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ appIds, country })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.success ? data.data : {};
        } catch (error) {
            console.error('Error fetching SensorTower data:', error);
            return {};
        }
    }

    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Load available chart types for Charts V2
    async loadChartTypes() {
        try {
            const response = await fetch(`${this.baseURL}/api/chart-types`);
            const data = await response.json();

            if (data.success) {
                this.chartsV2.availableTypes = data.chartTypes;
                this.renderChartTypes();
            } else {
                console.error('Failed to load chart types:', data.error);
                this.renderChartTypesError();
            }
        } catch (error) {
            console.error('Error loading chart types:', error);
            this.renderChartTypesError();
        }
    }

    // Render chart types grid
    renderChartTypes() {
        const grid = document.getElementById('chart-types-grid');

        const chartTypeIcons = {
            'FreeAppsV2': 'fas fa-download',
            'PaidApplications': 'fas fa-dollar-sign',
            'AppsByRevenue': 'fas fa-chart-line',
            'FreeApplications': 'fas fa-mobile-alt',
            'FreeIpadApplications': 'fas fa-tablet-alt',
            'PaidIpadApplications': 'fas fa-tablet-alt',
            'IpadAppsByRevenue': 'fas fa-chart-bar',
            'FreeAppleTVApps': 'fas fa-tv',
            'PaidAppleTVApps': 'fas fa-tv',
            'AppleTVAppsByRevenue': 'fas fa-tv',
            'FreeMacAppsV2': 'fas fa-laptop',
            'Applications': 'fas fa-th-large'
        };

        grid.innerHTML = this.chartsV2.availableTypes.map(chartType => {
            const icon = chartTypeIcons[chartType.name] || 'fas fa-mobile-alt';
            const isSelected = this.chartsV2.selectedType === chartType.name;

            return `
                <button onclick="demo.selectChartType('${chartType.name}')" 
                        class="chart-type-btn p-4 border-2 rounded-lg transition-all duration-200 text-left hover:shadow-md ${isSelected
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-orange-300'
                }">
                    <div class="flex items-center mb-2">
                        <i class="${icon} text-lg ${isSelected ? 'text-orange-600' : 'text-gray-600'}"></i>
                        <span class="ml-2 font-medium text-sm">${chartType.displayName}</span>
                    </div>
                    <div class="text-xs text-gray-500">${chartType.name}</div>
                    ${chartType.name === 'FreeAppsV2' ? '<div class="text-xs text-red-600 font-medium mt-1">★ Newly Discovered</div>' : ''}
                </button>
            `;
        }).join('');
    }

    // Render chart types error
    renderChartTypesError() {
        const grid = document.getElementById('chart-types-grid');
        grid.innerHTML = `
            <div class="col-span-full text-center py-8 text-red-600">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load chart types</p>
                <button onclick="demo.loadChartTypes()" class="mt-2 text-sm text-blue-600 hover:underline">
                    Try again
                </button>
            </div>
        `;
    }

    // Select chart type
    selectChartType(chartTypeName) {
        this.chartsV2.selectedType = chartTypeName;
        this.renderChartTypes();

        // Show selected chart info
        const selectedInfo = document.getElementById('selected-chart-info');
        const selectedName = document.getElementById('selected-chart-name');

        const chartType = this.chartsV2.availableTypes.find(ct => ct.name === chartTypeName);
        if (chartType) {
            selectedName.textContent = chartType.displayName;
            selectedInfo.classList.remove('hidden');
        }

        // Enable fetch button
        document.getElementById('fetch-v2-btn').disabled = false;
    }

    // Fetch Charts V2
    async fetchChartsV2(loadMore = false) {
        if (!this.chartsV2.selectedType) {
            alert('Please select a chart type first');
            return;
        }

        const country = document.getElementById('v2-country-select').value;
        const genre = document.getElementById('v2-genre-select').value;
        const limit = parseInt(document.getElementById('v2-limit-select').value);

        // Reset pagination if not loading more
        if (!loadMore) {
            this.pagination.chartsV2.offset = 0;
            this.pagination.chartsV2.limit = limit;
            this.pagination.chartsV2.currentParams = {
                chartType: this.chartsV2.selectedType,
                country,
                genre: parseInt(genre)
            };
        }

        // Show loading
        if (!loadMore) {
            document.getElementById('v2-charts-loading').classList.remove('hidden');
            document.getElementById('v2-charts-results').classList.add('hidden');
        } else {
            document.getElementById('v2-charts-load-more-loading').classList.remove('hidden');
            document.getElementById('v2-charts-load-more-btn').classList.add('hidden');
        }

        try {
            const requestBody = {
                ...this.pagination.chartsV2.currentParams,
                limit: this.pagination.chartsV2.limit,
                offset: this.pagination.chartsV2.offset,
                maxFetch: 100 // Fetch up to 100 IDs from iTunes
            };

            const response = await fetch(`${this.baseURL}/api/charts-v2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.success) {
                this.displayChartsV2Results(data, loadMore);
                this.stats.totalApps += data.apps.length;
                this.stats.countriesExplored.add(country);
                this.updateStats();

                // Update pagination
                this.pagination.chartsV2.hasMore = data.pagination.hasMore;
                if (loadMore) {
                    this.pagination.chartsV2.offset = data.pagination.nextOffset || this.pagination.chartsV2.offset;
                } else {
                    this.pagination.chartsV2.offset = data.pagination.nextOffset || 0;
                }
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error fetching charts V2:', error);
            this.showError(`Failed to fetch charts: ${error.message}`);

            // Hide loading
            document.getElementById('v2-charts-loading').classList.add('hidden');
            document.getElementById('v2-charts-load-more-loading').classList.add('hidden');
            document.getElementById('v2-charts-load-more-btn').classList.remove('hidden');
        }
    }

    // Display Charts V2 results
    async displayChartsV2Results(data, loadMore = false) {
        const resultsDiv = document.getElementById('v2-charts-results');
        const gridDiv = document.getElementById('v2-charts-grid');
        const countSpan = document.getElementById('v2-charts-count');
        const paginationInfo = document.getElementById('v2-pagination-info');
        const loadMoreDiv = document.getElementById('v2-charts-load-more');
        const loadingDiv = document.getElementById('v2-charts-loading');
        const loadMoreLoading = document.getElementById('v2-charts-load-more-loading');
        const loadMoreBtn = document.getElementById('v2-charts-load-more-btn');

        // Hide loading
        loadingDiv.classList.add('hidden');
        loadMoreLoading.classList.add('hidden');
        loadMoreBtn.classList.remove('hidden');

        // Update count and pagination info
        if (!loadMore) {
            countSpan.textContent = `${data.apps.length} apps`;
            gridDiv.innerHTML = '';
        } else {
            const currentCount = gridDiv.children.length;
            countSpan.textContent = `${currentCount + data.apps.length} apps`;
        }

        paginationInfo.textContent = `Showing ${data.pagination.offset + 1}-${data.pagination.offset + data.apps.length} of ${data.pagination.totalAvailable}`;

        // Check if we need to fetch SensorTower data for apps 195-200
        const currentOffset = data.pagination.offset;
        const appsWithSensorTower = [...data.apps];

        // If we're showing apps in the 195-200 range, fetch SensorTower data
        const appsInRange = data.apps.filter((app, index) => {
            const globalRank = currentOffset + index + 1;
            return globalRank >= 195 && globalRank <= 200;
        });

        if (appsInRange.length > 0) {
            console.log(`Fetching SensorTower data for ${appsInRange.length} apps in range 195-200`);

            // Show loading indicator for SensorTower data
            const sensorTowerLoadingDiv = document.createElement('div');
            sensorTowerLoadingDiv.className = 'text-center py-4 bg-purple-50 rounded-lg mb-4';
            sensorTowerLoadingDiv.innerHTML = `
                <i class="fas fa-spinner loading text-purple-600 mr-2"></i>
                <span class="text-purple-700">Fetching SensorTower analytics data...</span>
            `;
            if (!loadMore) {
                resultsDiv.appendChild(sensorTowerLoadingDiv);
            }

            const appIds = appsInRange.map(app => app.id);
            const country = document.getElementById('v2-country-select').value.toUpperCase();
            const sensorTowerData = await this.fetchSensorTowerData(appIds, country);

            // Attach SensorTower data to apps
            appsWithSensorTower.forEach((app, index) => {
                const globalRank = currentOffset + index + 1;
                if (globalRank >= 195 && globalRank <= 200 && sensorTowerData[app.id]) {
                    app.sensorTower = sensorTowerData[app.id];
                }
            });

            // Remove loading indicator
            if (sensorTowerLoadingDiv.parentElement) {
                sensorTowerLoadingDiv.remove();
            }
        }

        // Add apps to grid
        const appsHTML = appsWithSensorTower.map(app => this.createAppCard(app, 'orange')).join('');

        if (loadMore) {
            gridDiv.innerHTML += appsHTML;
        } else {
            gridDiv.innerHTML = appsHTML;
        }

        // Show/hide load more button
        if (data.pagination.hasMore) {
            loadMoreDiv.classList.remove('hidden');
        } else {
            loadMoreDiv.classList.add('hidden');
        }

        // Show results
        resultsDiv.classList.remove('hidden');

        // Add fade-in animation
        if (!loadMore) {
            resultsDiv.classList.add('fade-in');
            setTimeout(() => resultsDiv.classList.remove('fade-in'), 500);
        }
    }
}

// Global functions for HTML onclick events
function showSection(sectionId) {
    demo.showSection(sectionId, event ? event.target : null);
}

function fetchTopCharts() {
    demo.fetchTopCharts();
}

function loadMoreCharts() {
    demo.fetchTopCharts(true);
}

function searchApps() {
    demo.searchApps();
}

function loadMoreSearch() {
    demo.searchApps(true);
}

function fetchAppDetails() {
    demo.fetchAppDetails();
}

function fetchChartsV2() {
    demo.fetchChartsV2();
}

function loadMoreChartsV2() {
    demo.fetchChartsV2(true);
}

// Initialize the demo
const demo = new ParseTunesDemo();

// Handle Enter key for search
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('search-term').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchApps();
        }
    });

    document.getElementById('app-id').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            fetchAppDetails();
        }
    });
});