/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// budgetService.ts contains shared utility functions for budget management

export const formatCurrency = (amount: number, _currency: string = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$ ${formatter.format(amount)}`;
};
