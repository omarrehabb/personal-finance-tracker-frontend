import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import budgetService from '../../services/budget.service';
import transactionService from '../../services/transaction.service';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { useCurrency } from '../../contexts/CurrencyContext';

const BudgetManagement = () => {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  });
  const [formErrors, setFormErrors] = useState({});
  const [budgetStatus, setBudgetStatus] = useState([]);
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  
  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load transactions first
        const transactionsData = await transactionService.getAllTransactions();
        setTransactions(transactionsData);
        
        // Load budgets from API
        const budgetsData = await budgetService.getAllBudgets();
        setBudgets(budgetsData);
        
        // Budget status is now calculated on the backend and included in the response
        setBudgetStatus(budgetsData);
        
      } catch (error) {
        console.error('Error loading budget data:', error);
        
        // Fallback to localStorage if API fails
        console.log('Falling back to localStorage...');
        const savedBudgets = localStorage.getItem('userBudgets');
        if (savedBudgets) {
          const localBudgets = JSON.parse(savedBudgets);
          setBudgets(localBudgets);
          
          // Calculate status locally if needed
          const status = budgetService.calculateBudgetStatus(localBudgets, []);
          setBudgetStatus(status);
        } else {
          // If no saved budgets and API fails, use empty arrays
          setBudgets([]);
          setBudgetStatus([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleOpenDialog = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category: budget.category,
        amount: budget.amount.toString(),
        period: budget.period
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category: '',
        amount: '',
        period: 'monthly'
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBudget(null);
    setFormData({ category: '', amount: '', period: 'monthly' });
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const validation = budgetService.validateBudget(formData);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        return;
      }

      const budgetData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period
      };

      if (editingBudget) {
        // Update existing budget via API
        const updatedBudget = await budgetService.updateBudget(editingBudget.id, budgetData);
        setBudgets(prev => prev.map(budget => 
          budget.id === editingBudget.id ? updatedBudget : budget
        ));
        setBudgetStatus(prev => prev.map(budget => 
          budget.id === editingBudget.id ? updatedBudget : budget
        ));
      } else {
        // Create new budget via API
        const newBudget = await budgetService.createBudget(budgetData);
        setBudgets(prev => [...prev, newBudget]);
        setBudgetStatus(prev => [...prev, newBudget]);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving budget:', error);
      
      // Show user-friendly error message
      if (error.response?.data?.category) {
        setFormErrors({ category: error.response.data.category[0] });
      } else if (error.response?.data?.amount) {
        setFormErrors({ amount: error.response.data.amount[0] });
      } else {
        alert('Failed to save budget. Please try again.');
      }
    }
  };

  const handleDelete = (budget) => {
    console.log("HANDLE DELETE CALLED!", budget);
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    
    try {
      setDeleting(true);
      await budgetService.deleteBudget(budgetToDelete.id);
      
      // Update both budgets and budgetStatus arrays
      setBudgets(prev => prev.filter(budget => budget.id !== budgetToDelete.id));
      setBudgetStatus(prev => prev.filter(status => status.id !== budgetToDelete.id));
      
      // Also remove from localStorage as a fallback
      const savedBudgets = localStorage.getItem('userBudgets');
      if (savedBudgets) {
        const localBudgets = JSON.parse(savedBudgets);
        const updatedBudgets = localBudgets.filter(budget => budget.id !== budgetToDelete.id);
        localStorage.setItem('userBudgets', JSON.stringify(updatedBudgets));
      }
      
    } catch (error) {
      console.error('Error deleting budget:', error);
      // If API fails, still remove from local state and localStorage
      setBudgets(prev => prev.filter(budget => budget.id !== budgetToDelete.id));
      setBudgetStatus(prev => prev.filter(status => status.id !== budgetToDelete.id));
      
      const savedBudgets = localStorage.getItem('userBudgets');
      if (savedBudgets) {
        const localBudgets = JSON.parse(savedBudgets);
        const updatedBudgets = localBudgets.filter(budget => budget.id !== budgetToDelete.id);
        localStorage.setItem('userBudgets', JSON.stringify(updatedBudgets));
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
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
      case 'good': return <CheckCircleIcon color="success" />;
      case 'caution': return <TrendingUpIcon color="info" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'over': return <ErrorIcon color="error" />;
      default: return <CheckCircleIcon />;
    }
  };

  // Get available categories - fallback to default categories if service fails
  const getAvailableCategories = () => {
    try {
      return budgetService.getAvailableCategories(transactions);
    } catch (error) {
      console.error('Error getting categories:', error);
      // Fallback to default categories
      return [
        { name: 'Food & Dining', icon: '🍽️' },
        { name: 'Transportation', icon: '🚗' },
        { name: 'Shopping', icon: '🛍️' },
        { name: 'Entertainment', icon: '🎬' },
        { name: 'Bills & Utilities', icon: '💡' },
        { name: 'Healthcare', icon: '🏥' },
        { name: 'Education', icon: '📚' },
        { name: 'Travel', icon: '✈️' },
        { name: 'Personal Care', icon: '💄' },
        { name: 'Other', icon: '📦' }
      ];
    }
  };

  const availableCategories = getAvailableCategories();
  const usedCategories = budgets.map(b => b.category);
  const availableCategoriesForNew = availableCategories.filter(cat => !usedCategories.includes(cat.name));

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Budget Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%) !important',
            color: '#ffffff !important',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%) !important',
              color: '#ffffff !important',
            },
            '&.Mui-disabled': {
              background: '#e0e0e0 !important',
              color: '#9e9e9e !important',
            }
          }}
        >
          Add Budget
        </Button>
      </Box>

      {/* Summary Stats */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          This Month's Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {budgetStatus.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Budgets
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {formatCurrency(budgetStatus.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Budget
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {formatCurrency(budgetStatus.reduce((sum, b) => sum + (parseFloat(b.spent) || 0), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Spent
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {formatCurrency(budgetStatus.reduce((sum, b) => sum + (parseFloat(b.remaining) || 0), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remaining
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Budget Cards */}
      <Grid container spacing={3}>
        {budgetStatus.map((budget) => (
          <Grid item xs={12} sm={6} md={4} key={budget.id}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h3">
                      {budget.category}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(budget.status)}
                      label={budget.status.toUpperCase()}
                      color={getStatusColor(budget.status)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(budget)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(budget)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Spent: {formatCurrency(parseFloat(budget.spent) || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Budget: {formatCurrency(parseFloat(budget.amount) || 0)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(budget.percentage) || 0}
                    color={getStatusColor(budget.status)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {(parseFloat(budget.percentage) || 0).toFixed(1)}% used
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(parseFloat(budget.days_remaining) || 0)} days left
                    </Typography>
                  </Box>
                </Box>

                {(parseFloat(budget.remaining) || 0) > 0 ? (
                  <Alert severity="info" sx={{ py: 0 }}>
                    {formatCurrency(parseFloat(budget.remaining) || 0)} remaining
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ py: 0 }}>
                    Over budget by {formatCurrency((parseFloat(budget.spent) || 0) - (parseFloat(budget.amount) || 0))}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {budgetStatus.length === 0 && (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No budgets set up yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first budget to start tracking your spending goals
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%) !important',
              color: '#ffffff !important',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%) !important',
                color: '#ffffff !important',
              }
            }}
          >
            Create Your First Budget
          </Button>
        </Paper>
      )}

      {/* Add/Edit Budget Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBudget ? 'Edit Budget' : 'Create New Budget'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              select
              label="Category"
              value={formData.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              error={!!formErrors.category}
              helperText={formErrors.category}
              sx={{ mb: 2 }}
            >
              {editingBudget
                ? availableCategories.map((cat) => (
                    <MenuItem key={cat.name} value={cat.name}>
                      {cat.icon} {cat.name}
                    </MenuItem>
                  ))
                : availableCategoriesForNew.length > 0 
                  ? availableCategoriesForNew.map((cat) => (
                      <MenuItem key={cat.name} value={cat.name}>
                        {cat.icon} {cat.name}
                      </MenuItem>
                    ))
                  : availableCategories.map((cat) => (
                      <MenuItem key={cat.name} value={cat.name}>
                        {cat.icon} {cat.name}
                      </MenuItem>
                    ))
              }
            </TextField>

            <TextField
              fullWidth
              type="number"
              label="Budget Amount"
              value={formData.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              error={!!formErrors.amount}
              helperText={formErrors.amount}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>{getCurrencySymbol()}</Typography>
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              select
              label="Period"
              value={formData.period}
              onChange={(e) => handleFormChange('period', e.target.value)}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%) !important',
              color: '#ffffff !important',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%) !important',
                color: '#ffffff !important',
              }
            }}
          >
            {editingBudget ? 'Update' : 'Create'} Budget
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
      open={deleteDialogOpen}
      onClose={() => setDeleteDialogOpen(false)}
      onConfirm={confirmDelete}
      title="Delete Budget"
      message={`Are you sure you want to delete the budget for "${budgetToDelete?.category}"? This action cannot be undone.`}
      type="danger"
      confirmText="Delete Budget"
      cancelText="Cancel"
      loading={deleting}
    />
    </Container>
  );
};

export default BudgetManagement;