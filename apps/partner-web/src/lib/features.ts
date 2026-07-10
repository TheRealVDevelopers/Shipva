/**
 * Feature flags — controls which sections this deployment exposes.
 *
 * For the current single-client build we ship a limited set. Everything else
 * stays in the codebase (routes + pages are intact) but is switched OFF here,
 * so it disappears from the sidebar and its URL redirects away. Flip a flag
 * back to `true` to re-enable a section — nothing is deleted.
 */
export type FeatureId =
  | 'overview' | 'trips' | 'fleet' | 'team'
  | 'customers' | 'payables'
  | 'invoices' | 'expenses' | 'payroll' | 'reports'
  | 'messages' | 'chat' | 'export'
  | 'documents' | 'earnings' | 'loads' | 'jobs' | 'subscription' | 'profile' | 'settings';

export const FEATURES: Record<FeatureId, boolean> = {
  // ── Enabled for this client ──────────────────────────────
  overview: true,      // Admin dashboard home
  team: true,          // Admin — roles & staff
  trips: true,         // Trip & route assignment
  fleet: true,         // Truck & driver management
  customers: true,     // Vendors — clients
  payables: true,      // Vendors — truck owners
  invoices: true,      // Accountant
  expenses: true,      // Accountant
  payroll: true,       // Accountant
  reports: true,       // Accountant
  messages: true,      // WhatsApp message generation
  chat: true,          // Internal chat
  export: true,        // Data export (Excel)

  // ── Hidden (kept in code, not shown to the user) ─────────
  documents: false,
  earnings: false,
  loads: false,
  jobs: false,
  subscription: false,
  profile: false,
  settings: false,
};

export const enabled = (id: FeatureId): boolean => FEATURES[id];
