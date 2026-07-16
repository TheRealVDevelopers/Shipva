/**
 * Money, shared across the org.
 *
 * Invoices, expenses, fuel logs, payroll and the "raise request to accountant"
 * flow were each a per-device localStorage blob — a supervisor's expense or a
 * driver-advance request never reached the accountant, because it lived only in
 * the browser that typed it. These are now the same shared Firestore collections
 * the reference data uses (see lib/common): any org member reads and writes, an
 * admin deletes. Firestore rules mirror that. The finer control — who can reach
 * the money pages at all — stays the role/page gating in lib/roles + lib/features
 * (invoices/expenses/payroll are accountant + owner/manager pages).
 */
import { sharedCollection } from './common.js';
import type { Invoice, Expense, FuelLog, PayrollLine } from './mocks.js';
import type { MoneyRequest } from './store.js';

export const invoicesCol = sharedCollection<Invoice>('orgInvoices');
export const expensesCol = sharedCollection<Expense>('orgExpenses');
export const fuelLogsCol = sharedCollection<FuelLog>('orgFuelLogs');
export const payrollCol = sharedCollection<PayrollLine>('orgPayroll');
export const requestsCol = sharedCollection<MoneyRequest>('orgRequests');
