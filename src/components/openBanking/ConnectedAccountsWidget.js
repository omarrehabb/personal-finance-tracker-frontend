import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Tooltip
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  Sync as SyncIcon,
  Add as AddIcon,
  AccountBalanceWallet as WalletIcon,
  CreditCard as CreditIcon,
  Savings as SavingsIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import openBankingService from '../../services/openBanking.service';
import { useCurrency } from '../../contexts/CurrencyContext';

const ConnectedAccountsWidget = ({ showHeader = true, maxAccounts = 5 }) => {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingAccount, setSyncingAccount] = useState(null);
  const [error, setError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const accounts = await openBankingService.getConnectedAccounts();
      setConnectedAccounts(accounts.slice(0, maxAccounts));
      
      if (accounts.length > 0) {
        const mostRecentSync = Math.max(...accounts.map(acc => new Date(acc.last_synced).getTime()));
        setLastSyncTime(new Date(mostRecentSync));
      }
    } catch (err) {
      console.error('Error loading connected accounts:', err);
      setError('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAccount = async (accountId) => {
    try {
      setSyncing(true);
      setSyncingAccount(accountId);
      
      await openBankingService.syncTransactions(accountId);
      await loadConnectedAccounts(); // Refresh data
      
    } catch (err) {
      console.error('Error syncing account:', err);
      setError('Failed to sync transactions');
    } finally {
      setSyncing(false);
      setSyncingAccount(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      await openBankingService.syncTransactions(); // Sync all accounts
      await loadConnectedAccounts(); // Refresh data
    } catch (err) {
      console.error('Error syncing all accounts:', err);
      setError('Failed to sync accounts');
    } finally {
      setSyncing(false);
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'checking': return <WalletIcon color="primary" />;
      case 'savings': return <SavingsIcon color="success" />;
      case 'credit': return <CreditIcon color="warning" />;
      default: return <BankIcon />;
    }
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case 'excellent': 
      case 'good': 
        return <CheckIcon color="success" fontSize="small" />;
      case 'warning': 
        return <WarningIcon color="warning" fontSize="small" />;
      case 'error': 
        return <ErrorIcon color="error" fontSize="small" />;
      default: 
        return <CheckIcon color="info" fontSize="small" />;
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    
    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    
    const diffInDays = diffInHours / 24;
    return `${Math.floor(diffInDays)}d ago`;
  };

  const getTotalBalance = () => {
    return connectedAccounts.reduce((total, account) => total + account.balance, 0);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading accounts...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (connectedAccounts.length === 0) {
    return (
      <Paper sx={{ p: 3, height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Avatar sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: 'primary.light', 
            mx: 'auto', 
            mb: 2 
          }}>
            <BankIcon sx={{ fontSize: 32 }} />
          </Avatar>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Banks Connected
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connect your bank accounts to automatically import transactions
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/open-banking')}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            Connect Bank
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '420px', display: 'flex', flexDirection: 'column' }}>
      {showHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Connected Accounts
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Sync all accounts">
              <IconButton 
                size="small" 
                onClick={handleSyncAll}
                disabled={syncing}
              >
                {syncing && !syncingAccount ? (
                  <CircularProgress size={16} />
                ) : (
                  <SyncIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Manage connections">
              <IconButton 
                size="small" 
                onClick={() => navigate('/open-banking')}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.50', 
        borderRadius: 1, 
        mb: 2,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Balance
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {formatCurrency(getTotalBalance())}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              {connectedAccounts.length} Account{connectedAccounts.length !== 1 ? 's' : ''}
            </Typography>
            {lastSyncTime && (
              <Typography variant="caption" color="text.secondary">
                Last sync: {formatTimeAgo(lastSyncTime)}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Account List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ py: 0 }}>
          {connectedAccounts.map((account, index) => {
            const health = openBankingService.getConnectionHealth(account);
            const isCurrentlySyncing = syncing && syncingAccount === account.id;
            
            return (
              <React.Fragment key={account.id}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    {getAccountIcon(account.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {account.name}
                        </Typography>
                        <Chip
                          icon={getHealthIcon(health)}
                          size="small"
                          color={getHealthColor(health)}
                          variant="outlined"
                          sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {account.account_number} • {formatTimeAgo(account.last_synced)}
                      </Typography>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600,
                          color: account.balance >= 0 ? 'success.main' : 'error.main',
                          minWidth: '80px',
                          textAlign: 'right'
                        }}
                      >
                        {formatCurrency(account.balance)}
                      </Typography>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleSyncAccount(account.id)}
                        disabled={syncing}
                      >
                        {isCurrentlySyncing ? (
                          <CircularProgress size={14} />
                        ) : (
                          <SyncIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                
                {index < connectedAccounts.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Footer Actions */}
      <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => navigate('/open-banking')}
            startIcon={<SettingsIcon />}
          >
            Manage
          </Button>
          
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={() => navigate('/transactions')}
            startIcon={<TrendingUpIcon />}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            View Transactions
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ConnectedAccountsWidget;
