import { useEffect, useState } from 'react';
import {
  Plus, Phone, Building2, Receipt, FileText, FileWarning, Download, ShieldCheck,
  Clock, FileSignature, ChevronLeft, Pencil, Trash2, BadgeCheck,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, DateInput, Select, Row } from '../../components/ui/Modal.js';
import { ImageUpload } from '../../components/ui/ImageUpload.js';
import { VendorDocs } from '../../components/VendorDocs.js';
import { watchTruckTypes, optionsFor, type TruckType } from '../../lib/truckTypes.js';
import { kycPending, SIGN_BACK_DAYS, type VendorDocKind } from '../../lib/vendorDocs.js';
import { printRateCard } from '../../lib/rateCard.js';
import { rupees, todayFullLabel, isoToLabel, todayIso } from '../../lib/format.js';
import {
  useStore, todayLabel, stageOf, STAGE_LABEL,
  type Customer, type OnboardStage, type EntityType,
} from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { canEditRecords } from '../../lib/roles.js';
import { useNotify } from '../../lib/notify.js';
import {
  nameError, phoneError, aadhaarError, panError, gstError, requiredError, allClear, normalizePhone,
} from '../../lib/validate.js';
import { printAgreement } from '../../lib/agreement.js';
import { printJoiningLetter } from '../../lib/joiningLetter.js';

const ENTITY_TYPES: { id: EntityType; label: string }[] = [
  { id: 'proprietorship', label: 'Proprietorship' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'pvt_ltd', label: 'Private Limited' },
  { id: 'llp', label: 'LLP' },
  { id: 'other', label: 'Other' },
];

const STAGE_TONE: Record<OnboardStage, BadgeTone> = {
  draft: 'neutral', trial: 'accent', agreement_pending: 'warning', active: 'success', rejected: 'danger',
};

/**
 * "Vehicle Types" on the rate card. It's the only row in the client's Img 1.1
 * without "manual update from employee" beside it — so it isn't typed, it's
 * picked from the admin's list, the same list the Truck Register uses.
 */
function VehicleTypesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [types, setTypes] = useState<TruckType[]>([]);
  useEffect(() => watchTruckTypes(setTypes), []);
  const options = optionsFor(types, value);
  return (
    <Field label="Vehicle Types" hint={types.length ? 'From your admin’s truck-type list' : 'Your admin sets this list in the Truck Register'}>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{options.length ? 'Select a vehicle type' : 'No truck types yet'}</option>
        {options.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
      </Select>
    </Field>
  );
}

const EMPTY = {
  name: '', entityType: 'proprietorship' as EntityType, gstin: '', pan: '', aadhaar: '',
  contactName: '', phone: '', phone2: '', email: '',
  addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
  bankAccountName: '', bankAccountNo: '', bankIfsc: '', bankName: '', upiId: '',
  signatoryName: '', signatoryTitle: '',
  rate: '', monthlyCost: '', extraKm: '', avgMonthlyKm: '', vehicleType: '',
  // Img 1.1 additions.
  workingHrs: '', workingDays: '', tollParking: '',
  // Document images — the upload under each number.
  gstinImg: undefined as string | undefined,
  panImg: undefined as string | undefined,
  aadhaarImg: undefined as string | undefined,
  cancelledChequeImg: undefined as string | undefined,
};
type Form = typeof EMPTY;

const AG_EMPTY = { effectiveFrom: '', durationMonths: '12', rate: '', notes: '' };

/** The 7-day trial window the Letter of Intent sets out. */
function trialWindow(): { start: string; end: string } {
  const d = new Date();
  const iso = (x: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  };
  const end = new Date(Date.now() + 6 * 864e5); // 7 calendar days inclusive
  return { start: isoToLabel(iso(d)), end: isoToLabel(iso(end)) };
}

export function Customers() {
  const { customers, addCustomer, setCustomerAgreement, updateCustomer, deleteCustomer } = useStore();
  const { member } = useAuth();
  const { push } = useNotify();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  // Editing/deleting is leadership-only; approving an agreement stays with
  // owner/manager (isAdmin), since that's what makes a vendor usable.
  const canEdit = canEditRecords(member?.role);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [f, setF] = useState<Form>(EMPTY);
  const [tried, setTried] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [agForId, setAgForId] = useState<string | null>(null);
  const agFor = agForId ? customers.find((c) => c.id === agForId) ?? null : null;
  // Held by id and derived live, so uploading a signed copy re-renders the panel
  // instead of freezing the record as it was when the dialog opened.
  const [docsForId, setDocsForId] = useState<string | null>(null);
  const docsFor = docsForId ? customers.find((c) => c.id === docsForId) ?? null : null;
  const [ag, setAg] = useState(AG_EMPTY);
  const [confirmDel, setConfirmDel] = useState<Customer | null>(null);

  const outstanding = customers.reduce((s, c) => s + c.outstandingPaise, 0);
  const onboarded = customers.filter((c) => stageOf(c) === 'active').length;
  const inFlight = customers.filter((c) => ['draft', 'trial', 'agreement_pending'].includes(stageOf(c))).length;

  // ── Validation, per step ────────────────────────────────────────────────────
  // GST-registered vendors give GSTIN + PAN; a proprietor without GST gives
  // PAN + Aadhaar instead (clause 5.5 needs a GSTIN to invoice, 5.8 a PAN for TDS).
  const hasGst = !!f.gstin.trim();
  const errs = {
    name: requiredError(f.name, 'Legal entity name'),
    gstin: hasGst ? gstError(f.gstin) : '',
    pan: panError(f.pan),
    aadhaar: hasGst ? '' : aadhaarError(f.aadhaar),
    contactName: nameError(f.contactName, { label: 'Contact name' }),
    phone: phoneError(f.phone),
    phone2: f.phone2.trim() ? phoneError(f.phone2, { label: 'Second phone' }) : '',
    email: requiredError(f.email, 'Email') || (/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(f.email.trim()) ? '' : 'Enter a valid email'),
    addressLine1: requiredError(f.addressLine1, 'Address line 1'),
    city: nameError(f.city, { label: 'City' }),
    state: nameError(f.state, { label: 'State' }),
    pincode: /^[1-9][0-9]{5}$/.test(f.pincode.trim()) ? '' : 'PIN code must be 6 digits',
    bankAccountName: requiredError(f.bankAccountName, 'Account holder name'),
    bankAccountNo: /^[0-9]{9,18}$/.test(f.bankAccountNo.trim()) ? '' : 'Account number must be 9–18 digits',
    bankIfsc: /^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.bankIfsc.trim().toUpperCase()) ? '' : 'IFSC must look like HDFC0001234',
    bankName: requiredError(f.bankName, 'Bank name'),
    signatoryName: nameError(f.signatoryName, { label: 'Signatory name' }),
    signatoryTitle: requiredError(f.signatoryTitle, 'Signatory title'),
  };
  const STEP_FIELDS: (keyof typeof errs)[][] = [
    ['name', 'gstin', 'pan', 'aadhaar'],
    ['contactName', 'phone', 'phone2', 'email', 'addressLine1', 'city', 'state', 'pincode'],
    ['bankAccountName', 'bankAccountNo', 'bankIfsc', 'bankName'],
    ['signatoryName', 'signatoryTitle'],
  ];
  const stepClear = (n: number) => STEP_FIELDS[n - 1]!.every((k) => !errs[k]);
  const allValid = allClear(errs);

  function startAdd() {
    setF(EMPTY); setStep(1); setTried(false); setEditId(null); setOpen(true);
  }
  function startEdit(c: Customer) {
    setF({
      name: c.name, entityType: c.entityType ?? 'proprietorship', gstin: c.gstin ?? '', pan: c.pan ?? '', aadhaar: c.aadhaar ?? '',
      contactName: c.contactName ?? '', phone: c.phone ?? '', phone2: c.phone2 ?? '', email: c.email ?? '',
      addressLine1: c.addressLine1 ?? '', addressLine2: c.addressLine2 ?? '', city: c.city ?? '', state: c.state ?? '', pincode: c.pincode ?? '',
      bankAccountName: c.bankAccountName ?? '', bankAccountNo: c.bankAccountNo ?? '', bankIfsc: c.bankIfsc ?? '', bankName: c.bankName ?? '', upiId: c.upiId ?? '',
      signatoryName: c.signatoryName ?? '', signatoryTitle: c.signatoryTitle ?? '',
      rate: c.ratePerKmPaise ? String(c.ratePerKmPaise / 100) : '',
      monthlyCost: c.monthlyCostPaise ? String(c.monthlyCostPaise / 100) : '',
      extraKm: c.extraKmPaise ? String(c.extraKmPaise / 100) : '',
      avgMonthlyKm: c.avgMonthlyKm ? String(c.avgMonthlyKm) : '',
      vehicleType: c.vehicleType ?? '',
      workingHrs: c.workingHrs ? String(c.workingHrs) : '',
      workingDays: c.workingDaysPerMonth ? String(c.workingDaysPerMonth) : '',
      tollParking: c.tollParkingPaise ? String(c.tollParkingPaise / 100) : '',
      gstinImg: c.gstinImg, panImg: c.panImg, aadhaarImg: c.aadhaarImg,
      cancelledChequeImg: c.cancelledChequeImg,
    });
    setStep(1); setTried(false); setEditId(c.id); setOpen(true);
  }

  function next() {
    setTried(true);
    if (!stepClear(step)) return;
    setTried(false);
    setStep((s) => Math.min(s + 1, 4));
  }

  function payload() {
    return {
      name: f.name.trim(), entityType: f.entityType,
      gstin: f.gstin.trim().toUpperCase(), pan: f.pan.trim().toUpperCase(), aadhaar: f.aadhaar.trim(),
      contactName: f.contactName.trim(), phone: normalizePhone(f.phone),
      phone2: f.phone2.trim() ? normalizePhone(f.phone2) : '', email: f.email.trim(),
      addressLine1: f.addressLine1.trim(), addressLine2: f.addressLine2.trim(),
      city: f.city.trim(), state: f.state.trim(), pincode: f.pincode.trim(),
      bankAccountName: f.bankAccountName.trim(), bankAccountNo: f.bankAccountNo.trim(),
      bankIfsc: f.bankIfsc.trim().toUpperCase(), bankName: f.bankName.trim(), upiId: f.upiId.trim(),
      signatoryName: f.signatoryName.trim(), signatoryTitle: f.signatoryTitle.trim(),
      // Not collected any more (Img 1.1 has no per-km rate) — startEdit still
      // loads it, so editing an old per-km record preserves what it holds.
      ratePerKmPaise: Math.round(Number(f.rate || '0') * 100),
      monthlyCostPaise: Math.round(Number(f.monthlyCost || '0') * 100),
      extraKmPaise: Math.round(Number(f.extraKm || '0') * 100),
      avgMonthlyKm: Number(f.avgMonthlyKm || '0'),
      vehicleType: f.vehicleType.trim(),
      workingHrs: Number(f.workingHrs || '0'),
      workingDaysPerMonth: Number(f.workingDays || '0'),
      tollParkingPaise: Math.round(Number(f.tollParking || '0') * 100),
      // '' not undefined: the shared-collection writer strips undefined keys, so
      // removing a document that way would silently leave the old one in place.
      gstinImg: f.gstinImg ?? '', panImg: f.panImg ?? '', aadhaarImg: f.aadhaarImg ?? '',
      cancelledChequeImg: f.cancelledChequeImg ?? '',
    };
  }

  function submit() {
    setTried(true);
    if (!allValid) return;
    if (editId) {
      updateCustomer(editId, payload());
      push({ title: 'Transporter updated', body: `${f.name.trim()} saved.`, tone: 'success' });
    } else {
      addCustomer({ ...payload(), stage: 'draft' });
      push({ title: 'Details captured', body: `${f.name.trim()} is a draft — issue the 7-day letter to start the trial.`, tone: 'success' });
    }
    setOpen(false); setF(EMPTY); setStep(1); setTried(false); setEditId(null);
  }

  /** Draft → trial: print the client's Letter of Intent and start the 7 days. */
  function issueLoi(c: Customer) {
    const { start, end } = trialWindow();
    updateCustomer(c.id, {
      stage: 'trial', trialStart: start, trialEnd: end,
      loiIssuedOn: todayFullLabel(),
      // The epoch drives the 7-day signed-back clock — see lib/vendorDocs.
      loiIssuedAtMs: Date.now(),
    });
    printJoiningLetter(
      { name: c.name, contact: c.contactName ?? '', place: [c.addressLine1, c.city].filter(Boolean).join(', '), phone: c.phone, email: c.email ?? '' },
      { startDate: start, endDate: end, employeeName: member?.name },
    );
    push({ title: '7-day trial started', body: `Letter of Intent issued to ${c.name} · trial ends ${end}.`, tone: 'success' });
  }

  const vendorParty = (c: Customer) => ({
    name: c.name, contact: c.contactName ?? '',
    place: [c.addressLine1, c.city].filter(Boolean).join(', '),
    phone: c.phone, email: c.email ?? '', gstin: c.gstin,
  });

  /** Generate a document filled in, and stamp the day it went out. */
  function sendDoc(c: Customer, kind: VendorDocKind) {
    const emp = member?.name;
    const on = todayFullLabel();
    const at = Date.now();
    if (kind === 'rateCard') {
      printRateCard(vendorParty(c), {
        avgMonthlyKm: c.avgMonthlyKm, workingHrs: c.workingHrs,
        workingDaysPerMonth: c.workingDaysPerMonth, vehicleType: c.vehicleType,
        monthlyCostPaise: c.monthlyCostPaise, extraKmPaise: c.extraKmPaise,
        tollParkingPaise: c.tollParkingPaise,
      }, emp);
      if (!c.rateCardSentOn) updateCustomer(c.id, { rateCardSentOn: on, rateCardSentAtMs: at });
      return;
    }
    if (kind === 'loi') {
      // Re-sending must not restart the trial or the 7-day clock.
      if (!c.loiIssuedOn) { issueLoi(c); return; }
      printJoiningLetter(vendorParty(c), { startDate: c.trialStart, endDate: c.trialEnd, employeeName: emp });
      return;
    }
    // The agreement goes out to be signed before it's approved, so fall back to
    // a provisional one built from their rate contract when none exists yet.
    const ag = c.agreement ?? {
      createdOn: todayLabel(), effectiveFrom: todayLabel(), durationMonths: 12,
      ...(c.ratePerKmPaise ? { ratePerKmPaise: c.ratePerKmPaise } : {}),
    };
    printAgreement('customer', { name: c.name, gstin: c.gstin, place: [c.addressLine1, c.city].filter(Boolean).join(', '), phone: c.phone }, ag, emp);
    if (!c.agreementSentOn) updateCustomer(c.id, { agreementSentOn: on, agreementSentAtMs: at });
  }

  /** The signed copy came back — or was removed. '' clears it (the writer drops
   *  undefined keys, so undefined would silently keep the old file). */
  function setSigned(c: Customer, kind: VendorDocKind, img: string | undefined) {
    const v = img ?? '';
    updateCustomer(c.id, kind === 'rateCard' ? { rateCardSignedImg: v }
      : kind === 'loi' ? { loiSignedImg: v } : { agreementSignedImg: v });
  }

  function openAgreement(c: Customer) {
    setAg({
      effectiveFrom: todayLabel(), durationMonths: '12',
      rate: c.ratePerKmPaise ? String(c.ratePerKmPaise / 100) : '', notes: '',
    });
    setAgForId(c.id);
  }

  /** Trial → active: the formal agreement is signed, so they're onboarded. */
  function approveAgreement(download: boolean) {
    if (!agFor) return;
    const agreement = {
      createdOn: todayLabel(), effectiveFrom: ag.effectiveFrom || todayLabel(),
      durationMonths: Number(ag.durationMonths) || 12,
      ...(ag.rate ? { ratePerKmPaise: Math.round(Number(ag.rate) * 100) } : {}),
      ...(ag.notes ? { notes: ag.notes } : {}),
    };
    setCustomerAgreement(agFor.id, agreement);
    updateCustomer(agFor.id, {
      stage: 'active', agreementApprovedOn: todayFullLabel(), agreementApprovedBy: member?.name ?? '',
    });
    if (download) {
      printAgreement('customer',
        { name: agFor.name, gstin: agFor.gstin, place: [agFor.addressLine1, agFor.city].filter(Boolean).join(', '), phone: agFor.phone },
        agreement);
    }
    push({ title: 'Transporter onboarded', body: `${agFor.name}'s agreement is approved — they can now be put on trips.`, tone: 'success' });
    setAgForId(null);
  }

  /** Once the 7-day window has passed, a trial vendor is awaiting their agreement. */
  function effectiveStage(c: Customer): OnboardStage {
    const s = stageOf(c);
    if (s !== 'trial' || !c.trialEnd) return s;
    const end = new Date(c.trialEnd);
    return !isNaN(end.getTime()) && Date.now() > end.getTime() + 864e5 ? 'agreement_pending' : s;
  }

  const stepTitle = ['Company & legal', 'Contact & address', 'Payment details', 'Rate contract & signatory'][step - 1];

  return (
    <PartnerLayout title="Transporters" subtitle="Onboarding, agreements, rate contracts & dues">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Transporters" value={String(customers.length)} hint="on file" tone="primary" icon={<Building2 size={14} />} />
          <KpiCard label="Onboarded" value={String(onboarded)} hint="agreement approved" tone="success" icon={<ShieldCheck size={14} />} />
          <KpiCard label="In onboarding" value={String(inFlight)} hint="not usable yet" tone="danger" icon={<Clock size={14} />} />
          <KpiCard label="Total dues" value={rupees(outstanding)} hint="receivable" tone="accent" icon={<Receipt size={14} />} />
        </section>

        <Card>
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-neutral-800">Transporter directory</h3>
            <Button size="sm" onClick={startAdd}><Plus size={13} /> Add transporter</Button>
          </div>
          <Table>
            <THead>
              <Tr><Th>Company</Th><Th>Onboarding</Th><Th>GSTIN / PAN</Th><Th>City</Th><Th className="text-right">Rate</Th><Th className="text-right">Outstanding</Th><Th></Th></Tr>
            </THead>
            <TBody>
              {customers.map((c) => {
                const st = effectiveStage(c);
                return (
                  <Tr key={c.id}>
                    <Td>
                      <div className="font-semibold text-neutral-900">{c.name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-400"><Phone size={10} /> {c.phone}{c.contactName ? ` · ${c.contactName}` : ''}</div>
                    </Td>
                    <Td>
                      <Badge tone={STAGE_TONE[st]}>{st === 'active' ? <ShieldCheck size={11} /> : st === 'trial' ? <Clock size={11} /> : <FileSignature size={11} />} {STAGE_LABEL[st]}</Badge>
                      {st === 'trial' && c.trialEnd && <div className="mt-0.5 text-[10px] text-neutral-400">ends {c.trialEnd}</div>}
                      {st === 'active' && c.agreementApprovedOn && <div className="mt-0.5 text-[10px] text-neutral-400">{c.agreementApprovedOn}</div>}
                    </Td>
                    <Td className="font-mono text-[11px] text-neutral-500">{c.gstin || c.pan || '—'}</Td>
                    <Td className="text-neutral-600">{c.city || '—'}</Td>
                    <Td className="text-right text-neutral-700">{c.ratePerKmPaise ? `${rupees(c.ratePerKmPaise)}/km` : c.monthlyCostPaise ? `${rupees(c.monthlyCostPaise)}/mo` : '—'}</Td>
                    <Td className="text-right">
                      {c.outstandingPaise > 0
                        ? <span className="font-bold text-rose-600">{rupees(c.outstandingPaise)}</span>
                        : <Badge tone="success">Clear</Badge>}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        {st === 'draft' && <Button size="sm" onClick={() => issueLoi(c)}><FileText size={12} /> Issue 7-day letter</Button>}
                        {(st === 'trial' || st === 'agreement_pending') && (
                          isAdmin
                            ? <Button size="sm" onClick={() => openAgreement(c)}><FileSignature size={12} /> Approve agreement</Button>
                            : <span className="text-[11px] text-neutral-400">Awaiting owner approval</span>
                        )}
                        {st === 'active' && c.agreement && (
                          <button onClick={() => printAgreement('customer', { name: c.name, gstin: c.gstin, place: [c.addressLine1, c.city].filter(Boolean).join(', '), phone: c.phone }, c.agreement!)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><Download size={12} /> Agreement</button>
                        )}
                        <button onClick={() => setDocsForId(c.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-primary-600" title="Rate card, joining letter & agreement">
                          <FileText size={12} /> Documents
                          {kycPending(c) && <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" title="KYC pending" />}
                        </button>
                        {canEdit && <button onClick={() => startEdit(c)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit transporter"><Pencil size={14} /></button>}
                        {canEdit && <button onClick={() => setConfirmDel(c)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600" title="Delete transporter"><Trash2 size={14} /></button>}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </Card>
        <p className="text-xs text-neutral-500">
          A transporter is onboarded in the order the agreements set out: capture their details, issue the <b>7-day Letter of Intent</b>,
          run the trial, then approve the <b>Service Agreement</b> before the eighth day. Only an onboarded transporter can be put on a trip.
        </p>
      </div>

      {/* Onboarding wizard */}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editId ? `Edit · ${f.name || 'transporter'}` : 'Onboard transporter'}
        subtitle={`Step ${step} of 4 — ${stepTitle}`}
        onSubmit={step < 4 ? next : submit} submitLabel={step < 4 ? 'Next' : editId ? 'Save changes' : 'Capture details'} wide>

        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-primary-500' : 'bg-neutral-200'}`} />
          ))}
        </div>
        {tried && !stepClear(step) && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
            Fill every field marked <span className="text-rose-500">*</span> to continue.
          </div>
        )}

        {step === 1 && (
          <>
            <Field label="Legal entity name" required hint="Exactly as it should appear on the agreement" error={tried ? errs.name : undefined}>
              <TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="S L V Transport" autoFocus />
            </Field>
            <Field label="Entity type" required>
              <Select value={f.entityType} onChange={(e) => setF({ ...f, entityType: e.target.value as EntityType })}>
                {ENTITY_TYPES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </Select>
            </Field>
            {/* Each identity document gets its own upload right under the number
                it belongs to — the client's "uploading of documents option below
                every section". */}
            <Field label="GSTIN" hint="Leave blank if they aren't GST-registered — then Aadhaar is required" error={tried ? errs.gstin : undefined}>
              <TextInput value={f.gstin} onChange={(e) => setF({ ...f, gstin: e.target.value.toUpperCase() })} placeholder="29ABCDE1234F1Z5" />
            </Field>
            <Field label="GST certificate">
              <ImageUpload value={f.gstinImg} onChange={(v) => setF({ ...f, gstinImg: v })} label="Upload GST certificate" path={`documents/transporters/${editId ?? 'new'}/gstin`} />
            </Field>
            <Row>
              <Field label="PAN" required hint="Needed for TDS" error={tried ? errs.pan : undefined}>
                <TextInput value={f.pan} onChange={(e) => setF({ ...f, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
              </Field>
              <Field label="Aadhaar" required={!hasGst} hint={hasGst ? 'Not needed — GST registered' : 'Required without a GSTIN'} error={tried ? errs.aadhaar : undefined}>
                <TextInput inputMode="numeric" disabled={hasGst} value={f.aadhaar} onChange={(e) => setF({ ...f, aadhaar: e.target.value })} placeholder="4821 7745 9012" />
              </Field>
            </Row>
            <Row>
              <Field label="PAN card">
                <ImageUpload value={f.panImg} onChange={(v) => setF({ ...f, panImg: v })} label="Upload PAN" path={`documents/transporters/${editId ?? 'new'}/pan`} />
              </Field>
              <Field label="Aadhaar card">
                <ImageUpload value={f.aadhaarImg} onChange={(v) => setF({ ...f, aadhaarImg: v })} label="Upload Aadhaar" path={`documents/transporters/${editId ?? 'new'}/aadhaar`} />
              </Field>
            </Row>
          </>
        )}

        {step === 2 && (
          <>
            <Row>
              <Field label="Contact person" required hint="The Letter of Intent is addressed to them" error={tried ? errs.contactName : undefined}>
                <TextInput value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} placeholder="Mahesh Gowda" autoFocus />
              </Field>
              <Field label="Email" required error={tried ? errs.email : undefined}>
                <TextInput type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="vendor@company.com" />
              </Field>
            </Row>
            <Row>
              <Field label="Phone" required error={tried ? errs.phone : undefined}>
                <TextInput inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="9876543210" />
              </Field>
              <Field label="Second phone" hint="Optional" error={tried ? errs.phone2 : undefined}>
                <TextInput inputMode="numeric" maxLength={10} value={f.phone2} onChange={(e) => setF({ ...f, phone2: e.target.value })} placeholder="9876543211" />
              </Field>
            </Row>
            <Field label="Address line 1" required hint="Registered / office address for the agreement" error={tried ? errs.addressLine1 : undefined}>
              <TextInput value={f.addressLine1} onChange={(e) => setF({ ...f, addressLine1: e.target.value })} placeholder="No. 46, 12th Main Rd" />
            </Field>
            <Field label="Address line 2" hint="Optional">
              <TextInput value={f.addressLine2} onChange={(e) => setF({ ...f, addressLine2: e.target.value })} placeholder="Shakambari Nagar, 1st Phase" />
            </Field>
            <Row>
              <Field label="City" required error={tried ? errs.city : undefined}>
                <TextInput value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Bengaluru" />
              </Field>
              <Field label="State" required error={tried ? errs.state : undefined}>
                <TextInput value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} placeholder="Karnataka" />
              </Field>
            </Row>
            <Field label="PIN code" required error={tried ? errs.pincode : undefined}>
              <TextInput inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value })} placeholder="560078" />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <p className="rounded-lg bg-primary-50 px-3 py-2 text-[11px] text-primary-800 ring-1 ring-inset ring-primary-100">
              How their monthly payout goes out. The agreement pays the first undisputed invoice within 45 days, then 14 days thereafter.
            </p>
            <Field label="Account holder name" required error={tried ? errs.bankAccountName : undefined}>
              <TextInput value={f.bankAccountName} onChange={(e) => setF({ ...f, bankAccountName: e.target.value })} placeholder="S L V Transport" autoFocus />
            </Field>
            <Row>
              <Field label="Account number" required error={tried ? errs.bankAccountNo : undefined}>
                <TextInput inputMode="numeric" value={f.bankAccountNo} onChange={(e) => setF({ ...f, bankAccountNo: e.target.value })} placeholder="50100123456789" />
              </Field>
              <Field label="IFSC" required error={tried ? errs.bankIfsc : undefined}>
                <TextInput value={f.bankIfsc} onChange={(e) => setF({ ...f, bankIfsc: e.target.value.toUpperCase() })} placeholder="HDFC0001234" />
              </Field>
            </Row>
            <Row>
              <Field label="Bank & branch" required error={tried ? errs.bankName : undefined}>
                <TextInput value={f.bankName} onChange={(e) => setF({ ...f, bankName: e.target.value })} placeholder="HDFC Bank, JP Nagar" />
              </Field>
              <Field label="UPI ID" hint="Optional">
                <TextInput value={f.upiId} onChange={(e) => setF({ ...f, upiId: e.target.value })} placeholder="name@okhdfcbank" />
              </Field>
            </Row>
            <Field label="Cancelled cheque" hint="Proves the account belongs to them before any payout goes out">
              <ImageUpload value={f.cancelledChequeImg} onChange={(v) => setF({ ...f, cancelledChequeImg: v })} label="Upload cancelled cheque" path={`documents/transporters/${editId ?? 'new'}/cheque`} />
            </Field>
          </>
        )}

        {step === 4 && (
          <>
            <Row>
              <Field label="Authorised signatory" required hint="Signs the agreement for them" error={tried ? errs.signatoryName : undefined}>
                <TextInput value={f.signatoryName} onChange={(e) => setF({ ...f, signatoryName: e.target.value })} placeholder="Mahesh Gowda" autoFocus />
              </Field>
              <Field label="Title" required error={tried ? errs.signatoryTitle : undefined}>
                <TextInput value={f.signatoryTitle} onChange={(e) => setF({ ...f, signatoryTitle: e.target.value })} placeholder="Proprietor" />
              </Field>
            </Row>
            {/* Rate contract — Annexure B, in the client's own "Img 1.1" shape.
                Their real contracts are monthly (₹1,70,000/mo + ₹12/extra km),
                which is why Img 1.1 has no per-km rate — so this form no longer
                asks for one. Existing per-km records keep whatever they hold. */}
            <p className="rounded-lg bg-primary-50 px-3 py-2 text-[11px] text-primary-800 ring-1 ring-inset ring-primary-100">
              Rate contract — Annexure B of the Service Agreement.
            </p>
            <Row>
              <Field label="Average Monthly KM"><TextInput type="number" value={f.avgMonthlyKm} onChange={(e) => setF({ ...f, avgMonthlyKm: e.target.value })} placeholder="6000" /></Field>
              <Field label="Working hrs" hint="Per day"><TextInput type="number" value={f.workingHrs} onChange={(e) => setF({ ...f, workingHrs: e.target.value })} placeholder="12" /></Field>
            </Row>
            <Row>
              <Field label="Working Days/Month"><TextInput type="number" value={f.workingDays} onChange={(e) => setF({ ...f, workingDays: e.target.value })} placeholder="26" /></Field>
              <VehicleTypesField value={f.vehicleType} onChange={(v) => setF({ ...f, vehicleType: v })} />
            </Row>
            <Row>
              <Field label="Monthly cost per Vehicle (₹)"><TextInput type="number" value={f.monthlyCost} onChange={(e) => setF({ ...f, monthlyCost: e.target.value })} placeholder="170000" /></Field>
              <Field label="Extra KM Charge per Vehicle (₹)"><TextInput type="number" value={f.extraKm} onChange={(e) => setF({ ...f, extraKm: e.target.value })} placeholder="12" /></Field>
            </Row>
            <Field label="Toll / Parking (₹)" hint="Monthly allowance, if it's on the contract"><TextInput type="number" value={f.tollParking} onChange={(e) => setF({ ...f, tollParking: e.target.value })} placeholder="3000" /></Field>
          </>
        )}

        {step > 1 && (
          <button type="button" onClick={() => { setTried(false); setStep((s) => s - 1); }}
            className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-primary-600">
            <ChevronLeft size={13} /> Back
          </button>
        )}
      </Modal>

      {/* Approve agreement → onboarded */}
      <Modal open={!!agFor} onClose={() => setAgForId(null)} title={`Service Agreement · ${agFor?.name ?? ''}`}
        subtitle="Approving this onboards them — they become usable on trips"
        onSubmit={() => approveAgreement(true)} submitLabel="Approve & download">
        <Row>
          <Field label="Effective from" required><DateInput value={ag.effectiveFrom} onChange={(v) => setAg({ ...ag, effectiveFrom: v })} /></Field>
          <Field label="Duration (months)" required><TextInput type="number" value={ag.durationMonths} onChange={(e) => setAg({ ...ag, durationMonths: e.target.value })} placeholder="12" /></Field>
        </Row>
        <Field label="Freight rate (₹/km)" hint="Optional"><TextInput type="number" value={ag.rate} onChange={(e) => setAg({ ...ag, rate: e.target.value })} placeholder="42" /></Field>
        <Field label="Special terms" hint="Optional"><TextInput value={ag.notes} onChange={(e) => setAg({ ...ag, notes: e.target.value })} placeholder="Monthly billing, 30-day credit" /></Field>
        {agFor && stageOf(agFor) === 'trial' && agFor.trialEnd && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">
            Their 7-day trial ends <b>{agFor.trialEnd}</b>. The Letter of Intent requires the formal agreement to be signed before the eighth day.
          </p>
        )}
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 ring-1 ring-inset ring-emerald-100">
          <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} /> Approving marks them onboarded.</span>
          <button type="button" onClick={() => approveAgreement(false)} className="font-bold text-emerald-700 hover:underline">Approve without download</button>
        </div>
      </Modal>

      {/* Rate card → joining letter → agreement, and the signed copies back */}
      {docsFor && (
        <Modal open onClose={() => setDocsForId(null)} title={`Documents · ${docsFor.name}`}
          subtitle="Send each one filled in, then upload the signed copy the vendor returns"
          onSubmit={() => setDocsForId(null)} submitLabel="Done" wide>
          {kycPending(docsFor) && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800 ring-1 ring-inset ring-rose-100">
              KYC pending — the joining letter went out over {SIGN_BACK_DAYS} days ago and no signed copy has come back.
            </p>
          )}
          <VendorDocs
            state={docsFor}
            path={`documents/transporters/${docsFor.id}`}
            onSend={(kind) => sendDoc(docsFor, kind)}
            onSigned={(kind, img) => setSigned(docsFor, kind, img)}
          />
        </Modal>
      )}

      {/* Delete */}
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title={`Delete ${confirmDel.name}?`} subtitle="This removes them for everyone"
          onSubmit={() => { deleteCustomer(confirmDel.id); push({ title: 'Deleted', body: `${confirmDel.name} removed.`, tone: 'info' }); setConfirmDel(null); }}
          submitLabel="Delete">
          <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-100">
            <b>{confirmDel.name}</b> will be removed from the shared transporter list for the whole team. Trips and invoices already raised keep their record. This can't be undone.
          </p>
        </Modal>
      )}
    </PartnerLayout>
  );
}
