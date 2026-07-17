/**
 * Vendor joining letter — "Letter of Intent and Transportation Trial Period
 * Agreement" (the client's own template). Printable / save-as-PDF, filled with
 * the vendor's details and a 7-day trial window.
 */
import { BRAND } from './brand.js';

export interface JoiningParty { name: string; contact?: string; place?: string; phone?: string; email?: string }

const CSS = `
  * { box-sizing:border-box; }
  body { font-family:"Times New Roman", Georgia, serif; color:#111; margin:0; padding:48px 56px; font-size:13px; line-height:1.55; }
  h1 { text-align:center; font-size:16px; margin:0 0 4px; }
  .date { color:#555; font-size:12px; margin-bottom:16px; }
  .to p { margin:2px 0; }
  h2 { font-size:13px; margin:16px 0 5px; }
  p { margin:8px 0; text-align:justify; }
  ul { margin:6px 0 6px 18px; } li { margin:5px 0; }
  b { font-weight:bold; }
  .sign { display:flex; justify-content:space-between; gap:40px; margin-top:44px; }
  .sign div { flex:1; font-size:12px; }
  .line { border-top:1px solid #000; margin-top:30px; padding-top:4px; }
  .foot { margin-top:26px; font-size:10px; color:#888; text-align:center; }
  @media print { body { padding:26px 30px; } }
`;

function fmt(d: Date) { return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }

export function printJoiningLetter(
  v: JoiningParty,
  opts?: { startDate?: string | undefined; endDate?: string | undefined; employeeName?: string | undefined },
): void {
  const today = fmt(new Date());
  const start = opts?.startDate || fmt(new Date(Date.now() + 3 * 864e5));
  const end = opts?.endDate || fmt(new Date(Date.now() + 10 * 864e5));

  const inner = `
    <h1>Letter of Intent and Transportation Trial Period Agreement</h1>
    <div class="date">Date: ${today}</div>
    <div class="to">
      <p><b>To,</b></p>
      <p>Vendor Company Name: ${v.name}</p>
      <p>Vendor Contact Name: ${v.contact || '____________________'}</p>
      <p>Vendor Address: ${v.place || '____________________'}</p>
      <p>Vendor Phone Number: ${v.phone || '____________________'}</p>
      <p>Vendor Email Address: ${v.email || '____________________'}</p>
    </div>

    <p><b>Subject: Proposal for Transportation Partnership and Trial Period Terms</b></p>
    <p>Dear ${v.contact || v.name},</p>
    <p>${BRAND.company} is pleased to offer you the opportunity to commence a transportation partnership for the dedicated delivery of goods, utilizing your own fleet vehicles. We anticipate a mutually beneficial and long-term working relationship. To ensure a smooth transition and operational compatibility, this partnership will commence with a mandatory one-week (7 calendar days) Trial Operation Period, governed by the terms below.</p>

    <h2>1. Trial Operation Period (7 Days)</h2>
    <p>The Trial Operation Period will begin on <b>${start}</b> and conclude on <b>${end}</b>. During this period, ${BRAND.company} will allocate logistics loads to the Vendor and assess overall service performance, reliability, and adherence to scheduling requirements.</p>

    <h2>2. Vendor's Sole Responsibility and Liability (Vehicle Operation)</h2>
    <p>During the trial, the operation and maintenance of the Vendor's vehicle(s) and any associated liabilities shall be the Vendor's sole and exclusive responsibility. ${BRAND.company} will not be responsible for:</p>
    <ul>
      <li><b>Mechanical Issues:</b> breakdowns, maintenance, repairs, fuel and running expenses.</li>
      <li><b>Liability:</b> any loss, damage, accidents, third-party claims or bodily injury from operating the vehicle(s).</li>
      <li><b>Compliance:</b> ensuring the vehicle is fully insured, registered, roadworthy and compliant with all transport regulations and permits.</li>
    </ul>

    <h2>3. Compensation and Payment Terms During Trial (Agreed Cost Only)</h2>
    <p>During the Trial Period, ${BRAND.company} will only pay the pre-discussed and agreed transportation service cost for loads successfully delivered. No additional payment will be made for the Vendor's vehicle maintenance, repairs, fuel, insurance or other operational overheads.</p>

    <h2>4. Continuation of Services and Formal Agreement</h2>
    <p>Following successful completion of the trial, continuation is conditional upon immediate execution of a separate, formal Transportation Services Agreement. The Vendor must sign the formal Agreement before the start of the eighth day; failure to do so will result in termination of the partnership opportunity.</p>

    <p>By signing below, the Vendor acknowledges and agrees to the terms of this Trial Operation Period, specifically the conditions regarding sole responsibility for vehicle operation and liability (Section 2) and the payment terms (Section 3).</p>
    <p>We look forward to a successful trial and a productive partnership.</p>

    <div class="sign">
      <div>Sincerely,<br>For <b>${BRAND.company}</b><div class="line">Name: ${opts?.employeeName || '____________________'}<br>Title: ____________________</div></div>
      <div>Acknowledged &amp; Accepted by Vendor<div class="line">Name: ${v.contact || '____________________'}<br>Company: ${v.name}</div></div>
    </div>
    <div class="foot">Generated by ${BRAND.company} · trial Letter of Intent template.</div>`;

  const bar = `<div class="__bar" style="position:sticky;top:0;z-index:9;display:flex;gap:10px;justify-content:center;align-items:center;background:#0F3D72;color:#fff;padding:9px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600">Preview<button onclick="window.print()" style="padding:6px 16px;border:0;border-radius:6px;background:#fff;color:#0F3D72;font-weight:700;cursor:pointer">Print / Save as PDF</button></div>`;
  const w = window.open('', '_blank', 'width=860,height=1000');
  if (!w) { alert('Please allow pop-ups to preview the letter.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Joining Letter — ${v.name}</title><style>${CSS}@media print{.__bar{display:none!important}}</style></head><body>${bar}${inner}</body></html>`);
  w.document.close();
}
