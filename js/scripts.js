// Save calculation data to firebase
function saveCalculation(data) {
  
  // Add timestamp
  data.timestamp = new Date().toISOString();
  
  // Check if user is signed in
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const user = firebase.auth().currentUser;
    if (user) {
      // Save to Firestore
      firebase.firestore().collection('users').doc(user.uid).collection('calculations').add(data)
        .then(docRef => {
          console.log('Calculation saved to Firestore with ID:', docRef.id);
        })
        .catch(error => {
          console.error('Error saving to Firestore:', error);
          // Fallback to localStorage
          saveToLocalStorage(data);
        });
      return;
    }
  }
  
  // Save to localStorage if not signed in or Firebase not available
  saveToLocalStorage(data);
}

// Helper function for localStorage saving
function saveToLocalStorage(data) {
  // Get existing saved calculations or initialize empty array
  let savedCalculations = JSON.parse(localStorage.getItem('roiCalculations')) || [];
  
  // Add to array
  savedCalculations.push(data);
  
  // Save back to localStorage
  localStorage.setItem('roiCalculations', JSON.stringify(savedCalculations));
}

// Functions to load from Firestore
function loadCalculationsFromFirestore() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase is not available. Cannot load from Firestore.');
    return;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const savedLocationsContainer = document.getElementById('saved-locations-container');
  if (!savedLocationsContainer) return;
  
  // Show loading indicator
  savedLocationsContainer.innerHTML = '<p>Loading your saved calculations...</p>';
  
  firebase.firestore().collection('users').doc(user.uid).collection('calculations')
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        savedLocationsContainer.innerHTML = '<p>No saved calculations yet.</p>';
        return;
      }
      
      let html = '<div class="saved-calculations-list">';
      
      snapshot.forEach((doc, index) => {
        const calc = doc.data();
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
              <button onclick="loadCalculationFromFirestore('${doc.id}')">Load</button>
              <button onclick="deleteCalculationFromFirestore('${doc.id}')">Delete</button>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      savedLocationsContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading calculations from Firestore:', error);
      savedLocationsContainer.innerHTML = '<p>Error loading calculations. Please try again.</p>';
    });
}

// Add functions for loading and deleting specific calculations
function loadCalculationFromFirestore(docId) {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase is not available. Cannot load from Firestore.');
    return;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  firebase.firestore().collection('users').doc(user.uid).collection('calculations').doc(docId)
    .get()
    .then(doc => {
      if (doc.exists) {
        const calc = doc.data();
        
        // Fill the form with saved data
        const data = calc.formData;
        
        // Helper function to set dropdown or custom input value
        function setDropdownValue(selectId, customId, value) {
          const select = document.getElementById(selectId);
          const customInput = document.getElementById(customId);
          
          if (!select || !customInput) return;
          
          // Check if the value matches any of the predefined options
          let found = false;
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value && parseFloat(select.options[i].value) === value) {
              select.selectedIndex = i;
              found = true;
              customInput.style.display = 'none';
              break;
            }
          }
          
          // If not found, set to custom
          if (!found && value) {
            // Find the "custom" option
            for (let i = 0; i < select.options.length; i++) {
              if (select.options[i].value === 'custom') {
                select.selectedIndex = i;
                customInput.value = value;
                customInput.style.display = 'block';
                break;
              }
            }
          }
        }
        
        // Location info
        document.querySelector('input[placeholder="e.g., Jayanagar, Bangalore"]').value = data.locationName || '';
        setDropdownValue('store-size', 'custom-store-size', data.storeSize);
        setDropdownValue('monthly-rent', 'custom-monthly-rent', data.monthlyRent);
        
        // Initial investment
        setDropdownValue('interior-cost', 'custom-interior-cost', data.interiorCost);
        document.querySelector('input[placeholder="e.g., 300000"]').value = data.securityDeposit || '';
        setDropdownValue('initial-stock', 'custom-initial-stock', data.initialStock);
        document.querySelector('input[placeholder="e.g., 200000"]').value = data.otherOneTime || '';
        
        // Monthly operational
        setDropdownValue('num-employees', 'custom-employees', data.numEmployees);
        document.querySelector('input[placeholder="e.g., 25000"]').value = data.avgSalary || '';
        document.querySelector('input[placeholder="e.g., 15000"]').value = data.utilities || '';
        document.querySelector('input[placeholder="e.g., 10000"]').value = data.maintenance || '';
        document.querySelector('input[placeholder="e.g., 30000"]').value = data.marketing || '';
        document.querySelector('input[placeholder="e.g., 20000"]').value = data.otherMonthly || '';
        
        // Financing
        document.querySelector('input[placeholder="e.g., 3000000"]').value = data.loanAmount || '';
        setDropdownValue('interest-rate', 'custom-interest-rate', data.interestRate);
        
        // Sales metrics
        document.querySelector('input[placeholder="e.g., 4000"]').value = data.avgTransaction || '';
        setDropdownValue('conversion-rate', 'custom-conversion-rate', data.conversionRate);
        setDropdownValue('profit-margin', 'custom-profit-margin', data.profitMargin);
        
        // Switch to input tab
        switchToTab('input');
        
        // Display results
        displayResults(data, calc.result);
      }
    })
    .catch(error => {
      console.error('Error loading calculation:', error);
      alert('Error loading calculation. Please try again.');
    });
}

function deleteCalculationFromFirestore(docId) {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase is not available. Cannot delete from Firestore.');
    return;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  if (confirm('Are you sure you want to delete this saved calculation?')) {
    firebase.firestore().collection('users').doc(user.uid).collection('calculations').doc(docId)
      .delete()
      .then(() => {
        loadCalculationsFromFirestore();
      })
      .catch(error => {
        console.error('Error deleting calculation:', error);
        alert('Error deleting calculation. Please try again.');
      });
  }
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

// Function to setup authentication
function setupAuth() {
  // Check if Firebase auth is available
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const auth = firebase.auth();
    const authStatus = document.getElementById('auth-status');
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
    const authModal = document.getElementById('auth-modal');
    const closeBtn = document.querySelector('.auth-close');
    
    // Set up auth state change listener
    auth.onAuthStateChanged(user => {
      if (user) {
        // User is signed in
        if (authStatus) authStatus.style.display = 'none';
        if (userInfo) {
          userInfo.style.display = 'flex';
          userEmail.textContent = user.email;
        }
        
        // Load user's calculations from Firestore if on saved tab
        const savedTab = document.querySelector('.tab-button[data-tab="saved"]');
        if (savedTab && savedTab.classList.contains('active')) {
          loadCalculationsFromFirestore();
        }
      } else {
        // User is signed out
        if (authStatus) authStatus.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
      }
    });
    
    // Setup login button click handler
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (authModal) authModal.style.display = 'block';
      });
    }
    
    // Setup logout button click handler
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
          console.log('User signed out');
        }).catch(error => {
          console.error('Sign out error:', error);
        });
      });
    }
    
    // Setup modal close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (authModal) authModal.style.display = 'none';
      });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
      if (event.target === authModal) {
        authModal.style.display = 'none';
      }
    });
    
    // Setup sign in and sign up buttons
    const signinBtn = document.getElementById('signin-btn');
    const signupBtn = document.getElementById('signup-btn');
    const googleSigninBtn = document.getElementById('google-signin-btn');
    
    if (signinBtn) {
      signinBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
          alert('Please enter both email and password');
          return;
        }
        
        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            authModal.style.display = 'none';
            // Clear form fields
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
          })
          .catch(error => {
            alert(`Sign in error: ${error.message}`);
          });
      });
    }
    
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
          alert('Please enter both email and password');
          return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => {
            authModal.style.display = 'none';
            // Clear form fields
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
          })
          .catch(error => {
            alert(`Sign up error: ${error.message}`);
          });
      });
    }
    
    if (googleSigninBtn) {
      googleSigninBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
          .then(() => {
            authModal.style.display = 'none';
          })
          .catch(error => {
            alert(`Google sign in error: ${error.message}`);
          });
      });
    }
  } else {
    console.warn('Firebase Auth is not available. Authentication features will be disabled.');
  }
}

// DOM Ready - Initialize everything
document.addEventListener('DOMContentLoaded', function() {
  // Setup event listeners
  setupForm();
  setupTabs();
  setupLoadSavedButton();
  setupDropdowns();
  
  // Only call setupAuth if Firebase is available
  if (typeof firebase !== 'undefined' && firebase.auth) {
    setupAuth();
  } else {
    console.warn('Firebase Auth is not available. Authentication features will be disabled.');
  }
});

// Setup dropdown fields with custom input options
function setupDropdowns() {
  // List of dropdowns with custom options
  const dropdowns = [
    { select: 'store-size', custom: 'custom-store-size' },
    { select: 'monthly-rent', custom: 'custom-monthly-rent' },
    { select: 'interior-cost', custom: 'custom-interior-cost' },
    { select: 'initial-stock', custom: 'custom-initial-stock' },
    { select: 'num-employees', custom: 'custom-employees' },
    { select: 'conversion-rate', custom: 'custom-conversion-rate' },
    { select: 'profit-margin', custom: 'custom-profit-margin' },
    { select: 'interest-rate', custom: 'custom-interest-rate' }
  ];
  
  // Add event listeners to each dropdown
  dropdowns.forEach(dropdown => {
    const selectElement = document.getElementById(dropdown.select);
    const customInput = document.getElementById(dropdown.custom);
    
    if (selectElement && customInput) {
      selectElement.addEventListener('change', function() {
        if (this.value === 'custom') {
          customInput.style.display = 'block';
          customInput.required = true;
        } else {
          customInput.style.display = 'none';
          customInput.required = false;
        }
      });
    }
  });
}

// Form setup and calculation logic
function setupForm() {
  const form = document.getElementById('roi-calculator-form');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Helper function to get value from dropdown or custom input
      function getDropdownValue(selectId, customId) {
        const select = document.getElementById(selectId);
        if (!select) return 0;
        
        if (select.value === 'custom') {
          const customInput = document.getElementById(customId);
          return parseFloat(customInput.value) || 0;
        } else {
          return parseFloat(select.value) || 0;
        }
      }
      
      // Gather form data
      const formData = {
        locationName: document.querySelector('input[placeholder="e.g., Jayanagar, Bangalore"]').value,
        storeSize: getDropdownValue('store-size', 'custom-store-size'),
        monthlyRent: getDropdownValue('monthly-rent', 'custom-monthly-rent'),
        
        // Initial Investment
        interiorCost: getDropdownValue('interior-cost', 'custom-interior-cost'),
        securityDeposit: parseFloat(document.querySelector('input[placeholder="e.g., 300000"]').value) || 0,
        initialStock: getDropdownValue('initial-stock', 'custom-initial-stock'),
        otherOneTime: parseFloat(document.querySelector('input[placeholder="e.g., 200000"]').value) || 0,
        
        // Monthly Operational
        numEmployees: getDropdownValue('num-employees', 'custom-employees'),
        avgSalary: parseFloat(document.querySelector('input[placeholder="e.g., 25000"]').value) || 0,
        utilities: parseFloat(document.querySelector('input[placeholder="e.g., 15000"]').value) || 0,
        maintenance: parseFloat(document.querySelector('input[placeholder="e.g., 10000"]').value) || 0,
        marketing: parseFloat(document.querySelector('input[placeholder="e.g., 30000"]').value) || 0,
        otherMonthly: parseFloat(document.querySelector('input[placeholder="e.g., 20000"]').value) || 0,
        
        // Financing
        loanAmount: parseFloat(document.querySelector('input[placeholder="e.g., 3000000"]').value) || 0,
        interestRate: getDropdownValue('interest-rate', 'custom-interest-rate'),
        
        // Sales Metrics
        avgTransaction: parseFloat(document.querySelector('input[placeholder="e.g., 4000"]').value) || 0,
        conversionRate: getDropdownValue('conversion-rate', 'custom-conversion-rate'),
        profitMargin: getDropdownValue('profit-margin', 'custom-profit-margin'),
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
      // Check if Firebase is available and user is signed in
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        loadCalculationsFromFirestore();
      } else {
        // Fallback to localStorage
        displaySavedCalculations();
      }
    }
  }
}

// ROI Calculation
function calculateROI(data) {
  // Calculate total initial investment
  const initialInvestment = 
    data.interiorCost +
    data.securityDeposit +
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
  
  setupScenarioTabs(result);

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


// Load saved calculation into form
function loadCalculation(index) {
  const savedCalcs = loadSavedCalculations();
  
  if (index >= 0 && index < savedCalcs.length) {
    const calc = savedCalcs[index];
    
    // Fill the form with saved data
    const data = calc.formData;
    
    // Helper function to set dropdown or custom input value
    function setDropdownValue(selectId, customId, value) {
      const select = document.getElementById(selectId);
      const customInput = document.getElementById(customId);
      
      if (!select || !customInput) return;
      
      // Check if the value matches any of the predefined options
      let found = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value && parseFloat(select.options[i].value) === value) {
          select.selectedIndex = i;
          found = true;
          customInput.style.display = 'none';
          break;
        }
      }
      
      // If not found, set to custom
      if (!found && value) {
        // Find the "custom" option
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === 'custom') {
            select.selectedIndex = i;
            customInput.value = value;
            customInput.style.display = 'block';
            break;
          }
        }
      }
    }
    
    // Location info
    document.querySelector('input[placeholder="e.g., Jayanagar, Bangalore"]').value = data.locationName || '';
    setDropdownValue('store-size', 'custom-store-size', data.storeSize);
    setDropdownValue('monthly-rent', 'custom-monthly-rent', data.monthlyRent);
    
    // Initial investment
    setDropdownValue('interior-cost', 'custom-interior-cost', data.interiorCost);
    document.querySelector('input[placeholder="e.g., 300000"]').value = data.securityDeposit || '';
    setDropdownValue('initial-stock', 'custom-initial-stock', data.initialStock);
    document.querySelector('input[placeholder="e.g., 200000"]').value = data.otherOneTime || '';
    
    // Monthly operational
    setDropdownValue('num-employees', 'custom-employees', data.numEmployees);
    document.querySelector('input[placeholder="e.g., 25000"]').value = data.avgSalary || '';
    document.querySelector('input[placeholder="e.g., 15000"]').value = data.utilities || '';
    document.querySelector('input[placeholder="e.g., 10000"]').value = data.maintenance || '';
    document.querySelector('input[placeholder="e.g., 30000"]').value = data.marketing || '';
    document.querySelector('input[placeholder="e.g., 20000"]').value = data.otherMonthly || '';
    
    // Financing
    document.querySelector('input[placeholder="e.g., 3000000"]').value = data.loanAmount || '';
    setDropdownValue('interest-rate', 'custom-interest-rate', data.interestRate);
    
    // Sales metrics
    document.querySelector('input[placeholder="e.g., 4000"]').value = data.avgTransaction || '';
    setDropdownValue('conversion-rate', 'custom-conversion-rate', data.conversionRate);
    setDropdownValue('profit-margin', 'custom-profit-margin', data.profitMargin);
    
    // Switch to input tab
    switchToTab('input');
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
          window.onload = function() { 
            window.print(); 
            // Close the window after printing to prevent memory leaks
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Export to CSV
function exportToCSV() {
  const resultsContainer = document.querySelector('.results-container');
  if (!resultsContainer) {
    console.error('Results container not found');
    return;
  }
  
  const locationNameElement = resultsContainer.querySelector('.results-subtitle');
  const locationName = locationNameElement ? locationNameElement.textContent : 'Unnamed Location';
  
  // Get current scenario
  let scenario = 'Two Year ROI';
  document.querySelectorAll('.scenario-tab').forEach(tab => {
    if (tab.classList.contains('active')) {
      scenario = tab.textContent.trim();
    }
  });
  
  // Get key metrics
  const keyMetricValueElement = resultsContainer.querySelector('.key-metric .metric-value');
  const dailySales = keyMetricValueElement ? 
    keyMetricValueElement.textContent.replace('₹', '').replace(/,/g, '').trim() : '0';
  
  // Fix potential regex error by adding a safe fallback
  const metricSubtext = resultsContainer.querySelector('.key-metric .metric-subtext');
  let customersNeeded = '0';
  if (metricSubtext) {
    const matches = metricSubtext.textContent.match(/(\d+)/);
    customersNeeded = matches ? matches[0] : '0';
  }
  
  const metricValues = resultsContainer.querySelectorAll('.metrics-grid .metric-value');
  const initialInvestment = metricValues[0] ? metricValues[0].textContent.replace('₹', '').replace(/,/g, '').trim() : '0';
  const monthlyExpenses = metricValues[1] ? metricValues[1].textContent.replace('₹', '').replace(/,/g, '').trim() : '0';
  const monthlyRevenue = metricValues[2] ? metricValues[2].textContent.replace('₹', '').replace(/,/g, '').trim() : '0';
  const monthlyProfit = metricValues[3] ? metricValues[3].textContent.replace('₹', '').replace(/,/g, '').trim() : '0';
  
  const breakevenElement = resultsContainer.querySelector('.breakeven-section .metric-value');
  const breakeven = breakevenElement ? 
    breakevenElement.textContent.replace('₹', '').replace(/,/g, '').trim() : '0';
  
  // Function to properly escape CSV fields
  const escapeCSV = (field) => {
    if (field === null || field === undefined) {
      return '';
    }
    const stringField = String(field);
    // If the field contains commas, quotes, or newlines, wrap it in quotes and escape any quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };
  
  // Create CSV content
  const csvRows = [
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
  ];
  
  const csvContent = csvRows.map(row => row.map(escapeCSV).join(',')).join('\n');
  
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
  
  // Clean up the URL object to prevent memory leaks
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
