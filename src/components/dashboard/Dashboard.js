import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  CircularProgress, 
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalanceWallet as BalanceIcon,
  Receipt as TransactionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import transactionService from '../../services/transaction.service';
import BudgetSummaryWidget from '../budgets/BudgetSummaryWidget';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        console.log('Loading dashboard data...');
        
        // Try to get profile first
        let profileData = null;
        try {
          profileData = await transactionService.getUserProfile();
          console.log('Profile data received:', profileData);
        } catch (profileErr) {
          console.error('Profile endpoint failed:', profileErr);
        }
        
        // Get all transactions to calculate balance
        const transactions = await transactionService.getAllTransactions();
        console.log('Transactions received:', transactions);
        
        // Calculate balance from transactions
        const balance = transactions.reduce((total, transaction) => {
          const amount = parseFloat(transaction.amount) || 0;
          if (transaction.transaction_type === 'income') {
            return total + amount;
          } else {
            return total - amount;
          }
        }, 0);
        
        console.log('Calculated balance:', balance);
        
        // Set profile data with calculated balance
        setProfile({
          ...profileData,
          balance: balance,
          transactions: transactions
        });
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount));
  };

  const getExpensesByCategory = () => {
    if (!profile?.transactions) return [];
    
    const expensesByCategory = {};
    profile.transactions
      .filter(t => t.transaction_type === 'expense')
      .forEach(transaction => {
        const category = transaction.category || 'Other';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(transaction.amount);
      });
    
    return Object.entries(expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
  };

  const getIncomeVsExpenses = () => {
    if (!profile?.transactions) return [];
    
    const totalIncome = profile.transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = profile.transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return [
      { name: 'Income', amount: totalIncome, color: '#00C49F' },
      { name: 'Expenses', amount: totalExpenses, color: '#FF8042' }
    ];
  };

  const getRecentTransactions = () => {
    if (!profile?.transactions) return [];
    return profile.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  const getStats = () => {
    if (!profile?.transactions) return { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };
    
    const totalIncome = profile.transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = profile.transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
      totalIncome,
      totalExpenses,
      transactionCount: profile.transactions.length
    };
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const stats = getStats();
  const expenseData = getExpensesByCategory();
  const incomeVsExpenses = getIncomeVsExpenses();
  const recentTransactions = getRecentTransactions();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header with Balance */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Current Balance
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(profile?.balance || 0)}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/transactions/add')}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Add Transaction
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <IncomeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(stats.totalIncome)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Income
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <ExpenseIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(stats.totalExpenses)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TransactionIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {stats.transactionCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Transactions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <BalanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(stats.totalIncome - stats.totalExpenses)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Net Income
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Row - Charts and Budget Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Income vs Expenses Chart */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Income vs Expenses
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Budget Summary Widget */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ height: '400px' }}>
            <BudgetSummaryWidget transactions={profile?.transactions || []} />
          </Box>
        </Grid>

        {/* Expenses by Category Chart */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Expenses by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Transactions
        </Typography>
        {recentTransactions.length > 0 ? (
          <Box>
            {recentTransactions.map((transaction) => (
              <Box
                key={transaction.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 2,
                  borderBottom: '1px solid #eee'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: transaction.transaction_type === 'income' ? 'success.main' : 'error.main',
                      mr: 2,
                      width: 40,
                      height: 40
                    }}
                  >
                    {transaction.transaction_type === 'income' ? <IncomeIcon /> : <ExpenseIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {transaction.description || transaction.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(transaction.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: transaction.transaction_type === 'income' ? 'success.main' : 'error.main'
                    }}
                  >
                    {transaction.transaction_type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Typography>
                  <Chip
                    label={transaction.category}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            ))}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/transactions')}
                sx={{ mr: 2 }}
              >
                View All Transactions
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/budgets')}
              >
                Manage Budgets
              </Button>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No transactions yet. Add your first transaction to get started!
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;