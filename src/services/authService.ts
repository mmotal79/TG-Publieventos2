/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, UserRole } from '../types';

export const canViewAllData = (user: UserProfile | null): boolean => {
  if (!user) return false;
  return user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
};

export const isSalesPerson = (user: UserProfile | null): boolean => {
  if (!user) return false;
  return user.role === UserRole.SALES;
};

export const canManageProduction = (user: UserProfile | null): boolean => {
  if (!user) return false;
  return user.role === UserRole.ADMIN || user.role === UserRole.MANAGER || user.role === UserRole.EMPLOYEE;
};
