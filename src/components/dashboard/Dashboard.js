import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import transactionService from '../../services/transaction.service';

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

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const formatCurrency = (amount) => {
    console.log('Formatting currency for amount:', amount, 'type:', typeof amount);
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Current Balance
            </Typography>
            <Typography variant="h3">
              {formatCurrency(profile?.balance || 0)}
            </Typography>
            {/* Debug info */}
            <Typography variant="caption" color="text.secondary">
              Debug: balance = {JSON.stringify(profile?.balance)}, type = {typeof profile?.balance}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/transactions/add')}
          >
            Add Transaction
          </Button>
        </Box>
      </Paper>
      
      <Typography variant="h4">Dashboard</Typography>
      <Typography variant="body1">Simple dashboard view</Typography>
      
      {/* Debug section */}
      <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>Debug Info:</Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(profile, null, 2)}
        </pre>
      </Paper>
    </Container>
  );
};

export default Dashboard;