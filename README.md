# Ground Network

A driver-first logistics **marketplace** for Bangalore — three demand engines on one
platform: **instant booking**, price-competitive **auctions**, and a **transporter
exchange** that fills idle trucks and empty return legs. Launched commission-free into
concentrated B2B demand (KASSIA industries + a transporters' association).

> Spec: `Logistics_App_Complete_AtoZ_Specification.md` (the A-to-Z reference).
> This repo was bootstrapped from the Sarva Express operator-OS, reusing its Firebase
> setup, Expo shell, design tokens and the `geofence`/`trackingToken` helpers — the
> product code is all new.

## Modules

| Surface | Stack | Status |
|---|---|---|
| **admin-web** | React + Vite + Tailwind | Dispatch, bookings, auctions, drivers (KYC), exchange, settings — **mock data, builds & runs** |
| **driver-app** | React Native (Expo) | Scaffold only |
| **functions** | Cloud Functions (TS, 2nd gen) | Core loop: `createBooking`, `acceptBooking` (atomic), `placeBid`, `chooseWinner`, `updateBookingStatus`, `setUserRole` |
| **customer app** | (planned) | Not started — WhatsApp-first booking is Phase 0 |

## Layout

```
ground-network/
├── apps/
│   ├── admin-web/          React — admin & dispatch console
│   └── driver-app/         React Native (Expo) — driver app (scaffold)
├── functions/              Cloud Functions (TypeScript, esbuild bundle)
├── packages/
│   ├── shared-types/       Marketplace schema (bookings, bids, transporters, posts, …)
│   ├── shared-logic/       booking FSM, fare model, geofence, tracking token
│   └── ui/                 Design tokens
├── firestore.rules         Deny-by-default
├── firestore.indexes.json  Composite indexes for bookings/bids/posts
└── firebase.json           Emulators + hosting + functions
```

## Data model (Firestore)

`users · customers · drivers · bookings · bids · transporters · fleetVehicles ·
fleetDrivers · loadPosts · truckPosts · connections` (+ config, ratings, auditLogs, counters).

## Develop

```bash
npm install
npm run dev:admin          # admin console at http://localhost:5173
npm run build:functions    # bundle Cloud Functions
npm run emulators          # Firebase emulator suite
```

## Deploy (needs a Firebase project on the Blaze plan)

Create a project, set it in `.firebaserc`, then:

```bash
npm run build -w @ground/admin-web
firebase deploy --only hosting
firebase deploy --only functions,firestore:rules,firestore:indexes,storage,database
```

## Build order (spec roadmap)

0. **Concierge MVP** — WhatsApp booking + manual dispatch console (admin-web is the start).
1. **Core loop** — driver app instant: nearby jobs → atomic accept → navigate → status.
2. **Differentiate** — auctions + customer tracking + transporter exchange + backhaul.
3. **Scale** — smart matching, referral (single-level, usage-based — never MLM), payments.
