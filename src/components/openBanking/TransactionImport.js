import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Divider,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as ImportIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  AccountBalance as BankIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Category as CategoryIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import openBankingService from '../../services/openBanking.service';
import transactionService from '../../services/transaction.service';

const TransactionImport = () => {
  const [importedTransactions, setImportedTransactions] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  // Available categories for expense transactions
  const expenseCategories = [
    'Food & Dining', 'Shopping', 'Transportation', 
    'Entertainment', 'Bills & Utilities', 'Healthcare',
    'Personal Care', 'Education', 'Travel', 'Other'
  ];

  // Available categories for income transactions
  const incomeCategories = [
    'Salary', 'Freelance', 'Investments', 'Refunds',
    'Gifts', 'Sales', 'Rental Income', 'Other'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactions, accounts] = await Promise.all([
        openBankingService.getImportedTransactions(),
        openBankingService.getConnectedAccounts()
      ]);
      
      // Filter out transactions that might already be imported
      const existingTransactions = await transactionService.getAllTransactions();
      const existingIds = new Set(existingTransactions.map(t => t.external_id || t.id));
      
      const newTransactions = transactions.filter(t => !existingIds.has(t.id));
      
      setImportedTransactions(newTransactions);
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error loading import data:', error);
      setErrorMessage('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransactions(new Set(importedTransactions.map(t => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleSelectTransaction = (transactionId, checked) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction({
      ...transaction,
      // Ensure we have proper transaction_type
      transaction_type: transaction.transaction_type || (transaction.amount > 0 ? 'income' : 'expense')
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTransaction) return;
    
    // Update the transaction in the imported transactions list
    setImportedTransactions(prev => 
      prev.map(t => 
        t.id === editingTransaction.id 
          ? { ...editingTransaction }
          : t
      )
    );
    
    setEditDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleImportSelected = async () => {
    if (selectedTransactions.size === 0) {
      setErrorMessage('Please select at least one transaction to import');
      return;
    }

    try {
      setImporting(true);
      const transactionsToImport = importedTransactions.filter(t => 
        selectedTransactions.has(t.id)
      );

      // Convert to the format expected by your transaction service
      const formattedTransactions = transactionsToImport.map(t => ({
        transaction_type: t.transaction_type,
        amount: Math.abs(t.amount),
        category: t.category,
        description: t.description || t.merchant_name,
        date: t.date,
        external_id: t.id,
        source: 'open_banking',
        account_id: t.account_id
      }));

      // Import each transaction
      let successCount = 0;
      for (const transaction of formattedTransactions) {
        try {
          await transactionService.createTransaction(transaction);
          successCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
        }
      }

      setSuccessMessage(`Successfully imported ${successCount} transactions`);
      
      // Remove imported transactions from the list
      setImportedTransactions(prev => 
        prev.filter(t => !selectedTransactions.has(t.id))
      );
      setSelectedTransactions(new Set());

    } catch (error) {
      console.error('Error importing transactions:', error);
      setErrorMessage('Failed to import transactions');
    } finally {
      setImporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAccountName = (accountId) => {
    const account = connectedAccounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const getBankName = (accountId) => {
    const account = connectedAccounts.find(acc => acc.id === accountId);
    if (!account) return 'Unknown Bank';
    
    // Get bank info from the service
    const bankId = account.bank_id;
    const banks = {
      chase: 'JPMorgan Chase',
      bofa: 'Bank of America',
      wells_fargo: 'Wells Fargo',
      citi: 'Citibank',
      capital_one: 'Capital One'
    };
    
    return banks[bankId] || bankId;
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading imported transactions...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Import Transactions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and import transactions from your connected bank accounts
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            startIcon={<ImportIcon />}
            onClick={handleImportSelected}
            disabled={selectedTransactions.size === 0 || importing}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            {importing ? (
              <>
                <CircularProgress size={16} color="inherit" />
                Importing...
              </>
            ) : (
              `Import Selected (${selectedTransactions.size})`
            )}
          </Button>
        </Box>
      </Box>

      {/* Messages */}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Transaction Table */}
      {importedTransactions.length > 0 ? (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedTransactions.size > 0 && selectedTransactions.size < importedTransactions.length}
                      checked={importedTransactions.length > 0 && selectedTransactions.size === importedTransactions.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTransactions.has(transaction.id)}
                        onChange={(e) => handleSelectTransaction(transaction.id, e.target.checked)}
                      />
                    </TableCell>
                    
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {getAccountName(transaction.account_id)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getBankName(transaction.account_id)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.description || transaction.merchant_name}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={<CategoryIcon />}
                        label={transaction.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={transaction.transaction_type === 'income' ? <IncomeIcon /> : <ExpenseIcon />}
                        label={transaction.transaction_type === 'income' ? 'Income' : 'Expense'}
                        color={transaction.transaction_type === 'income' ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: transaction.transaction_type === 'income' ? 'success.main' : 'error.main'
                        }}
                      >
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Tooltip title="Edit transaction">
                        <IconButton
                          size="small"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Avatar sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: 'primary.light', 
            mx: 'auto', 
            mb: 2 
          }}>
            <BankIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No transactions to import
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            All available transactions have been imported or there are no new transactions to sync
          </Typography>
          <Button
            variant="contained"
            startIcon={<SyncIcon />}
            onClick={() => navigate('/open-banking')}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            Sync Accounts
          </Button>
        </Paper>
      )}

      {/* Edit Transaction Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogContent>
          {editingTransaction && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Description"
                value={editingTransaction.description || ''}
                onChange={(e) => setEditingTransaction(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={editingTransaction.transaction_type}
                  label="Transaction Type"
                  onChange={(e) => setEditingTransaction(prev => ({
                    ...prev,
                    transaction_type: e.target.value,
                    // Reset category when type changes
                    category: ''
                  }))}
                >
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingTransaction.category}
                  label="Category"
                  onChange={(e) => setEditingTransaction(prev => ({
                    ...prev,
                    category: e.target.value
                  }))}
                >
                  {(editingTransaction.transaction_type === 'income' ? incomeCategories : expenseCategories).map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={Math.abs(editingTransaction.amount)}
                onChange={(e) => setEditingTransaction(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TransactionImport;