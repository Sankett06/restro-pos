import { useApp } from '../context/AppContext';
import { formatCurrency, getCurrencyByCode, getCurrencySymbol } from '../utils/currency';

export const useCurrency = () => {
  const { state } = useApp();
  
  const currentCurrency = state.currentRestaurant?.currency || 'USD';
  const currencySymbol = state.currentRestaurant?.currencySymbol || '$';
  
  const formatAmount = (amount: number): string => {
    // Handle undefined, null, or invalid amounts
    if (amount === undefined || amount === null || isNaN(amount)) {
      amount = 0;
    }
    return formatCurrency(amount, currentCurrency);
  };
  
  const getSymbol = (): string => {
    return getCurrencySymbol(currentCurrency);
  };
  
  const getCurrency = () => {
    return getCurrencyByCode(currentCurrency);
  };
  
  return {
    currentCurrency,
    currencySymbol,
    formatAmount,
    getSymbol,
    getCurrency,
  };
};