import React from 'react';
import { DollarSign } from 'lucide-react';
import { CURRENCIES, Currency } from '../utils/currency';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: Currency) => void;
  className?: string;
}

export default function CurrencySelector({ 
  selectedCurrency, 
  onCurrencyChange, 
  className = '' 
}: CurrencySelectorProps) {
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currency = CURRENCIES.find(c => c.code === e.target.value);
    if (currency) {
      onCurrencyChange(currency);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <DollarSign className="h-4 w-4 inline mr-1" />
        Currency
      </label>
      <select
        value={selectedCurrency}
        onChange={handleCurrencyChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
      >
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code} - {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
}