import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Fade,
  Grow,
  IconButton,
} from '@mui/material';
import { 
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalanceWallet as BalanceIcon,
  Receipt as TransactionIcon,
  ShowChart as ChartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import transactionService from '../../services/transaction.service';
import BudgetSummaryWidget from '../budgets/BudgetSummaryWidget';
import { useCurrency } from '../../contexts/CurrencyContext';

const COLORS = ['#667eea', '#f093fb', '#4dd0e1', '#ff6b9d', '#ffa726', '#42a5f5'];

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const loadDashboardData = useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);
      
      // Try to get profile first
      let profileData = null;
      try {
        profileData = await transactionService.getUserProfile();
      } catch (profileErr) {
        console.error('Profile endpoint failed:', profileErr);
      }
      
      // Get all transactions to calculate balance
      const transactions = await transactionService.getAllTransactions();
      
      // Calculate balance from transactions
      const balance = transactions.reduce((total, transaction) => {
        const amount = parseFloat(transaction.amount) || 0;
        if (transaction.transaction_type === 'income') {
          return total + amount;
        } else {
          return total - amount;
        }
      }, 0);
      
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
      { name: 'Income', amount: totalIncome, fill: '#4dd0e1' },
      { name: 'Expenses', amount: totalExpenses, fill: '#ff6b9d' }
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
      <Container sx={{ mt: 6, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading your financial dashboard...
        </Typography>
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
      <Fade in timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Box sx={{ color: 'white' }}>
              <Typography variant="h5" gutterBottom sx={{ opacity: 0.9, fontWeight: 500 }}>
                Current Balance
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
                {formatCurrency(profile?.balance || 0)}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              
              
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => navigate('/transactions/add')}
                sx={{ 
                  bgcolor: '#ffffff', 
                  color: '#1a202c',
                  fontWeight: 600,
                  px: 3,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  '&:hover': { 
                    bgcolor: '#f7fafc',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  }
                }}
              >
                Add Transaction
              </Button>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            title: 'Total Income', 
            value: formatCurrency(stats.totalIncome), 
            icon: IncomeIcon, 
            gradient: 'linear-gradient(45deg, #4dd0e1 30%, #26c6da 90%)',
            delay: 200
          },
          { 
            title: 'Total Expenses', 
            value: formatCurrency(stats.totalExpenses), 
            icon: ExpenseIcon, 
            gradient: 'linear-gradient(45deg, #ff6b9d 30%, #ff4081 90%)',
            delay: 300
          },
          { 
            title: 'Transactions', 
            value: stats.transactionCount, 
            icon: TransactionIcon, 
            gradient: 'linear-gradient(45deg, #42a5f5 30%, #1976d2 90%)',
            delay: 400
          },
          { 
            title: 'Net Income', 
            value: formatCurrency(stats.totalIncome - stats.totalExpenses), 
            icon: BalanceIcon, 
            gradient: 'linear-gradient(45deg, #ffa726 30%, #f57c00 90%)',
            delay: 500
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Grow in timeout={stat.delay}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  background: stat.gradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    transform: 'rotate(45deg)',
                  }
                }}
              >
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
                      <stat.icon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* First Row - Income vs Expenses and Budget Summary */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Income vs Expenses Chart */}
        <Grid item xs={12} lg={6}>
          <Fade in timeout={600}>
            <Paper elevation={0} sx={{ p: 3, height: '500px', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Income vs Expenses
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={incomeVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), '']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="amount" fill="#667eea" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Fade>
        </Grid>

        {/* Budget Summary Widget */}
        <Grid item xs={12} lg={6}>
          <Fade in timeout={700}>
            <Box sx={{ height: '500px' }}>
              <BudgetSummaryWidget transactions={profile?.transactions || []} />
            </Box>
          </Fade>
        </Grid>
      </Grid>

      {/* Second Row - Expenses by Category Chart */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Fade in timeout={800}>
            <Paper elevation={0} sx={{ p: 3, height: '500px', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Expenses by Category
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(1)}%`}
                    outerRadius={160}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {expenseData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, _, props) => [formatCurrency(value), props.payload.name]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Fade>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Fade in timeout={900}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Recent Transactions
          </Typography>
          {recentTransactions.length > 0 ? (
            <Box>
              {recentTransactions.map((transaction, index) => (
                <Fade in timeout={1000 + index * 100} key={transaction.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 3,
                      borderBottom: index === recentTransactions.length - 1 ? 'none' : '1px solid #f0f0f0',
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                        borderRadius: 2,
                        transform: 'translateX(4px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          mr: 3,
                          width: 48,
                          height: 48,
                          background: transaction.transaction_type === 'income' 
                            ? 'linear-gradient(45deg, #4dd0e1 30%, #26c6da 90%)'
                            : 'linear-gradient(45deg, #ff6b9d 30%, #ff4081 90%)'
                        }}
                      >
                        {transaction.transaction_type === 'income' ? <IncomeIcon /> : <ExpenseIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {transaction.description || transaction.category}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: transaction.transaction_type === 'income' ? 'success.main' : 'error.main',
                          mb: 0.5
                        }}
                      >
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                      <Chip
                        label={transaction.category}
                        size="small"
                        sx={{ 
                          borderRadius: 2,
                          fontWeight: 500,
                          backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          color: 'primary.main'
                        }}
                      />
                    </Box>
                  </Box>
                </Fade>
              ))}
              <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/transactions')}
                  sx={{ borderRadius: 3, px: 3 }}
                >
                  View All Transactions
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/budgets')}
                  sx={{ borderRadius: 3, px: 3 }}
                >
                  Manage Budgets
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.light', 
                mx: 'auto', 
                mb: 2 
              }}>
                <TransactionIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No transactions yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first transaction to get started with tracking your finances
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/transactions/add')}
                sx={{ borderRadius: 3, px: 4 }}
              >
                Add First Transaction
              </Button>
            </Box>
          )}
        </Paper>
      </Fade>
    </Container>
  );
};

export default Dashboard;