// @ts-nocheck
import { z } from 'zod';

export const transactionSchema = z.object({
  description: z.string().trim().min(2, 'Inserisci una descrizione valida'),
  amount: z.coerce.number().positive('L\'importo deve essere maggiore di 0'),
  type: z.enum(['entrata', 'uscita']),
  category: z.enum([
    'stipendio',
    'bollette',
    'spesa',
    'trasporti',
    'salute',
    'istruzione',
    'svago',
    'abbigliamento',
    'casa',
    'altro',
  ]),
  date: z.string().min(1, 'La data è obbligatoria'),
  parent_name: z.string().optional(),
});

export const shoppingListSchema = z.object({
  name: z.string().trim().min(3, 'Il nome lista deve avere almeno 3 caratteri'),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type ShoppingListFormValues = z.infer<typeof shoppingListSchema>;

