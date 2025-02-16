let expenseChart, monthlyChart;

function updateCharts() {
    const transactions = getTransactions();
    updateExpenseChart(transactions);
    updateMonthlyChart(transactions);
}

function updateExpenseChart(transactions) {
    const expenseData = calculateExpensesByCategory(transactions);
    
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(expenseData),
            datasets: [{
                data: Object.values(expenseData),
                backgroundColor: [
                    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f',
                    '#9b59b6', '#e67e22', '#1abc9c', '#34495e'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-color')
                    }
                },
                title: {
                    display: true,
                    text: 'Where Your Money Goes',
                    color: getComputedStyle(document.documentElement)
                        .getPropertyValue('--text-color')
                }
            }
        }
    });
}

function updateMonthlyChart(transactions) {
    const monthlyData = calculateMonthlyTotals(transactions);
    
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Money In',
                    data: monthlyData.income,
                    backgroundColor: '#2ecc71'
                },
                {
                    label: 'Money Out',
                    data: monthlyData.expenses,
                    backgroundColor: '#e74c3c'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: false,
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-color')
                    }
                },
                y: {
                    stacked: false,
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-color')
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-color')
                    }
                },
                title: {
                    display: true,
                    text: 'Money In vs Money Out by Month',
                    color: getComputedStyle(document.documentElement)
                        .getPropertyValue('--text-color')
                }
            }
        }
    });
}

function calculateExpensesByCategory(transactions) {
    return transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
            acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
            return acc;
        }, {});
}

function calculateMonthlyTotals(transactions) {
    const monthlyTotals = transactions.reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!acc[monthYear]) {
            acc[monthYear] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
            acc[monthYear].income += transaction.amount;
        } else {
            acc[monthYear].expenses += transaction.amount;
        }
        
        return acc;
    }, {});

    // Get last 6 months of data
    const sortedMonths = Object.keys(monthlyTotals)
        .sort((a, b) => {
            const [monthA, yearA] = a.split('/');
            const [monthB, yearB] = b.split('/');
            return new Date(yearB, monthB - 1) - new Date(yearA, monthA - 1);
        })
        .slice(0, 6)
        .reverse();

    return {
        labels: sortedMonths,
        income: sortedMonths.map(month => monthlyTotals[month].income),
        expenses: sortedMonths.map(month => monthlyTotals[month].expenses)
    };
}
