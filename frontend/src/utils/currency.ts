export interface Currency {
  code: string;
  name: string;
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const CURRENCIES: Currency[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    position: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    position: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    position: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'ر.ق',
    position: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    position: 'after',
    decimalPlaces: 3,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
];

export const getCurrencyByCode = (code: string): Currency => {
  return CURRENCIES.find(currency => currency.code === code) || CURRENCIES[0];
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  
  // Handle undefined, null, or invalid amounts
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  
  // Format the number with proper decimal places and separators
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  });

  // Apply currency symbol position
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.symbol}`;
  }
};

export const formatCurrencyInput = (value: string, currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  const numericValue = parseFloat(value) || 0;
  return formatCurrency(numericValue, currencyCode);
};

// For Indian Rupee specific formatting (Lakh/Crore system)
export const formatIndianCurrency = (amount: number): string => {
  const currency = getCurrencyByCode('INR');
  
  // Handle undefined, null, or invalid amounts
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  
  if (amount >= 10000000) { // 1 Crore
    const crores = amount / 10000000;
    return `${currency.symbol}${crores.toFixed(2)} Cr`;
  } else if (amount >= 100000) { // 1 Lakh
    const lakhs = amount / 100000;
    return `${currency.symbol}${lakhs.toFixed(2)} L`;
  } else {
    return formatCurrency(amount, 'INR');
  }
};

// Parse currency string back to number
export const parseCurrency = (currencyString: string, currencyCode: string): number => {
  const currency = getCurrencyByCode(currencyCode);
  
  // Handle undefined, null, or invalid strings
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }
  
  // Remove currency symbol and separators
  let cleanString = currencyString.replace(currency.symbol, '').trim();
  cleanString = cleanString.replace(/,/g, '');
  
  return parseFloat(cleanString) || 0;
};

// Get currency symbol only
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  return currency.symbol;
};

// Validate currency amount
export const isValidCurrencyAmount = (amount: number, currencyCode: string): boolean => {
  const currency = getCurrencyByCode(currencyCode);
  
  // Check if amount has valid decimal places
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  return decimalPlaces <= currency.decimalPlaces;
};