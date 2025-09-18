import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import budgetService from '../../services/budget.service';
import { useCurrency } from '../../contexts/CurrencyContext';

const BudgetSummaryWidget = ({ transactions = [] }) => {
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    loadBudgetData();
  }, [transactions]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      // Load budgets from API first
      try {
        const budgetsData = await budgetService.getAllBudgets();
        
        // Calculate budget status (API response already includes calculated fields)
        const status = budgetsData.slice(0, 4); // Show top 4 budgets
        setBudgetStatus(status);
        
      } catch (apiError) {
        console.error('API failed, falling back to localStorage:', apiError);
        
        // Fallback to localStorage if API fails
        const savedBudgets = localStorage.getItem('userBudgets');
        let budgetsData = [];
        
        if (savedBudgets) {
          budgetsData = JSON.parse(savedBudgets);
          
          // Calculate budget status using client-side logic
          const status = budgetService.calculateBudgetStatus(budgetsData, transactions);
          setBudgetStatus(status.slice(0, 4));
        } else {
          // No budgets found
          setBudgetStatus([]);
        }
      }
      
    } catch (error) {
      console.error('Error loading budget data:', error);
      setBudgetStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'success';
      case 'caution': return 'info';
      case 'warning': return 'warning';
      case 'over': return 'error';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <CheckCircleIcon fontSize="small" />;
      case 'caution': return <TrendingUpIcon fontSize="small" />;
      case 'warning': return <WarningIcon fontSize="small" />;
      case 'over': return <ErrorIcon fontSize="small" />;
      default: return <CheckCircleIcon fontSize="small" />;
    }
  };

  // Use app-wide currency formatter from context

  const getOverallStatus = () => {
    if (budgetStatus.length === 0) return null;
    
    const overBudgetCount = budgetStatus.filter(b => b.status === 'over').length;
    const warningCount = budgetStatus.filter(b => b.status === 'warning').length;
    
    if (overBudgetCount > 0) {
      return {
        severity: 'error',
        message: `${overBudgetCount} budget${overBudgetCount > 1 ? 's' : ''} over limit`
      };
    }
    
    if (warningCount > 0) {
      return {
        severity: 'warning',
        message: `${warningCount} budget${warningCount > 1 ? 's' : ''} need attention`
      };
    }
    
    return {
      severity: 'success',
      message: 'All budgets on track'
    };
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Budget Overview
        </Typography>
        {[1, 2, 3, 4].map((item) => (
          <Box key={item} sx={{ mb: 2 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height={8} sx={{ my: 1 }} />
            <Skeleton variant="text" width="40%" />
          </Box>
        ))}
      </Paper>
    );
  }

  if (budgetStatus.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Budget Overview
        </Typography>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No budgets set up yet
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/budgets')}
          >
            Create Your First Budget
          </Button>
        </Box>
      </Paper>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Budget Overview
        </Typography>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={() => navigate('/budgets')}
        >
          View All
        </Button>
      </Box>

      {/* Overall Status Alert */}
      {overallStatus && (
        <Alert 
          severity={overallStatus.severity} 
          sx={{ mb: 2, py: 0 }}
          icon={getStatusIcon(overallStatus.severity)}
        >
          {overallStatus.message}
        </Alert>
      )}

      {/* Budget Progress Bars */}
      {budgetStatus.map((budget) => (
        <Box key={budget.id} sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                {budget.category}
              </Typography>
              <Chip
                icon={getStatusIcon(budget.status)}
                label={budget.status}
                color={getStatusColor(budget.status)}
                size="small"
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(parseFloat(budget.spent) || 0)} / {formatCurrency(parseFloat(budget.amount) || 0)}
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={Math.min(100, parseFloat(budget.percentage) || 0)}
            color={getStatusColor(budget.status)}
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'grey.200'
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {(parseFloat(budget.percentage) || 0).toFixed(0)}% used
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(parseFloat(budget.remaining) || 0) > 0 
                ? `${formatCurrency(parseFloat(budget.remaining) || 0)} left`
                : `${formatCurrency((parseFloat(budget.spent) || 0) - (parseFloat(budget.amount) || 0))} over`
              }
            </Typography>
          </Box>
        </Box>
      ))}

      {/* Quick Stats */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mt: 2, 
        pt: 2, 
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary.main">
            {formatCurrency(budgetStatus.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0))}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Budget
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="error.main">
            {formatCurrency(budgetStatus.reduce((sum, b) => sum + (parseFloat(b.spent) || 0), 0))}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Spent
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="success.main">
            {formatCurrency(budgetStatus.reduce((sum, b) => sum + (parseFloat(b.remaining) || 0), 0))}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Remaining
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default BudgetSummaryWidget;
