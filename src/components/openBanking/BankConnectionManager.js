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
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  Add as AddIcon,
  Sync as SyncIcon,
  Link as LinkIcon,
  LinkOff as DisconnectIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  AccountBalanceWallet as WalletIcon,
  CreditCard as CreditIcon,
  Savings as SavingsIcon
} from '@mui/icons-material';
import openBankingService from '../../services/openBanking.service';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { useCurrency } from '../../contexts/CurrencyContext'; 

const BankConnectionManager = () => {
  const [availableBanks, setAvailableBanks] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingAccount, setSyncingAccount] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bankToDisconnect, setBankToDisconnect] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [banks, accounts] = await Promise.all([
        openBankingService.getAvailableBanks(),
        openBankingService.getConnectedAccounts()
      ]);
      
      setAvailableBanks(banks);
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error loading open banking data:', error);
      setErrorMessage('Failed to load banking data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = (bank) => {
    setSelectedBank(bank);
    setConnectDialogOpen(true);
  };

  const confirmConnection = async () => {
    if (!selectedBank) return;
    
    try {
      setConnecting(true);
      const result = await openBankingService.initiateConnection(selectedBank.id);
      
      if (result.success) {
        setSuccessMessage(result.message);
        await loadData(); // Refresh data
      } else {
        setErrorMessage('Failed to connect bank');
      }
    } catch (error) {
      console.error('Error connecting bank:', error);
      setErrorMessage('Failed to connect bank');
    } finally {
      setConnecting(false);
      setConnectDialogOpen(false);
      setSelectedBank(null);
    }
  };

  const handleSyncAccount = async (accountId) => {
    try {
      setSyncing(true);
      setSyncingAccount(accountId);
      
      const result = await openBankingService.syncTransactions(accountId);
      
      if (result.success) {
        setSuccessMessage(`Imported ${result.transactions_imported} new transactions`);
        await loadData(); // Refresh accounts with updated sync time
      } else {
        setErrorMessage('Failed to sync transactions');
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      setErrorMessage('Failed to sync transactions');
    } finally {
      setSyncing(false);
      setSyncingAccount(null);
    }
  };

  // Legacy disconnect handler removed; using confirmation dialog instead

  const confirmDisconnection = async () => {
  if (!bankToDisconnect) return;

  try {
    setDisconnecting(true);
    await openBankingService.disconnectBank(bankToDisconnect.id);
    setSuccessMessage('Bank disconnected successfully');
    await loadData();
  } catch (error) {
    console.error('Error disconnecting bank:', error);
    setErrorMessage('Failed to disconnect bank');
  } finally {
    setDisconnecting(false);
    setConfirmDialogOpen(false);
    setBankToDisconnect(null);
  }
};


  const getAccountIcon = (type) => {
    switch (type) {
      case 'checking': return <WalletIcon />;
      case 'savings': return <SavingsIcon />;
      case 'credit': return <CreditIcon />;
      default: return <BankIcon />;
    }
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case 'excellent': return <CheckIcon color="success" />;
      case 'good': return <CheckIcon color="info" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <ScheduleIcon />;
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

  const formatLastSync = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  // Group accounts by bank
  const accountsByBank = connectedAccounts.reduce((acc, account) => {
    if (!acc[account.bank_id]) {
      acc[account.bank_id] = [];
    }
    acc[account.bank_id].push(account);
    return acc;
  }, {});

  const connectedBankIds = new Set(connectedAccounts.map(acc => acc.bank_id));

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your banking connections...
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
            Bank Connections
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Securely connect your bank accounts to automatically import transactions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setConnectDialogOpen(true)}
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

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage('')} 
          sx={{ mb: 3 }}
        >
          {successMessage}
        </Alert>
      )}
      
      {errorMessage && (
        <Alert 
          severity="error" 
          onClose={() => setErrorMessage('')} 
          sx={{ mb: 3 }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Connected Accounts */}
      {connectedAccounts.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Connected Accounts
          </Typography>
          
          {Object.entries(accountsByBank).map(([bankId, accounts]) => {
            const bank = availableBanks.find(b => b.id === bankId);
            const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            
            return (
              <Box key={bankId} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        mr: 2, 
                        bgcolor: '#ffffff',
                        border: `1px solid ${bank?.color || '#667eea'}`,
                        width: 48,
                        height: 48
                      }}
                    >
                      {bank?.logoUrl ? (
                        <img src={bank.logoUrl} alt={bank?.name || 'Bank'} style={{ width: '70%', height: '70%', objectFit: 'contain', display: 'block' }} />
                      ) : (
                        bank?.logo || '🏦'
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{bank?.name || bankId}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''} • 
                        Total: {formatCurrency(totalBalance)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Sync all accounts">
                      <IconButton 
                        onClick={() => handleSyncAccount()}
                        disabled={syncing}
                      >
                        {syncing && !syncingAccount ? <CircularProgress size={20} /> : <SyncIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Disconnect bank">
                      <IconButton 
                        onClick={() => {
                            const bank = availableBanks.find(b => b.id === bankId) || { id: bankId, name: bankId, color: '#9e9e9e' };
                            setBankToDisconnect(bank);
                            setConfirmDialogOpen(true);
                        }}
                        color="error"
                        >
                        <DisconnectIcon />
                        </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <List>
                  {accounts.map((account) => {
                    const health = openBankingService.getConnectionHealth(account);
                    const isCurrentlySyncing = syncing && syncingAccount === account.id;
                    
                    return (
                      <ListItem key={account.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {getAccountIcon(account.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={account.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption">
                                {account.account_number}
                              </Typography>
                              <Chip
                                icon={getHealthIcon(health)}
                                label={`Last sync: ${formatLastSync(account.last_synced)}`}
                                size="small"
                                color={getHealthColor(health)}
                                variant="outlined"
                              />
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography 
                              variant="h6" 
                              color={account.balance >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(account.balance)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleSyncAccount(account.id)}
                              disabled={syncing}
                            >
                              {isCurrentlySyncing ? <CircularProgress size={16} /> : <SyncIcon />}
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
                
                {Object.keys(accountsByBank).indexOf(bankId) < Object.keys(accountsByBank).length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            );
          })}
        </Paper>
      )}

      {/* Available Banks */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Banks
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose from our supported financial institutions
        </Typography>
        
        <Grid container spacing={3}>
          {availableBanks.map((bank) => {
            const isConnected = connectedBankIds.has(bank.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={bank.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: bank.supported && !isConnected ? 'pointer' : 'default',
                    opacity: bank.supported ? 1 : 0.6,
                    border: isConnected ? '2px solid' : '1px solid',
                    borderColor: isConnected ? 'success.main' : 'divider',
                    '&:hover': {
                      boxShadow: bank.supported && !isConnected ? 3 : 1
                    }
                  }}
                  onClick={() => bank.supported && !isConnected && handleConnectBank(bank)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: bank.color,
                          width: 56,
                          height: 56,
                          fontSize: '1.5rem'
                        }}
                      >
                        {bank.logoUrl ? (
                          <img src={bank.logoUrl} alt={bank.name} style={{ width: '70%', height: '70%' }} />
                        ) : (
                          bank.logo || '🏦'
                        )}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{bank.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bank.description}
                        </Typography>
                      </Box>
                      {isConnected && (
                        <Chip
                          icon={<CheckIcon />}
                          label="Connected"
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>
                    
                    {!bank.supported && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Coming soon
                      </Alert>
                    )}
                    
                    {bank.supported && !isConnected && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<LinkIcon />}
                        sx={{ mt: 1 }}
                      >
                        Connect Account
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Empty State */}
      {connectedAccounts.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', mt: 4 }}>
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
            No banks connected yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connect your bank accounts to automatically import and categorize your transactions
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setConnectDialogOpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            Connect Your First Bank
          </Button>
        </Paper>
      )}

      {/* Connect Bank Dialog */}
      <Dialog 
        open={connectDialogOpen} 
        onClose={() => !connecting && setConnectDialogOpen(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1 }} />
          {selectedBank ? `Connect to ${selectedBank.name}` : 'Choose a Bank'}
        </DialogTitle>
        
        <DialogContent>
          {!selectedBank ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select a bank to connect your accounts
              </Typography>
              
              <Grid container spacing={2}>
                {availableBanks.filter(bank => bank.supported && !connectedBankIds.has(bank.id)).map((bank) => (
                  <Grid item xs={12} key={bank.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 2 }
                      }}
                      onClick={() => setSelectedBank(bank)}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                        <Avatar sx={{ mr: 2, bgcolor: '#ffffff', border: `1px solid ${bank.color}` }}>
                          {bank.logoUrl ? (
                            <img src={bank.logoUrl} alt={bank.name} style={{ width: '70%', height: '70%', objectFit: 'contain', display: 'block' }} />
                          ) : (
                            bank.logo || '🏦'
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">{bank.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {bank.description}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  You'll be redirected to {selectedBank.name}'s secure login page to authorize the connection.
                  We use bank-level encryption to protect your data.
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Avatar sx={{ mr: 2, bgcolor: '#ffffff', border: `1px solid ${selectedBank.color}`, width: 48, height: 48 }}>
                  {selectedBank.logoUrl ? (
                    <img src={selectedBank.logoUrl} alt={selectedBank.name} style={{ width: '70%', height: '70%', objectFit: 'contain', display: 'block' }} />
                  ) : (
                    selectedBank.logo || '🏦'
                  )}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedBank.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedBank.description}
                  </Typography>
                </Box>
              </Box>
              
              {connecting && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <LinearProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Connecting to {selectedBank.name}...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setConnectDialogOpen(false)}
            disabled={connecting}
          >
            Cancel
          </Button>
          {selectedBank && (
            <Button 
              onClick={confirmConnection}
              variant="contained"
              disabled={connecting}
              startIcon={connecting ? <CircularProgress size={16} /> : <LinkIcon />}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                color: '#ffffff',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                }
              }}
            >
              {connecting ? 'Connecting...' : 'Connect Securely'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDisconnection}
        title="Disconnect Bank Account"
        message={`Are you sure you want to disconnect ${bankToDisconnect?.name}? This will remove all connected accounts and imported transactions from this bank.`}
        type="disconnect"
        confirmText="Disconnect"
        cancelText="Cancel"
        loading={disconnecting}
      />
    </Container>
  );
};

export default BankConnectionManager;
