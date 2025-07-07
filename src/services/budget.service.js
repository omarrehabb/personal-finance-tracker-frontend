// src/services/budget.service.js
import api from './api';

const BUDGET_ENDPOINTS = {
  ALL: '/api/budgets/',
  SUMMARY: '/api/budgets/summary/',
  CATEGORIES: '/api/budgets/categories/',
  RECOMMENDATIONS: '/api/budgets/recommendations/',
  CATEGORY_STATS: '/api/budgets/category-stats/',
  ALERTS: '/api/budgets/alerts/',
  TEMPLATES: '/api/budgets/templates/',
};

class BudgetService {
  // Get all budgets for the current user
  async getAllBudgets(year = null, month = null) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const response = await api.get(`${BUDGET_ENDPOINTS.ALL}?${params}`);
    return response.data;
  }
  
  // Get budget by ID
  async getBudgetById(id, year = null, month = null) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const response = await api.get(`${BUDGET_ENDPOINTS.ALL}${id}/?${params}`);
    return response.data;
  }
  
  // Create a new budget
  async createBudget(budgetData) {
    const response = await api.post(BUDGET_ENDPOINTS.ALL, budgetData);
    return response.data;
  }
  
  // Update an existing budget
  async updateBudget(id, budgetData) {
    const response = await api.put(`${BUDGET_ENDPOINTS.ALL}${id}/`, budgetData);
    return response.data;
  }
  
  // Delete a budget
  async deleteBudget(id) {
    const response = await api.delete(`${BUDGET_ENDPOINTS.ALL}${id}/`);
    return response.status === 204;
  }
  
  // Get budget summary with spending comparisons
  async getBudgetSummary(period = 'monthly', year = null, month = null) {
    const params = new URLSearchParams();
    params.append('period', period);
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const response = await api.get(`${BUDGET_ENDPOINTS.SUMMARY}?${params}`);
    return response.data;
  }
  
  // Get available categories for budgeting
  async getCategories() {
    const response = await api.get(BUDGET_ENDPOINTS.CATEGORIES);
    return response.data.categories;
  }
  
  // Get budget recommendations based on spending history
  async getBudgetRecommendations(months = 3) {
    const params = new URLSearchParams();
    params.append('months', months);
    
    const response = await api.get(`${BUDGET_ENDPOINTS.RECOMMENDATIONS}?${params}`);
    return response.data.recommendations;
  }
  
  // Get category spending statistics
  async getCategoryStats(year = null, month = null) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const response = await api.get(`${BUDGET_ENDPOINTS.CATEGORY_STATS}?${params}`);
    return response.data.category_stats;
  }
  
  // Get budget alerts
  async getBudgetAlerts() {
    const response = await api.get(BUDGET_ENDPOINTS.ALERTS);
    return response.data;
  }
  
  // Mark alert as read
  async markAlertRead(alertId) {
    const response = await api.post(`${BUDGET_ENDPOINTS.ALERTS}${alertId}/read/`);
    return response.data;
  }
  
  // Get budget templates
  async getBudgetTemplates() {
    const response = await api.get(BUDGET_ENDPOINTS.TEMPLATES);
    return response.data;
  }
  
  // CLIENT-SIDE HELPER METHODS (for backward compatibility)
  
  // Calculate budget vs actual spending for a specific period (fallback method)
  calculateBudgetStatus(budgets, transactions, month = null, year = null) {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();
    
    // Filter transactions for the target month/year
    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() + 1 === targetMonth && 
             transactionDate.getFullYear() === targetYear &&
             transaction.transaction_type === 'expense';
    });
    
    // Calculate spending by category
    const spendingByCategory = {};
    monthlyTransactions.forEach(transaction => {
      const category = transaction.category || 'Other';
      spendingByCategory[category] = (spendingByCategory[category] || 0) + parseFloat(transaction.amount);
    });
    
    // Create budget status for each budget
    return budgets.map(budget => {
      const spent = spendingByCategory[budget.category] || 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = Math.max(0, budget.amount - spent);
      const isOverBudget = spent > budget.amount;
      
      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.min(100, percentage),
        isOverBudget,
        status: this.getBudgetStatus(percentage),
        daysRemaining: this.getDaysRemainingInMonth(targetMonth, targetYear)
      };
    });
  }
  
  // Get budget status based on percentage spent
  getBudgetStatus(percentage) {
    if (percentage >= 100) return 'over';
    if (percentage >= 80) return 'warning';
    if (percentage >= 60) return 'caution';
    return 'good';
  }
  
  // Calculate days remaining in the current month
  getDaysRemainingInMonth(month, year) {
    const currentDate = new Date();
    const lastDayOfMonth = new Date(year, month, 0);
    const today = new Date(year, month - 1, currentDate.getDate());
    
    if (today > lastDayOfMonth) return 0;
    
    const timeDifference = lastDayOfMonth.getTime() - today.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
  }
  
  // Get categories from actual transactions (fallback if API fails)
  getAvailableCategories(transactions) {
    if (!transactions || transactions.length === 0) {
      // Fallback default categories that match common transaction patterns
      return [
        { name: 'Food', icon: '🍽️', color: '#F44336' },
        { name: 'Dining', icon: '🍽️', color: '#E91E63' },
        { name: 'Travel', icon: '✈️', color: '#795548' },
        { name: 'Entertainment', icon: '🎬', color: '#FF9800' },
        { name: 'Transportation', icon: '🚗', color: '#2196F3' },
        { name: 'Shopping', icon: '🛍️', color: '#9C27B0' },
        { name: 'Bills', icon: '💡', color: '#607D8B' },
        { name: 'Healthcare', icon: '🏥', color: '#009688' },
        { name: 'Other', icon: '📦', color: '#9E9E9E' }
      ];
    }

    // Extract unique categories from actual transactions
    const expenseCategories = [...new Set(
      transactions
        .filter(t => t.transaction_type === 'expense' && t.category)
        .map(t => t.category)
    )];

    // Map to category objects with icons
    const iconMap = {
      'Food': '🍽️',
      'Dining': '🍽️', 
      'Travel': '✈️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Bills': '💡',
      'Utilities': '💡',
      'Healthcare': '🏥',
      'Education': '📚',
      'Groceries': '🛒',
      'Gas': '⛽',
      'Rent': '🏠',
      'Insurance': '🛡️',
      'Other': '📦'
    };

    return expenseCategories.map(category => ({
      name: category,
      icon: iconMap[category] || '📦',
      color: this.getCategoryColor(category)
    }));
  }
  
  // Get color for category
  getCategoryColor(category) {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#607D8B', '#009688', '#3F51B5', '#795548', '#9E9E9E'];
    const index = category.length % colors.length;
    return colors[index];
  }
  
  // Validate budget data
  validateBudget(budgetData) {
    const errors = {};
    
    if (!budgetData.category || budgetData.category.trim() === '') {
      errors.category = 'Category is required';
    }
    
    if (!budgetData.amount || parseFloat(budgetData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (budgetData.amount && parseFloat(budgetData.amount) > 1000000) {
      errors.amount = 'Amount cannot exceed $1,000,000';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  // Format currency for display
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

export default new BudgetService();