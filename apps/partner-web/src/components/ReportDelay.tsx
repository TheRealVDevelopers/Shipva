/**
 * "Report" — was "Report delay".
 *
 * Reports that a VRID's arrival or departure has slipped: pick the VRID, pick
 * which event, give a reason code and a new estimate. The scheduled time is
 * shown but never editable — the point is the gap between plan and reality.
 *
 * Reason codes come from the admin's list (see lib/reasonCodes). An admin can
 * type a new one right here; everyone else can only pick. Entries are appended,
 * never edited, so the audit log stays a record of what was said when.
 */
import { useEffect, useMemo, useState } from 'react';
import { Plus, Clock, X, Trash2 } from 'lucide-react';
import { Modal, Field, TextInput, DateTimeInput, Select, Row } from './ui/Modal.js';
import { useAuth } from '../lib/auth.js';
import { useNotify } from '../lib/notify.js';
import {
  watchReasonCodes, addReasonCode, removeReasonCode, addStandardCodes, type ReasonCode,
} from '../lib/reasonCodes.js';
import type { BoardItem } from '../lib/board.js';
import type { DelayReport } from '../lib/store.js';

const fmt = (dt?: string) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return isNaN(d.getTime()) ? dt : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
};

export function ReportDelay({ item, onClose, onSave }: {
  item: BoardItem;
  onClose: () => void;
  onSave: (reports: DelayReport[]) => void;
}) {
  const { member } = useAuth();
  const { push } = useNotify();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';

  const [codes, setCodes] = useState<ReasonCode[]>([]);
  useEffect(() => watchReasonCodes(setCodes), []);

  const [vrid, setVrid] = useState(item.vrids[0] ?? item.legs[0]?.vrid ?? '');
  const [event, setEvent] = useState('');
  const [reason, setReason] = useState('');
  const [estimatedAt, setEstimatedAt] = useState('');
  const [newCode, setNewCode] = useState('');
  const [tried, setTried] = useState(false);

  // Events are this VRID's own stops — an arrival and a departure each.
  const events = useMemo(() => {
    const leg = item.legs.find((l) => l.vrid === vrid) ?? item.legs[0];
    if (!leg) return [] as { key: string; label: string; scheduled: string }[];
    return leg.stops.flatMap((s) => [
      { key: `${s.name} arrival`, label: `${s.name} arrival`, scheduled: s.arrivalAt ?? '' },
      { key: `${s.name} departure`, label: `${s.name} departure`, scheduled: s.departureAt ?? '' },
    ]);
  }, [item, vrid]);

  const scheduledAt = events.find((e) => e.key === event)?.scheduled ?? '';
  const reports = item.source.reports ?? [];

  const errs = {
    vrid: vrid ? '' : 'Pick a VRID',
    event: event ? '' : 'Pick what was delayed',
    reason: reason ? '' : 'Pick a reason code',
    estimatedAt: estimatedAt ? '' : 'Give the new estimated time',
  };
  const ready = Object.values(errs).every((e) => !e);

  function confirm() {
    setTried(true);
    if (!ready) return;
    const entry: DelayReport = {
      id: `${Date.now().toString(36)}`,
      vrid, event, reason, scheduledAt, estimatedAt,
      byName: member?.name ?? '', atMs: Date.now(),
    };
    onSave([...reports, entry]);
    push({ title: 'Delay reported', body: `${event} · ${reason}`, tone: 'info' });
    onClose();
  }

  async function addCode() {
    const l = newCode.trim();
    if (!l) return;
    await addReasonCode(l);
    setReason(l);
    setNewCode('');
  }

  return (
    <Modal open onClose={onClose} title="Report" subtitle={`${item.code} · ${item.driver || '—'}`}
      onSubmit={confirm} submitLabel="Confirm" wide>

      <p className="rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-800 ring-1 ring-inset ring-sky-100">
        Reason codes are allowed up to 72 hours after load completion. Report the reason accurately so the delay is clearly understood.
      </p>

      <Row>
        <Field label="VR ID" required error={tried ? errs.vrid : undefined}>
          <Select value={vrid} onChange={(e) => { setVrid(e.target.value); setEvent(''); }}>
            {item.legs.map((l) => <option key={l.vrid} value={l.vrid}>{l.vrid}</option>)}
          </Select>
        </Field>
        <Field label="What was delayed" required error={tried ? errs.event : undefined}>
          <Select value={event} onChange={(e) => setEvent(e.target.value)}>
            <option value="">Select arrival / departure</option>
            {events.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </Select>
        </Field>
      </Row>

      <Field label="Reason code" required error={tried ? errs.reason : undefined}
        hint={isAdmin ? 'You maintain this list — anyone else can only pick from it' : 'Set by your admin'}>
        <Select value={reason} onChange={(e) => setReason(e.target.value)} disabled={codes.length === 0}>
          <option value="">{codes.length ? 'Select a reason' : 'No reason codes yet'}</option>
          {codes.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
        </Select>
      </Field>

      {/* Admin-only list management — the client's "admin types it manually and sets it". */}
      {isAdmin && (
        <div className="rounded-xl p-3 ring-1 ring-inset ring-neutral-200" style={{ background: '#F7F8F8' }}>
          <div className="mb-2 text-[11px] font-extrabold text-neutral-700">Manage reason codes</div>
          {codes.length === 0 && (
            <button type="button"
              onClick={async () => { const n = await addStandardCodes(codes); push({ title: 'Reason codes added', body: `${n} standard codes.`, tone: 'success' }); }}
              className="mb-2 w-full rounded-lg bg-primary-500 py-2 text-xs font-bold text-white hover:bg-primary-600">
              Add Amazon's standard codes
            </button>
          )}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {codes.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700 ring-1 ring-inset ring-neutral-200">
                {c.label}
                <button type="button" onClick={() => void removeReasonCode(c.id)} className="text-neutral-300 hover:text-rose-500" title={`Remove ${c.label}`}><X size={11} /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <TextInput value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Add your own reason…" className="text-xs" />
            <button type="button" onClick={() => void addCode()} disabled={!newCode.trim()}
              className="shrink-0 rounded-lg bg-neutral-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><Plus size={12} /></button>
          </div>
        </div>
      )}

      <div className="rounded-xl p-3 ring-1 ring-inset ring-neutral-200" style={{ background: '#F7F8F8' }}>
        <div className="mb-1.5 text-[11px] font-extrabold text-neutral-700">Estimated time change</div>
        <div className="mb-2 text-[11px] text-neutral-500">Scheduled: <b className="text-neutral-800">{fmt(scheduledAt)}</b></div>
        <Field label="New estimate" required error={tried ? errs.estimatedAt : undefined}>
          <DateTimeInput value={estimatedAt} onChange={setEstimatedAt} />
        </Field>
      </div>

      {/* Audit log */}
      <details className="rounded-lg ring-1 ring-inset ring-neutral-200">
        <summary className="cursor-pointer px-3 py-2 text-[11px] font-bold text-neutral-600">Audit log ({reports.length})</summary>
        <div className="max-h-40 overflow-y-auto border-t border-neutral-100">
          {reports.length === 0 && <p className="px-3 py-3 text-center text-[11px] text-neutral-400">Nothing reported yet.</p>}
          {[...reports].reverse().map((r) => (
            <div key={r.id} className="border-b border-neutral-50 px-3 py-2 text-[11px] last:border-0">
              <div className="font-bold text-neutral-800">{r.event} <span className="font-mono text-neutral-400">· {r.vrid}</span></div>
              <div className="text-neutral-600">{r.reason} — {fmt(r.scheduledAt)} → <b>{fmt(r.estimatedAt)}</b></div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-400">
                <Clock size={9} /> {new Date(r.atMs).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                {r.byName ? ` · ${r.byName}` : ''}
              </div>
            </div>
          ))}
        </div>
      </details>
    </Modal>
  );
}
