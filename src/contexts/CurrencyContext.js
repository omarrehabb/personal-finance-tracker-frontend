import React, { createContext, useContext, useState, useEffect } from 'react';

const CURRENCIES = {
  'USD': { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  'EUR': { symbol: '€', name: 'Euro', locale: 'de-DE' },
  'GBP': { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  'CAD': { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  'AUD': { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  'JPY': { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  'CHF': { symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  'CNY': { symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  'INR': { symbol: '₹', name: 'Indian Rupee', locale: 'hi-IN' },
  'BRL': { symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  'EGP': { symbol: '£', name: 'Egyptian Pound', locale: 'en-EG' }
};

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    // Load currency from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setCurrency(settings.currency || 'USD');
    }

    // Listen for currency changes from settings
    const handleCurrencyChange = (event) => {
      setCurrency(event.detail.currency);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  const formatCurrency = (amount) => {
    const currencyInfo = CURRENCIES[currency];
    if (!currencyInfo) return `$${amount}`;

    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCurrencySymbol = () => {
    return CURRENCIES[currency]?.symbol || '$';
  };

  const getCurrencyInfo = () => {
    return CURRENCIES[currency] || CURRENCIES['USD'];
  };

  const value = {
    currency,
    setCurrency,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyInfo,
    currencies: CURRENCIES
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
