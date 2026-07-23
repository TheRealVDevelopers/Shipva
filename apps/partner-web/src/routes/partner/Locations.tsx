/**
 * Location Master — the client's ask: stop pasting the same Google Maps link
 * on every trip. Save a location once (short code + name + maps link) and it's
 * available to the whole org wherever a location is typed — the Trips form and
 * the Amazon Tour stops suggest by code and fill the name + link automatically.
 *
 * Access mirrors the other shared registers (lib/common + firestore.rules):
 * any org member can add and use locations; leadership edits; admins delete.
 */
import { useMemo, useState } from 'react';
import { MapPin, Plus, Search, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput } from '../../components/ui/Modal.js';
import { useNotify } from '../../lib/notify.js';
import { useAuth } from '../../lib/auth.js';
import { canEditRecords } from '../../lib/roles.js';
import { locationsCol, normCode, useLocations, type SavedLocation } from '../../lib/locations.js';

interface Draft { code: string; name: string; mapUrl: string }
const blank = (): Draft => ({ code: '', name: '', mapUrl: '' });

export function Locations() {
  const { member } = useAuth();
  const { push } = useNotify();
  const locations = useLocations();

  // Edit & delete are leadership only, matching the other registers and the
  // Firestore rules (canWipe = admin or team leader). Anyone may add.
  const canEdit = canEditRecords(member?.role);
  const canDelete = canEdit;

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState<Draft>(blank());
  const [tried, setTried] = useState(false);
  const [confirmDel, setConfirmDel] = useState<SavedLocation | null>(null);

  const shown = useMemo(() => {
    const s = q.trim().toUpperCase();
    if (!s) return locations;
    return locations.filter((l) => normCode(l.code).includes(s) || l.name.toUpperCase().includes(s) || l.mapUrl.toUpperCase().includes(s));
  }, [locations, q]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const code = normCode(f.code);
  const dupe = locations.find((l) => l.id !== editId && normCode(l.code) === code);
  const urlOk = /^https?:\/\/\S+$/i.test(f.mapUrl.trim());
  const errs = {
    code: !code ? 'Code is required — the shortcut people will type' : dupe ? `“${code}” is already taken by ${dupe.name}` : '',
    name: !f.name.trim() ? 'Location name is required' : '',
    mapUrl: !f.mapUrl.trim() ? 'Google Maps link is required' : !urlOk ? 'Paste a full link starting with https://' : '',
  };
  const valid = !errs.code && !errs.name && !errs.mapUrl;

  function startAdd() { setF(blank()); setEditId(null); setTried(false); setOpen(true); }
  function startEdit(l: SavedLocation) {
    setF({ code: l.code, name: l.name, mapUrl: l.mapUrl });
    setEditId(l.id ?? null); setTried(false); setOpen(true);
  }

  async function save() {
    setTried(true);
    if (!valid) return;
    const rec = { code, name: f.name.trim(), mapUrl: f.mapUrl.trim() };
    if (editId) {
      await locationsCol.update(editId, rec);
      push({ title: 'Location updated', body: `${rec.code} — ${rec.name}`, tone: 'success' });
    } else {
      await locationsCol.add({ ...rec, createdByName: member?.name ?? '' });
      push({ title: 'Location saved', body: `Type “${rec.code}” anywhere a location is asked and it fills itself in.`, tone: 'success' });
    }
    setOpen(false);
  }

  async function doDelete() {
    if (!confirmDel?.id) return;
    await locationsCol.remove(confirmDel.id);
    push({ title: 'Location removed', body: `${confirmDel.code} — ${confirmDel.name}`, tone: 'info' });
    setConfirmDel(null);
  }

  return (
    <PartnerLayout title="Locations" subtitle="Location Master — save a maps link once, use it everywhere by code">
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 ring-1 ring-inset ring-neutral-200">
              <Search size={14} className="text-neutral-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, name or link"
                className="w-48 bg-transparent text-xs font-semibold text-neutral-700 outline-none placeholder:text-neutral-400" />
            </div>
            <Button size="sm" onClick={startAdd}><Plus size={14} /> Add location</Button>
          </div>

          <Table>
            <THead>
              <tr>
                <Th>Code</Th>
                <Th>Location name</Th>
                <Th>Google Maps</Th>
                <Th>Added by</Th>
                <Th> </Th>
              </tr>
            </THead>
            <TBody>
              {shown.map((l) => (
                <Tr key={l.id}>
                  <Td><span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs font-extrabold text-neutral-700">{l.code}</span></Td>
                  <Td><span className="text-sm font-bold text-neutral-800">{l.name}</span></Td>
                  <Td>
                    <a href={l.mapUrl} target="_blank" rel="noreferrer"
                      className="inline-flex max-w-[260px] items-center gap-1 truncate text-xs font-bold text-primary-600 hover:text-primary-700">
                      <MapPin size={12} className="shrink-0" /> <span className="truncate">{l.mapUrl.replace(/^https?:\/\//i, '')}</span> <ExternalLink size={11} className="shrink-0" />
                    </a>
                  </Td>
                  <Td><span className="text-xs text-neutral-500">{l.createdByName || '—'}</span></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && <button onClick={() => startEdit(l)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit"><Pencil size={14} /></button>}
                      {canDelete && <button onClick={() => setConfirmDel(l)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 size={14} /></button>}
                    </div>
                  </Td>
                </Tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-neutral-400">
                  {locations.length === 0
                    ? 'No locations yet — add your first shortcut and it works everywhere instantly.'
                    : 'Nothing matches this search.'}
                </td></tr>
              )}
            </TBody>
          </Table>
        </Card>

        <p className="px-1 text-[11px] text-neutral-400">
          Anywhere a location is asked — a trip’s pickup/drop or an Amazon tour stop — type the code and pick the
          suggestion; the name and maps link fill in automatically. Shared across the whole team.
        </p>
      </div>

      {/* Add / edit */}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editId ? 'Edit location' : 'Add location'}
        subtitle="Save once — everyone can use it everywhere by typing the code"
        onSubmit={() => void save()} submitLabel={editId ? 'Save changes' : 'Save location'}>
        <Field label="Location code" required error={tried ? errs.code : undefined}
          hint="Short & memorable — HK2, BHK3, ABC… this is what people type">
          <TextInput value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })}
            placeholder="HK2" className="font-mono" maxLength={20} />
        </Field>
        <Field label="Location name" required error={tried ? errs.name : undefined}>
          <TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Hoskote Hub 2" />
        </Field>
        <Field label="Google Maps link" required error={tried ? errs.mapUrl : undefined}
          hint="Open the place in Google Maps → Share → Copy link">
          <TextInput value={f.mapUrl} onChange={(e) => setF({ ...f, mapUrl: e.target.value })}
            placeholder="https://maps.app.goo.gl/…" className="text-xs" inputMode="url" />
        </Field>
      </Modal>

      {/* Delete confirm */}
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title="Delete location?"
          subtitle={`${confirmDel.code} — ${confirmDel.name}`}
          onSubmit={() => void doDelete()} submitLabel="Delete">
          <p className="text-sm text-neutral-600">
            Existing trips and tours keep the name and link already filled in — only the shortcut goes away.
          </p>
        </Modal>
      )}
    </PartnerLayout>
  );
}
