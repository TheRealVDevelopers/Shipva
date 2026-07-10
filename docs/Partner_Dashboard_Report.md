# ShipVa — Partner (Transporter) Dashboard: State & Feature Report

_As of 2026-07-04 · app: `apps/partner-web` · live: https://sarva-gn-partner.web.app (and https://sarva-gn-app.web.app/partner)_

---

## 0. Executive summary

The partner dashboard is a **high-fidelity, interactive prototype of the Transporter OS**. It has
17 sections covering the full operational surface a transporter needs — trips, fleet, drivers,
staff, customers, invoicing, expenses, fuel, payables, payroll, documents, reports, settings —
with real charts, working create-forms, and a mobile-friendly layout.

**Maturity level: front-end complete, data is local-only.** All data lives in the browser
(`localStorage`). Records you create persist across refresh **on that one device/browser**, but
there is **no server, no accounts, no multi-user, and no real auth yet**. It is a convincing,
clickable product you can demo and validate — not yet a live system real transporters can log into
and rely on. Making it real is the next phase (backend + auth + multi-tenancy).

Think of it as: **the skeleton and skin are done; the bloodstream (backend) is not connected.**

---

## 1. What it HAS — section by section

The left sidebar has 17 items. Status legend: **✅ Live/functional** · **◐ Partial (UI real, some
actions are stubs)** · **▢ Display-only (mock)** · **🔒 Phase-2 (marketing "SOON")**.

| # | Section | Status | What's in it |
|---|---------|--------|--------------|
| 1 | **Overview** | ◐ | Hero KPI cards (Revenue MTD, Net profit, Outstanding, Active trips) with trend arrows + sparklines; quick-action buttons; Revenue-vs-Expense 6-month bar chart; expense-breakdown donut; receivables-aging bars; collections gauge; fuel-leakage flag; live-trips feed; fleet-utilization donut; document-expiry alerts |
| 2 | **Trips** | ✅ | KPIs; All/Active/Closed filters; working search; **"New trip" form** (pick driver + vehicle, auto-generates LR number); table with route, driver/vehicle, material, freight, e-way status, trip status |
| 3 | **My Fleet** | ▢ | Drivers tab (avatar, phone, vehicle, duty, KYC, rating) + Trucks tab (reg, type, capacity, status, docs). *Add driver/truck buttons not yet wired.* |
| 4 | **Documents** | ◐ | Vehicle document vault (insurance, permit, fitness, PUC, road tax); expired / ≤30-day / valid counters; table sorted soonest-expiry-first; upload button (stub) |
| 5 | **Team & Roles** | ▢ | Staff seats banner; cards for managers/supervisors/accountants with per-role permissions; role-reference grid |
| 6 | **Customers** | ✅ | CRM directory; KPIs; **"Add customer" form**; rate-per-km (rate contracts); outstanding dues per client |
| 7 | **Invoices** | ✅ | KPIs (outstanding, collected, overdue, GST); **"New invoice" form** (auto-calculates GST + total); **"Mark paid"**; receivables-aging card; download/send (stubs) |
| 8 | **Expenses & Fuel** | ✅ | Expense tab with **"Add expense"**; Fuel-log tab with **"Log fuel"** (auto-computes expected cost and **flags leakage**); expense-mix donut; leakage explainer |
| 9 | **Payables** | ▢ | Attached/market trucks + truck-owner ledger (advance/balance owed); record-payment (stub) |
| 10 | **Payroll** | ◐ | KPIs; current payroll run (base/bhatta/deductions/net/status); **"Run payroll"** (settles the cycle); recent payouts |
| 11 | **Earnings** | ▢ | Pre-existing earnings list (per-trip payouts) |
| 12 | **Reports** | ✅ | P&L: revenue-vs-expense chart, cost-structure donut, **P&L-by-vehicle** and **top-routes** (both computed live from your trips) |
| 13 | **Load Board** | 🔒 | Marketplace load board — Phase 2 (tagged SOON) |
| 14 | **Active Jobs** | 🔒 | Marketplace jobs — Phase 2 (tagged SOON) |
| 15 | **Subscription** | ▢ | Plan tiers (Starter ₹1,499 / Growth ₹3,999 / Pro ₹8,999), current plan, driver-slot usage |
| 16 | **Profile** | ▢ | Company identity (name, GSTIN, region, rating) |
| 17 | **Settings** | ◐ | Company profile (save is cosmetic), fuel/mileage config, subscription summary, **working "reset demo data"** |

**Cross-cutting things it has:**
- **Custom charts** — sparklines, grouped bars, donuts, radial gauges, progress bars — all
  hand-built inline SVG (no chart library, so it's fast and fully on-brand).
- **A data store** (`lib/store.tsx`) — a single source of truth the pages read/write, persisted to
  localStorage. Deliberately backend-agnostic so it can be swapped to Firestore later without
  touching any page.
- **A form/modal kit** — reusable modal + inputs powering all the create flows.
- **Mobile navigation** — hamburger + slide-over drawer (the sidebar is desktop-only otherwise).
- **Brand system** — dark sidebar, blue/white/orange, Nunito, illustrated vehicles, subtle motion.

---

## 2. What's genuinely FUNCTIONAL vs COSMETIC (the honest cut)

**Actually works (creates/changes data that persists):**
- Create a **trip** (auto LR number) → appears in Trips, Overview live-trips, and Reports
- Create an **invoice** (auto GST + total) and **mark it paid**
- Add an **expense**; **log fuel** (auto leakage flag)
- Add a **customer** (with rate contract)
- **Run payroll** (marks the cycle paid)
- **Reset demo data** (Settings)
- **Search** trips; **filter** trips; **tab** switches; **mobile drawer**

**Looks real but does nothing yet (stubs):**
- "Assign" driver, "Download" invoice/LR, "Send reminder", the notification bell
- "Record payment" / "Pay" on Payables, customer "Ledger", document "Upload"/"Renew"
- Add driver / add truck on Fleet
- E-way-bill generation, POD capture

**Important nuance — some numbers are static:** the big **headline aggregates** on Overview,
Invoices, Expenses (e.g. "Revenue MTD ₹3.86L", "Outstanding ₹6.12L", "Fuel leakage ₹7k",
receivables-aging bars) are **fixed sample figures** — they do **not** recompute when you add a
trip or invoice. What *is* live are the **lists** (trips, invoices, expenses, fuel, customers,
payroll) and the **Reports** page (P&L-by-vehicle and top-routes are computed from your actual
trips). This is normal for a prototype, but worth knowing when you demo it.

---

## 3. What it does NOT have (the gaps)

**Backend & data**
- No server database. Data is per-browser localStorage — clearing the browser or opening it on
  another phone/computer shows the seed data again. Nothing is shared between users.
- No **multi-tenancy** — it's hardwired to one demo transporter ("Karnataka Roadlines").
- Headline KPIs don't recompute from live data (see §2).
- No edit/delete of records (only add + a couple of status changes).

**Auth & onboarding**
- **No real login.** The login screen is a mock form; anyone with the URL sees the dashboard.
- No **phone-OTP**, no company/GST setup, no **KYC** (Aadhaar/PAN/GST) flow.

**Operational depth still missing**
- **Live GPS tracking / map** of trucks (needs the driver app feeding location).
- **POD capture** (delivery proof photo/signature) and **e-way bill** generation.
- **LR / invoice PDF** download/print. *(In progress — a print engine was started but not yet
  deployed.)*
- **WhatsApp** sending of LR / tracking link / payment reminders.
- **Maintenance / tyre / service logs**, driver **attendance**, driver↔truck assignment.
- **Notifications** center (the bell is decorative).
- Editing customers' ledgers, recording payments against payables/receivables.

**UX polish**
- No empty/loading states on most lists.
- Search exists only on Trips.

---

## 4. How it SHOULD work (target behaviour)

### 4.1 The daily loop (the heart of it)
1. A **supervisor** creates a **trip**: pick consignor (customer), pickup/drop, material, weight,
   assign a **driver + truck** (owned or attached). System issues an **LR number** and, for taxable
   goods, an **e-way bill**.
2. The trip moves through states: assigned → loading → in-transit → at-drop → **POD captured** →
   closed. Status updates come from the **driver app** (GPS + status taps), reflecting live on the
   transporter's Overview map.
3. On delivery, the accountant raises a **GST invoice** to the customer (freight + GST), which lands
   in **receivables**; the driver's **bhatta** and any trip **expenses/fuel** are logged against the
   trip, feeding **per-trip P&L**.
4. Weekly/monthly, **payroll** runs for drivers + staff; **payments** to attached truck-owners are
   recorded against **payables**.
5. Everything rolls up into **Reports** (P&L by trip/vehicle/route) and the **Overview** health
   panel (outstanding, collections, fuel leakage, utilization, document expiry).

### 4.2 Who does what (roles, tenant-scoped)
- **Owner** — everything.
- **Manager** — all operations, assign trips, view money, manage staff.
- **Supervisor** — assign trips to drivers, update trip status, only their pool.
- **Accountant** — invoicing/GST, payroll, expenses & ledgers.
- **Driver** (separate app) — accept trip, navigate, update status, capture POD.

Each role sees **only their own company's data** — never another transporter's.

### 4.3 The money hooks that justify the subscription
- **Receivables** with aging + one-tap reminders → get paid faster.
- **GST invoicing + e-way bill** → compliance without a CA chasing paperwork.
- **Fuel leakage** = actual diesel vs `(distance ÷ mileage) × rate` → catches pilferage.
- **Payables** to attached trucks → know exactly what you owe.
- **P&L per vehicle/route** → drop loss-making routes.

### 4.4 Login & onboarding (target)
Phone number → OTP → set password → accept T&C → land on dashboard (explorable immediately).
Soft-gate only money/go-live actions behind **KYC** (GSTIN + PAN, Aadhaar via DigiLocker — never
store raw Aadhaar images). Subscription tier picked during or after onboarding.

---

## 5. Complete feature list (with status)

**Done ✅ | Partial ◐ | Missing ✗**

**Trips / operations**
- ✅ Create trip + auto LR · ✅ trip list/filter/search · ◐ trip statuses (shown, not driver-driven)
- ✗ trip detail view · ✗ POD capture · ✗ e-way-bill generation · ✗ LR PDF (in progress) · ✗ multi-point/part loads

**Fleet & drivers**
- ◐ driver list · ◐ truck list · ✗ add driver/truck (in progress) · ✗ driver↔truck assignment · ✗ attendance · ✗ maintenance/tyre logs

**Documents**
- ◐ document vault + expiry sort/alerts · ✗ upload/store files · ✗ renew workflow

**Team & roles**
- ◐ staff directory + role permissions (display) · ✗ invite/manage members · ✗ real permission enforcement (needs auth)

**Customers / CRM**
- ✅ add customer · ✅ rate contracts (₹/km) · ◐ outstanding per client · ✗ customer ledger/history

**Invoices & receivables**
- ✅ create GST invoice (auto tax) · ✅ mark paid · ◐ aging (static) · ✗ PDF/print (in progress) · ✗ reminders (WhatsApp/SMS)

**Expenses & fuel**
- ✅ add expense · ✅ log fuel + leakage flag · ◐ leakage aggregate (static) · ✗ diesel-rate feed

**Payables**
- ◐ attached-truck ledger (display) · ✗ record payment · ✗ advance tracking

**Payroll**
- ✅ run payroll (marks paid) · ◐ lines (base/bhatta/deductions) · ✗ payslips · ✗ idempotent server run

**Reports**
- ✅ P&L by vehicle · ✅ top routes · ✅ revenue-vs-expense chart · ◐ month figures (static series)

**Live tracking**
- ✗ map · ✗ GPS from driver app · ✗ geofence at pickup/drop

**Money/dashboard**
- ◐ Overview KPIs (static aggregates) · ✅ charts render · ✗ live recompute

**Platform**
- ✅ local persistence · ✅ mobile nav · ✅ brand/design system · ✗ backend · ✗ auth · ✗ multi-tenancy · ✗ onboarding/KYC · ✗ notifications

---

## 6. Technical snapshot

- **Stack:** React + Vite + TypeScript + Tailwind; React Router; lucide icons; inline-SVG charts.
- **Data:** `lib/store.tsx` — React context over localStorage, seeded from `lib/mocks.ts`.
  Backend-agnostic `useStore()` API so pages don't change when the backend lands.
- **Deploy:** two Firebase Hosting targets — standalone `sarva-gn-partner.web.app` and the combined
  role-chooser site `sarva-gn-app.web.app/partner`.
- **Not yet present:** Firestore, Cloud Functions callables, Firebase Auth, security rules for the
  Transporter OS (the poll/marketplace rules exist, but nothing tenant-scoped for this).

---

## 7. What "making it real" takes (roadmap)

1. **Foundation (blocking):** enable a Firebase **sign-in provider** (Anonymous now, Phone for OTP);
   multi-tenant data model under `/transporters/{id}/…`; tenant-scoped security rules.
2. **Swap the store to Firestore** — same `useStore()` API, real persistence per transporter,
   headline KPIs computed from live data.
3. **Onboarding + phone-OTP login + soft-gated KYC.**
4. **Close the stubs:** driver/truck add, LR & invoice PDF, POD capture, e-way bill, record-payment,
   reminders (WhatsApp), notifications.
5. **Live tracking** via the driver app (GPS → map).
6. **Subscription billing** (Razorpay) wired to the plan tiers.

---

## 8. Flags to keep in mind

- **No auth today** — the dashboard is publicly reachable at its URL and shows one demo tenant.
  Fine for a prototype/demo; must be fixed before any real transporter data goes in.
- **Aadhaar handling** (when KYC is built) is a legal matter — use DigiLocker/offline-XML, don't
  store raw images.
- **Subscription copy** currently shows the marketplace pitch ("no commission / free until
  liquidity"); for a pure-OS Phase 1 the pitch should be "you're paying for the tooling."
- **Prototype figures** — headline totals are illustrative, not computed; don't quote them as real.
