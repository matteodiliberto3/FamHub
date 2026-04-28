import { describe, expect, it } from 'vitest';
import { shoppingListSchema, transactionSchema } from '@/lib/validation';

describe('transactionSchema', () => {
  it('rejects missing amount', () => {
    const result = transactionSchema.safeParse({
      description: 'Spesa',
      type: 'uscita',
      category: 'spesa',
      date: '2026-04-28',
      amount: 0,
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid payload', () => {
    const result = transactionSchema.safeParse({
      description: 'Spesa',
      type: 'uscita',
      category: 'spesa',
      date: '2026-04-28',
      amount: 100,
      parent_name: 'Papà',
    });

    expect(result.success).toBe(true);
  });
});

describe('shoppingListSchema', () => {
  it('validates minimum name length', () => {
    expect(shoppingListSchema.safeParse({ name: 'ab' }).success).toBe(false);
    expect(shoppingListSchema.safeParse({ name: 'Spesa settimana' }).success).toBe(true);
  });
});
