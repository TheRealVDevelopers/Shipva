# ShipVa

A logistics platform for India, built supply-side first.

**Phase 1 — Transporter OS (current focus).** A multi-tenant, subscription SaaS for the
transporter / commission-agent (the middleman): manage drivers, trucks, staff & roles, trips
(LR / e-way bill / POD), GST invoicing, receivables/payables, fuel & expenses, and payroll —
with a live, per-transporter dashboard. Monetized by a **flat monthly subscription**, tiered by
fleet size. No commission.

**Phase 2 (~6 months+) — Marketplace.** Turn on load-matching: instant booking, price-competitive
auctions, and a transporter exchange that fills idle trucks and empty return legs — plus driver &
customer subscriptions. The customer / driver / admin surfaces already scaffolded here are the
front-end for this phase.

> **Full Phase-1 spec:** [`docs/Transporter_OS_Spec.md`](docs/Transporter_OS_Spec.md) — the
> authoritative reference for what to build, what to reuse, and the roadmap.
>
> This repo was bootstrapped from the Sarva Express operator-OS, reusing its Firebase setup,
> Expo shell, design tokens and the `geofence`/`trackingToken` helpers. Phase 1 additionally
> **ports operational depth** (RBAC roles, GST invoicing, payroll, trip lifecycle) from that repo.

## Apps

| Surface | Stack | Phase | Status |
|---|---|---|---|
| **partner-web** | React + Vite + Tailwind | **1** | Transporter dashboard — Overview, Fleet, Earnings, **Subscription**, Profile (+ LoadBoard/ActiveJobs for P2). **Mock data.** This is the Phase-1 base to elevate into the full OS. |
| **admin-web** | React + Vite + Tailwind | 1–2 | Dispatch, bookings, auctions, drivers (KYC), exchange, settings — mock data |
| **customer-web** | React + Vite + Tailwind | 2 | Porter-style booking (instant + auction) — mock/browser-store |
| **driver-web** | React + Vite + Tailwind | 2 | Driver "pro" app (dark/orange) — mock/browser-store |
| **driver-app** | React Native (Expo) | 2 | Scaffold only |
| **functions** | Cloud Functions (TS, 2nd gen) | 1–2 | Marketplace loop: `createBooking`, `acceptBooking` (atomic), `placeBid`, `chooseWinner`, `updateBookingStatus`, `setUserRole`. Phase-1 OS callables (trips, invoicing, payroll, tenant roles) TBD. |

## Layout

```
shipva/
├── apps/
│   ├── partner-web/        React — Transporter OS dashboard (Phase-1 base)
│   ├── admin-web/          React — admin & dispatch console
│   ├── customer-web/       React — customer booking (Phase 2)
│   ├── driver-web/         React — driver app, web (Phase 2)
│   └── driver-app/         React Native (Expo) — driver app (scaffold)
├── functions/              Cloud Functions (TypeScript, esbuild bundle)
├── packages/
│   ├── shared-types/       Schema (bookings, bids, transporters, posts, … ; OS types TBD)
│   ├── shared-logic/       booking FSM, fare model, geofence, tracking token
│   └── ui/                 Design tokens (blue · white · orange · Nunito)
├── docs/Transporter_OS_Spec.md   Phase-1 spec
├── firestore.rules         Deny-by-default
└── firebase.json           Emulators + hosting + functions
```

## Firebase

Project: **`sarvaexpressos`** (Blaze plan enabled). Hosting sites are live (mock UIs):
combined role-chooser at `sarva-gn-app.web.app`, plus per-surface `sarva-gn-{admin,book,driver,partner}`.
Real data path (Firestore wiring + callables + phone-OTP auth) is the next build step.

## Develop

```bash
npm install
npm run dev -w @shipva/partner-web   # Transporter OS dashboard (Phase-1 base)
npm run dev:admin                     # admin console
npm run build:functions               # bundle Cloud Functions
npm run emulators                     # Firebase emulator suite
```

## Deploy

```bash
npm run build -w @shipva/partner-web
firebase deploy --only hosting
firebase deploy --only functions,firestore:rules,firestore:indexes,storage,database
```

## Build order (Phase 1 — Transporter OS)

0. **Foundation** — multi-tenancy (`/transporters/{id}/…`) + phone-OTP auth + tenant-scoped rules.
1. **Onboarding + KYC** — phone login, GST company, soft-gated KYC (DigiLocker; don't store raw Aadhaar).
2. **Core daily loop** — drivers/trucks → trip + LR → assign → track → POD → close.
3. **Money layer** (the paid hook) — GST invoicing + e-way bill → receivables/payables → fuel + expenses → payroll.
4. **Dashboard** — redesigned per-transporter, charts.
5. **Subscription + billing** — wire real plans.

Phase 2 (~6 mo+): activate the marketplace (LoadBoard/auctions/exchange) + driver & customer subscriptions.
Referral is single-level, usage-based — never MLM.
