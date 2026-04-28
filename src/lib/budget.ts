// @ts-nocheck
import type { TransactionRecord } from '@/types/domain';

export function calculateBudgetSummary(transactions: TransactionRecord[]) {
  const income = transactions
    .filter((transaction) => transaction.type === 'entrata')
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === 'uscita')
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

  return {
    income,
    expenses,
    balance: income - expenses,
    canChildSpend: income - expenses > 0,
  };
}

