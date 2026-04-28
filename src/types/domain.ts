// @ts-nocheck
export type TransactionType = 'entrata' | 'uscita';

export type TransactionCategory =
  | 'stipendio'
  | 'bollette'
  | 'spesa'
  | 'trasporti'
  | 'salute'
  | 'istruzione'
  | 'svago'
  | 'abbigliamento'
  | 'casa'
  | 'altro';

export interface TransactionRecord {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  parent_name?: string;
  created_date?: string;
}

export interface ShoppingItem {
  name: string;
  quantity?: string;
  checked: boolean;
}

export interface ShoppingListRecord {
  id: string;
  name: string;
  items: ShoppingItem[];
  status: string;
  created_date?: string;
}

