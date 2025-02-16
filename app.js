// Constants and Global Variables
const CATEGORIES = {
    income: ['Salary', 'Side Job', 'Gift', 'Other Money In'],
    expense: ['Food & Drinks', 'Transport', 'Fun', 'Shopping', 'House', 'Health', 'Other']
};

const STORAGE_KEYS = {
    TRANSACTIONS: 'expense_tracker_transactions',
    BUDGET: 'expense_tracker_budget',
    SAVINGS_GOAL: 'expense_tracker_savings_goal',
    THEME: 'expense_tracker_theme'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadAndDisplayData();
    updateDateTime();
    // Update date time every second
    setInterval(updateDateTime, 1000);
});

function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    document.getElementById('currentDateTime').textContent = 
        now.toLocaleString('en-US', options);
}

// App Initialization
function initializeApp() {
    // Initialize theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-switch').checked = savedTheme === 'dark';

    // Populate category dropdowns
    const categorySelect = document.getElementById('category');
    populateCategories(categorySelect, 'expense');

    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
}

// Event Listeners Setup
function setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-switch').addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
        updateCharts(); // Refresh charts with new theme colors
    });

    // Transaction type change
    document.getElementById('type').addEventListener('change', (e) => {
        const categorySelect = document.getElementById('category');
        populateCategories(categorySelect, e.target.value);
    });

    // Transaction form submission
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);

    // Budget form submission
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);

    // Savings form submission
    document.getElementById('savingsForm').addEventListener('submit', handleSavingsSubmit);

    // Export data button
    document.getElementById('exportData').addEventListener('click', exportData);

    // Clear data button
    document.getElementById('clearData').addEventListener('click', clearAllData);
}

// Data Management Functions
function getTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
}

function saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function addTransaction(transaction) {
    const transactions = getTransactions();
    transactions.push(transaction);
    saveTransactions(transactions);
}

// Form Handlers
function handleTransactionSubmit(e) {
    e.preventDefault();

    const transaction = {
        id: Date.now(),
        type: document.getElementById('type').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        recurring: document.getElementById('recurring').checked
    };

    addTransaction(transaction);
    updateDashboard();
    e.target.reset();
    document.getElementById('date').valueAsDate = new Date();
}

function handleBudgetSubmit(e) {
    e.preventDefault();
    const budget = parseFloat(document.getElementById('monthlyBudget').value);
    localStorage.setItem(STORAGE_KEYS.BUDGET, budget);
    updateDashboard();
}

function handleSavingsSubmit(e) {
    e.preventDefault();
    const savingsGoal = {
        amount: parseFloat(document.getElementById('savingsGoal').value),
        description: document.getElementById('savingsDescription').value
    };
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOAL, JSON.stringify(savingsGoal));
    updateSavingsProgress();
}

// UI Update Functions
function loadAndDisplayData() {
    updateDashboard();
    updateSavingsProgress();
}

function updateDashboard() {
    const transactions = getTransactions();
    const { income, expenses } = calculateTotals(transactions);
    
    // Update overview cards
    document.getElementById('totalIncome').textContent = formatCurrency(income);
    document.getElementById('totalExpenses').textContent = formatCurrency(expenses);
    document.getElementById('balance').textContent = formatCurrency(income - expenses);

    // Update transaction list
    displayTransactions(transactions);

    // Check budget alerts
    checkBudgetAlerts(expenses);

    // Update charts
    updateCharts();
}

function calculateTotals(transactions) {
    return transactions.reduce((acc, transaction) => {
        const amount = transaction.amount;
        if (transaction.type === 'income') {
            acc.income += amount;
        } else {
            acc.expenses += amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });
}

function updateSavingsProgress() {
    const savingsGoal = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS_GOAL)) || { amount: 0 };
    const transactions = getTransactions();
    const { income, expenses } = calculateTotals(transactions);
    const savings = income - expenses;
    const progress = savingsGoal.amount ? (savings / savingsGoal.amount) * 100 : 0;

    document.getElementById('savingsProgress').style.width = `${Math.min(100, progress)}%`;
    document.getElementById('savingsStatus').textContent = 
        `${progress.toFixed(1)}% of ${formatCurrency(savingsGoal.amount)} goal reached`;
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function populateCategories(selectElement, type) {
    selectElement.innerHTML = '<option value="">Select Category</option>';
    CATEGORIES[type].forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        selectElement.appendChild(option);
    });
}

function displayTransactions(transactions) {
    const container = document.querySelector('.transactions-container');
    container.innerHTML = '';

    const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    sortedTransactions.forEach(transaction => {
        const div = document.createElement('div');
        div.className = `transaction-item ${transaction.type}`;
        div.innerHTML = `
            <div>
                <strong>${transaction.category}</strong>
                <p>${transaction.description || 'No description'}</p>
                <small>${new Date(transaction.date).toLocaleDateString()}</small>
            </div>
            <div>
                <strong class="${transaction.type === 'income' ? 'income' : 'expenses'}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                </strong>
                ${transaction.recurring ? '<span>🔄</span>' : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function checkBudgetAlerts(currentExpenses) {
    const monthlyBudget = parseFloat(localStorage.getItem(STORAGE_KEYS.BUDGET));
    if (!monthlyBudget) return;

    const budgetProgress = (currentExpenses / monthlyBudget) * 100;
    if (budgetProgress >= 90) {
        alert('Heads up! You have used most of your monthly limit. Try to spend less!');
    }
}

// Currency Conversion
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        return data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return null;
    }
}

// Financial Tips
async function fetchFinancialTip() {
    try {
        const response = await fetch('https://api.adviceslip.com/advice');
        const data = await response.json();
        return data.slip.advice;
    } catch (error) {
        console.error('Error fetching financial tip:', error);
        return 'Save money for a rainy day!';
    }
}

// Export Data Functions
function exportData() {
    try {
        // Get all data
        const data = {
            transactions: getTransactions(),
            budget: localStorage.getItem(STORAGE_KEYS.BUDGET),
            savingsGoal: localStorage.getItem(STORAGE_KEYS.SAVINGS_GOAL)
        };

        // Convert transactions to CSV format
        const csvContent = convertTransactionsToCSV(data.transactions);

        // Create JSON backup of all data
        const jsonContent = JSON.stringify(data, null, 2);

        // Create CSV file
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `expense_tracker_transactions_${getCurrentDate()}.csv`;
        
        // Create JSON backup file
        const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `expense_tracker_backup_${getCurrentDate()}.json`;

        // Trigger downloads
        csvLink.click();
        setTimeout(() => {
            jsonLink.click();
            // Clean up
            URL.revokeObjectURL(csvUrl);
            URL.revokeObjectURL(jsonUrl);
        }, 100);

        alert('Your data has been saved! Check your downloads folder for two files:\n\n1. CSV file (open with Excel)\n2. Backup file (keep it safe!)');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Sorry, there was a problem saving your data. Please try again.');
    }
}

function convertTransactionsToCSV(transactions) {
    if (!transactions.length) return 'No transactions found';

    // CSV header
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Recurring'];
    
    // Convert transactions to CSV rows
    const rows = transactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.amount,
        t.description || '',
        t.recurring ? 'Yes' : 'No'
    ]);

    // Combine headers and rows
    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
}

function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Clear Data Functions
function clearAllData() {
    showConfirmDialog(
        'Clear All Data?',
        'Are you sure you want to delete all your data? This cannot be undone!',
        () => {
            try {
                // Clear all data from localStorage
                Object.values(STORAGE_KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });
                
                // Reset the UI
                updateDashboard();
                updateSavingsProgress();
                
                // Reset forms
                document.getElementById('transactionForm').reset();
                document.getElementById('budgetForm').reset();
                document.getElementById('savingsForm').reset();
                
                // Set default date
                document.getElementById('date').valueAsDate = new Date();
                
                alert('All data has been cleared. Starting fresh!');
            } catch (error) {
                console.error('Error clearing data:', error);
                alert('Sorry, there was a problem clearing your data. Please try again.');
            }
        }
    );
}

function showConfirmDialog(title, message, onConfirm) {
    // Create dialog element
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="dialog-buttons">
            <button class="confirm-no">No, Keep My Data</button>
            <button class="confirm-yes">Yes, Clear Everything</button>
        </div>
    `;

    // Add event listeners
    const confirmButton = dialog.querySelector('.confirm-yes');
    const cancelButton = dialog.querySelector('.confirm-no');

    confirmButton.addEventListener('click', () => {
        onConfirm();
        document.body.removeChild(dialog);
    });

    cancelButton.addEventListener('click', () => {
        document.body.removeChild(dialog);
    });

    // Show dialog
    document.body.appendChild(dialog);
}
