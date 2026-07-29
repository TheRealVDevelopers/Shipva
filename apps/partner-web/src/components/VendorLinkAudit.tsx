/**
 * Vendor link health — the report the client asked for after drivers stopped
 * appearing under their vendor in Route Assign.
 *
 * Shows every driver and truck whose stored vendor name isn't an exact match
 * for a registered vendor, split into the two cases that matter:
 *
 *  • Needs attention — the name matches no vendor at all. That record is
 *    invisible in Route Assign until someone says who it belongs to.
 *  • Untidy — the same vendor written differently ("(A A Transport) Abhilash"
 *    vs "A A Transport (Abhilash)"). These WORK, because matching is tolerant,
 *    but the drift is what made this fragile, so they're offered a one-click
 *    tidy to the registered spelling.
 *
 * Only rendered when there is something to report — a permanently visible
 * "0 problems" panel is just noise on a page that already has plenty.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Wand2, Download } from 'lucide-react';
import { Card } from './ui/Card.js';
import { Badge } from './ui/Badge.js';
import { Button } from './ui/Button.js';
import { Select } from './ui/Modal.js';
import { useStore } from '../lib/store.js';
import { useAuth } from '../lib/auth.js';
import { canEditRecords, canExportData } from '../lib/roles.js';
import { useNotify } from '../lib/notify.js';
import { auditVendorLinks, vendorNamesOf, type VendorLinkIssue } from '../lib/vendors.js';
import { exportRows, type Cell } from '../lib/exportExcel.js';
import { brandSlug } from '../lib/brand.js';

export function VendorLinkAudit() {
  const { drivers, trucks, customers, attached, updateDriver, updateTruck } = useStore();
  const { member } = useAuth();
  const { push } = useNotify();
  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState<Record<string, string>>({});

  const book = useMemo(() => ({ customers, owners: attached }), [customers, attached]);
  const issues = useMemo(() => auditVendorLinks(drivers, trucks, book), [drivers, trucks, book]);
  const vendorNames = useMemo(() => vendorNamesOf(customers, attached), [customers, attached]);

  const orphans = issues.filter((i) => i.state === 'orphan');
  const untidy = issues.filter((i) => i.state === 'loose');
  const canFix = canEditRecords(member?.role);

  if (issues.length === 0) return null;

  const relink = (i: VendorLinkIssue, to: string) => {
    if (!to) return;
    if (i.kind === 'Driver') updateDriver(i.id, { vendor: to });
    else updateTruck(i.id, { vendor: to });
    push({ title: `${i.kind} re-linked`, body: `${i.label} → ${to}`, tone: 'success' });
  };

  /** Tidy every untidy name at once — each already resolves to one vendor. */
  const fixAllUntidy = () => {
    untidy.forEach((i) => { if (i.suggested) relink(i, i.suggested); });
    push({ title: 'Names tidied', body: `${untidy.length} record${untidy.length === 1 ? '' : 's'} now use the registered spelling.`, tone: 'success' });
  };

  const exportIssues = () => {
    exportRows(`${brandSlug}-vendor-link-report-${new Date().toISOString().slice(0, 10)}`,
      ['Type', 'Record', 'Stored vendor name', 'Problem', 'Registered vendor it should be'],
      issues.map((i): Cell[] => [
        i.kind, i.label, i.stored,
        i.state === 'orphan' ? 'No matching vendor' : 'Spelt differently',
        i.suggested ?? '',
      ]));
  };

  return (
    <Card>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-5 py-3 text-left">
        <AlertTriangle size={16} className={orphans.length ? 'text-rose-500' : 'text-amber-500'} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-neutral-900">Vendor links need a look</div>
          <div className="text-[11px] text-neutral-500">
            {orphans.length > 0 && <><b className="text-rose-600">{orphans.length} not linked to any vendor</b>{untidy.length > 0 && ' · '}</>}
            {untidy.length > 0 && `${untidy.length} written differently from the register`}
          </div>
        </div>
        <span className="text-xs font-bold text-primary-600">{open ? 'Hide' : 'Review'}</span>
      </button>

      {open && (
        <div className="border-t border-neutral-100">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5">
            <p className="max-w-2xl text-[11px] text-neutral-500">
              A driver or truck is linked to its vendor by <b>name</b>. These records don't hold the
              registered spelling — the ones marked <b>Not linked</b> won't appear in Route Assign at all.
            </p>
            <div className="flex items-center gap-2">
              {canExportData(member?.role) && (
                <Button size="sm" variant="secondary" onClick={exportIssues}><Download size={13} /> Export</Button>
              )}
              {canFix && untidy.length > 0 && (
                <Button size="sm" onClick={fixAllUntidy}><Wand2 size={13} /> Tidy all {untidy.length}</Button>
              )}
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {issues.map((i) => (
              <div key={`${i.kind}-${i.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">{i.label}</span>
                    <Badge tone="neutral">{i.kind}</Badge>
                    {i.state === 'orphan'
                      ? <Badge tone="danger">Not linked</Badge>
                      : <Badge tone="warning">Spelt differently</Badge>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-neutral-500">
                    Stored as <span className="font-mono font-semibold text-neutral-700">“{i.stored}”</span>
                    {i.suggested && <> · registered as <span className="font-mono font-semibold text-emerald-700">“{i.suggested}”</span></>}
                  </div>
                </div>

                {canFix && (
                  <div className="flex shrink-0 items-center gap-2">
                    {i.state === 'loose' && i.suggested ? (
                      <Button size="sm" variant="secondary" onClick={() => relink(i, i.suggested!)}>
                        <Check size={13} /> Use registered spelling
                      </Button>
                    ) : (
                      <>
                        <Select
                          value={picks[`${i.kind}-${i.id}`] ?? ''}
                          onChange={(e) => setPicks((p) => ({ ...p, [`${i.kind}-${i.id}`]: e.target.value }))}
                          className="w-56">
                          <option value="">— pick the right vendor —</option>
                          {vendorNames.map((v) => <option key={v} value={v}>{v}</option>)}
                        </Select>
                        <Button size="sm" disabled={!picks[`${i.kind}-${i.id}`]}
                          onClick={() => relink(i, picks[`${i.kind}-${i.id}`] ?? '')}>
                          Link
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
