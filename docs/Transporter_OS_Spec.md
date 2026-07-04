# Transporter OS — Phase 1 Product Spec

_ShipVa · drafted 2026-07-04_

> **One-line strategy:** Win the supply side first. Give each transporter (the commission
> agent / middleman) an operating system for their daily chaos, charge them a flat monthly
> **subscription**, and become their system-of-record. Driver + customer subscriptions and the
> load marketplace come **after** (~6 months), on top of the base we own.

---

## 1. Scope decision (locked 2026-07-04)

| Question | Decision |
|---|---|
| Phase-1 product | **Pure multi-tenant Transporter OS** — internal operations software. No load-matching marketplace yet. |
| Monetization | **Flat monthly subscription**, charged to the transporter. Tiered by fleet size. |
| Home repo | **ShipVa** — elevate `apps/partner-web` into the full OS. |
| Reuse | Port operational depth (roles, GST invoicing, payroll, trip lifecycle) from the **Sarva Express OS** repo. |
| Phase 2 (~6 mo+) | Turn on the marketplace layer (load board / auctions already scaffolded in partner-web) + **driver & customer subscriptions**. |

**Why transporters first:** small/mid Indian transporters run on paper registers, diaries, and
WhatsApp. Digitizing that is a real, unmet pain. Once we own their drivers, trucks, trips, and
money, the marketplace and downstream monetization become natural — and we skip the marketplace
cold-start problem.

**The honest risk & the answer:** transporters are price-sensitive and slow to pay for software.
So the product must hit a _"this saves me money / keeps me compliant"_ nerve, not just be a nicer
diary. The paid hooks that do that: **receivables/outstanding tracking, GST invoicing + e-way
bill, and fuel/expense leakage control.**

> **Pricing-story note:** `partner-web`'s current subscription copy ("free until liquidity",
> "no commission on any job") is a _marketplace_ pitch — we don't charge until loads flow. For a
> **pure-OS Phase 1 that has no marketplace loads yet**, that hook doesn't apply and shouldn't be
> shown. We charge for the _management tooling itself_ from day one. This is actually a **stronger**
> position: real utility, billable immediately, no liquidity required. The marketplace copy returns
> in Phase 2.

---

## 2. Current starting point — what `partner-web` already has

All mock data (`apps/partner-web/src/lib/mocks.ts`), no Firestore wiring yet.

- **Per-tenant identity** — company, contact, phone, region, GSTIN, verify status, rating (`partner`)
- **Subscription** — tier, price (paise), driver slots used/total, renewal, flat-monthly / no-commission model, `PLANS` = Starter/Growth/Pro
- **Overview dashboard** — KPI cards (active jobs, drivers online, loads to claim, earnings/month), live-jobs table
- **Fleet** — drivers (name/phone/reg/type/duty/KYC/rating/trips) + trucks (reg/type/capacity/status/docsOk), with tabs + "Onboard driver / Add truck"
- **Earnings**, **Profile**, **LoadBoard**, **ActiveJobs** (last two are Phase-2 marketplace)
- **Design system** — blue/white/orange, Nunito, `VehicleArt` SVG set, Card/KpiCard/Table/Badge primitives, motion

So the **transporter-facing frame + subscription is done**. Phase 1 is mostly: (a) wire it to a
real multi-tenant backend, and (b) add the operations depth below.

---

## 3. The transporter work-map → features

Every job a transporter does, and where each capability comes from:
**[HAVE]** already in partner-web · **[PORT]** exists in Sarva OS, bring it over · **[NEW]** build it.

### 3.1 Fleet & vehicle management
- [HAVE] Trucks (owned) — reg, type, capacity, status, docs-ok
- [NEW] **Attached / market trucks** (truck-owners the transporter brokers with) — critical in India
- [NEW] Document vault + **expiry reminders**: RC, insurance, national permit, fitness, PUC, road tax
- [NEW] Maintenance / service / tyre logs

### 3.2 Driver & staff management
- [HAVE] Drivers — selfie, name, phone, vehicle, duty, KYC, rating
- [PORT] **Staff with roles** — supervisors, managers, accountants + permissions (`Sarva OS: packages/shared-types/src/rbac.ts`). Re-scope roles to a tenant (see §5).
- [NEW] Assign driver ↔ truck; attendance / duty

### 3.3 Trip / load / order management _(the daily loop)_
- [PORT] Trip lifecycle state machine (`Sarva OS: orders FSM + functions/src/callable/transitionOrderStatus.ts`) → re-cast as internal **Trips** (distinct from Phase-2 marketplace bookings)
- [NEW] **LR / bilty / consignment note** generation
- [NEW] **E-way bill** generate/link, **POD** capture (photo/signature)
- [NEW] FTL vs LTL (part loads), multi-point trips

### 3.4 Live tracking
- [HAVE/Phase-2 shell] Duty status; [PORT] geofence + tracking-token logic already reusable
- [NEW] Per-driver GPS via the **driver app** (ShipVa `apps/driver-app` / `driver-web`)

### 3.5 Money — the subscription-justifying core
- [PORT] **GST invoicing** (`Sarva OS: packages/shared-types/src/billing.ts`, invoices)
- [NEW] **Customer ledger (receivables)** — who owes what, aging
- [NEW] **Truck-owner ledger (payables)** — advance + balance to attached vehicles
- [NEW] Trip advance/balance, driver _bhatta_ (allowance)
- [NEW] **Fuel management** — auto-calc: `fuel cost = (distance ÷ truck mileage km/l) × diesel rate`.
  Store mileage per truck/type; the gap between calculated and actual diesel = **pilferage flag**.
- [NEW] **Expenses** — toll, RTO, police, loading/unloading, repairs, misc per trip
- [NEW] **Commission / margin** per trip (their real profit)
- [PORT] **Payroll** for drivers & staff (`Sarva OS: payrollRuns, earnings`)
- [NEW] P&L per trip / vehicle / route; outstanding & payment reminders

### 3.6 Compliance & documents
- [HAVE, partial] Verify status; [NEW] KYC onboarding (Aadhaar/PAN/GST — see §4), e-way bills, document vault

### 3.7 Customer / CRM
- [NEW] Regular consignors, **rate contracts** (agreed freight per route/customer), booking history

### 3.8 Communication
- [NEW] Assign-notifications to drivers; WhatsApp of LR / tracking-link / POD to customers; expiry & payment alerts

---

## 4. Onboarding & KYC (from teammate's flow, with fixes)

Flow: **phone number + OTP + password → T&C → dashboard → verify to go live.**

- ✅ Phone+OTP+password, company under GSTIN, driver add w/ selfie+vehicle, tiers shown, GPS via driver app, profile (support/help/**refer-&-earn**) — all good, keep.
- ⚠️ **Don't hard-gate the whole dashboard behind KYC.** Let them explore in an _unverified_ state; gate only go-live / money actions (issuing invoices, etc.) behind verification. Hard gates kill activation.
- ⚠️ **Aadhaar is a legal flag.** Storing raw Aadhaar front/back images carries obligations under the Aadhaar Act (masking, storage, localization). Use **DigiLocker / Aadhaar offline-XML / an authorised KYC provider** — do not store raw images.
- ⚠️ **Online/offline toggle** only means something in the Phase-2 marketplace (available to receive loads). Defer it, or label "available for marketplace loads (coming soon)".
- ⚠️ **Location permission** matters for the _driver's_ app, not the transporter's phone — don't force it on the transporter.

---

## 5. Multi-tenancy & auth (the foundational change — do first)

- **Every record is scoped to a transporter tenant.** Recommended: subcollections under
  `/transporters/{transporterId}/…` (drivers, trucks, trips, invoices, expenses, fuelLogs, staff,
  payrollRuns, ledgers, customers, documents). Clean isolation, simple rules.
- **Auth:** phone-OTP (Firebase Phone provider). Custom claims carry
  `{ role, transporterId, scopes }`.
- **Roles (re-scoped RBAC):** `transporter_owner`, `manager`, `supervisor`, `accountant`
  (+ `driver` via the driver app). Ported concept from Sarva OS `rbac.ts`, but authority is now
  bounded to the tenant.
- **Rules:** deny cross-tenant reads/writes — `request.auth.token.transporterId == {transporterId}`.
  All money mutations happen in callables (as in Sarva OS), never client-side.

> This is the biggest real change: Sarva OS is single-operator; partner-web is single-partner-mock.
> Neither is tenant-isolated today. Lock this before building features on top.

---

## 6. Subscription tiers (refine existing `PLANS`)

Keep the flat-monthly / no-commission model and the three anchors; re-cast plan _features_ around
**OS capabilities** (not marketplace loads, which are Phase 2). Price axis = **# drivers/trucks +
# staff seats + depth of money features.**

| Tier | Price/mo | Drivers | Staff seats | OS features |
|---|---|---|---|---|
| **Starter** | ₹1,499 | up to 5 | 1 | Trips + LR, driver/truck mgmt, basic tracking, GST invoicing |
| **Growth** | ₹3,999 | up to 20 | 2–3 supervisors | + Fuel/expense, receivables/payables ledgers, e-way bill, WhatsApp share |
| **Pro** | ₹8,999 | up to 60 | manager + supervisors + accountant | + Payroll, P&L analytics, rate contracts, priority support |

---

## 7. Dashboard redesign (per-tenant, insight-first)

Each transporter sees **their own** data. Widgets:
- Live **active-trips map** (their trucks now)
- **Revenue vs expense** chart (week/month)
- **Outstanding receivables** gauge + aging
- **Vehicle utilization** (% earning vs idle)
- **Fuel cost trend** + leakage flag
- **Top routes by profit**, driver leaderboard
- **Document-expiry** alert strip (insurance/permit due)

Build on real charts, not the current static KPI cards alone.

---

## 8. Build sequence

1. **Foundation** — multi-tenancy + phone-OTP auth + tenant-scoped rules _(blocking)_
2. **Onboarding + KYC** — soft-gated, DigiLocker-based
3. **Core daily loop** — drivers/trucks → trip + LR → assign → track → POD → close (port trip FSM)
4. **Money layer** (paid hook) — GST invoicing + e-way bill → receivables/payables → fuel + expenses → payroll
5. **Redesigned per-tenant dashboard** with charts
6. **Subscription + billing** wired to real plans

Phase 2 (~6 mo+): marketplace layer (activate LoadBoard/auctions + online/offline toggle) + driver & customer subscriptions.

---

## 9. Open decisions

- Billing/payments rail for the subscription itself (Razorpay subscriptions?)
- KYC provider (DigiLocker vs a KYC aggregator)
- Trips vs Phase-2 bookings: one collection with a `source` field, or two? (Recommend two — keep internal ops clean.)
- Diesel-rate source for fuel auto-calc (manual per-trip vs a rate feed)
