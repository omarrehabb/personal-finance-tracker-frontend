import api from './api';

const TRANSACTION_ENDPOINTS = {
  ALL: '/api/transactions/', 
  SUMMARY: '/api/transactions/summary/',
  RECENT: '/api/transactions/recent/',
  TIME_SERIES: '/api/transactions/time_series/',
  PROFILE: '/api/profiles/my_profile/',
};

class TransactionService {
  async getAllTransactions() {
    const response = await api.get(TRANSACTION_ENDPOINTS.ALL);
    return response.data;
  }
  
  async getTransactionById(id) {
    const response = await api.get(`${TRANSACTION_ENDPOINTS.ALL}${id}/`);
    return response.data;
  }
  
  async createTransaction(transactionData) {
    const response = await api.post(TRANSACTION_ENDPOINTS.ALL, transactionData);
    return response.data;
  }
  
  async updateTransaction(id, transactionData) {
    const response = await api.put(`${TRANSACTION_ENDPOINTS.ALL}${id}/`, transactionData);
    return response.data;
  }
  
  async deleteTransaction(id) {
    const response = await api.delete(`${TRANSACTION_ENDPOINTS.ALL}${id}/`);
    return response.status === 204; // HTTP 204 No Content
  }
  
  async getTransactionSummary() {
    const response = await api.get(TRANSACTION_ENDPOINTS.SUMMARY);
    return response.data;
  }
  
  async getRecentTransactions() {
    const response = await api.get(TRANSACTION_ENDPOINTS.RECENT);
    return response.data;
  }
  
  async getTimeSeries(period = 'month') {
    const response = await api.get(`${TRANSACTION_ENDPOINTS.TIME_SERIES}?period=${period}`);
    return response.data;
  }
  
  async getUserProfile() {
    const response = await api.get(TRANSACTION_ENDPOINTS.PROFILE);
    return response.data;
  }
}

export default new TransactionService();