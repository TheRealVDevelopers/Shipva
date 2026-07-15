/**
 * Print-to-PDF helpers. We render a clean document into a new window and call
 * print() — the browser's "Save as PDF" produces the file. No PDF dependency.
 */
import { rupees } from './format.js';
import { BRAND } from './brand.js';
import type { Invoice, Trip } from './mocks.js';

const parts = BRAND.name.split(' ');
const LOGO_HTML = parts.length > 1
  ? `${parts.slice(0, -1).join(' ')} <span>${parts[parts.length - 1]}</span>`
  : BRAND.name;

const CSS = `
  * { box-sizing: border-box; font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  body { margin: 0; color: #181D27; padding: 40px; }
  .brand { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0F3D72; padding-bottom:16px; }
  .logo { font-size:22px; font-weight:900; color:#0F3D72; }
  .logo span { color:#D86C0E; }
  .muted { color:#6b7280; font-size:12px; }
  h1 { font-size:18px; margin:24px 0 4px; }
  table { width:100%; border-collapse:collapse; margin-top:16px; font-size:13px; }
  th { text-align:left; background:#F7F8FA; padding:8px 10px; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:#6b7280; }
  td { padding:8px 10px; border-bottom:1px solid #EDEFF3; }
  .right { text-align:right; }
  .totals { margin-top:16px; margin-left:auto; width:280px; font-size:13px; }
  .totals div { display:flex; justify-content:space-between; padding:5px 0; }
  .totals .grand { border-top:2px solid #0F3D72; margin-top:6px; padding-top:8px; font-weight:900; font-size:15px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:20px; font-size:13px; }
  .box { border:1px solid #D8DCE3; border-radius:8px; padding:12px 14px; }
  .box .lbl { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#8A93A3; font-weight:700; }
  .foot { margin-top:40px; font-size:11px; color:#8A93A3; text-align:center; }
  @media print { body { padding:0; } }
`;

const BAR = `<div class="__bar" style="position:sticky;top:0;z-index:9;display:flex;gap:10px;justify-content:center;align-items:center;background:#0F3D72;color:#fff;padding:9px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600">Preview<button onclick="window.print()" style="padding:6px 16px;border:0;border-radius:6px;background:#fff;color:#0F3D72;font-weight:700;cursor:pointer">Print / Save as PDF</button></div>`;

function open(title: string, body: string) {
  const w = window.open('', '_blank', 'width=820,height=1000');
  if (!w) { alert('Please allow pop-ups to preview the document.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${CSS}@media print{.__bar{display:none!important}}</style></head><body>${BAR}${body}</body></html>`);
  w.document.close();
}

function header(docLabel: string, docNo: string, date: string) {
  // Only print the legal lines we actually have — a blank or invented GSTIN on
  // a tax invoice is a compliance problem, so omit rather than guess.
  const legal = [
    // The logo already reads BRAND.name; only repeat the company when it differs.
    BRAND.company === BRAND.name ? '' : BRAND.company,
    BRAND.address,
    BRAND.gstin ? `GSTIN: ${BRAND.gstin}` : '',
    BRAND.phone ?? '',
    BRAND.email ?? '',
  ].filter(Boolean).map((l) => `<div class="muted">${l}</div>`).join('');

  return `
    <div class="brand">
      <div style="max-width:60%">
        <div class="logo">${LOGO_HTML}</div>
        <div style="margin-top:6px">${legal}</div>
      </div>
      <div style="text-align:right">
        <h1 style="margin:0">${docLabel}</h1>
        <div class="muted" style="margin-top:6px">No: <b>${docNo}</b></div>
        <div class="muted">Date: ${date}</div>
      </div>
    </div>`;
}

export function printInvoice(inv: Invoice) {
  const body = `
    ${header('TAX INVOICE', inv.no, inv.date)}
    <div class="grid">
      <div class="box"><div class="lbl">Billed to</div><div style="font-weight:700;margin-top:4px">${inv.client}</div></div>
      <div class="box"><div class="lbl">Due date</div><div style="font-weight:700;margin-top:4px">${inv.dueDate}</div></div>
    </div>
    <table>
      <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Freight & transport charges</td><td class="right">${rupees(inv.basePaise)}</td></tr>
      </tbody>
    </table>
    <div class="totals">
      <div><span>Taxable value</span><span>${rupees(inv.basePaise)}</span></div>
      <div><span>GST</span><span>${rupees(inv.gstPaise)}</span></div>
      <div class="grand"><span>Total</span><span>${rupees(inv.totalPaise)}</span></div>
    </div>
    <div class="foot">This is a computer-generated invoice from ${BRAND.name} · ${BRAND.tagline}.</div>`;
  open(`Invoice ${inv.no}`, body);
}

export function printLR(t: Trip) {
  const body = `
    ${header('LORRY RECEIPT (LR)', t.lr, t.date)}
    <div class="grid">
      <div class="box"><div class="lbl">From (pickup)</div><div style="font-weight:700;margin-top:4px">${t.from}</div></div>
      <div class="box"><div class="lbl">To (drop)</div><div style="font-weight:700;margin-top:4px">${t.to}</div></div>
      <div class="box"><div class="lbl">Driver</div><div style="font-weight:700;margin-top:4px">${t.driver}</div></div>
      <div class="box"><div class="lbl">Vehicle</div><div style="font-weight:700;margin-top:4px">${t.vehicleReg}</div></div>
    </div>
    <table>
      <thead><tr><th>Material</th><th class="right">Weight</th><th class="right">Freight</th></tr></thead>
      <tbody>
        <tr><td>${t.material}</td><td class="right">${t.weightKg.toLocaleString('en-IN')} kg</td><td class="right">${rupees(t.freightPaise)}</td></tr>
      </tbody>
    </table>
    <div class="grid">
      <div class="box"><div class="lbl">E-way bill</div><div style="font-weight:700;margin-top:4px">${t.ewayBill ? 'Linked' : 'Pending'}</div></div>
      <div class="box"><div class="lbl">Status</div><div style="font-weight:700;margin-top:4px;text-transform:capitalize">${t.status.replaceAll('_', ' ')}</div></div>
    </div>
    <div class="foot">Goods received in good condition · ${BRAND.name} · signature ______________</div>`;
  open(`LR ${t.lr}`, body);
}
