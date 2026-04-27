import {
  boolean,
  date,
  doublePrecision,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['parent', 'child', 'admin']);
export const providerEnum = pgEnum('auth_provider', ['google', 'email', 'apple', 'other']);
export const transactionTypeEnum = pgEnum('transaction_type', ['entrata', 'uscita']);
export const transactionCategoryEnum = pgEnum('transaction_category', [
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
]);
export const approvalStatusEnum = pgEnum('approval_status', ['in_attesa', 'approvato', 'rifiutato']);
export const eventCategoryEnum = pgEnum('event_category', [
  'scuola',
  'sport',
  'medico',
  'lavoro',
  'famiglia',
  'altro',
]);
export const budgetTypeEnum = pgEnum('budget_type', [
  'vacanza',
  'gita_scolastica',
  'campo_estivo',
  'altro',
]);
export const budgetStatusEnum = pgEnum('budget_status', ['in_attesa', 'approvato', 'rifiutato']);
export const shoppingListStatusEnum = pgEnum('shopping_list_status', ['attiva', 'completata']);

export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const appUsers = pgTable('app_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  provider: providerEnum('provider').notNull().default('google'),
  role: userRoleEnum('role').notNull().default('child'),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
});

export const childProfiles = pgTable('child_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const childAccountLinks = pgTable(
  'child_account_links',
  {
    childId: uuid('child_id')
      .notNull()
      .references(() => childProfiles.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'cascade' }),
    linkedAt: timestamp('linked_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.childId, table.userId] }),
  }),
);

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  amount: doublePrecision('amount').notNull(),
  type: transactionTypeEnum('type').notNull(),
  category: transactionCategoryEnum('category'),
  date: date('date').notNull(),
  parentName: text('parent_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const permissionRequests = pgTable('permission_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  childName: text('child_name').notNull(),
  description: text('description').notNull(),
  date: date('date').notNull(),
  time: text('time'),
  returnTime: text('return_time'),
  location: text('location'),
  parent1Approval: approvalStatusEnum('parent1_approval').notNull().default('in_attesa'),
  parent1Name: text('parent1_name'),
  parent2Approval: approvalStatusEnum('parent2_approval').notNull().default('in_attesa'),
  parent2Name: text('parent2_name'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const familyEvents = pgTable('family_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  date: date('date').notNull(),
  time: text('time'),
  category: eventCategoryEnum('category'),
  assignedTo: text('assigned_to'),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const budgetRequests = pgTable('budget_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  type: budgetTypeEnum('type').notNull(),
  amount: doublePrecision('amount').notNull(),
  dateFrom: date('date_from'),
  dateTo: date('date_to'),
  requestedBy: text('requested_by'),
  status: budgetStatusEnum('status').notNull().default('in_attesa'),
  parentNotes: text('parent_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const shoppingLists = pgTable('shopping_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  items: jsonb('items').notNull().default([]),
  status: shoppingListStatusEnum('status').notNull().default('attiva'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
