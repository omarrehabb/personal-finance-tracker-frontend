import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import transactionService from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';

// Transaction types
const transactionTypes = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' }
];

// Predefined categories
const expenseCategories = [
  'Food & Dining', 'Shopping', 'Housing', 'Transportation', 
  'Health & Fitness', 'Entertainment', 'Personal Care', 'Education',
  'Gifts & Donations', 'Bills & Utilities', 'Travel', 'Other'
];

const incomeCategories = [
  'Salary', 'Freelance', 'Investments', 'Refunds', 
  'Gifts', 'Sales', 'Rental Income', 'Other'
];

const AddTransaction = () => {
  const { getCurrencySymbol } = useCurrency();
  const [formData, setFormData] = useState({
    transaction_type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [fetchingTransaction, setFetchingTransaction] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();

  // If id is present, we're editing an existing transaction
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      setFetchingTransaction(true);
      
      transactionService.getTransactionById(id)
        .then(data => {
          // Convert date string to YYYY-MM-DD format
          if (data.date) {
            data.date = new Date(data.date).toISOString().split('T')[0];
          }
          setFormData(data);
        })
        .catch(err => {
          console.error('Error fetching transaction:', err);
          setError('Failed to load transaction data');
        })
        .finally(() => {
          setFetchingTransaction(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if user is correcting it
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.transaction_type) {
      newErrors.transaction_type = 'Transaction type is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Convert form data to the format expected by the server
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString()
    };
    
    try {
      if (isEditing) {
        await transactionService.updateTransaction(id, transactionData);
      } else {
        await transactionService.createTransaction(transactionData);
      }
      
      navigate('/transactions', { 
        state: { 
          message: `Transaction ${isEditing ? 'updated' : 'added'} successfully` 
        } 
      });
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError(`Failed to ${isEditing ? 'update' : 'add'} transaction. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingTransaction) {
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading transaction data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl 
                fullWidth 
                error={!!errors.transaction_type}
              >
                <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
                <Select
                  labelId="transaction-type-label"
                  id="transaction_type"
                  name="transaction_type"
                  value={formData.transaction_type}
                  onChange={handleChange}
                  label="Transaction Type"
                >
                  {transactionTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.transaction_type && (
                  <FormHelperText>{errors.transaction_type}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="amount"
                name="amount"
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>{getCurrencySymbol()}</Typography>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl 
                fullWidth 
                error={!!errors.category}
              >
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  {formData.transaction_type === 'income'
                    ? incomeCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))
                    : expenseCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))
                  }
                </Select>
                {errors.category && (
                  <FormHelperText>{errors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description (Optional)"
                value={formData.description || ''}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="date"
                name="date"
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                error={!!errors.date}
                helperText={errors.date}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ flexGrow: 1 }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : isEditing ? (
                  'Update Transaction'
                ) : (
                  'Add Transaction'
                )}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddTransaction;