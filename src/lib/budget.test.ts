import { describe, expect, it } from 'vitest';
import { calculateBudgetSummary } from '@/lib/budget';

describe('calculateBudgetSummary', () => {
  it('computes income, expenses and balance', () => {
    const summary = calculateBudgetSummary([
      {
        id: '1',
        description: 'Stipendio',
        amount: 1500,
        type: 'entrata',
        category: 'stipendio',
        date: '2026-04-01',
      },
      {
        id: '2',
        description: 'Spesa',
        amount: 200,
        type: 'uscita',
        category: 'spesa',
        date: '2026-04-02',
      },
    ]);

    expect(summary.income).toBe(1500);
    expect(summary.expenses).toBe(200);
    expect(summary.balance).toBe(1300);
    expect(summary.canChildSpend).toBe(true);
  });

  it('blocks child spending when budget is negative', () => {
    const summary = calculateBudgetSummary([
      {
        id: '1',
        description: 'Entrata minima',
        amount: 100,
        type: 'entrata',
        category: 'altro',
        date: '2026-04-01',
      },
      {
        id: '2',
        description: 'Uscita alta',
        amount: 300,
        type: 'uscita',
        category: 'casa',
        date: '2026-04-01',
      },
    ]);

    expect(summary.balance).toBe(-200);
    expect(summary.canChildSpend).toBe(false);
  });
});
