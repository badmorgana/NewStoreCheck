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