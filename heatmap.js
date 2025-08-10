// Supreme Court Cases Heatmap JavaScript
// Requires D3.js and PapaParse libraries to be loaded

class SupremeCourtHeatmap {
    constructor(containerId, csvFilePath) {
        this.containerId = containerId;
        this.csvFilePath = csvFilePath;
        this.tooltip = null;
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 30;
        this.currentSearchTerm = '';
        this.justiceColumns = [
            'Gesmundo', 'Leonen', 'Caguioa', 'Hernando', 'Lazaro-Javier', 
            'M. Lopez', 'Inting', 'Zalameda', 'Gaerlan', 'Rosario', 
            'J. Lopez', 'Dimaampao', 'Marquez', 'Kho', 'Singh'
        ];
        
        // Add Roboto font
        this.addRobotoFont();
        
        this.init();
    }
    
    addRobotoFont() {
        // Add Google Fonts link for Roboto if not already present
        var existingLink = document.querySelector('link[href*="fonts.googleapis.com"][href*="Roboto"]');
        if (!existingLink) {
            var link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }
    
    init() {
        this.createStyles();
        this.createTooltip();
        this.loadData();
    }
    
    createStyles() {
        // Add CSS styles to the document if not already present
        if (!document.getElementById('heatmap-styles')) {
            var styles = `
                <style id="heatmap-styles">
                .heatmap-container {
                    max-width: 1600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                    font-family: 'Roboto', Arial, sans-serif;
                    color: #212529;
                }
                
                .heatmap-header {
                    background: white;
                    color: #212529;
                    padding: 20px;
                    text-align: center;
                    border-bottom: 1px solid #ddd;
                }
                
                .heatmap-table-container {
                    overflow-x: auto;
                    max-height: none;
                }
                
                .heatmap-pagination {
                    padding: 20px;
                    text-align: center;
                    background: #f8f9fa;
                    border-top: 1px solid #ddd;
                }
                
                .heatmap-pagination-info {
                    margin-bottom: 15px;
                    color: #212529;
                    font-size: 14px;
                }
                
                .heatmap-pagination-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .heatmap-pagination-btn {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    background: white;
                    color: #212529;
                    cursor: pointer;
                    border-radius: 4px;
                    font-family: 'Roboto', Arial, sans-serif;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }
                
                .heatmap-pagination-btn:hover:not(:disabled) {
                    background: #e9ecef;
                }
                
                .heatmap-pagination-btn:disabled {
                    background: #f8f9fa;
                    color: #6c757d;
                    cursor: not-allowed;
                }
                
                .heatmap-pagination-btn.active {
                    background: #82c9b2;
                    color: white;
                    border-color: #82c9b2;
                }
                
                .heatmap-page-select {
                    padding: 6px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-family: 'Roboto', Arial, sans-serif;
                    font-size: 14px;
                    color: #212529;
                }
                
                .heatmap-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                
                .heatmap-table th, .heatmap-table td {
                    padding: 8px 6px;
                    text-align: center;
                    border: 1px solid #ddd;
                    position: relative;
                }
                
                .heatmap-table th {
                    background: white;
                    color: #212529;
                    font-weight: bold;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    border-bottom: 2px solid #34495e;
                }
                
                .heatmap-case-no-col,
                .heatmap-date-col,
                .heatmap-division-col,
                .heatmap-ponente-col {
                    text-align: left;
                    min-width: 100px;
                    font-size: 11px;
                }
                
                .heatmap-case-no-col {
                    font-weight: bold;
                    color: #212529;
                }
                
                .heatmap-date-col {
                    color: #7f8c8d;
                    min-width: 80px;
                }
                
                .heatmap-division-col {
                    color: #34495e;
                    min-width: 120px;
                }
                
                .heatmap-ponente-col {
                    color: #212529;
                    font-weight: normal;
                    min-width: 100px;
                }
                
                .heatmap-decision-cell {
                    background: #ecf0f1;
                    color: #212529;
                    font-weight: bold;
                    cursor: help;
                    min-width: 80px;
                }
                
                .heatmap-link-cell {
                    background: white;
                    color: #212529;
                    cursor: pointer;
                    font-weight: bold;
                    min-width: 60px;
                    text-decoration: underline;
                }
                
                .heatmap-link-cell:hover {
                    background: #f8f9fa;
                }
                
                .heatmap-justice-cell {
                    min-width: 40px;
                    font-weight: bold;
                    font-size: 13px;
                }
                
                .heatmap-vote-C, .heatmap-vote-P, .heatmap-vote-CD { 
                    background-color: #82c9b2; 
                    color: white; 
                }
                
                .heatmap-vote-D { 
                    background-color: #f5aa7b; 
                    color: white; 
                }
                
                .heatmap-vote-NP { 
                    background-color: #666666; 
                    color: white; 
                }
                
                .heatmap-vote-OB, .heatmap-vote-OL, .heatmap-vote-OT, 
                .heatmap-vote-OL-star, .heatmap-vote-OB-star { 
                    background-color: #dedede; 
                    color: #212529; 
                }
                
                .heatmap-vote-NA { 
                    background-color: #ffffff; 
                    color: #212529; 
                }
                
                .heatmap-tooltip {
                    position: absolute;
                    background: rgba(0,0,0,0.9);
                    color: white;
                    padding: 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    max-width: 300px;
                    z-index: 1000;
                    pointer-events: none;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }
                
                .heatmap-legend {
                    padding: 15px 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #ddd;
                    text-align: left;
                }
                
                .heatmap-search-container {
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .heatmap-search-input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-family: 'Roboto', Arial, sans-serif;
                    font-size: 14px;
                    color: #212529;
                    min-width: 250px;
                }
                
                .heatmap-search-clear {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    background: white;
                    color: #212529;
                    cursor: pointer;
                    border-radius: 4px;
                    font-family: 'Roboto', Arial, sans-serif;
                    font-size: 14px;
                }
                
                .heatmap-search-clear:hover {
                    background: #e9ecef;
                }
                
                .heatmap-search-results {
                    margin-left: 15px;
                    color: #6c757d;
                    font-size: 14px;
                }
                
                .heatmap-legend-item {
                    display: inline-block;
                    margin: 5px 10px;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: bold;
                }
                
                .heatmap-table tr:hover {
                    background-color: rgba(52, 152, 219, 0.1);
                }
                
                .heatmap-justice-header {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    min-width: 35px;
                    font-size: 11px;
                }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }
    
    createTooltip() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'heatmap-tooltip')
            .style('display', 'none');
    }
    
    getVoteClass(vote) {
        if (!vote || vote === null || vote === '') return '';
        
        var cleanVote = vote.toString().trim().toUpperCase();
        switch(cleanVote) {
            case 'C':
            case 'P':
            case 'CD':
                return 'heatmap-vote-C';
            case 'D':
                return 'heatmap-vote-D';
            case 'NP':
                return 'heatmap-vote-NP';
            case 'OB':
            case 'OL':
            case 'OT':
            case 'OL*':
            case 'OB*':
                return 'heatmap-vote-OB';
            case 'N/A':
                return 'heatmap-vote-NA';
            default:
                return '';
        }
    }
    
    formatDivision(division) {
        if (!division) return '';
        
        // Remove "DIVISION" from the end, but keep "EN BANC" as is
        if (division.toUpperCase() === 'EN BANC') {
            return division;
        }
        
        return division.replace(/\s+DIVISION$/i, '');
    }
    
    formatDispositive(text) {
        if (!text) return '';
        return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }
    
    searchData(searchTerm) {
        this.currentSearchTerm = searchTerm.toLowerCase().trim();
        
        if (!this.currentSearchTerm) {
            this.filteredData = this.data;
        } else {
            var self = this;
            this.filteredData = this.data.filter(function(d) {
                var division = (d.division || '').toLowerCase();
                var ponente = (d.ponente || '').toLowerCase();
                
                return division.includes(self.currentSearchTerm) || 
                       ponente.includes(self.currentSearchTerm);
            });
        }
        
        // Reset to first page when searching
        this.currentPage = 1;
        
        // Update the display
        this.updateDisplay();
    }
    
    updateDisplay() {
        var table = d3.select('#' + this.containerId + ' .heatmap-table');
        this.createTableBody(table);
        
        var container = d3.select('#' + this.containerId + ' .heatmap-container');
        container.select('.heatmap-pagination').remove();
        this.createPagination(container);
        
        // Update search results info
        this.updateSearchResults();
    }
    
    updateSearchResults() {
        var searchResults = d3.select('#' + this.containerId + ' .heatmap-search-results');
        
        if (this.currentSearchTerm) {
            searchResults.text('Found ' + this.filteredData.length + ' of ' + this.data.length + ' cases');
        } else {
            searchResults.text('');
        }
    }
    
    async loadData() {
        try {
            // Use fetch to load CSV file in browser environment
            var response = await fetch(this.csvFilePath);
            
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            var fileContent = await response.text();
            
            var parsed = Papa.parse(fileContent, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
            
            // Clean headers
            var cleanedData = parsed.data.map(function(row) {
                var cleanedRow = {};
                Object.keys(row).forEach(function(key) {
                    cleanedRow[key.trim()] = row[key];
                });
                return cleanedRow;
            });
            
            this.data = cleanedData;
            this.filteredData = cleanedData;
            this.createHeatmap();
            
        } catch (error) {
            console.error('Error loading data:', error);
            
            // Show error message to user
            var container = d3.select('#' + this.containerId);
            container.html('<div style="padding: 20px; text-align: center; color: #e74c3c;">' +
                '<h3>Error Loading Data</h3>' +
                '<p>Could not load the CSV file: ' + this.csvFilePath + '</p>' +
                '<p>Please make sure the file exists and is accessible.</p>' +
                '<small>Error: ' + error.message + '</small>' +
                '</div>');
        }
    }
    
    createHeatmap() {
        var container = d3.select('#' + this.containerId);
        
        // Clear existing content
        container.html('');
        
        // Create main container
        var heatmapDiv = container
            .append('div')
            .attr('class', 'heatmap-container');
        
        // Legend at the top with search
        var legendDiv = heatmapDiv.append('div')
            .attr('class', 'heatmap-legend');
        
        // Search container
        var searchContainer = legendDiv.append('div')
            .attr('class', 'heatmap-search-container');
        
        searchContainer.append('label')
            .attr('for', 'heatmap-search')
            .text('Search by division or ponente: ');
        
        var searchInput = searchContainer.append('input')
            .attr('type', 'text')
            .attr('id', 'heatmap-search')
            .attr('class', 'heatmap-search-input')
            .attr('placeholder', 'Enter division (e.g., "FIRST", "EN BANC") or ponente name...');
        
        var self = this;
        searchInput.on('input', function() {
            self.searchData(this.value);
        });
        
        searchContainer.append('button')
            .attr('class', 'heatmap-search-clear')
            .text('Clear')
            .on('click', function() {
                searchInput.property('value', '');
                self.searchData('');
            });
        
        searchContainer.append('span')
            .attr('class', 'heatmap-search-results');
        
        // Legend items
        legendDiv.append('div')
            .html(
                '<span class="heatmap-legend-item heatmap-vote-C">Concur</span>' +
                '<span class="heatmap-legend-item heatmap-vote-D">Dissent</span>' +
                '<span class="heatmap-legend-item heatmap-vote-NP">No Part</span>' +
                '<span class="heatmap-legend-item heatmap-vote-OB">On Leave/On Travel/Others</span>' +
                '<span class="heatmap-legend-item heatmap-vote-NA">Blanks - Not a participant</span>');
        
        // Table container
        var tableContainer = heatmapDiv
            .append('div')
            .attr('class', 'heatmap-table-container');
        
        // Table
        var table = tableContainer
            .append('table')
            .attr('class', 'heatmap-table');
        
        // Create header
        this.createTableHeader(table);
        
        // Create body with current page data
        this.createTableBody(table);
        
        // Create pagination
        this.createPagination(heatmapDiv);
        
        console.log('Supreme Court Heatmap: Loaded ' + this.data.length + ' court cases');
    }
    
    createTableHeader(table) {
        // Header row
        var thead = table.append('thead');
        var headerRow = thead.append('tr');
        
        headerRow.append('th').text('Case no.');
        headerRow.append('th').text('Date');
        headerRow.append('th').text('Division');
        headerRow.append('th').text('Ponente');
        headerRow.append('th').text('Decision (hover for details)');
        headerRow.append('th').text('Link');
        
        var self = this;
        this.justiceColumns.forEach(function(justice) {
            headerRow.append('th')
                .attr('class', 'heatmap-justice-header')
                .text(justice);
        });
    }
    
    createTableBody(table) {
        // Remove existing tbody
        table.select('tbody').remove();
        
        // Get current page data from filtered data
        var startIndex = (this.currentPage - 1) * this.itemsPerPage;
        var endIndex = startIndex + this.itemsPerPage;
        var pageData = this.filteredData.slice(startIndex, endIndex);
        
        // Body
        var tbody = table.append('tbody');
        
        var rows = tbody.selectAll('tr')
            .data(pageData)
            .enter()
            .append('tr');
        
        var self = this;
        
        // Case No. column
        rows.append('td')
            .attr('class', 'heatmap-case-no-col')
            .text(function(d) { return d.case_no || ''; });
        
        // Date column
        rows.append('td')
            .attr('class', 'heatmap-date-col')
            .text(function(d) { return d.date || ''; });
        
        // Division column (formatted)
        rows.append('td')
            .attr('class', 'heatmap-division-col')
            .text(function(d) { return self.formatDivision(d.division); });
        
        // Ponente column (not bold)
        rows.append('td')
            .attr('class', 'heatmap-ponente-col')
            .text(function(d) { return d.ponente || ''; });
        
        // Decision column with tooltip
        rows.append('td')
            .attr('class', 'heatmap-decision-cell')
            .text('Decision')
            .on('mouseover', function(event, d) {
                if (d['dispositive position']) {
                    self.tooltip
                        .style('display', 'block')
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px')
                        .html('<strong>Dispositive:</strong><br>' + self.formatDispositive(d['dispositive position']));
                }
            })
            .on('mouseout', function() {
                self.tooltip.style('display', 'none');
            });
        
        // Link column
        rows.append('td')
            .attr('class', 'heatmap-link-cell')
            .text('Link')
            .style('cursor', 'pointer')
            .on('click', function(event, d) {
                if (d.case_link) {
                    window.open(d.case_link, '_blank');
                }
            });
        
        // Justice columns (without text, just color coding)
        this.justiceColumns.forEach(function(justice) {
            rows.append('td')
                .attr('class', function(d) { 
                    return 'heatmap-justice-cell ' + self.getVoteClass(d[justice]); 
                })
                .html('&nbsp;'); // Empty cell with non-breaking space to maintain structure
        });
    }
    
    createPagination(container) {
        var totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        var startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        var endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
        
        var paginationDiv = container
            .append('div')
            .attr('class', 'heatmap-pagination');
        
        // Pagination info
        var searchText = this.currentSearchTerm ? ' (filtered)' : '';
        paginationDiv
            .append('div')
            .attr('class', 'heatmap-pagination-info')
            .text('Showing ' + (this.filteredData.length > 0 ? startItem : 0) + '-' + endItem + ' of ' + this.filteredData.length + ' decisions' + searchText);
        
        // Only show pagination controls if there are results
        if (this.filteredData.length === 0) {
            paginationDiv
                .append('div')
                .style('text-align', 'center')
                .style('padding', '20px')
                .style('color', '#6c757d')
                .text('No cases found matching your search criteria.');
            return;
        }
        
        // Pagination controls
        var controlsDiv = paginationDiv
            .append('div')
            .attr('class', 'heatmap-pagination-controls');
        
        var self = this;
        
        // First page button
        controlsDiv
            .append('button')
            .attr('class', 'heatmap-pagination-btn')
            .text('First')
            .property('disabled', this.currentPage === 1)
            .on('click', function() { self.goToPage(1); });
        
        // Previous page button
        controlsDiv
            .append('button')
            .attr('class', 'heatmap-pagination-btn')
            .text('Previous')
            .property('disabled', this.currentPage === 1)
            .on('click', function() { self.goToPage(self.currentPage - 1); });
        
        // Page number buttons (show current page and nearby pages)
        var startPage = Math.max(1, this.currentPage - 2);
        var endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            controlsDiv
                .append('button')
                .attr('class', 'heatmap-pagination-btn')
                .text('1')
                .on('click', function() { self.goToPage(1); });
            
            if (startPage > 2) {
                controlsDiv
                    .append('span')
                    .style('padding', '0 5px')
                    .text('...');
            }
        }
        
        for (var i = startPage; i <= endPage; i++) {
            var pageNum = i;
            controlsDiv
                .append('button')
                .attr('class', 'heatmap-pagination-btn' + (i === this.currentPage ? ' active' : ''))
                .text(i)
                .on('click', function() { 
                    var page = parseInt(this.textContent);
                    self.goToPage(page); 
                });
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                controlsDiv
                    .append('span')
                    .style('padding', '0 5px')
                    .text('...');
            }
            
            controlsDiv
                .append('button')
                .attr('class', 'heatmap-pagination-btn')
                .text(totalPages)
                .on('click', function() { self.goToPage(totalPages); });
        }
        
        // Next page button
        controlsDiv
            .append('button')
            .attr('class', 'heatmap-pagination-btn')
            .text('Next')
            .property('disabled', this.currentPage === totalPages)
            .on('click', function() { self.goToPage(self.currentPage + 1); });
        
        // Last page button
        controlsDiv
            .append('button')
            .attr('class', 'heatmap-pagination-btn')
            .text('Last')
            .property('disabled', this.currentPage === totalPages)
            .on('click', function() { self.goToPage(totalPages); });
        
        // Page select dropdown (only show if there are multiple pages)
        if (totalPages > 1) {
            controlsDiv
                .append('span')
                .style('margin-left', '15px')
                .text('Go to page: ');
            
            var pageSelect = controlsDiv
                .append('select')
                .attr('class', 'heatmap-page-select')
                .on('change', function() {
                    var selectedPage = parseInt(this.value);
                    if (selectedPage) {
                        self.goToPage(selectedPage);
                    }
                });
            
            for (var j = 1; j <= totalPages; j++) {
                pageSelect
                    .append('option')
                    .attr('value', j)
                    .property('selected', j === this.currentPage)
                    .text('Page ' + j);
            }
        }
    }
    
    goToPage(page) {
        var totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            
            // Update table body
            var table = d3.select('#' + this.containerId + ' .heatmap-table');
            this.createTableBody(table);
            
            // Update pagination
            var container = d3.select('#' + this.containerId + ' .heatmap-container');
            container.select('.heatmap-pagination').remove();
            this.createPagination(container);
            
            // Scroll to top of table
            var element = document.querySelector('#' + this.containerId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
}

// Usage function - call this to initialize the heatmap
function createSupremeCourtHeatmap(containerId, csvFilePath) {
    if (!csvFilePath) {
        csvFilePath = 'for json.csv';
    }
    return new SupremeCourtHeatmap(containerId, csvFilePath);
}

// Auto-initialize if container exists (optional)
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('heatmap')) {
        createSupremeCourtHeatmap('heatmap');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupremeCourtHeatmap: SupremeCourtHeatmap, createSupremeCourtHeatmap: createSupremeCourtHeatmap };
}