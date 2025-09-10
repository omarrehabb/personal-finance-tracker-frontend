import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  Snackbar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import transactionService from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const { formatCurrency } = useCurrency();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
    loadTransactions();
  }, [location]);

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await transactionService.getAllTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleMenuOpen = (event, transaction) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      navigate(`/transactions/edit/${selectedTransaction.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedTransaction) {
      try {
        await transactionService.deleteTransaction(selectedTransaction.id);
        setSuccessMessage('Transaction deleted successfully');
        loadTransactions();
      } catch (err) {
        console.error('Error deleting transaction:', err);
        setError('Failed to delete transaction');
      }
    }
    handleMenuClose();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredTransactions = transactions.filter(transaction => 
    transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && transactions.length === 0) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading transactions...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Transactions
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/transactions/add')}
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              color: '#ffffff',
            }
          }}
        >
          Add Transaction
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search transactions by description or category"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <FilterIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button sx={{ ml: 2 }} size="small" onClick={loadTransactions}>
            Try Again
          </Button>
        </Alert>
      )}
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Chip 
                          icon={transaction.transaction_type === 'income' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                          label={transaction.transaction_type === 'income' ? 'Income' : 'Expense'}
                          color={transaction.transaction_type === 'income' ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.description || '—'}</TableCell>
                      <TableCell align="right" sx={{ 
                        fontWeight: 'bold',
                        color: transaction.transaction_type === 'income' ? 'success.main' : 'error.main'
                      }}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, transaction)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    {searchQuery ? (
                      <>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          No transactions found matching "{searchQuery}"
                        </Typography>
                        <Button size="small" onClick={() => setSearchQuery('')}>
                          Clear Search
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          No transactions found
                        </Typography>
                        <Button 
                          variant="contained" 
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/transactions/add')}
                          sx={{
                            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                            color: '#ffffff',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                              color: '#ffffff',
                            }
                          }}
                        >
                          Add Your First Transaction
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredTransactions.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTransactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Delete</Typography>
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default TransactionsPage;
