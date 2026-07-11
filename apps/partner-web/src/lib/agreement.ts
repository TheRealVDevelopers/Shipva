/**
 * Vendor agreement generator. Fills a template with the vendor + agreement
 * fields and opens it for print / save-as-PDF. This is a GENERIC placeholder
 * template — replace the clauses in `body()` with the client's official format
 * (they will provide it); the field plumbing stays the same.
 */
import { BRAND } from './brand.js';
import { partner } from './mocks.js';
import { rupees } from './format.js';
import type { Agreement } from './store.js';

export interface AgreementParty { name: string; gstin?: string; place?: string; phone?: string }

const CSS = `
  * { box-sizing: border-box; font-family: "Times New Roman", Georgia, serif; }
  body { margin: 0; color: #14181f; padding: 48px 56px; line-height: 1.55; font-size: 13.5px; }
  .head { text-align:center; border-bottom:2px solid #0F3D72; padding-bottom:14px; }
  .brand { font-size:20px; font-weight:800; color:#0F3D72; letter-spacing:.02em; }
  .brand span { color:#D86C0E; }
  h1 { font-size:16px; text-align:center; margin:22px 0 4px; text-transform:uppercase; letter-spacing:.08em; }
  .meta { text-align:center; color:#555; font-size:12px; }
  h2 { font-size:13px; margin:20px 0 6px; text-transform:uppercase; letter-spacing:.04em; color:#0F3D72; }
  p { margin:8px 0; text-align:justify; }
  .parties { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:18px; }
  .party { border:1px solid #d8dce3; border-radius:6px; padding:12px 14px; }
  .party .lbl { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#8A93A3; font-weight:700; }
  .party b { display:block; margin-top:3px; }
  ol { margin:6px 0 6px 18px; padding:0; }
  ol li { margin:6px 0; }
  .sign { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:56px; }
  .sign div { border-top:1px solid #333; padding-top:6px; font-size:12px; }
  .foot { margin-top:36px; font-size:10.5px; color:#8A93A3; text-align:center; }
  @media print { body { padding:24px; } }
`;

function open(title: string, inner: string) {
  const w = window.open('', '_blank', 'width=840,height=1000');
  if (!w) { alert('Please allow pop-ups to download the agreement.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${CSS}</style></head><body onload="setTimeout(()=>window.print(),150)">${inner}</body></html>`);
  w.document.close();
}

const brandLogo = (() => {
  const parts = BRAND.name.split(' ');
  return parts.length > 1 ? `${parts.slice(0, -1).join(' ')} <span>${parts[parts.length - 1]}</span>` : BRAND.name;
})();

export function printAgreement(kind: 'customer' | 'truck-owner', vendor: AgreementParty, a: Agreement): void {
  const isCustomer = kind === 'customer';
  const rateClause = isCustomer
    ? `The agreed freight rate is <b>${a.ratePerKmPaise ? `${rupees(a.ratePerKmPaise)} per km` : 'as mutually agreed per consignment'}</b>, exclusive of applicable GST.`
    : `The Transporter shall pay the Vendor freight for each trip, retaining a service commission of <b>${a.commissionPct ?? 0}%</b>, settled as per the agreed cycle.`;

  const inner = `
    <div class="head"><div class="brand">${brandLogo}</div></div>
    <h1>${isCustomer ? 'Transport Services Agreement' : 'Vehicle Attachment Agreement'}</h1>
    <p class="meta">Made on ${a.effectiveFrom} · valid for ${a.durationMonths} months</p>

    <div class="parties">
      <div class="party"><span class="lbl">Transporter (First Party)</span><b>${BRAND.company}</b>GSTIN: ${partner.gstin}<br>${partner.region}<br>${partner.phone}</div>
      <div class="party"><span class="lbl">${isCustomer ? 'Customer (Second Party)' : 'Vehicle Owner (Second Party)'}</span><b>${vendor.name}</b>${vendor.gstin ? `GSTIN: ${vendor.gstin}<br>` : ''}${vendor.place ? `${vendor.place}<br>` : ''}${vendor.phone ?? ''}</div>
    </div>

    <h2>1. Scope</h2>
    <p>${isCustomer
      ? `The Transporter agrees to provide road transportation of the Customer's goods, and the Customer agrees to tender goods for carriage, on the terms below.`
      : `The Vehicle Owner agrees to attach the vehicle(s) to the Transporter for carriage of goods, and the Transporter agrees to allot trips, on the terms below.`}</p>

    <h2>2. Commercials</h2>
    <p>${rateClause}</p>

    <h2>3. Term &amp; Termination</h2>
    <p>This Agreement is effective from ${a.effectiveFrom} for a period of ${a.durationMonths} months, renewable by mutual consent. Either party may terminate with 30 days' written notice; outstanding dues survive termination.</p>

    <h2>4. Obligations</h2>
    <ol>
      <li>Each party shall comply with applicable transport, tax and safety laws.</li>
      <li>Valid documents (RC, insurance, fitness, permits, driving licence) shall be maintained for all vehicles and drivers deployed.</li>
      <li>Goods shall be carried and delivered in good condition; loss/damage handled per the carrier's liability terms.</li>
      <li>Payments shall be made within the agreed credit period against valid invoices / lorry receipts.</li>
    </ol>

    ${a.notes ? `<h2>5. Special Terms</h2><p>${a.notes}</p>` : ''}

    <h2>${a.notes ? '6' : '5'}. Jurisdiction</h2>
    <p>This Agreement is governed by the laws of India; disputes are subject to the jurisdiction of courts at the Transporter's registered place of business.</p>

    <div class="sign">
      <div>For ${BRAND.company}<br><br>Authorised Signatory</div>
      <div>For ${vendor.name}<br><br>Authorised Signatory</div>
    </div>

    <div class="foot">Template agreement generated by ${BRAND.name} · ${BRAND.tagline}. Replace with your official format before use.</div>`;

  open(`Agreement — ${vendor.name}`, inner);
}
