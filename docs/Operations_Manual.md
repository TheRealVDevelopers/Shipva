# Sarva Express OS — Operations Manual

**Version 1.0 · 13 August 2026**

How the transport operating system works, module by module — for owners, managers, team leaders,
supervisors and accounts staff.

> **What this document is.** A complete functional reference for Sarva Express OS: every screen, what
> it does, and the rules that sit behind it. It is written for the people who use the system, not for
> developers — there is no code in it. Sections are numbered so they can be quoted in an email or a
> training session.
>
> A hosted, formatted version of this manual and a PDF companion are also issued to the client. When
> you change behaviour described here, update this file in the same commit.

## Contents

| § | Covers |
|---|---|
| [1](#1-the-system-at-a-glance) | The system at a glance — addresses, the shape of the app, what is shared |
| [2](#2-roles--who-sees-what) | Roles & who sees what — the five roles, edit and export rules, team scoping |
| [3](#3-signing-in--joining) | Signing in & joining — invitation to activation, password recovery |
| [4](#4-operations) | Operations — Trips, Amazon Tours, Locations |
| [5](#5-vendors-register) | Vendors Register — Transporters, Truck Owners, Trucks, Drivers |
| [6](#6-accounts) | Accounts — Vendor Payment MIS, Expenses, Diesel, Payroll, Reports |
| [7](#7-admin) | Admin — Team & Roles, Activity Log |
| [8](#8-tools) | Tools — WhatsApp, Team Chat, Data Export |
| [9](#9-alerts--reminders) | Alerts & reminders — what the app tells you, and who it tells |
| [10](#10-records--data-safety) | Records & data safety — shared vs scoped, history, access |
| [11](#11-limits--open-items) | Limits & open items — stated plainly, including what needs the client |

---

## 1. The system at a glance

Sarva Express OS runs the whole transport operation in one place — the runs on the road, the vendors
who move them, the money in and out, and the people who do the work.

The public Sarva Express website sits at the main address. Staff reach the operating system through
the **Staff Login** button in the header, which opens the app at `/app`. One address for everyone to
remember.

### Where it lives

| Address | What it is |
|---|---|
| `sarvaexpress-app.web.app` | Website at the top level; staff app behind **Staff Login** at `/app` |
| `sarva-gn-partner.web.app` | The same system on a second address |
| `sarva-express-253f2.web.app` | A third address, kept in step with the other two |

### The shape of the app

| Group | Screens |
|---|---|
| **Dashboard** | Your home screen, tailored to your job |
| **Operations** | Trips · Amazon Tours · Locations |
| **Vendors Register** | Transporters · Truck Owners · Truck Register · Driver Register |
| **Accounts** | Vendor Payments · Expenses & Fuel · Diesel Requests · Payroll & HR · Reports |
| **Admin** | Team & Roles · Activity Log |
| **Tools** | WhatsApp · Team Chat · Data Export |

> **Everything is live for everyone.** The registers, the money and the paperwork are shared across
> the company — what one person saves, everyone sees immediately, with no refresh and no copies to
> reconcile. Trips and tours are the exception: they are scoped to the team that runs them (§2.2).

---

## 2. Roles & who sees what

Every person signs in with their own email and password. Their role decides which screens appear and
what they are allowed to change.

| Role | What they do | Sees |
|---|---|---|
| **Owner** | Runs the company | Everything |
| **Manager** | All operations and money, manages staff | Everything |
| **Team Leader** | Runs a sub-team of POCs; assigns and watches their routes | Operations, their own team, export, activity log — *no company money* |
| **Supervisor / POC** | Works the runs on the ground and updates them | Their own trips, tours, registers, chat — *no money, no team admin* |
| **Accountant** | Vendor payments, expenses, payroll, ledgers | All of Accounts, the registers, reports and export — *not the operations board* |

### 2.1 Two rules that sit above the screens

**Who may rewrite or delete a record** — trips, tours, drivers, trucks, transporters, truck owners —
is limited to the **Owner, Manager and Team Leader**. A supervisor can still do their job: update a
run, record a check-in, submit a VR ID. They simply cannot rewrite or destroy the underlying record.

**Who may take data out of the building** — the Excel exports — is the **Owner, Manager, Team Leader
and Accountant**. Supervisors cannot export.

### 2.2 How work is scoped to a team

Each supervisor reports to a team leader. A trip or tour belongs to the team of the person handling
it, so:

- A **supervisor** sees their own runs.
- A **team leader** sees every run belonging to their POCs.
- An **owner or manager** sees all of them.

Move a person to a different team leader and their active runs move with them — see §7.1.

### 2.3 Per-person adjustments

The role sets a sensible default, but an admin can switch individual screens on or off for any one
person from **Team & Roles**. The Dashboard is always available; everything else can be granted or
withdrawn.

---

## 3. Signing in & joining

A new employee goes from invitation to working account in four steps, with the documents checked
before they get in.

### 3.1 Joining

1. **The admin invites them** from Team & Roles — name, email, role, team leader and which screens
   they get. The system creates the account and shows a temporary password *once*.
2. **They sign in and set their own password.** The temporary one stops working.
3. **They complete their profile** — date of birth, address, emergency contact, Aadhaar and PAN
   numbers, bank details, and uploads of Aadhaar, PAN and a cancelled cheque. Until this is done and
   approved, the *only* page they can open is their own profile, and the app tells them exactly what
   is still missing.
4. **A manager reviews and activates them**, setting designation, joining date and salary. The
   joining letter is generated automatically at that moment.

The owner and managers are exempt from the approval gate — somebody has to be able to approve the
first profile.

### 3.2 Forgotten passwords

The sign-in screen has a **Forgot password?** link. The person enters their registered email and
receives a secure, single-use reset link. It opens a Sarva Express page where they choose a new
password, and signs them straight in with it — no second trip to the login screen.

The message shown after requesting a link reads the same whether or not the address is registered, so
it cannot be used to work out who has an account.

### 3.3 Admin password reset

For someone locked out who cannot wait for an email, an **owner or manager** can reset their password
from Team & Roles. A one-time password is shown once to hand over, and the employee must set their
own on next sign-in — so the admin never knows their final password. There is also a one-click
**Email reset link** if they would rather do it themselves.

The owner account can only be recovered through the email link, so nobody can take it over by
resetting its password.

---

## 4. Operations

Everything that moves on the road — the board, the Amazon relay work, and the saved locations that
feed both.

### 4.1 Trips

The Trips board is where a run is watched and updated. Every run — a normal trip or an Amazon tour —
appears on one of three tabs:

```
Upcoming  →  In Transit  →  Completed
```

A run's own progress moves through **Assigned → Loading → In transit → At drop → POD pending →
Closed**.

**Working a run**

- **Collapsed**, each line is scannable — code, vendor, driver, vehicle, POC, status.
- **Expanded**, it shows the stop-by-stop breakdown: stop, equipment, planned and actual arrival,
  planned and actual departure.
- **Check in and check out at every stop separately.** Each stop carries its own buttons, so a stop
  missed or filled in late never blocks the ones after it, and stops can be recorded in whatever
  order the run actually happened. The live stop is marked **Now**; a stop checked into but not yet
  left reads **In progress**.
- You cannot check out of a stop you never checked into — a departure with no arrival leaves the
  arrival time blank on the Amazon sheet.

**Updating a run**

A run carrying several VR IDs is **updated once per VR ID**, each saved and submitted on its own. The
header shows the progress — *"0 of 2 VRIDs updated — each one is submitted separately."* The trip
completes when every VR ID is in.

Each VR ID carries its own figures: present/absent, load type, starting and ending KM, manual KM
(worked out from the odometer, not typed), Amazon KM, GPS KM, POD, expense and invoice. Photo uploads
take several images per kind. Feedback and remarks are optional; the kilometre figures and POD are
not.

**Finding and reassigning**

- **Date filter on every tab** — pick a single day, or fill both boxes for a range.
- **Bulk reassign** — press *Select to reassign*, tick any runs (or select all shown) and hand them
  to one person together. Leadership only. Every hand-over is recorded on the run's history.

### 4.2 Amazon Tours

The Amazon relay work has its own screen for building routes; the day-to-day updating happens on the
Trips board.

**Assigning a route**

1. Open **Route Assign** and pick the vendor. Their drivers and vehicles fill in automatically.
2. Enter the Tour ID and each VR ID, with its stops, equipment and planned times.
3. Assign the POC who will work it.
4. Create the route — or **Save as Draft** if it is only part-filled.

Drafts sit on their own tab with a count, hold no VR IDs, and never appear on the board or in exports
until they become a real route.

> **Trip ID vs VR ID.** A **Trip ID can be reused across as many routes as you like**. Only **VR IDs
> are exclusive** — a VR ID already on an active route is refused, with an error naming it, both as
> you type and again when you save.

**Sharing** — on the row itself, without opening it: **Vendor Share**, **Driver Share**, **Copy
route** and **Copy vendor**. These are proper links, so a pop-up blocker cannot silently swallow them,
and copy works inside the WhatsApp and Instagram browsers too.

**Cancelling and restoring** — a cancelled route is marked **Cancelled** and kept on its own tab; it
does not disappear. Its VR IDs are freed for reassignment immediately. It can be restored, re-claiming
its VR IDs, or telling you exactly which one has since been taken.

**Exports**

- **The 67-column workbook** — reproduces the client's own "Export file Amazon.xlsx" exactly, in
  their column order, one row per VR ID, with created/updated by, date and time added *after* their
  columns so nothing they paste breaks.
- **Update history** — the same data with one row per change, for filtering and pivoting.
- **Amazon's own 54-column sheet**, untouched, as its own button.

### 4.3 Locations

Save a location once — a short code, a name and a Google Maps link — and it is available to the whole
company wherever a location is typed. Type `HKA3` on a trip point or an Amazon stop and the name and
the map link fill in together.

Anyone can add and use locations; leadership can edit them; admins can delete them.

---

## 5. Vendors Register

Four registers — Transporters, Truck Owners, Trucks and Drivers — sharing one set of rules about
identity numbers and search.

### 5.1 Rules that apply to all four

> **No duplicate registration numbers.** Every unique number exists **once across the whole system**:
> vehicle number, mobile number, driving licence, PAN, Aadhaar, GST and RC. Registering one already on
> file is refused with a message naming who holds it — *"This vehicle number is already registered to
> Truck Owner 'Ramesh'."*
>
> Checked across all four registers together, because a PAN or a vehicle number identifies one real
> thing. Spacing and capitalisation are ignored, so `KA05 K2245` and `ka05k2245` count as the same.
> Editing a record never trips on its own numbers. **Only the name may repeat.**

**Search** sits on each of the four registers and finds a record by name *or* by any number —
transporter name, mobile, licence, vehicle number, vehicle type, PAN, GST. Type several words and all
of them must match, so `yoga 90433` finds a driver by part of the name and part of the phone at once.

### 5.2 Transporters

The transporter record carries the legal entity details the Service Agreement needs — legal name,
entity type, GSTIN or Aadhaar, PAN, contact, registered address, bank details and authorised
signatory — plus an upload under every number.

**Onboarding**

```
Draft  →  Trial · 7-day LOI  →  Agreement pending  →  Onboarded
```

Details are captured, the 7-day Letter of Intent is issued, the trial runs, and the Service Agreement
must be signed before day 8. A transporter cannot be put on a trip until they are **Onboarded**, and
from **day 9** without a signed agreement they are blocked. A vendor has **7 days** to return a signed
joining letter, and admin has **2 days** to verify a new registration before it reads overdue.

**Rate cards** — a transporter holds a **primary rate card** (the agreement's Annexure B) and as many
**additional rate cards** as needed, commonly one per vehicle type. Each additional card carries its
own printable copy, its own signed copy uploaded back, and can be picked when a run or an MIS is
priced. A card is **retired rather than deleted**, so an invoice already raised against it still says
what it billed. A card with no signed copy on file is flagged at the moment of billing.

**Documents** — Rate Card, Letter of Intent and Service Agreement all accept **PDF, PNG or JPG**, PDF
offered first. A signed PDF is stored exactly as the vendor sent it; only photographs are compressed.
Oversized files report their actual size against the 8 MB limit rather than failing silently.

### 5.3 Truck Owners

The same paperwork loop as a transporter, minus the rate card — a truck owner does not carry one. The
register holds owner and transporter name, vehicle, KYC state, onboarding stage and the running
balance owed, with **Record payment** to settle against it.

### 5.4 Truck & Driver Registers

Drivers carry phone, Aadhaar, PAN and driving licence; trucks carry registration, RC, insurance and
fitness. A document counts as **on file only when both the number and the photo are present** — the
app reports them separately, so "Aadhaar photo" reads differently from "Aadhaar" and nobody thinks a
saved number has gone missing.

> **If a vendor's drivers seem to vanish.** Drivers and trucks are linked to their vendor by name.
> Renaming a vendor moves its drivers and trucks with it automatically. Brackets, spacing and
> capitalisation are ignored when matching, and an empty list explains itself — *"No drivers are
> registered under [vendor]"* — rather than showing a blank dropdown. A repair report appears on the
> Driver and Truck registers whenever a record's vendor name does not match, and corrects it in one
> click.

---

## 6. Accounts

Vendor settlement from MIS to UTR, the cost ledgers, diesel advances, payroll and the reports over the
top.

### 6.1 Vendor Payments — the MIS

An MIS is raised for **one transporter, one vehicle and one period**. Everything else is read against
that window.

**Building it**

1. **Pick the transporter** — their registered rate card is pulled in automatically, with the monthly
   package, extra-km rate, allowance and vehicle type.
2. **Pick the vehicle and the period** (from–to), or leave the vehicle blank to bill everything they
   ran.
3. **Check the trip count.** The system counts the runs that vendor actually did in the window. Type
   a different figure to override it — the row then marks it as *overridden*, so the counted number
   is never quietly replaced.
4. **Add toll and other charges**, with a note for what the other charges were.
5. **Read the payment summary.** Monthly package, plus kilometres beyond the allowance, plus toll and
   other charges, *less the diesel already advanced* — pulled automatically from the approved fuel
   requests for that vendor, vehicle and period. One tap uses the net figure as the billed amount.

A part-finished MIS can be kept with **Save as draft** and completed later. Drafts stay out of the
expense totals until they are raised.

**Agreeing it with the vendor**

```
Draft  →  Sent to vendor  →  Disputed → edit → resend   |   No dispute  →  Invoice
```

Send the MIS to the vendor by email; the row records that it went and when. If they disagree, record
what they disputed — editing the MIS clears the dispute so it can go back out. If they agree, one
button marks it **No dispute**. **An invoice cannot be raised until they have.**

**Paying it** — record the invoice date, **who processed it**, and upload the vendor's own invoice
(PDF or photo). Payment then moves **Draft → Pending → Processing → Paid**, with **Overdue** flagged
past the due date. Settlement captures paid-on, amount, payment mode, TDS deducted and the **UTR /
bank reference**, so a payout can be traced later. Every change is recorded with who made it and when
— nothing is silently overwritten.

**The dashboard** shows total vendor expenses, pending, processing and paid, with a six-month
vendor-spend summary beside it.

### 6.2 Expenses & Fuel

Expense entry runs **Date → Vendor → available VR IDs**, each step narrowing the next, so a toll, fuel
or RTO cost can only be booked against a VR ID that actually ran that day. The VR ID, Tour ID and
vendor are stored on the expense and shown in the table.

The page also tracks **fuel leakage** — actual diesel cost against expected — and holds the queue of
requests raised to the accountant.

### 6.3 Diesel Requests

The accountant's settlement queue for diesel advances. Each request shows its complete detail —
vendor, driver and number, vehicle, every VR ID, Tour ID, G-pay name and number, service date, amount,
who raised it and when — or jumps straight to the linked tour.

- **Search** across Tour ID, VR ID, vendor, driver, vehicle, G-pay details, note and UTR, plus a
  clearable date filter.
- **Pending** and **Paid** tabs (with Rejected and All), each with a live count.
- Marking one paid records who settled it and captures the **UTR**.
- The export carries every field, including who settled it and when.

The detail is captured onto the request when it is raised, so a later edit to the route cannot change
what an advance was actually paid against.

### 6.4 Payroll & HR

Each employee's monthly salary sits on their record. Accounts picks a monthly cycle, presses
**Generate lines** for everyone with a salary set, then adds incentives and deductions per person.
Running payroll twice never double-pays, and the cycle exports to a spreadsheet.

**Joining letters** are generated automatically the moment an employee is activated and can be
reprinted any time. **Payslips** are downloadable per employee per cycle — basic, incentive,
deductions, gross and net, with designation, PAN and bank details.

### 6.5 Reports

Profit & loss trend with the current month live, cost structure, P&L by vehicle, and top routes by
revenue.

---

## 7. Admin

### 7.1 Team & Roles

Invite employees, set their role, team leader and screens, review their documents, set employment
terms and activate them. A manager has full visibility of every employee's record.

**Changing a team leader** — an owner or manager can move a person to a different team leader, or back
to reporting to the owner, from the employee's Details.

- **Their active trips and tours move with them**, so the new leader sees them and the previous one no
  longer does. Finished runs stay with the team that ran them, for the record.
- **All new notifications and task updates follow** to the new leader automatically.
- **A record of every change is kept** on the person — when, from which leader to which, who made the
  change and how many runs moved.

**Removing and re-adding** — removing an employee removes both their record and their login, so the
same email can be invited again later. Anyone removed before this was fixed can also be re-added: the
app detects the stranded login and releases it automatically.

### 7.2 Activity Log

Login and logout, working hours, break time and status, for any date you pick, filtered by name or
status and exportable as a sheet. Break time is derived — the span present, minus the time actually
active.

Leadership only, and a **team leader sees only their own POCs** — not manager or owner activity. The
owner is not activity-tracked.

---

## 8. Tools

### 8.1 WhatsApp

Pick a trip — search by VR, LR, route, driver or customer — and three messages are ready to send:
**trip details to the driver**, **dispatch / LR to the customer**, and a **payment reminder to the
customer**. Amazon tours have their own vendor, driver and diesel-request messages, shared straight
from the row.

### 8.2 Team Chat

Internal chat between staff, inside the app.

### 8.3 Data Export

Excel exports of Trips, Invoices, Expenses, Fuel logs, Transporters, Truck owners, Drivers and Trucks.
Delivered as real Excel files, so dates arrive as dates and formulas work. Owner, Manager, Team Leader
and Accountant only.

---

## 9. Alerts & reminders

The app raises three kinds of notification, all in the bell tray, and some as desktop alerts.

| Alert | When | Who gets it |
|---|---|---|
| **Trip reminder** | One hour before every scheduled arrival and departure, on every VR ID | Whoever the run is assigned to, and their leadership |
| **Task update** | A teammate finishes or misses a task | Owner, manager, and that person's team leader |
| **Vendor payment due** | A vendor payment falls due or goes past due — once per payment per day | Owner, manager, accountant |

**Clicking a trip reminder opens that run's update screen directly**, on the right tab, ready to fill
in. A stop already checked in or out is skipped, and sent reminders are remembered so refreshing never
replays them.

Desktop notifications — which show even when the tab is behind other windows — are switched on from
the bell menu.

---

## 10. Records & data safety

### 10.1 What is shared, what is scoped

**Shared with everyone:** transporters, truck owners, drivers, trucks, locations, and all the money —
invoices, expenses, fuel logs, payroll and requests. Add a driver and every colleague sees it at once.

**Scoped to the team:** trips and tours, by the reporting line described in §2.2.

### 10.2 History that cannot be quietly rewritten

Runs keep a permanent record of every change — created, edited, assigned, checked in and out, each VR
ID saved and submitted, diesel requested, cancelled, restored. An update records *what* it altered, so
the sheet shows the sequence of edits rather than only where it landed.

The same applies to vendor payments: every MIS change is stamped with who made it and when.
Reporting-line changes are kept on the employee's own record.

### 10.3 Access

Every person has their own login. Nothing is readable without signing in, and the rules are enforced
on the server, not just hidden in the screen. Documents and photographs are stored in cloud storage
under the same access rules.

---

## 11. Limits & open items

Stated plainly, so nobody is surprised by them.

### 11.1 Known limits

- **Reminders reach a person while the app is open** on their device — including when the tab is
  behind other windows. Reaching a phone with the app fully closed needs mobile push notifications,
  which is separate work.
- **Sending an MIS to a vendor** opens the email ready to send from the user's own mail account.
  Sending automatically from a `sarvaexpress.in` address needs the sending-domain setup below.
- **Password reset and MIS emails** currently send from the system's default address, which is why
  they can land in spam.
- **Mobile-number (SMS) OTP** is not enabled. It requires a paid SMS gateway and DLT/TRAI sender
  registration.

### 11.2 Waiting on the client

1. Point the real domain at the website when ready.
2. Add `sarva-express-253f2.web.app` to the authorised sign-in domains, or login on that address will
   fail.
3. In the Firebase console, set the password-reset **custom action URL**, the **sender name**, and
   **verify the `sarvaexpress.in` sending domain** (a few DNS records) — that last one is what stops
   the emails going to spam.

**Data task:** any vendor MIS raised before 13 August 2026 may be missing its rate card, kilometres,
UTR, TDS and note — a fault that was discarding them on save, now fixed. Opening those rows and
filling the figures back in restores them.
