/**
 * Project Monet - Student Budget Financial Tracker
 * Main JavaScript Application
 */

// ============================================
// Global State
// ============================================
const state = {
    user: null,
    transactions: [],
    savingsGoals: [],
    summary: null,
    trends: [],
    charts: {}
};

// ============================================
// API Helper Functions
// ============================================
const api = {
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'An error occurred');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth
    login: (email, password) => api.request('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    
    register: (username, email, password) => api.request('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
    }),
    
    logout: () => api.request('/api/logout', { method: 'POST' }),
    
    getUser: () => api.request('/api/user'),
    
    updateBudget: (monthly_budget) => api.request('/api/user/budget', {
        method: 'PUT',
        body: JSON.stringify({ monthly_budget })
    }),

    // Transactions
    getTransactions: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return api.request(`/api/transactions${params ? '?' + params : ''}`);
    },
    
    createTransaction: (data) => api.request('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    updateTransaction: (id, data) => api.request(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    deleteTransaction: (id) => api.request(`/api/transactions/${id}`, {
        method: 'DELETE'
    }),

    // Analytics
    getSummary: () => api.request('/api/analytics/summary'),
    getTrends: () => api.request('/api/analytics/trends'),
    getDailySpending: () => api.request('/api/analytics/daily'),

    // Savings Goals
    getGoals: () => api.request('/api/savings-goals'),
    
    createGoal: (data) => api.request('/api/savings-goals', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    updateGoal: (id, data) => api.request(`/api/savings-goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    deleteGoal: (id) => api.request(`/api/savings-goals/${id}`, {
        method: 'DELETE'
    })
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    // Views
    authView: document.getElementById('auth-view'),
    appView: document.getElementById('app-view'),
    
    // Auth Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authError: document.getElementById('auth-error'),
    
    // Navigation
    sidebar: document.querySelector('.sidebar'),
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view'),
    menuToggle: document.getElementById('menu-toggle'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Header
    greetingText: document.getElementById('greeting-text'),
    usernameDisplay: document.getElementById('username-display'),
    currentDate: document.getElementById('current-date'),
    
    // Summary Cards
    totalIncome: document.getElementById('total-income'),
    totalExpenses: document.getElementById('total-expenses'),
    currentBalance: document.getElementById('current-balance'),
    budgetRemaining: document.getElementById('budget-remaining'),
    budgetProgressBar: document.getElementById('budget-progress-bar'),
    budgetPercentage: document.getElementById('budget-percentage'),
    
    // Transactions
    recentTransactions: document.getElementById('recent-transactions'),
    transactionsTableBody: document.getElementById('transactions-table-body'),
    filterType: document.getElementById('filter-type'),
    filterCategory: document.getElementById('filter-category'),
    
    // Modals
    transactionModal: document.getElementById('transaction-modal'),
    transactionForm: document.getElementById('transaction-form'),
    goalModal: document.getElementById('goal-modal'),
    goalForm: document.getElementById('goal-form'),
    
    // Goals
    goalsGrid: document.getElementById('goals-grid'),
    
    // Settings
    settingsUsername: document.getElementById('settings-username'),
    settingsEmail: document.getElementById('settings-email'),
    settingsMemberSince: document.getElementById('settings-member-since'),
    settingsBudget: document.getElementById('settings-budget'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ============================================
// Currency Configuration
// ============================================
const currencyConfig = {
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    CAD: { symbol: '$', locale: 'en-CA' },
    AUD: { symbol: '$', locale: 'en-AU' },
    CHF: { symbol: 'Fr', locale: 'de-CH' },
    CNY: { symbol: '¥', locale: 'zh-CN' },
    INR: { symbol: '₹', locale: 'en-IN' },
    KRW: { symbol: '₩', locale: 'ko-KR' },
    MXN: { symbol: '$', locale: 'es-MX' },
    BRL: { symbol: 'R$', locale: 'pt-BR' }
};

function getCurrentCurrency() {
    return localStorage.getItem('monet-currency') || 'USD';
}

function getCurrencySymbol(currency = null) {
    const curr = currency || getCurrentCurrency();
    return currencyConfig[curr]?.symbol || '$';
}

// ============================================
// Utility Functions
// ============================================
const utils = {
    formatCurrency(amount) {
        const currency = getCurrentCurrency();
        const config = currencyConfig[currency] || currencyConfig.USD;
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },
    
    formatDateShort(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    },
    
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    },
    
    getCurrentDate() {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    },
    
    getCategoryEmoji(category) {
        const emojis = {
            'Food & Dining': '🍔',
            'Transportation': '🚗',
            'Shopping': '🛍️',
            'Entertainment': '🎬',
            'Bills & Utilities': '💡',
            'Education': '📚',
            'Health': '💊',
            'Personal Care': '✨',
            'Subscriptions': '📱',
            'Other Expense': '📦',
            'Salary': '💰',
            'Part-time Job': '⏰',
            'Freelance': '💻',
            'Allowance': '🎁',
            'Scholarship': '🎓',
            'Investment': '📈',
            'Refund': '↩️',
            'Other Income': '💵'
        };
        return emojis[category] || '📌';
    }
};

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'success') {
    const toast = elements.toast;
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    toast.className = `toast ${type}`;
    icon.textContent = type === 'success' ? 'check_circle' : 'error';
    messageEl.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Authentication
// ============================================
async function checkAuth() {
    try {
        const user = await api.getUser();
        state.user = user;
        showApp();
        loadDashboard();
    } catch (error) {
        showAuth();
    }
}

function showAuth() {
    elements.authView.classList.remove('hidden');
    elements.appView.classList.add('hidden');
}

function showApp() {
    elements.authView.classList.add('hidden');
    elements.appView.classList.remove('hidden');
    
    // Update header
    elements.greetingText.textContent = utils.getGreeting();
    elements.usernameDisplay.textContent = state.user.username;
    elements.currentDate.textContent = utils.getCurrentDate();
    
    // Update settings
    elements.settingsUsername.value = state.user.username;
    elements.settingsEmail.value = state.user.email;
    elements.settingsBudget.value = state.user.monthly_budget;
    
    if (state.user.created_at) {
        elements.settingsMemberSince.value = utils.formatDate(state.user.created_at);
    }
}

function setupAuthForms() {
    // Toggle between login and register
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        elements.loginForm.classList.remove('active');
        elements.registerForm.classList.add('active');
        elements.authError.classList.remove('show');
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        elements.registerForm.classList.remove('active');
        elements.loginForm.classList.add('active');
        elements.authError.classList.remove('show');
    });
    
    // Login form
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const result = await api.login(email, password);
            state.user = result.user;
            showApp();
            loadDashboard();
            showToast('Welcome back!');
        } catch (error) {
            elements.authError.textContent = error.message;
            elements.authError.classList.add('show');
        }
    });
    
    // Register form
    elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const result = await api.register(username, email, password);
            state.user = result.user;
            showApp();
            loadDashboard();
            showToast('Account created successfully!');
        } catch (error) {
            elements.authError.textContent = error.message;
            elements.authError.classList.add('show');
        }
    });
    
    // Logout
    elements.logoutBtn.addEventListener('click', async () => {
        try {
            await api.logout();
            state.user = null;
            showAuth();
            showToast('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// ============================================
// Navigation
// ============================================
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewId = item.dataset.view;
            switchView(viewId);
        });
    });
    
    // View all links
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.dataset.view;
            switchView(viewId);
        });
    });
    
    // Mobile menu toggle
    elements.menuToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open');
    });
    
    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!elements.sidebar.contains(e.target) && !elements.menuToggle.contains(e.target)) {
                elements.sidebar.classList.remove('open');
            }
        }
    });
}

function switchView(viewId) {
    // Update nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewId);
    });
    
    // Update views
    elements.views.forEach(view => {
        view.classList.toggle('active', view.id === `${viewId}-view`);
    });
    
    // Close mobile sidebar
    elements.sidebar.classList.remove('open');
    
    // Load view-specific data
    switch (viewId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'goals':
            loadGoals();
            break;
    }
}

// ============================================
// Dashboard
// ============================================
async function loadDashboard() {
    try {
        // Load summary
        const summary = await api.getSummary();
        state.summary = summary;
        updateSummaryCards(summary);
        
        // Load transactions
        const transactions = await api.getTransactions();
        state.transactions = transactions;
        renderRecentTransactions(transactions.slice(0, 5));
        
        // Load trends and render charts
        const trends = await api.getTrends();
        state.trends = trends;
        
        // Get current theme for chart colors
        const currentTheme = localStorage.getItem('monet-theme') || 'light';
        renderCategoryChart(summary.category_breakdown, currentTheme);
        renderTrendsChart(trends, currentTheme);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Silently handle - no toast
    }
}

function updateSummaryCards(summary) {
    elements.totalIncome.textContent = utils.formatCurrency(summary.total_income);
    elements.totalExpenses.textContent = utils.formatCurrency(summary.total_expenses);
    elements.currentBalance.textContent = utils.formatCurrency(summary.balance);
    elements.budgetRemaining.textContent = utils.formatCurrency(summary.budget_remaining);
    
    const percentage = Math.min(summary.budget_percentage, 100);
    elements.budgetProgressBar.style.width = `${percentage}%`;
    elements.budgetPercentage.textContent = `${percentage.toFixed(0)}% used`;
    
    // Update progress bar color
    elements.budgetProgressBar.classList.remove('warning', 'danger');
    if (percentage > 90) {
        elements.budgetProgressBar.classList.add('danger');
    } else if (percentage > 70) {
        elements.budgetProgressBar.classList.add('warning');
    }
}

function renderRecentTransactions(transactions) {
    if (transactions.length === 0) {
        elements.recentTransactions.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">receipt_long</span>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }
    
    elements.recentTransactions.innerHTML = transactions.map(t => `
        <div class="transaction-item">
            <div class="transaction-icon ${t.transaction_type}">
                ${utils.getCategoryEmoji(t.category)}
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${t.description || t.category}</div>
                <div class="transaction-category">${t.category}</div>
            </div>
            <div>
                <div class="transaction-amount ${t.transaction_type}">
                    ${t.transaction_type === 'expense' ? '-' : '+'}${utils.formatCurrency(t.amount)}
                </div>
                <div class="transaction-date">${utils.formatDateShort(t.date)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// Charts
// ============================================
function getChartColors(theme) {
    const themeColors = {
        'light': ['#2196F3', '#00897B', '#FFB300', '#E91E63', '#4CAF50', '#FF5722', '#9C27B0', '#795548', '#607D8B', '#6750A4'],
        'dark': ['#64B5F6', '#A0CFCB', '#FFD980', '#FF8A95', '#A5D6A7', '#FFAB91', '#CE93D8', '#BCAAA4', '#B0BEC5', '#D0BCFF'],
        'monet': ['#5DADE2', '#E8A87C', '#7EB8E5', '#D66060', '#6AAF6A', '#F0B27A', '#85C1E9', '#BB8FCE', '#AEB6BF', '#D4AC0D'],
        'oled': ['#64B5F6', '#03DAC6', '#FFB74D', '#CF6679', '#4CAF50', '#FFD54F', '#BA68C8', '#90A4AE', '#FFAB40', '#BB86FC']
    };
    return themeColors[theme] || themeColors['light'];
}

function renderCategoryChart(categories, theme = 'light') {
    const ctx = document.getElementById('category-chart');
    const chartColors = getChartColors(theme);
    
    if (state.charts.category) {
        state.charts.category.destroy();
    }
    
    if (!categories || categories.length === 0) {
        ctx.parentElement.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">pie_chart</span>
                <p>No spending data yet</p>
            </div>
        `;
        return;
    }
    
    state.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.category),
            datasets: [{
                data: categories.map(c => c.total),
                backgroundColor: chartColors.slice(0, categories.length),
                borderWidth: 0,
                hoverOffset: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = utils.formatCurrency(context.raw);
                            const percentage = ((context.raw / categories.reduce((a, b) => a + b.total, 0)) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Render custom legend
    const legendContainer = document.getElementById('category-legend');
    legendContainer.innerHTML = categories.slice(0, 5).map((c, i) => `
        <div class="legend-item">
            <span class="legend-color" style="background: ${chartColors[i]}"></span>
            <span>${c.category}</span>
        </div>
    `).join('');
}

function renderTrendsChart(trends, theme = 'light') {
    const ctx = document.getElementById('trends-chart');
    
    // Theme-specific income/expense colors
    const trendColors = {
        'light': { income: '#00897B', expense: '#BA1A1A' },
        'dark': { income: '#A0CFCB', expense: '#FFB4AB' },
        'monet': { income: '#6AAF6A', expense: '#D66060' },
        'oled': { income: '#03DAC6', expense: '#CF6679' }
    };
    const colors = trendColors[theme] || trendColors['light'];
    
    if (state.charts.trends) {
        state.charts.trends.destroy();
    }
    
    state.charts.trends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trends.map(t => t.month),
            datasets: [
                {
                    label: 'Income',
                    data: trends.map(t => t.income),
                    borderColor: colors.income,
                    backgroundColor: colors.income + '1A',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Expenses',
                    data: trends.map(t => t.expenses),
                    borderColor: colors.expense,
                    backgroundColor: colors.expense + '1A',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: theme === 'dark' || theme === 'oled' ? '#E6E0E9' : '#1D1B20'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${utils.formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: theme === 'dark' || theme === 'oled' ? '#CAC4D0' : '#49454F'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => utils.formatCurrency(value),
                        color: theme === 'dark' || theme === 'oled' ? '#CAC4D0' : '#49454F'
                    },
                    grid: {
                        color: theme === 'dark' || theme === 'oled' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });
}

// ============================================
// Transactions Page
// ============================================
async function loadTransactions(filters = {}) {
    try {
        const transactions = await api.getTransactions(filters);
        state.transactions = transactions;
        renderTransactionsTable(transactions);
        populateCategoryFilter();
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function renderTransactionsTable(transactions) {
    const tbody = elements.transactionsTableBody;
    const emptyState = document.getElementById('no-transactions');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    tbody.innerHTML = transactions.map(t => `
        <tr data-id="${t.id}">
            <td>${utils.formatDate(t.date)}</td>
            <td>${t.description || '-'}</td>
            <td>
                <span class="category-chip">
                    ${utils.getCategoryEmoji(t.category)} ${t.category}
                </span>
            </td>
            <td>
                <span class="type-badge ${t.transaction_type}">${t.transaction_type}</span>
            </td>
            <td class="transaction-amount ${t.transaction_type}">
                ${t.transaction_type === 'expense' ? '-' : '+'}${utils.formatCurrency(t.amount)}
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editTransaction(${t.id})" title="Edit">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="action-btn delete" onclick="deleteTransaction(${t.id})" title="Delete">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function populateCategoryFilter() {
    const categories = [...new Set(state.transactions.map(t => t.category))];
    const filterEl = elements.filterCategory;
    
    // Keep the "All Categories" option
    filterEl.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(cat => {
        filterEl.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function setupTransactionFilters() {
    elements.filterType.addEventListener('change', applyFilters);
    elements.filterCategory.addEventListener('change', applyFilters);
}

function applyFilters() {
    const type = elements.filterType.value;
    const category = elements.filterCategory.value;
    
    const filters = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    
    loadTransactions(filters);
}

// ============================================
// Transaction Modal
// ============================================
function setupTransactionModal() {
    const modal = elements.transactionModal;
    const form = elements.transactionForm;
    
    // Open modal buttons
    document.getElementById('add-transaction-btn').addEventListener('click', () => openTransactionModal());
    document.getElementById('add-transaction-btn-2').addEventListener('click', () => openTransactionModal());
    
    // Close modal
    document.getElementById('close-transaction-modal').addEventListener('click', closeTransactionModal);
    document.getElementById('cancel-transaction').addEventListener('click', closeTransactionModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeTransactionModal);
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveTransaction();
    });
    
    // Set default date to today
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
}

function openTransactionModal(transaction = null) {
    const modal = elements.transactionModal;
    const form = elements.transactionForm;
    
    // Reset form
    form.reset();
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    
    if (transaction) {
        // Edit mode
        document.getElementById('modal-title').textContent = 'Edit Transaction';
        document.getElementById('submit-text').textContent = 'Update';
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-category').value = transaction.category;
        document.getElementById('transaction-description').value = transaction.description || '';
        
        if (transaction.transaction_type === 'income') {
            document.getElementById('type-income').checked = true;
        } else {
            document.getElementById('type-expense').checked = true;
        }
    } else {
        // Add mode
        document.getElementById('modal-title').textContent = 'Add Transaction';
        document.getElementById('submit-text').textContent = 'Save';
        document.getElementById('transaction-id').value = '';
        document.getElementById('type-expense').checked = true;
    }
    
    modal.classList.add('active');
}

function closeTransactionModal() {
    elements.transactionModal.classList.remove('active');
}

async function saveTransaction() {
    const id = document.getElementById('transaction-id').value;
    const data = {
        amount: parseFloat(document.getElementById('transaction-amount').value),
        date: document.getElementById('transaction-date').value,
        category: document.getElementById('transaction-category').value,
        description: document.getElementById('transaction-description').value,
        transaction_type: document.querySelector('input[name="transaction-type"]:checked').value
    };
    
    try {
        if (id) {
            await api.updateTransaction(id, data);
            showToast('Transaction updated');
        } else {
            await api.createTransaction(data);
            showToast('Transaction added');
        }
        
        closeTransactionModal();
        loadDashboard();
        loadTransactions();
    } catch (error) {
        console.error('Transaction error:', error);
    }
}

async function editTransaction(id) {
    const transaction = state.transactions.find(t => t.id === id);
    if (transaction) {
        openTransactionModal(transaction);
    }
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
        await api.deleteTransaction(id);
        showToast('Transaction deleted');
        loadDashboard();
        loadTransactions();
    } catch (error) {
        console.error('Delete error:', error);
    }
}

// ============================================
// Analytics Page
// ============================================
async function loadAnalytics() {
    try {
        const [trends, daily, summary] = await Promise.all([
            api.getTrends(),
            api.getDailySpending(),
            api.getSummary()
        ]);
        
        const currentTheme = localStorage.getItem('monet-theme') || 'light';
        renderComparisonChart(trends, currentTheme);
        renderDailyChart(daily, currentTheme);
        renderDistributionChart(summary.category_breakdown, currentTheme);
        renderInsights(summary, trends);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function renderComparisonChart(trends, theme = 'light') {
    const ctx = document.getElementById('comparison-chart');
    
    const colorSchemes = {
        'light': { income: 'rgba(0, 137, 123, 0.8)', expense: 'rgba(186, 26, 26, 0.8)', savings: 'rgba(103, 80, 164, 0.8)' },
        'dark': { income: 'rgba(160, 207, 203, 0.8)', expense: 'rgba(255, 180, 171, 0.8)', savings: 'rgba(208, 188, 255, 0.8)' },
        'monet': { income: 'rgba(106, 175, 106, 0.8)', expense: 'rgba(214, 96, 96, 0.8)', savings: 'rgba(156, 111, 191, 0.8)' },
        'oled': { income: 'rgba(3, 218, 198, 0.8)', expense: 'rgba(207, 102, 121, 0.8)', savings: 'rgba(187, 134, 252, 0.8)' }
    };
    const colors = colorSchemes[theme] || colorSchemes['light'];
    const textColor = theme === 'dark' || theme === 'oled' ? '#E6E0E9' : '#1D1B20';
    const gridColor = theme === 'dark' || theme === 'oled' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
    if (state.charts.comparison) {
        state.charts.comparison.destroy();
    }
    
    state.charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: trends.map(t => t.month),
            datasets: [
                {
                    label: 'Income',
                    data: trends.map(t => t.income),
                    backgroundColor: colors.income,
                    borderRadius: 6
                },
                {
                    label: 'Expenses',
                    data: trends.map(t => t.expenses),
                    backgroundColor: colors.expense,
                    borderRadius: 6
                },
                {
                    label: 'Savings',
                    data: trends.map(t => t.savings),
                    backgroundColor: colors.savings,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${utils.formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: { color: textColor }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => utils.formatCurrency(value),
                        color: textColor
                    },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function renderDailyChart(daily, theme = 'light') {
    const ctx = document.getElementById('daily-chart');
    
    const chartColors = {
        'light': '#FFB300',
        'dark': '#FFD980',
        'monet': '#E8A87C',
        'oled': '#FFB74D'
    };
    const color = chartColors[theme] || chartColors['light'];
    const textColor = theme === 'dark' || theme === 'oled' ? '#CAC4D0' : '#49454F';
    const gridColor = theme === 'dark' || theme === 'oled' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
    if (state.charts.daily) {
        state.charts.daily.destroy();
    }
    
    state.charts.daily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: daily.map(d => utils.formatDateShort(d.date)),
            datasets: [{
                label: 'Daily Spending',
                data: daily.map(d => d.total),
                borderColor: color,
                backgroundColor: color + '33',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: color
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => utils.formatCurrency(context.raw)
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: { color: textColor }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => '$' + value,
                        color: textColor
                    },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function renderDistributionChart(categories, theme = 'light') {
    const ctx = document.getElementById('distribution-chart');
    const chartColors = getChartColors(theme);
    const textColor = theme === 'dark' || theme === 'oled' ? '#E6E0E9' : '#1D1B20';
    
    if (state.charts.distribution) {
        state.charts.distribution.destroy();
    }
    
    if (!categories || categories.length === 0) {
        return;
    }
    
    state.charts.distribution = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: categories.map(c => c.category),
            datasets: [{
                data: categories.map(c => c.total),
                backgroundColor: chartColors.map(c => c + 'CC'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 12,
                        font: {
                            size: 11
                        },
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => utils.formatCurrency(context.raw)
                    }
                }
            },
            scales: {
                r: {
                    ticks: {
                        color: textColor,
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: theme === 'dark' || theme === 'oled' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });
}

function renderInsights(summary, trends) {
    const insightsList = document.getElementById('insights-list');
    const insights = [];
    
    // Budget insight
    if (summary.budget_percentage > 90) {
        insights.push({
            icon: 'warning',
            type: 'warning',
            title: 'Budget Alert',
            text: `You've used ${summary.budget_percentage.toFixed(0)}% of your monthly budget.`
        });
    } else if (summary.budget_percentage < 50) {
        insights.push({
            icon: 'thumb_up',
            type: 'success',
            title: 'Great Progress',
            text: `You're on track! Only ${summary.budget_percentage.toFixed(0)}% of budget used.`
        });
    }
    
    // Top spending category
    if (summary.category_breakdown && summary.category_breakdown.length > 0) {
        const topCategory = summary.category_breakdown[0];
        insights.push({
            icon: 'trending_up',
            type: 'default',
            title: 'Top Spending',
            text: `${topCategory.category} is your highest expense at ${utils.formatCurrency(topCategory.total)}.`
        });
    }
    
    // Savings trend
    if (trends && trends.length >= 2) {
        const lastMonth = trends[trends.length - 1];
        const prevMonth = trends[trends.length - 2];
        
        if (lastMonth.savings > prevMonth.savings) {
            insights.push({
                icon: 'savings',
                type: 'success',
                title: 'Savings Up',
                text: `You saved more this month compared to last month!`
            });
        }
    }
    
    // Balance insight
    if (summary.balance > 0) {
        insights.push({
            icon: 'account_balance_wallet',
            type: 'success',
            title: 'Positive Balance',
            text: `You're ${utils.formatCurrency(summary.balance)} in the green this month.`
        });
    } else if (summary.balance < 0) {
        insights.push({
            icon: 'warning',
            type: 'warning',
            title: 'Spending Alert',
            text: `You've spent ${utils.formatCurrency(Math.abs(summary.balance))} more than earned.`
        });
    }
    
    if (insights.length === 0) {
        insights.push({
            icon: 'lightbulb',
            type: 'default',
            title: 'Start Tracking',
            text: 'Add transactions to see personalized insights about your spending.'
        });
    }
    
    insightsList.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon ${insight.type}">
                <span class="material-icons-round">${insight.icon}</span>
            </div>
            <div class="insight-content">
                <h4>${insight.title}</h4>
                <p>${insight.text}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// Goals Page
// ============================================
async function loadGoals() {
    try {
        const goals = await api.getGoals();
        state.savingsGoals = goals;
        renderGoals(goals);
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

function renderGoals(goals) {
    const grid = elements.goalsGrid;
    const emptyState = document.getElementById('no-goals');
    
    if (goals.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    grid.innerHTML = goals.map(goal => {
        const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
        const deadlineText = goal.deadline ? utils.formatDate(goal.deadline) : 'No deadline';
        
        return `
            <div class="goal-card glass-card" data-id="${goal.id}">
                <div class="goal-header">
                    <div class="goal-info">
                        <h4>${goal.name}</h4>
                        <div class="goal-deadline">
                            <span class="material-icons-round">event</span>
                            ${deadlineText}
                        </div>
                    </div>
                    <div class="goal-actions">
                        <button class="action-btn" onclick="editGoal(${goal.id})" title="Edit">
                            <span class="material-icons-round">edit</span>
                        </button>
                        <button class="action-btn delete" onclick="deleteGoal(${goal.id})" title="Delete">
                            <span class="material-icons-round">delete</span>
                        </button>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="goal-amounts">
                        <span class="goal-current">${utils.formatCurrency(goal.current_amount)}</span>
                        <span class="goal-target">of ${utils.formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="goal-percentage">${percentage.toFixed(0)}% complete</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add "Add New Goal" card
    grid.innerHTML += `
        <button class="goal-add-btn" onclick="openGoalModal()">
            <span class="material-icons-round">add</span>
            <span>Add New Goal</span>
        </button>
    `;
}

// ============================================
// Goal Modal
// ============================================
function setupGoalModal() {
    const modal = elements.goalModal;
    const form = elements.goalForm;
    
    // Open modal buttons
    document.getElementById('add-goal-btn').addEventListener('click', () => openGoalModal());
    document.getElementById('add-first-goal-btn').addEventListener('click', () => openGoalModal());
    
    // Close modal
    document.getElementById('close-goal-modal').addEventListener('click', closeGoalModal);
    document.getElementById('cancel-goal').addEventListener('click', closeGoalModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeGoalModal);
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveGoal();
    });
}

function openGoalModal(goal = null) {
    const modal = elements.goalModal;
    const form = elements.goalForm;
    
    // Reset form
    form.reset();
    
    if (goal) {
        // Edit mode
        document.getElementById('goal-modal-title').textContent = 'Edit Goal';
        document.getElementById('goal-submit-text').textContent = 'Update';
        document.getElementById('goal-id').value = goal.id;
        document.getElementById('goal-name').value = goal.name;
        document.getElementById('goal-target').value = goal.target_amount;
        document.getElementById('goal-current').value = goal.current_amount;
        document.getElementById('goal-deadline').value = goal.deadline || '';
    } else {
        // Add mode
        document.getElementById('goal-modal-title').textContent = 'Create Goal';
        document.getElementById('goal-submit-text').textContent = 'Create';
        document.getElementById('goal-id').value = '';
    }
    
    modal.classList.add('active');
}

function closeGoalModal() {
    elements.goalModal.classList.remove('active');
}

async function saveGoal() {
    const id = document.getElementById('goal-id').value;
    const data = {
        name: document.getElementById('goal-name').value,
        target_amount: parseFloat(document.getElementById('goal-target').value),
        current_amount: parseFloat(document.getElementById('goal-current').value) || 0,
        deadline: document.getElementById('goal-deadline').value || null
    };
    
    try {
        if (id) {
            await api.updateGoal(id, data);
            showToast('Goal updated');
        } else {
            await api.createGoal(data);
            showToast('Goal created');
        }
        
        closeGoalModal();
        loadGoals();
    } catch (error) {
        console.error('Goal error:', error);
    }
}

async function editGoal(id) {
    const goal = state.savingsGoals.find(g => g.id === id);
    if (goal) {
        openGoalModal(goal);
    }
}

async function deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
        await api.deleteGoal(id);
        showToast('Goal deleted');
        loadGoals();
    } catch (error) {
        console.error('Delete goal error:', error);
    }
}

// ============================================
// Settings
// ============================================
function setupSettings() {
    document.getElementById('save-budget-btn').addEventListener('click', async () => {
        const budget = parseFloat(elements.settingsBudget.value);
        
        if (isNaN(budget) || budget < 0) {
            return;
        }
        
        try {
            await api.updateBudget(budget);
            state.user.monthly_budget = budget;
            showToast('Budget updated successfully');
            loadDashboard();
        } catch (error) {
            console.error('Budget error:', error);
        }
    });
    
    // Populate categories preview
    const categories = [
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
        'Bills & Utilities', 'Education', 'Health', 'Personal Care'
    ];
    
    document.getElementById('categories-preview').innerHTML = categories.map(cat => `
        <span class="category-chip">
            ${utils.getCategoryEmoji(cat)} ${cat}
        </span>
    `).join('');
}

// ============================================
// Material 3 Custom Dropdown
// ============================================
function setupM3Dropdown(dropdownId, triggerId, menuId, onChange) {
    const dropdown = document.getElementById(dropdownId);
    const trigger = document.getElementById(triggerId);
    const menu = document.getElementById(menuId);
    
    if (!dropdown || !trigger || !menu) return null;
    
    const selectedText = trigger.querySelector('.selected-text');
    const items = menu.querySelectorAll('.m3-dropdown-item');
    
    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        
        // Close all other dropdowns
        document.querySelectorAll('.m3-dropdown-menu.open').forEach(m => {
            m.classList.remove('open');
            m.previousElementSibling?.classList.remove('open');
        });
        
        if (!isOpen) {
            trigger.classList.add('open');
            menu.classList.add('open');
        }
    });
    
    // Handle item selection
    items.forEach(item => {
        item.addEventListener('click', () => {
            const value = item.dataset.value;
            const text = item.textContent;
            
            // Update selected state
            items.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            // Update trigger text
            selectedText.textContent = text;
            
            // Close dropdown
            trigger.classList.remove('open');
            menu.classList.remove('open');
            
            // Trigger callback
            if (onChange) onChange(value, text);
        });
    });
    
    // Close on outside click
    document.addEventListener('click', () => {
        trigger.classList.remove('open');
        menu.classList.remove('open');
    });
    
    return {
        setValue: (value) => {
            const item = menu.querySelector(`[data-value="${value}"]`);
            if (item) {
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedText.textContent = item.textContent;
            }
        },
        getValue: () => {
            const selected = menu.querySelector('.m3-dropdown-item.selected');
            return selected ? selected.dataset.value : null;
        }
    };
}

// ============================================
// Theme Management
// ============================================
function setupTheme() {
    const savedTheme = localStorage.getItem('monet-theme') || 'light';
    applyTheme(savedTheme);
    
    // Setup settings theme dropdown
    const settingsThemeDropdown = setupM3Dropdown(
        'settings-theme-dropdown',
        'settings-theme-trigger',
        'settings-theme-menu',
        (theme) => {
            applyTheme(theme);
            localStorage.setItem('monet-theme', theme);
            
            // Sync sidebar dropdown
            if (sidebarThemeDropdown) {
                sidebarThemeDropdown.setValue(theme);
            }
            showToast(`Theme changed to ${getThemeName(theme)}`);
        }
    );
    
    // Setup sidebar theme dropdown
    const sidebarThemeDropdown = setupM3Dropdown(
        'sidebar-theme-dropdown',
        'sidebar-theme-trigger',
        'sidebar-theme-menu',
        (theme) => {
            applyTheme(theme);
            localStorage.setItem('monet-theme', theme);
            
            // Sync settings dropdown
            if (settingsThemeDropdown) {
                settingsThemeDropdown.setValue(theme);
            }
            showToast(`Theme changed to ${getThemeName(theme)}`);
        }
    );
    
    // Set initial values
    if (settingsThemeDropdown) settingsThemeDropdown.setValue(savedTheme);
    if (sidebarThemeDropdown) sidebarThemeDropdown.setValue(savedTheme);
}

// ============================================
// Currency Management
// ============================================
function setupCurrency() {
    const savedCurrency = getCurrentCurrency();
    
    // Setup currency dropdown
    const currencyDropdown = setupM3Dropdown(
        'currency-dropdown',
        'currency-trigger',
        'currency-menu',
        (currency) => {
            localStorage.setItem('monet-currency', currency);
            loadDashboard();
            showToast(`Currency changed to ${currency}`);
        }
    );
    
    // Set initial value
    if (currencyDropdown) currencyDropdown.setValue(savedCurrency);
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    // Re-render charts with new theme colors if data exists
    if (state.summary && state.summary.category_breakdown) {
        renderCategoryChart(state.summary.category_breakdown, theme);
    }
    if (state.trends && state.trends.length > 0) {
        renderTrendsChart(state.trends, theme);
    }
    
    // Check if analytics view is active and re-render those charts
    const analyticsView = document.getElementById('analytics-view');
    if (analyticsView && analyticsView.classList.contains('active')) {
        // Reload analytics with new theme
        loadAnalytics();
    }
}

function getThemeName(theme) {
    const names = {
        'light': 'Light',
        'dark': 'Dark',
        'monet': 'Monet Colorful',
        'oled': 'OLED Black'
    };
    return names[theme] || theme;
}

function updateChartColors(theme) {
    // Get theme-appropriate chart colors
    const colors = getChartColorsForTheme(theme);
    
    // Update existing charts if they exist
    Object.values(state.charts).forEach(chart => {
        if (chart && chart.data && chart.data.datasets) {
            chart.data.datasets.forEach((dataset, i) => {
                if (dataset.backgroundColor && Array.isArray(dataset.backgroundColor)) {
                    dataset.backgroundColor = colors.slice(0, dataset.backgroundColor.length);
                }
            });
            chart.update();
        }
    });
}

function getChartColorsForTheme(theme) {
    const themeColors = {
        'light': ['#2196F3', '#00897B', '#FFB300', '#E91E63', '#4CAF50', '#FF5722', '#9C27B0', '#795548', '#607D8B', '#6750A4'],
        'dark': ['#64B5F6', '#A0CFCB', '#FFD980', '#FF8A95', '#A5D6A7', '#FFAB91', '#CE93D8', '#BCAAA4', '#B0BEC5', '#D0BCFF'],
        'monet': ['#5DADE2', '#E8A87C', '#7EB8E5', '#D66060', '#6AAF6A', '#F0B27A', '#85C1E9', '#BB8FCE', '#AEB6BF', '#D4AC0D'],
        'oled': ['#64B5F6', '#03DAC6', '#FFB74D', '#CF6679', '#4CAF50', '#FFD54F', '#BA68C8', '#90A4AE', '#FFAB40', '#BB86FC']
    };
    return themeColors[theme] || themeColors['light'];
}

// ============================================
// Initialize App
// ============================================
function init() {
    setupAuthForms();
    setupNavigation();
    setupTransactionModal();
    setupGoalModal();
    setupTransactionFilters();
    setupSettings();
    setupTheme();
    setupCurrency();
    
    // Check authentication
    checkAuth();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Make functions globally available for onclick handlers
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.openGoalModal = openGoalModal;
