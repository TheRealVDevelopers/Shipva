import { useState } from 'react';
import {
  Truck as TruckIcon, Phone, HandCoins, FileText, FileWarning, Download, Plus,
  ShieldCheck, ShieldAlert, Clock, FileSignature, ChevronLeft, Pencil, Trash2, BadgeCheck,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, DateInput, Select, Row } from '../../components/ui/Modal.js';
import { ImageUpload } from '../../components/ui/ImageUpload.js';
import { rupees, todayFullLabel, isoToLabel } from '../../lib/format.js';
import {
  useStore, todayLabel, ownerStageOf, kycOf, STAGE_LABEL,
  type AttachedTruck, type OnboardStage, type KycState,
} from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { canEditRecords } from '../../lib/roles.js';
import {
  nameError, phoneError, aadhaarError, panError, gstError, vehicleRegError,
  requiredError, allClear, normalizePhone,
} from '../../lib/validate.js';
import { printAgreement } from '../../lib/agreement.js';
import { printJoiningLetter } from '../../lib/joiningLetter.js';
import { useNotify } from '../../lib/notify.js';

const STAGE_TONE: Record<OnboardStage, BadgeTone> = {
  draft: 'neutral', trial: 'accent', agreement_pending: 'warning', active: 'success', rejected: 'danger',
};
const KYC_TONE: Record<KycState, BadgeTone> = { pending: 'warning', verified: 'success', rejected: 'danger' };

const AG_EMPTY = { effectiveFrom: '', durationMonths: '24', commission: '', notes: '' };

const EMPTY = {
  owner: '', transporterName: '', reg: '', phone: '', phone2: '',
  pan: '', aadhaar: '', gstin: '',
  addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
  bankAccountName: '', bankAccountNo: '', bankIfsc: '', bankName: '', upiId: '',
  // Document images — no GST certificate, per the client.
  panImg: undefined as string | undefined,
  aadhaarImg: undefined as string | undefined,
  cancelledChequeImg: undefined as string | undefined,
};
type Form = typeof EMPTY;

function trialWindow(): { start: string; end: string } {
  const p = (n: number) => String(n).padStart(2, '0');
  const iso = (x: Date) => `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  return { start: isoToLabel(iso(new Date())), end: isoToLabel(iso(new Date(Date.now() + 6 * 864e5))) };
}

export function Payables() {
  const { attached, setAttachedAgreement, recordOwnerPayment, addAttached, updateAttached, deleteAttached } = useStore();
  const { member } = useAuth();
  const { push } = useNotify();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  // Editing/deleting is leadership-only; KYC verification stays owner/manager.
  const canEdit = canEditRecords(member?.role);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [f, setF] = useState<Form>(EMPTY);
  const [tried, setTried] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [agForId, setAgForId] = useState<string | null>(null);
  const agFor = agForId ? attached.find((a) => a.id === agForId) ?? null : null;
  const [ag, setAg] = useState(AG_EMPTY);

  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ id: '', amount: '' });
  const [kycForId, setKycForId] = useState<string | null>(null);
  const kycFor = kycForId ? attached.find((a) => a.id === kycForId) ?? null : null;
  const [confirmDel, setConfirmDel] = useState<AttachedTruck | null>(null);

  const totalPayable = attached.reduce((s, a) => s + a.balancePaise, 0);
  const owed = attached.filter((a) => a.balancePaise > 0).length;
  const kycPending = attached.filter((a) => kycOf(a) !== 'verified').length;
  const totalTrips = attached.reduce((s, a) => s + a.trips, 0);

  // ── Validation ──────────────────────────────────────────────────────────────
  const hasGst = !!f.gstin.trim();
  const errs = {
    owner: nameError(f.owner, { label: 'Owner name' }),
    transporterName: '',                                   // optional — independents have none
    reg: vehicleRegError(f.reg),
    phone: phoneError(f.phone),
    phone2: f.phone2.trim() ? phoneError(f.phone2, { label: 'Second phone' }) : '',
    pan: panError(f.pan),
    aadhaar: aadhaarError(f.aadhaar),
    gstin: hasGst ? gstError(f.gstin) : '',
    addressLine1: requiredError(f.addressLine1, 'Address line 1'),
    city: nameError(f.city, { label: 'City' }),
    state: nameError(f.state, { label: 'State' }),
    pincode: /^[1-9][0-9]{5}$/.test(f.pincode.trim()) ? '' : 'PIN code must be 6 digits',
    bankAccountName: requiredError(f.bankAccountName, 'Account holder name'),
    bankAccountNo: /^[0-9]{9,18}$/.test(f.bankAccountNo.trim()) ? '' : 'Account number must be 9–18 digits',
    bankIfsc: /^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.bankIfsc.trim().toUpperCase()) ? '' : 'IFSC must look like HDFC0001234',
    bankName: requiredError(f.bankName, 'Bank name'),
  };
  const STEP_FIELDS: (keyof typeof errs)[][] = [
    ['owner', 'transporterName', 'reg', 'phone', 'phone2'],
    ['pan', 'aadhaar', 'gstin', 'addressLine1', 'city', 'state', 'pincode'],
    ['bankAccountName', 'bankAccountNo', 'bankIfsc', 'bankName'],
  ];
  const stepClear = (n: number) => STEP_FIELDS[n - 1]!.every((k) => !errs[k]);
  const allValid = allClear(errs);

  function startAdd() { setF(EMPTY); setStep(1); setTried(false); setEditId(null); setOpen(true); }
  function startEdit(a: AttachedTruck) {
    setF({
      owner: a.owner, transporterName: a.transporterName ?? '', reg: a.reg, phone: a.phone, phone2: a.phone2 ?? '',
      pan: a.pan ?? '', aadhaar: a.aadhaar ?? '', gstin: a.gstin ?? '',
      addressLine1: a.addressLine1 ?? '', addressLine2: a.addressLine2 ?? '', city: a.city ?? '', state: a.state ?? '', pincode: a.pincode ?? '',
      bankAccountName: a.bankAccountName ?? '', bankAccountNo: a.bankAccountNo ?? '', bankIfsc: a.bankIfsc ?? '', bankName: a.bankName ?? '', upiId: a.upiId ?? '',
      panImg: a.panImg, aadhaarImg: a.aadhaarImg, cancelledChequeImg: a.cancelledChequeImg,
    });
    setStep(1); setTried(false); setEditId(a.id); setOpen(true);
  }
  function next() {
    setTried(true);
    if (!stepClear(step)) return;
    setTried(false); setStep((s) => Math.min(s + 1, 3));
  }
  function payload() {
    return {
      owner: f.owner.trim(), transporterName: f.transporterName.trim(),
      reg: f.reg.trim().toUpperCase(), phone: normalizePhone(f.phone),
      phone2: f.phone2.trim() ? normalizePhone(f.phone2) : '',
      pan: f.pan.trim().toUpperCase(), aadhaar: f.aadhaar.trim(), gstin: f.gstin.trim().toUpperCase(),
      addressLine1: f.addressLine1.trim(), addressLine2: f.addressLine2.trim(),
      city: f.city.trim(), state: f.state.trim(), pincode: f.pincode.trim(),
      bankAccountName: f.bankAccountName.trim(), bankAccountNo: f.bankAccountNo.trim(),
      bankIfsc: f.bankIfsc.trim().toUpperCase(), bankName: f.bankName.trim(), upiId: f.upiId.trim(),
      // '' not undefined: the shared-collection writer strips undefined keys, so
      // removing a document that way would silently leave the old one in place.
      panImg: f.panImg ?? '', aadhaarImg: f.aadhaarImg ?? '', cancelledChequeImg: f.cancelledChequeImg ?? '',
    };
  }
  function submit() {
    setTried(true);
    if (!allValid) return;
    if (editId) {
      updateAttached(editId, payload());
      push({ title: 'Owner updated', body: `${f.owner.trim()} saved.`, tone: 'success' });
    } else {
      addAttached({ ...payload(), balancePaise: 0, trips: 0, stage: 'draft', kycStatus: 'pending' });
      push({ title: 'Details captured', body: `${f.owner.trim()} is a draft — verify KYC and issue the 7-day letter.`, tone: 'success' });
    }
    setOpen(false); setF(EMPTY); setStep(1); setTried(false); setEditId(null);
  }

  function issueLoi(a: AttachedTruck) {
    const { start, end } = trialWindow();
    updateAttached(a.id, { stage: 'trial', trialStart: start, trialEnd: end, loiIssuedOn: todayFullLabel() });
    printJoiningLetter(
      { name: a.transporterName || a.owner, contact: a.owner, place: [a.addressLine1, a.city].filter(Boolean).join(', '), phone: a.phone },
      { startDate: start, endDate: end },
    );
    push({ title: '7-day trial started', body: `Letter of Intent issued to ${a.owner} · trial ends ${end}.`, tone: 'success' });
  }

  function setKyc(a: AttachedTruck, status: KycState) {
    updateAttached(a.id, {
      kycStatus: status,
      kycVerifiedBy: status === 'verified' ? member?.name ?? '' : '',
      kycVerifiedOn: status === 'verified' ? todayFullLabel() : '',
    });
    push({
      title: status === 'verified' ? 'KYC verified' : status === 'rejected' ? 'KYC rejected' : 'KYC reset',
      body: `${a.owner}'s identity documents marked ${status}.`,
      tone: status === 'verified' ? 'success' : 'warning',
    });
    setKycForId(null);
  }

  function openAgreement(a: AttachedTruck) {
    setAg({
      effectiveFrom: todayLabel(), durationMonths: '24',
      commission: a.agreement?.commissionPct ? String(a.agreement.commissionPct) : '', notes: '',
    });
    setAgForId(a.id);
  }
  function approveAgreement(download: boolean) {
    if (!agFor) return;
    const agreement = {
      createdOn: todayLabel(), effectiveFrom: ag.effectiveFrom || todayLabel(),
      durationMonths: Number(ag.durationMonths) || 24,
      ...(ag.commission ? { commissionPct: Number(ag.commission) } : {}),
      ...(ag.notes ? { notes: ag.notes } : {}),
    };
    setAttachedAgreement(agFor.id, agreement);
    updateAttached(agFor.id, { stage: 'active', agreementApprovedOn: todayFullLabel(), agreementApprovedBy: member?.name ?? '' });
    if (download) {
      printAgreement('truck-owner',
        { name: agFor.owner, gstin: agFor.gstin ?? '', place: [agFor.addressLine1, agFor.city].filter(Boolean).join(', '), phone: agFor.phone },
        agreement);
    }
    push({ title: 'Owner onboarded', body: `${agFor.owner}'s agreement is approved.`, tone: 'success' });
    setAgForId(null);
  }

  function submitPayment() {
    const amt = Math.round(Number(pay.amount) * 100);
    if (!pay.id || !(amt > 0)) return;
    recordOwnerPayment(pay.id, amt);
    push({ title: 'Payment recorded', body: `${rupees(amt)} paid.`, tone: 'success' });
    setPay({ id: '', amount: '' }); setPayOpen(false);
  }

  function effectiveStage(a: AttachedTruck): OnboardStage {
    const s = ownerStageOf(a);
    if (s !== 'trial' || !a.trialEnd) return s;
    const end = new Date(a.trialEnd);
    return !isNaN(end.getTime()) && Date.now() > end.getTime() + 864e5 ? 'agreement_pending' : s;
  }

  const stepTitle = ['Owner & vehicle', 'KYC & address', 'Payment details'][step - 1];

  return (
    <PartnerLayout title="Truck Owners" subtitle="Attached / market trucks, KYC, agreements & balances">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Attached trucks" value={String(attached.length)} hint="market vehicles" tone="primary" icon={<TruckIcon size={14} />} />
          <KpiCard label="KYC pending" value={String(kycPending)} hint="not verified" tone="danger" icon={<ShieldAlert size={14} />} />
          <KpiCard label="Total payable" value={rupees(totalPayable)} hint={`${owed} owed`} tone="accent" icon={<HandCoins size={14} />} />
          <KpiCard label="Trips (market)" value={String(totalTrips)} hint="via attached" tone="success" />
        </section>

        <Card>
          <CardHeader title="Truck-owner ledger" subtitle="Balances owed to attached vehicles"
            action={
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPayOpen(true)}><HandCoins size={13} /> Record payment</Button>
                <Button size="sm" onClick={startAdd}><Plus size={13} /> Add owner</Button>
              </div>
            } />
          <Table>
            <THead>
              <Tr><Th>Owner</Th><Th>Transporter</Th><Th>Vehicle</Th><Th>KYC</Th><Th>Onboarding</Th><Th className="text-right">Balance</Th><Th></Th></Tr>
            </THead>
            <TBody>
              {attached.map((a) => {
                const st = effectiveStage(a);
                const kyc = kycOf(a);
                return (
                  <Tr key={a.id}>
                    <Td>
                      <div className="font-semibold text-neutral-900">{a.owner}</div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                        <Phone size={10} /> {a.phone}{a.phone2 ? ` · ${a.phone2}` : ''}
                      </div>
                    </Td>
                    <Td className="text-neutral-600">{a.transporterName || <span className="text-neutral-400">Independent</span>}</Td>
                    <Td className="font-mono text-xs text-neutral-700">{a.reg}</Td>
                    <Td>
                      <button onClick={() => setKycForId(a.id)} className="cursor-pointer" title="Review KYC">
                        <Badge tone={KYC_TONE[kyc]}>
                          {kyc === 'verified' ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />} {kyc === 'verified' ? 'Verified' : kyc === 'rejected' ? 'Rejected' : 'KYC pending'}
                        </Badge>
                      </button>
                    </Td>
                    <Td>
                      <Badge tone={STAGE_TONE[st]}>
                        {st === 'active' ? <ShieldCheck size={11} /> : st === 'trial' ? <Clock size={11} /> : <FileSignature size={11} />} {STAGE_LABEL[st]}
                      </Badge>
                      {st === 'trial' && a.trialEnd && <div className="mt-0.5 text-[10px] text-neutral-400">ends {a.trialEnd}</div>}
                    </Td>
                    <Td className="text-right">
                      {a.balancePaise > 0 ? <span className="font-bold text-rose-600">{rupees(a.balancePaise)}</span> : <Badge tone="success">Settled</Badge>}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        {st === 'draft' && <Button size="sm" onClick={() => issueLoi(a)}><FileText size={12} /> Issue 7-day letter</Button>}
                        {(st === 'trial' || st === 'agreement_pending') && (
                          isAdmin
                            ? <Button size="sm" onClick={() => openAgreement(a)}><FileSignature size={12} /> Approve agreement</Button>
                            : <span className="text-[11px] text-neutral-400">Awaiting owner approval</span>
                        )}
                        {st === 'active' && (a.agreement
                          ? <button onClick={() => printAgreement('truck-owner', { name: a.owner, gstin: a.gstin ?? '', place: [a.addressLine1, a.city].filter(Boolean).join(', '), phone: a.phone }, a.agreement!)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><Download size={12} /> Agreement</button>
                          : <Button size="sm" onClick={() => openAgreement(a)}><FileWarning size={12} /> Create agreement</Button>)}
                        {canEdit && <button onClick={() => startEdit(a)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit owner"><Pencil size={14} /></button>}
                        {canEdit && <button onClick={() => setConfirmDel(a)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600" title="Delete owner"><Trash2 size={14} /></button>}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </Card>
        <p className="text-xs text-neutral-500">
          Owner and transporter are kept apart — a vehicle owner often runs under someone else's transport company. Identity papers (PAN, Aadhaar,
          and GSTIN when they have one) are verified by an owner or manager, and the attachment agreement follows the same
          <b> 7-day letter → agreement</b> order as a transporter.
        </p>
      </div>

      {/* Add / edit owner */}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editId ? `Edit · ${f.owner || 'owner'}` : 'Add truck owner'}
        subtitle={`Step ${step} of 3 — ${stepTitle}`}
        onSubmit={step < 3 ? next : submit} submitLabel={step < 3 ? 'Next' : editId ? 'Save changes' : 'Capture details'} wide>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((n) => <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-primary-500' : 'bg-neutral-200'}`} />)}
        </div>
        {tried && !stepClear(step) && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
            Fill every field marked <span className="text-rose-500">*</span> to continue.
          </div>
        )}

        {step === 1 && (
          <>
            <Row>
              <Field label="Owner name" required hint="The person who owns the vehicle" error={tried ? errs.owner : undefined}>
                <TextInput value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} placeholder="M. Khan" autoFocus />
              </Field>
              <Field label="Transporter name" hint="Optional — blank if independent">
                <TextInput value={f.transporterName} onChange={(e) => setF({ ...f, transporterName: e.target.value })} placeholder="Deccan Freight" />
              </Field>
            </Row>
            <Field label="Vehicle number" required error={tried ? errs.reg : undefined}>
              <TextInput value={f.reg} onChange={(e) => setF({ ...f, reg: e.target.value.toUpperCase() })} placeholder="KA25B4410" />
            </Field>
            <Row>
              <Field label="Phone" required error={tried ? errs.phone : undefined}>
                <TextInput inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="9876543210" />
              </Field>
              <Field label="Second phone" hint="Optional" error={tried ? errs.phone2 : undefined}>
                <TextInput inputMode="numeric" maxLength={10} value={f.phone2} onChange={(e) => setF({ ...f, phone2: e.target.value })} placeholder="9876543211" />
              </Field>
            </Row>
          </>
        )}

        {step === 2 && (
          <>
            <p className="rounded-lg bg-primary-50 px-3 py-2 text-[11px] text-primary-800 ring-1 ring-inset ring-primary-100">
              Identity papers. An owner or manager verifies these before the vehicle is put to work.
            </p>
            <Row>
              <Field label="PAN" required error={tried ? errs.pan : undefined}>
                <TextInput value={f.pan} onChange={(e) => setF({ ...f, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" autoFocus />
              </Field>
              <Field label="Aadhaar" required error={tried ? errs.aadhaar : undefined}>
                <TextInput inputMode="numeric" value={f.aadhaar} onChange={(e) => setF({ ...f, aadhaar: e.target.value })} placeholder="4821 7745 9012" />
              </Field>
            </Row>
            {/* Same document uploads as a transporter — but no GST certificate:
                the client's "same goes for Truck Owners except the GST part".
                The GSTIN number itself stays, since owner-drivers who do have
                one still need it on their invoice. */}
            <Row>
              <Field label="PAN card">
                <ImageUpload value={f.panImg} onChange={(v) => setF({ ...f, panImg: v })} label="Upload PAN" path={`documents/owners/${editId ?? 'new'}/pan`} />
              </Field>
              <Field label="Aadhaar card">
                <ImageUpload value={f.aadhaarImg} onChange={(v) => setF({ ...f, aadhaarImg: v })} label="Upload Aadhaar" path={`documents/owners/${editId ?? 'new'}/aadhaar`} />
              </Field>
            </Row>
            <Field label="GSTIN" hint="Optional — many owner-drivers aren't registered" error={tried ? errs.gstin : undefined}>
              <TextInput value={f.gstin} onChange={(e) => setF({ ...f, gstin: e.target.value.toUpperCase() })} placeholder="29ABCDE1234F1Z5" />
            </Field>
            <Field label="Address line 1" required error={tried ? errs.addressLine1 : undefined}>
              <TextInput value={f.addressLine1} onChange={(e) => setF({ ...f, addressLine1: e.target.value })} placeholder="No. 12, 3rd Cross" />
            </Field>
            <Field label="Address line 2" hint="Optional">
              <TextInput value={f.addressLine2} onChange={(e) => setF({ ...f, addressLine2: e.target.value })} placeholder="Peenya" />
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
              <TextInput inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value })} placeholder="560058" />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <p className="rounded-lg bg-primary-50 px-3 py-2 text-[11px] text-primary-800 ring-1 ring-inset ring-primary-100">
              Where their balance gets paid out.
            </p>
            <Field label="Account holder name" required error={tried ? errs.bankAccountName : undefined}>
              <TextInput value={f.bankAccountName} onChange={(e) => setF({ ...f, bankAccountName: e.target.value })} placeholder="M. Khan" autoFocus />
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
                <TextInput value={f.bankName} onChange={(e) => setF({ ...f, bankName: e.target.value })} placeholder="HDFC Bank, Peenya" />
              </Field>
              <Field label="UPI ID" hint="Optional">
                <TextInput value={f.upiId} onChange={(e) => setF({ ...f, upiId: e.target.value })} placeholder="name@okhdfcbank" />
              </Field>
            </Row>
            <Field label="Cancelled cheque" hint="Proves the account belongs to them before any payout goes out">
              <ImageUpload value={f.cancelledChequeImg} onChange={(v) => setF({ ...f, cancelledChequeImg: v })} label="Upload cancelled cheque" path={`documents/owners/${editId ?? 'new'}/cheque`} />
            </Field>
          </>
        )}

        {step > 1 && (
          <button type="button" onClick={() => { setTried(false); setStep((s) => s - 1); }}
            className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-primary-600">
            <ChevronLeft size={13} /> Back
          </button>
        )}
      </Modal>

      {/* KYC review */}
      {kycFor && (
        <Modal open onClose={() => setKycForId(null)} title={`KYC · ${kycFor.owner}`} subtitle="Identity papers on file"
          onSubmit={() => setKycForId(null)} submitLabel="Close">
          <div className="space-y-2 rounded-lg bg-neutral-50 p-3 text-xs ring-1 ring-inset ring-neutral-100">
            {([['PAN', kycFor.pan], ['Aadhaar', kycFor.aadhaar], ['GSTIN', kycFor.gstin]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="font-bold text-neutral-500">{k}</span><span className="font-mono text-neutral-800">{v || '—'}</span></div>
            ))}
          </div>
          {kycOf(kycFor) === 'verified' ? (
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 text-xs ring-1 ring-inset ring-emerald-100">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                <BadgeCheck size={14} /> Verified{kycFor.kycVerifiedBy ? ` by ${kycFor.kycVerifiedBy}` : ''}{kycFor.kycVerifiedOn ? ` · ${kycFor.kycVerifiedOn}` : ''}
              </span>
              {isAdmin && <button type="button" onClick={() => setKyc(kycFor, 'pending')} className="font-bold text-emerald-700 hover:underline">Reset</button>}
            </div>
          ) : isAdmin ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-sky-50 px-3 py-2.5 text-xs ring-1 ring-inset ring-sky-100">
              <span className="text-sky-800">Confirm you've checked these documents.</span>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setKyc(kycFor, 'rejected')} className="rounded-lg bg-white px-3 py-1.5 font-bold text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50">Reject</button>
                <button type="button" onClick={() => setKyc(kycFor, 'verified')} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700">Mark verified</button>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-sky-50 px-3 py-2.5 text-xs text-sky-800 ring-1 ring-inset ring-sky-100">An owner or manager needs to verify these.</p>
          )}
        </Modal>
      )}

      {/* Approve agreement */}
      <Modal open={!!agFor} onClose={() => setAgForId(null)} title={`Attachment agreement · ${agFor?.owner ?? ''}`}
        subtitle="Approving this onboards them" onSubmit={() => approveAgreement(true)} submitLabel="Approve & download">
        <Row>
          <Field label="Effective from" required><DateInput value={ag.effectiveFrom} onChange={(v) => setAg({ ...ag, effectiveFrom: v })} /></Field>
          <Field label="Duration (months)" required><TextInput type="number" value={ag.durationMonths} onChange={(e) => setAg({ ...ag, durationMonths: e.target.value })} placeholder="24" /></Field>
        </Row>
        <Field label="Commission (%)" hint="Optional"><TextInput type="number" value={ag.commission} onChange={(e) => setAg({ ...ag, commission: e.target.value })} placeholder="8" /></Field>
        <Field label="Special terms" hint="Optional"><TextInput value={ag.notes} onChange={(e) => setAg({ ...ag, notes: e.target.value })} placeholder="Fortnightly settlement" /></Field>
        {agFor && kycOf(agFor) !== 'verified' && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">
            Their KYC isn't verified yet. You can still approve, but check the identity papers first.
          </p>
        )}
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 ring-1 ring-inset ring-emerald-100">
          <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} /> Approving marks them onboarded.</span>
          <button type="button" onClick={() => approveAgreement(false)} className="font-bold text-emerald-700 hover:underline">Approve without download</button>
        </div>
      </Modal>

      {/* Record payment */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment" subtitle="Reduces the owner's balance"
        onSubmit={submitPayment} submitLabel="Record payment" submitDisabled={!pay.id || !(Number(pay.amount) > 0)}>
        <Field label="Owner" required>
          <Select value={pay.id} onChange={(e) => setPay({ ...pay, id: e.target.value })}>
            <option value="">Select owner</option>
            {attached.map((a) => <option key={a.id} value={a.id}>{a.owner} · balance {rupees(a.balancePaise)}</option>)}
          </Select>
        </Field>
        <Field label="Amount (₹)" required><TextInput type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="20000" /></Field>
      </Modal>

      {/* Delete */}
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title={`Delete ${confirmDel.owner}?`} subtitle="This removes them for everyone"
          onSubmit={() => { deleteAttached(confirmDel.id); push({ title: 'Deleted', body: `${confirmDel.owner} removed.`, tone: 'info' }); setConfirmDel(null); }}
          submitLabel="Delete">
          <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-100">
            <b>{confirmDel.owner}</b> ({confirmDel.reg}) will be removed for the whole team.
            {confirmDel.balancePaise > 0 && <> They still have a balance of <b>{rupees(confirmDel.balancePaise)}</b> outstanding.</>} This can't be undone.
          </p>
        </Modal>
      )}
    </PartnerLayout>
  );
}
