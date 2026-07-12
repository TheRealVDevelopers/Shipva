import { useState } from 'react';
import { Modal, Field, TextInput, Select } from './ui/Modal.js';
import { createTask } from '../lib/tasks.js';
import { roleLabel } from '../lib/roles.js';
import { useNotify } from '../lib/notify.js';
import type { Member } from '../lib/members.js';

/** Assign a task to a teammate, with an optional finish-by deadline. If `preset`
 *  is given the assignee is fixed; otherwise a picker is shown. */
export function AssignTaskModal({ members, preset, createdBy, onClose }: {
  members: Member[]; preset?: Member | null; createdBy: string; onClose: () => void;
}) {
  const { push } = useNotify();
  const assignable = members.filter((m) => m.role !== 'owner');
  const [uid, setUid] = useState(preset?.uid ?? assignable[0]?.uid ?? '');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);

  const member = preset ?? members.find((m) => m.uid === uid) ?? null;
  const valid = !!member && title.trim().length > 0 && !busy;

  async function save() {
    if (!member || !title.trim() || busy) return;
    setBusy(true);
    try {
      const dueAtMs = due ? new Date(due).getTime() : undefined;
      await createTask({ title, note, assigneeUid: member.uid, assigneeName: member.name, createdBy, ...(dueAtMs ? { dueAtMs } : {}) });
      push({ title: 'Task assigned', body: `${member.name} will see it on their dashboard.`, tone: 'success' });
      onClose();
    } catch { push({ title: "Couldn't assign", body: 'Please try again.', tone: 'warning' }); }
    finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={preset ? `Assign task · ${preset.name}` : 'Assign a task'} subtitle="Shows on their dashboard with a timer" onSubmit={save} submitLabel={busy ? 'Assigning…' : 'Assign task'} submitDisabled={!valid}>
      {!preset && (
        <Field label="Assign to">
          <Select value={uid} onChange={(e) => setUid(e.target.value)}>
            {assignable.length === 0 && <option value="">No team members yet</option>}
            {assignable.map((m) => <option key={m.uid} value={m.uid}>{m.name} · {roleLabel(m.role)}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Task"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call Bharat Steels about POD" autoFocus /></Field>
      <Field label="Details" hint="Optional"><TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Get signed POD for LR-24817" /></Field>
      <Field label="Finish by" hint="Optional — a red alert shows if it's crossed"><TextInput type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
    </Modal>
  );
}
