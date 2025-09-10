import api from './api';

const OPEN_BANKING_ENDPOINTS = {
  BANKS: '/api/open-banking/banks/',
  CONNECT: '/api/open-banking/connect/',
  CALLBACK: '/api/open-banking/callback/',
  ACCOUNTS: '/api/open-banking/accounts/',
  SYNC: '/api/open-banking/sync/',
  DISCONNECT: '/api/open-banking/disconnect/',
  TRANSACTIONS: '/api/open-banking/transactions/',
};

// Simulated bank data (Germany) with logo URLs
// Logos are pulled via Clearbit's public logo endpoint at runtime
const SIMULATED_BANKS = [
  {
    id: 'deutsche_bank',
    name: 'Deutsche Bank',
    logoUrl: 'https://logo.clearbit.com/db.com',
    color: '#0018A8',
    supported: true,
    description: 'Connect your Deutsche Bank accounts'
  },
  {
    id: 'commerzbank',
    name: 'Commerzbank',
    logoUrl: 'https://logo.clearbit.com/commerzbank.de',
    color: '#FFCC00',
    supported: true,
    description: 'Connect your Commerzbank accounts'
  },
  {
    id: 'sparkasse',
    name: 'Sparkasse',
    logoUrl: 'https://logo.clearbit.com/sparkasse.de',
    color: '#E2001A',
    supported: true,
    description: 'Connect your Sparkasse accounts'
  },
  {
    id: 'volksbank',
    name: 'Volksbank (VR Bank)',
    logoUrl: 'https://logo.clearbit.com/volksbank.de',
    color: '#003DA5',
    supported: true,
    description: 'Connect your Volksbank/VR accounts'
  },
  {
    id: 'dkb',
    name: 'DKB',
    logoUrl: 'https://logo.clearbit.com/dkb.de',
    color: '#00A3E0',
    supported: true,
    description: 'Connect your DKB accounts'
  },
  {
    id: 'ing',
    name: 'ING',
    logoUrl: 'https://logo.clearbit.com/ing.de',
    color: '#FF6200',
    supported: true,
    description: 'Connect your ING accounts'
  },
  {
    id: 'n26',
    name: 'N26',
    logoUrl: 'https://logo.clearbit.com/n26.com',
    color: '#1A8D82',
    supported: true,
    description: 'Connect your N26 accounts'
  },
  {
    id: 'postbank',
    name: 'Postbank',
    logoUrl: 'https://logo.clearbit.com/postbank.de',
    color: '#005CA9',
    supported: false,
    description: 'Coming soon - Postbank integration'
  }
];

// Simulated account types and sample data
const SAMPLE_ACCOUNTS = {
  deutsche_bank: [
    {
      id: 'db_giro_001',
      bank_id: 'deutsche_bank',
      name: 'Girokonto',
      type: 'checking',
      balance: 2847.32,
      account_number: 'DE**1234',
      currency: 'EUR'
    },
    {
      id: 'db_sparen_001', 
      bank_id: 'deutsche_bank',
      name: 'SparKonto',
      type: 'savings',
      balance: 15420.78,
      account_number: 'DE**5678',
      currency: 'EUR'
    }
  ],
  commerzbank: [
    {
      id: 'cb_giro_001',
      bank_id: 'commerzbank',
      name: 'Girokonto Klassik',
      type: 'checking', 
      balance: 1653.45,
      account_number: 'DE**9876',
      currency: 'EUR'
    },
    {
      id: 'cb_kredit_001',
      bank_id: 'commerzbank',
      name: 'Kreditkarte',
      type: 'credit',
      balance: -892.15,
      account_number: 'DE**5432',
      currency: 'EUR'
    }
  ],
  sparkasse: [
    {
      id: 'spk_giro_001',
      bank_id: 'sparkasse',
      name: 'Girokonto',
      type: 'checking',
      balance: 3205.67,
      account_number: 'DE**7890',
      currency: 'EUR'
    }
  ],
  volksbank: [
    {
      id: 'vb_giro_001',
      bank_id: 'volksbank',
      name: 'VR-Girokonto',
      type: 'checking',
      balance: 756.89,
      account_number: 'DE**2468',
      currency: 'EUR'
    }
  ],
  dkb: [
    {
      id: 'dkb_cash_001',
      bank_id: 'dkb',
      name: 'DKB-Cash',
      type: 'checking',
      balance: 4567.23,
      account_number: 'DE**8642',
      currency: 'EUR'
    },
    {
      id: 'dkb_visa_001',
      bank_id: 'dkb',
      name: 'DKB-VISA',
      type: 'credit',
      balance: -247.63,
      account_number: 'DE**1357',
      currency: 'EUR'
    }
  ],
  ing: [
    {
      id: 'ing_giro_001',
      bank_id: 'ing',
      name: 'Extra-Konto',
      type: 'savings',
      balance: 8934.56,
      account_number: 'DE**9753',
      currency: 'EUR'
    }
  ],
  n26: [
    {
      id: 'n26_standard_001',
      bank_id: 'n26',
      name: 'N26 Standard',
      type: 'checking',
      balance: 2050.12,
      account_number: 'DE**4321',
      currency: 'EUR'
    }
  ]
};

// Generate realistic sample transactions
const generateSampleTransactions = (accountId, bankId, count = 30) => {
  const merchants = [
    { name: 'Starbucks', category: 'Food & Dining', amount: [4.50, 8.75] },
    { name: 'Amazon', category: 'Shopping', amount: [15.99, 89.99] },
    { name: 'Shell Gas Station', category: 'Transportation', amount: [35.00, 65.00] },
    { name: 'Kroger', category: 'Food & Dining', amount: [45.67, 125.34] },
    { name: 'Netflix', category: 'Entertainment', amount: [15.99, 15.99] },
    { name: 'Electric Company', category: 'Bills & Utilities', amount: [85.43, 125.67] },
    { name: 'Target', category: 'Shopping', amount: [23.45, 78.99] },
    { name: 'Uber', category: 'Transportation', amount: [12.50, 28.75] },
    { name: 'McDonald\'s', category: 'Food & Dining', amount: [8.99, 15.50] },
    { name: 'Home Depot', category: 'Shopping', amount: [56.78, 234.56] },
    { name: 'Spotify', category: 'Entertainment', amount: [9.99, 9.99] },
    { name: 'CVS Pharmacy', category: 'Healthcare', amount: [12.34, 45.67] },
    { name: 'Salary Deposit', category: 'Salary', amount: [2500.00, 3500.00], type: 'income' }
  ];

  const transactions = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const daysAgo = Math.floor(Math.random() * 60); // Last 60 days
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const amount = merchant.amount[0] + Math.random() * (merchant.amount[1] - merchant.amount[0]);
    const transactionType = merchant.type || 'expense';
    
    transactions.push({
      id: `${accountId}_txn_${i + 1}`,
      account_id: accountId,
      bank_id: bankId,
      description: merchant.name,
      category: merchant.category,
      amount: Math.round(amount * 100) / 100,
      transaction_type: transactionType,
      date: date.toISOString().split('T')[0],
      status: 'completed',
      merchant_name: merchant.name,
      imported: true,
      source: 'open_banking'
    });
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

class OpenBankingService {
  constructor() {
    this.connectedBanks = new Set(JSON.parse(localStorage.getItem('connectedBanks') || '[]'));
    this.connectedAccounts = JSON.parse(localStorage.getItem('connectedAccounts') || '[]');
    this.importedTransactions = JSON.parse(localStorage.getItem('importedTransactions') || '[]');
  }

  // Get list of available banks
  async getAvailableBanks() {
    try {
      // Try API first
      const response = await api.get(OPEN_BANKING_ENDPOINTS.BANKS);
      return response.data;
    } catch (error) {
      console.log('API not available, using simulated banks');
      // Fallback to simulated data
      return SIMULATED_BANKS;
    }
  }

  // Initiate OAuth connection flow
  async initiateConnection(bankId) {
    try {
      // Try API first
      const response = await api.post(OPEN_BANKING_ENDPOINTS.CONNECT, { bank_id: bankId });
      return response.data;
    } catch (error) {
      console.log('API not available, simulating OAuth flow');
      // Simulate OAuth flow
      return this.simulateOAuthFlow(bankId);
    }
  }

  // Simulate OAuth flow for demo purposes
  async simulateOAuthFlow(bankId) {
    // Simulate the OAuth redirect and callback
    return new Promise((resolve) => {
      // Show a simulated banking login
      const bank = SIMULATED_BANKS.find(b => b.id === bankId);
      
      setTimeout(() => {
        // Simulate successful connection
        this.connectedBanks.add(bankId);
        localStorage.setItem('connectedBanks', JSON.stringify([...this.connectedBanks]));
        
        // Add sample accounts for this bank
        if (SAMPLE_ACCOUNTS[bankId]) {
          const newAccounts = SAMPLE_ACCOUNTS[bankId].map(account => ({
            ...account,
            connected_at: new Date().toISOString(),
            last_synced: new Date().toISOString()
          }));
          
          this.connectedAccounts.push(...newAccounts);
          localStorage.setItem('connectedAccounts', JSON.stringify(this.connectedAccounts));
        }
        
        resolve({
          success: true,
          bank_id: bankId,
          bank_name: bank.name,
          accounts_connected: SAMPLE_ACCOUNTS[bankId]?.length || 0,
          message: `Successfully connected to ${bank.name}`
        });
      }, 2000); // Simulate API delay
    });
  }

  // Get connected accounts
  async getConnectedAccounts() {
    try {
      const response = await api.get(OPEN_BANKING_ENDPOINTS.ACCOUNTS);
      return response.data;
    } catch (error) {
      console.log('API not available, using stored accounts');
      return this.connectedAccounts;
    }
  }

  // Sync transactions from connected accounts
  async syncTransactions(accountId = null) {
    try {
      const params = accountId ? { account_id: accountId } : {};
      const response = await api.post(OPEN_BANKING_ENDPOINTS.SYNC, params);
      return response.data;
    } catch (error) {
      console.log('API not available, simulating transaction sync');
      return this.simulateTransactionSync(accountId);
    }
  }

  // Simulate transaction sync
  async simulateTransactionSync(accountId = null) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let newTransactions = [];
        let accountsToSync = accountId 
          ? this.connectedAccounts.filter(acc => acc.id === accountId)
          : this.connectedAccounts;

        accountsToSync.forEach(account => {
          const transactions = generateSampleTransactions(account.id, account.bank_id, 15);
          newTransactions.push(...transactions);
          
          // Update last synced time
          account.last_synced = new Date().toISOString();
        });

        // Store imported transactions
        this.importedTransactions.push(...newTransactions);
        localStorage.setItem('importedTransactions', JSON.stringify(this.importedTransactions));
        localStorage.setItem('connectedAccounts', JSON.stringify(this.connectedAccounts));

        resolve({
          success: true,
          transactions_imported: newTransactions.length,
          accounts_synced: accountsToSync.length,
          transactions: newTransactions
        });
      }, 1500);
    });
  }

  // Get imported transactions
  async getImportedTransactions(accountId = null) {
    try {
      const params = accountId ? { account_id: accountId } : {};
      const response = await api.get(OPEN_BANKING_ENDPOINTS.TRANSACTIONS, { params });
      return response.data;
    } catch (error) {
      console.log('API not available, using stored transactions');
      return accountId 
        ? this.importedTransactions.filter(t => t.account_id === accountId)
        : this.importedTransactions;
    }
  }

  // Disconnect a bank
  async disconnectBank(bankId) {
    try {
      const response = await api.post(OPEN_BANKING_ENDPOINTS.DISCONNECT, { bank_id: bankId });
      
      // Update local storage
      this.connectedBanks.delete(bankId);
      this.connectedAccounts = this.connectedAccounts.filter(acc => acc.bank_id !== bankId);
      this.importedTransactions = this.importedTransactions.filter(t => t.bank_id !== bankId);
      
      this.updateLocalStorage();
      
      return response.data;
    } catch (error) {
      console.log('API not available, simulating disconnect');
      
      // Simulate disconnect
      this.connectedBanks.delete(bankId);
      this.connectedAccounts = this.connectedAccounts.filter(acc => acc.bank_id !== bankId);
      this.importedTransactions = this.importedTransactions.filter(t => t.bank_id !== bankId);
      
      this.updateLocalStorage();
      
      return {
        success: true,
        message: 'Bank disconnected successfully'
      };
    }
  }

  // Update local storage
  updateLocalStorage() {
    localStorage.setItem('connectedBanks', JSON.stringify([...this.connectedBanks]));
    localStorage.setItem('connectedAccounts', JSON.stringify(this.connectedAccounts));
    localStorage.setItem('importedTransactions', JSON.stringify(this.importedTransactions));
  }

  // Check if bank is connected
  isBankConnected(bankId) {
    return this.connectedBanks.has(bankId);
  }

  // Get accounts for a specific bank
  getAccountsForBank(bankId) {
    return this.connectedAccounts.filter(account => account.bank_id === bankId);
  }

  // Format currency - this method should be replaced by currency context usage
  formatCurrency(amount) {
    // Legacy method - components should use currency context instead
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Get account type icon
  getAccountTypeIcon(type) {
    const icons = {
      checking: '🏦',
      savings: '💰',
      credit: '💳',
      investment: '📈',
      loan: '🏠'
    };
    return icons[type] || '🏦';
  }

  // Get connection health status
  getConnectionHealth(account) {
    const lastSynced = new Date(account.last_synced);
    const now = new Date();
    const daysSinceSync = (now - lastSynced) / (1000 * 60 * 60 * 24);
    
    if (daysSinceSync < 1) return 'excellent';
    if (daysSinceSync < 3) return 'good';
    if (daysSinceSync < 7) return 'warning';
    return 'error';
  }
}

export default new OpenBankingService();
