/**
 * Feature flags — controls which sections this deployment exposes.
 *
 * For the current single-client build we ship a limited set. Everything else
 * stays in the codebase (routes + pages are intact) but is switched OFF here,
 * so it disappears from the sidebar and its URL redirects away. Flip a flag
 * back to `true` to re-enable a section — nothing is deleted.
 */
export type FeatureId =
  | 'overview' | 'trips' | 'tours' | 'fleet' | 'team' | 'activity'
  | 'locations' | 'customers' | 'payables'
  | 'invoices' | 'expenses' | 'diesel' | 'payroll' | 'reports'
  | 'messages' | 'chat' | 'export'
  | 'documents' | 'earnings' | 'loads' | 'jobs' | 'subscription' | 'profile' | 'settings';

export const FEATURES: Record<FeatureId, boolean> = {
  // ── Enabled for this client ──────────────────────────────
  overview: true,      // Admin dashboard home
  team: true,          // Admin — roles & staff
  activity: true,      // Admin — employee activity log
  trips: true,         // Trip & route assignment
  tours: true,         // Amazon relay tours (55-col sheet)
  locations: true,     // Location Master — shared maps-link shortcuts
  fleet: true,         // Truck & driver management
  customers: true,     // Vendors — clients
  payables: true,      // Vendors — truck owners
  invoices: true,      // Accountant
  expenses: true,      // Accountant
  diesel: true,        // Accountant — diesel advance requests
  reports: true,       // Accountant
  messages: true,      // WhatsApp message generation
  chat: true,          // Internal chat
  export: true,        // Data export (Excel)

  // Payroll & HR: switched off in July 2026 because nothing in the app ever
  // created a pay line, so the page was permanently empty. Back on — the
  // client's requirement 16 asks for salary, incentives, joining letters and
  // payslips, and the page now builds its lines from the real team.
  payroll: true,

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
