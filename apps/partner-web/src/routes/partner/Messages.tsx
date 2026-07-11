import { useMemo, useState } from 'react';
import { MessageCircle, Send, Copy, Check } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Field, Select, TextInput } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { rupees } from '../../lib/format.js';
import { useStore } from '../../lib/store.js';
import { BRAND } from '../../lib/brand.js';

type Template = 'trip_driver' | 'dispatch_customer' | 'payment_reminder' | 'custom';

const TEMPLATES: { id: Template; label: string; needs: 'trip' | 'invoice' | 'none' }[] = [
  { id: 'trip_driver', label: 'Trip assigned → driver', needs: 'trip' },
  { id: 'dispatch_customer', label: 'Dispatch / LR → customer', needs: 'trip' },
  { id: 'payment_reminder', label: 'Payment reminder → customer', needs: 'invoice' },
  { id: 'custom', label: 'Custom message', needs: 'none' },
];

function waDigits(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
}

export function Messages() {
  const { trips, invoices, drivers, customers } = useStore();
  const [tpl, setTpl] = useState<Template>('trip_driver');
  const [tripLr, setTripLr] = useState(trips[0]?.lr ?? '');
  const [invNo, setInvNo] = useState(invoices[0]?.no ?? '');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [edited, setEdited] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = TEMPLATES.find((t) => t.id === tpl)!;

  const auto = useMemo(() => {
    const trip = trips.find((t) => t.lr === tripLr);
    const inv = invoices.find((i) => i.no === invNo);
    if (tpl === 'trip_driver' && trip) {
      const ph = drivers.find((d) => d.name === trip.driver)?.phone ?? '';
      return { phone: ph, msg: `Namaste ${trip.driver},\n\nNew trip *${trip.lr}*\nRoute: ${trip.from} → ${trip.to}\nMaterial: ${trip.material} (${trip.weightKg.toLocaleString('en-IN')} kg)\nVehicle: ${trip.vehicleReg}\nFreight: ${rupees(trip.freightPaise)}\n\nPlease confirm pickup. — ${BRAND.company}` };
    }
    if (tpl === 'dispatch_customer' && trip) {
      return { phone: '', msg: `Dear Customer,\n\nYour consignment *${trip.lr}* has been dispatched.\n${trip.from} → ${trip.to}\nMaterial: ${trip.material} (${trip.weightKg.toLocaleString('en-IN')} kg)\n\nWe will share updates as it moves. Thank you for choosing ${BRAND.company}.` };
    }
    if (tpl === 'payment_reminder' && inv) {
      const ph = customers.find((c) => c.name === inv.client)?.phone ?? '';
      return { phone: ph, msg: `Dear ${inv.client},\n\nThis is a gentle reminder that invoice *${inv.no}* for *${rupees(inv.totalPaise)}* (incl. GST) is due on ${inv.dueDate}.\n\nKindly arrange payment at your earliest convenience. Thank you.\n— ${BRAND.company} Accounts` };
    }
    return { phone: '', msg: '' };
  }, [tpl, tripLr, invNo, trips, invoices, drivers, customers]);

  const msg = edited ? text : auto.msg;
  const num = (edited ? phone : auto.phone) || phone;
  const link = `https://wa.me/${num ? waDigits(num) : ''}?text=${encodeURIComponent(msg)}`;

  function resetEdits() { setEdited(false); setText(''); setPhone(''); }

  async function copy() {
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* no clipboard */ }
  }

  return (
    <PartnerLayout title="WhatsApp Messages" subtitle="Auto-generate and send via WhatsApp">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composer */}
        <Card>
          <CardHeader title="Compose" subtitle="Pick a template — details fill in automatically" />
          <CardBody className="space-y-3.5">
            <Field label="Template">
              <Select value={tpl} onChange={(e) => { setTpl(e.target.value as Template); resetEdits(); }}>
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </Field>

            {meta.needs === 'trip' && (
              <Field label="Trip">
                <Select value={tripLr} onChange={(e) => { setTripLr(e.target.value); resetEdits(); }}>
                  {trips.map((t) => <option key={t.lr} value={t.lr}>{t.lr} · {t.from}→{t.to}</option>)}
                </Select>
              </Field>
            )}
            {meta.needs === 'invoice' && (
              <Field label="Invoice">
                <Select value={invNo} onChange={(e) => { setInvNo(e.target.value); resetEdits(); }}>
                  {invoices.map((i) => <option key={i.no} value={i.no}>{i.no} · {i.client} · {rupees(i.totalPaise)}</option>)}
                </Select>
              </Field>
            )}

            <Field label="Recipient phone" hint="10-digit or with country code">
              <TextInput value={edited ? phone : auto.phone} onChange={(e) => { setEdited(true); if (!text) setText(auto.msg); setPhone(e.target.value); }} placeholder="98450 10001" />
            </Field>

            <Field label="Message">
              <textarea
                value={msg}
                onChange={(e) => { setEdited(true); if (!phone) setPhone(auto.phone); setText(e.target.value); }}
                rows={9}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-primary-400"
              />
            </Field>
          </CardBody>
        </Card>

        {/* Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Preview" subtitle="How it will look" action={<MessageCircle size={16} className="text-[#25D366]" />} />
            <CardBody>
              <div className="rounded-2xl bg-[#E5DDD5] p-4">
                <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#DCF8C6] px-3 py-2 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm text-neutral-800">{msg || <span className="text-neutral-400">Your message will appear here…</span>}</p>
                  <div className="mt-1 text-right text-[10px] text-neutral-500">now ✓✓</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <a
                  href={link} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white shadow-sm transition ${msg ? 'bg-[#25D366] hover:bg-[#1fbd5a]' : 'pointer-events-none bg-neutral-300'}`}
                >
                  <Send size={15} /> Open in WhatsApp
                </a>
                <Button variant="secondary" size="md" onClick={copy} disabled={!msg}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">Opens WhatsApp (web or app) with the recipient and message pre-filled — you tap send.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </PartnerLayout>
  );
}
