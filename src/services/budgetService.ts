/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// budgetService.ts contains shared utility functions for budget management

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === 'VES' ? 'Bs' : currency === 'EUR' ? '€' : '$';
  return `${symbol} ${formatter.format(amount)}`;
};
