// Add this to your scripts.js file

// Save calculation data
function saveCalculation(data) {
  // Get existing saved calculations or initialize empty array
  let savedCalculations = JSON.parse(localStorage.getItem('roiCalculations')) || [];
  
  // Add timestamp
  data.timestamp = new Date().toISOString();
  
  // Add to array
  savedCalculations.push(data);
  
  // Save back to localStorage
  localStorage.setItem('roiCalculations', JSON.stringify(savedCalculations));
}

// Load saved calculations
function loadSavedCalculations() {
  return JSON.parse(localStorage.getItem('roiCalculations')) || [];
}

// Display saved calculations in the Saved Locations tab
function displaySavedCalculations() {
  const savedCalcs = loadSavedCalculations();
  const savedLocationsContainer = document.getElementById('saved-locations-container');
  
  if (savedCalcs.length === 0) {
    savedLocationsContainer.innerHTML = '<p>No saved calculations yet.</p>';
    return;
  }
  
  let html = '<div class="saved-calculations-list">';
  
  savedCalcs.forEach((calc, index) => {
    const date = new Date(calc.timestamp).toLocaleDateString();
    html += `
      <div class="saved-calculation-item">
        <div class="saved-item-header">
          <h3>${calc.locationName || 'Unnamed Location'}</h3>
          <span>${date}</span>
        </div>
        <div class="saved-item-metrics">
          <div>Initial Investment: ₹${calc.initialInvestment.toLocaleString()}</div>
          <div>Monthly Revenue: ₹${calc.monthlyRevenue.toLocaleString()}</div>
          <div>ROI Period: ${calc.roiPeriod} years</div>
        </div>
        <div class="saved-item-actions">
          <button onclick="loadCalculation(${index})">Load</button>
          <button onclick="deleteCalculation(${index})">Delete</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  savedLocationsContainer.innerHTML = html;
}
// DOM Ready - Initialize everything
document.addEventListener('DOMContentLoaded', function() {
  // Setup event listeners
  setupForm();
  setupTabs();
  setupLoadSavedButton();
});

// Form setup and calculation logic
function setupForm() {
  const form = document.getElementById('roi-calculator-form');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Gather form data
      const formData = {
        locationName: document.querySelector('input[placeholder="e.g., Jayanagar, Bangalore"]').value,
        storeSize: parseFloat(document.querySelector('input[placeholder="e.g., 1000"]').value) || 0,
        squareFootCost: parseFloat(document.querySelector('input[placeholder="e.g., 5000"]').value) || 0,
        monthlyRent: parseFloat(document.querySelector('input[placeholder="e.g., 100"]').value) || 0,
        
        // Initial Investment
        interiorCost: parseFloat(document.querySelector('input[placeholder="e.g., 1000000"]').value) || 0,
        securityDeposit: parseFloat(document.querySelector('input[placeholder="e.g., 300000"]').value) || 0,
        fixturesEquipment: parseFloat(document.querySelector('input[placeholder="e.g., 500000"]').value) || 0,
        initialStock: parseFloat(document.querySelector('input[placeholder="e.g., 5000000"]').value) || 0,
        otherOneTime: parseFloat(document.querySelector('input[placeholder="e.g., 200000"]').value) || 0,
        
        // Monthly Operational
        numEmployees: parseFloat(document.querySelector('input[placeholder="e.g., 3"]').value) || 0,
        avgSalary: parseFloat(document.querySelector('input[placeholder="e.g., 25000"]').value) || 0,
        utilities: parseFloat(document.querySelector('input[placeholder="e.g., 15000"]').value) || 0,
        maintenance: parseFloat(document.querySelector('input[placeholder="e.g., 10000"]').value) || 0,
        marketing: parseFloat(document.querySelector('input[placeholder="e.g., 30000"]').value) || 0,
        otherMonthly: parseFloat(document.querySelector('input[placeholder="e.g., 20000"]').value) || 0,
        
        // Financing
        loanAmount: parseFloat(document.querySelector('input[placeholder="e.g., 3000000"]').value) || 0,
        interestRate: parseFloat(document.querySelector('input[placeholder="e.g., 12"]').value) || 0,
        
        // Sales Metrics
        avgTransaction: parseFloat(document.querySelector('input[placeholder="e.g., 4000"]').value) || 0,
        conversionRate: parseFloat(document.querySelector('input[placeholder="e.g., 90"]').value) || 0,
        profitMargin: parseFloat(document.querySelector('input[placeholder="e.g., 50"]').value) || 0,
      };
      
      // Calculate ROI
      const result = calculateROI(formData);
      
      // Display results
      displayResults(formData, result);
      
      // Save calculation
      const calculationData = {
        locationName: formData.locationName || 'Unnamed Location',
        initialInvestment: result.initialInvestment,
        monthlyRevenue: result.twoYearROI.monthlyRevenueNeeded,
        roiPeriod: 2, // Default to 2-year ROI
        formData: formData,
        result: result
      };
      
      saveCalculation(calculationData);
      
      // Switch to results tab
      switchToTab('results');
    });
    
    // Reset button functionality
    const resetButton = form.querySelector('button[type="button"]');
    if (resetButton) {
      resetButton.addEventListener('click', function() {
        form.reset();
      });
    }
  }
}

// Tab Switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchToTab(tabName);
    });
  });
}

function setupLoadSavedButton() {
  const loadSavedButton = document.querySelector('.btn-secondary');
  
  if (loadSavedButton) {
    loadSavedButton.addEventListener('click', function() {
      switchToTab('saved');
    });
  }
}

function switchToTab(tabName) {
  // Update active tab
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Show appropriate container
  const formContainer = document.querySelector('.form-container');
  const resultsContainer = document.querySelector('.results-container');
  const savedLocationsContainer = document.getElementById('saved-locations-container');
  
  formContainer.style.display = tabName === 'input' ? 'block' : 'none';
  resultsContainer.style.display = tabName === 'results' ? 'block' : 'none';
  
  if (savedLocationsContainer) {
    savedLocationsContainer.style.display = tabName === 'saved' ? 'block' : 'none';
    
    if (tabName === 'saved') {
      displaySavedCalculations();
    }
  }
}

// ROI Calculation
function calculateROI(data) {
  // Calculate total initial investment
  const initialInvestment = 
    (data.squareFootCost * data.storeSize) +
    data.interiorCost +
    data.securityDeposit +
    data.fixturesEquipment + 
    data.initialStock +
    data.otherOneTime;
  
  // Calculate monthly expenses
  const monthlyExpenses = 
    (data.monthlyRent * data.storeSize) +
    (data.numEmployees * data.avgSalary) +
    data.utilities +
    data.maintenance +
    data.marketing +
    data.otherMonthly;
  
  // Calculate monthly loan payment (if applicable)
  let monthlyLoanPayment = 0;
  if (data.loanAmount > 0 && data.interestRate > 0) {
    const monthlyRate = data.interestRate / 100 / 12;
    const numPayments = 24; // 2 years
    monthlyLoanPayment = data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / 
                         (Math.pow(1 + monthlyRate, numPayments) - 1);
  }
  
  // Calculate total monthly costs
  const totalMonthlyExpenses = monthlyExpenses + monthlyLoanPayment;
  
  // Calculate various ROI scenarios
  const sixMonthROI = {
      monthlyRevenueNeeded: (initialInvestment / 6) + totalMonthlyExpenses,
      dailyRevenueNeeded: ((initialInvestment / 6) + totalMonthlyExpenses) / 30,
      customersPerDay: Math.ceil(((initialInvestment / 6) + totalMonthlyExpenses) / 30 / data.avgTransaction),
      visitorsPerDay: Math.ceil(((initialInvestment / 6) + totalMonthlyExpenses) / 30 / data.avgTransaction / (data.conversionRate / 100))
    
  };
  
  const twoYearROI = {
    monthlyRevenueNeeded: (initialInvestment / 24) + totalMonthlyExpenses,
      dailyRevenueNeeded: ((initialInvestment / 24) + totalMonthlyExpenses) / 30,
      customersPerDay: Math.ceil(((initialInvestment / 24) + totalMonthlyExpenses) / 30 / data.avgTransaction),
      visitorsPerDay: Math.ceil(((initialInvestment / 24) + totalMonthlyExpenses) / 30 / data.avgTransaction / (data.conversionRate / 100))};
  
  const threeYearROI = {
    monthlyRevenueNeeded: (initialInvestment / 36) + totalMonthlyExpenses,
      dailyRevenueNeeded: ((initialInvestment / 36) + totalMonthlyExpenses) / 30,
      customersPerDay: Math.ceil(((initialInvestment / 36) + totalMonthlyExpenses) / 30 / data.avgTransaction),
      visitorsPerDay: Math.ceil(((initialInvestment / 36) + totalMonthlyExpenses) / 30 / data.avgTransaction / (data.conversionRate / 100))
  };
  
  // Calculate breakeven daily sales
  const breakeven = {
    dailySales: totalMonthlyExpenses / 30
  };
  
  return {
    initialInvestment,
    monthlyExpenses: totalMonthlyExpenses,
    sixMonthROI,
    twoYearROI,
    threeYearROI,
    breakeven
  };
}

// Display calculation results
function displayResults(formData, result) {
  // Update location name
  document.querySelector('.results-subtitle').textContent = formData.locationName || 'Unnamed Location';
  
  // Update main metric
  document.querySelector('.key-metric .metric-value').textContent = `₹${Math.round(result.twoYearROI.dailyRevenueNeeded).toLocaleString()} daily sales`;
  document.querySelector('.key-metric .metric-subtext').textContent = `This requires approximately ${result.twoYearROI.customersPerDay} customers per day (${result.twoYearROI.visitorsPerDay} visitors)`;

  
  // Update metrics grid
  const metricsGrid = document.querySelector('.metrics-grid');
  const metricValues = metricsGrid.querySelectorAll('.metric-value');
  
  // Initial Investment
  metricValues[0].textContent = `₹${Math.round(result.initialInvestment).toLocaleString()}`;
  
  // Monthly Expenses
  metricValues[1].textContent = `₹${Math.round(result.monthlyExpenses).toLocaleString()}`;
  
  // Required Monthly Revenue
  metricValues[2].textContent = `₹${Math.round(result.twoYearROI.monthlyRevenueNeeded).toLocaleString()}`;
  
  // Monthly Profit Needed
  metricValues[3].textContent = `₹${Math.round(result.twoYearROI.monthlyRevenueNeeded - result.monthlyExpenses).toLocaleString()}`;
  
  // Update breakeven
  document.querySelector('.breakeven-section .metric-value').textContent = `₹${Math.round(result.breakeven.dailySales).toLocaleString()}`;
  


  // Add export and print buttons (add this line)
  setupResultsActions();
}

// Scenario tab switching
function setupScenarioTabs(result) {
  const scenarioTabs = document.querySelectorAll('.scenario-tab');
  
  scenarioTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      scenarioTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Update metrics based on selected scenario
      let scenario;
      
      if (this.textContent.includes('6 Month')) {
        scenario = result.sixMonthROI;
      } else if (this.textContent.includes('2 Year')) {
        scenario = result.twoYearROI;
      } else if (this.textContent.includes('3 Year')) {
        scenario = result.threeYearROI;
      }
      
      if (scenario) {
        // Update main metric
        document.querySelector('.key-metric .metric-value').textContent = `₹${Math.round(scenario.dailyRevenueNeeded).toLocaleString()} daily sales`;
        document.querySelector('.key-metric .metric-subtext').textContent = `This requires approximately ${scenario.customersPerDay} customers per day (${scenario.visitorsPerDay} visitors)`;
      
        
        // Update the required monthly revenue and profit
        const metricValues = document.querySelectorAll('.metrics-grid .metric-value');
        
        // Required Monthly Revenue
        metricValues[2].textContent = `₹${Math.round(scenario.monthlyRevenueNeeded).toLocaleString()}`;
        
        // Monthly Profit Needed
        metricValues[3].textContent = `₹${Math.round(scenario.monthlyRevenueNeeded - result.monthlyExpenses).toLocaleString()}`;
      }
    });
  });
}
  // Set up scenario tabs
  setupScenarioTabs(result);

// Load saved calculation into form
function loadCalculation(index) {
  const savedCalcs = loadSavedCalculations();
  
  if (index >= 0 && index < savedCalcs.length) {
    const calc = savedCalcs[index];
    
    // Fill the form with saved data
    const data = calc.formData;
    
    // Location info
    document.querySelector('input[placeholder="e.g., Jayanagar, Bangalore"]').value = data.locationName || '';
    document.querySelector('input[placeholder="e.g., 1000"]').value = data.storeSize || '';
    document.querySelector('input[placeholder="e.g., 5000"]').value = data.squareFootCost || '';
    document.querySelector('input[placeholder="e.g., 100"]').value = data.monthlyRent || '';
    
    // Initial investment
    document.querySelector('input[placeholder="e.g., 1000000"]').value = data.interiorCost || '';
    document.querySelector('input[placeholder="e.g., 300000"]').value = data.securityDeposit || '';
    document.querySelector('input[placeholder="e.g., 500000"]').value = data.fixturesEquipment || '';
    document.querySelector('input[placeholder="e.g., 5000000"]').value = data.initialStock || '';
    document.querySelector('input[placeholder="e.g., 200000"]').value = data.otherOneTime || '';
    
    // Monthly operational
    document.querySelector('input[placeholder="e.g., 3"]').value = data.numEmployees || '';
    document.querySelector('input[placeholder="e.g., 25000"]').value = data.avgSalary || '';
    document.querySelector('input[placeholder="e.g., 15000"]').value = data.utilities || '';
    document.querySelector('input[placeholder="e.g., 10000"]').value = data.maintenance || '';
    document.querySelector('input[placeholder="e.g., 30000"]').value = data.marketing || '';
    document.querySelector('input[placeholder="e.g., 20000"]').value = data.otherMonthly || '';
    
    // Financing
    document.querySelector('input[placeholder="e.g., 3000000"]').value = data.loanAmount || '';
    document.querySelector('input[placeholder="e.g., 12"]').value = data.interestRate || '';
    
    // Sales metrics
    document.querySelector('input[placeholder="e.g., 4000"]').value = data.avgTransaction || '';
    document.querySelector('input[placeholder="e.g., 90"]').value = data.conversionRate || '';
    document.querySelector('input[placeholder="e.g., 50"]').value = data.profitMargin || '';
    
    // Switch to input tab
    switchToTab('input');
    
    // Also show results
    displayResults(data, calc.result);
  }
}

// Delete saved calculation
function deleteCalculation(index) {
  const savedCalcs = loadSavedCalculations();
  
  if (index >= 0 && index < savedCalcs.length) {
    if (confirm('Are you sure you want to delete this saved calculation?')) {
      savedCalcs.splice(index, 1);
      localStorage.setItem('roiCalculations', JSON.stringify(savedCalcs));
      displaySavedCalculations();
    }
  }
}
// Add these functions to setup print and export
function setupResultsActions() {

  const existingActions = document.querySelector('.results-actions');
  if (existingActions) {
    existingActions.remove();
  }

  // Create container for action buttons
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'results-actions';
  actionsContainer.style.marginTop = '15px';
  actionsContainer.style.display = 'flex';
  actionsContainer.style.gap = '10px';
  
  // Add print button
  const printBtn = document.createElement('button');
  printBtn.className = 'btn btn-secondary';
  printBtn.innerHTML = '<span style="margin-right: 5px;">🖨️</span> Print Results';
  printBtn.addEventListener('click', printResults);
  
  // Add export button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-secondary';
  exportBtn.innerHTML = '<span style="margin-right: 5px;">📊</span> Export as CSV';
  exportBtn.addEventListener('click', exportToCSV);
  
  // Add buttons to container
  actionsContainer.appendChild(printBtn);
  actionsContainer.appendChild(exportBtn);
  
  // Add container to results header
  document.querySelector('.results-header').appendChild(actionsContainer);
}

// Print functionality
function printResults() {
  // Create a printable version
  const printContent = document.querySelector('.results-container').cloneNode(true);
  
  // Remove buttons
  const actionsContainer = printContent.querySelector('.results-actions');
  if (actionsContainer) {
    actionsContainer.remove();
  }
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>ROI Calculator Results</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
          .results-title {
            color: #6a3d98;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .results-subtitle {
            color: #666;
            margin-bottom: 20px;
          }
          .metric-label {
            color: #666;
            font-size: 14px;
          }
          .metric-value {
            color: #6a3d98;
            font-size: 24px;
            font-weight: bold;
          }
          .key-metric {
            margin-bottom: 15px;
            padding: 15px;
            border: 1px solid #eee;
            border-radius: 8px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .summary-title {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .results-summary {
            background-color: #f9f5ff;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
        <footer style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          Generated by Store ROI Calculator on ${new Date().toLocaleDateString()}
        </footer>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Export to CSV
function exportToCSV() {
  const resultsContainer = document.querySelector('.results-container');
  const locationName = resultsContainer.querySelector('.results-subtitle').textContent;
  
  // Get current scenario
  let scenario = 'Two Year ROI';
  document.querySelectorAll('.scenario-tab').forEach(tab => {
    if (tab.classList.contains('active')) {
      scenario = tab.textContent.trim();
    }
  });
  
  // Get key metrics
  const dailySales = resultsContainer.querySelector('.key-metric .metric-value').textContent.replace('₹', '').replace(/,/g, '').trim();
  const customersNeeded = resultsContainer.querySelector('.key-metric .metric-subtext').textContent.match(/(\d+)/)[0];
  
  const metricValues = resultsContainer.querySelectorAll('.metrics-grid .metric-value');
  const initialInvestment = metricValues[0].textContent.replace('₹', '').replace(/,/g, '').trim();
  const monthlyExpenses = metricValues[1].textContent.replace('₹', '').replace(/,/g, '').trim();
  const monthlyRevenue = metricValues[2].textContent.replace('₹', '').replace(/,/g, '').trim();
  const monthlyProfit = metricValues[3].textContent.replace('₹', '').replace(/,/g, '').trim();
  
  const breakeven = resultsContainer.querySelector('.breakeven-section .metric-value').textContent.replace('₹', '').replace(/,/g, '').trim();
  
  // Create CSV content
  const csvContent = [
    ['Store ROI Calculator Results'],
    ['Generated on', new Date().toLocaleString()],
    [''],
    ['Location', locationName],
    ['Scenario', scenario],
    [''],
    ['Metric', 'Value'],
    ['Initial Investment', `₹${initialInvestment}`],
    ['Monthly Expenses', `₹${monthlyExpenses}`],
    ['Required Monthly Revenue', `₹${monthlyRevenue}`],
    ['Monthly Profit Needed', `₹${monthlyProfit}`],
    ['Daily Sales Required', `₹${dailySales}`],
    ['Customers Needed Per Day', customersNeeded],
    ['Breakeven Daily Sales', `₹${breakeven}`],
    ['']
  ].map(row => row.join(',')).join('\n');
  
  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ROI_Analysis_${locationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}