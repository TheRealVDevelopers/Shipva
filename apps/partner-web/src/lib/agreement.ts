/**
 * Vendor / service-provider agreement generator.
 *
 * Reproduces the official SARVA EXPRESS "Service Agreement" (the client's own
 * template) as a printable / save-as-PDF document, filling in the vendor party
 * details, effective date and term. Sarva's own party details are fixed per the
 * template. Replace the constants below if the entity details change.
 */
import { partner } from './mocks.js';
import type { Agreement } from './store.js';

export interface AgreementParty { name: string; gstin?: string; place?: string; phone?: string }

const SARVA = {
  name: 'SARVA EXPRESS',
  gstin: '29CDVPV2440P1ZE',
  address: 'No. 46, GF, 12th Main Rd, 9th Cross, Shakambari Nagar, 1st Phase, J. P. Nagar, Bengaluru, Karnataka 560078, India',
  email: 'legal@sarvaexpress.com',
};

const CSS = `
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; color:#111; margin:0; padding:46px 54px; font-size:12.5px; line-height:1.5; }
  h1 { text-align:center; font-size:17px; letter-spacing:.06em; margin:0 0 4px; }
  .sub { text-align:center; color:#555; font-size:11px; margin-bottom:18px; }
  h2 { font-size:12.5px; margin:16px 0 5px; text-transform:uppercase; letter-spacing:.03em; }
  p { margin:7px 0; text-align:justify; }
  .clause { margin:5px 0 5px 0; }
  .num { font-weight:bold; }
  .parties p { margin:6px 0; }
  b { font-weight:bold; }
  .sign { display:flex; justify-content:space-between; margin-top:60px; gap:40px; }
  .sign div { flex:1; }
  .line { border-top:1px solid #000; margin-top:34px; padding-top:4px; font-size:11px; }
  .foot { margin-top:30px; font-size:10px; color:#888; text-align:center; }
  @media print { body { padding:26px 30px; } }
`;

function open(title: string, inner: string) {
  const w = window.open('', '_blank', 'width=860,height=1000');
  if (!w) { alert('Please allow pop-ups to download the agreement.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${CSS}</style></head><body onload="setTimeout(()=>window.print(),200)">${inner}</body></html>`);
  w.document.close();
}

/** kept for signature compatibility with existing callers (customer / truck-owner). */
export function printAgreement(_kind: 'customer' | 'truck-owner', vendor: AgreementParty, a: Agreement): void {
  const term = a.durationMonths >= 12 && a.durationMonths % 12 === 0
    ? `${a.durationMonths / 12} (${a.durationMonths / 12}) year(s)`
    : `${a.durationMonths} (${a.durationMonths}) month(s)`;
  const feeLine = a.ratePerKmPaise
    ? `₹${(a.ratePerKmPaise / 100).toLocaleString('en-IN')} per km`
    : a.commissionPct
      ? `a service commission of ${a.commissionPct}% retained by SARVA per trip`
      : 'as set out in Annexure B';

  const inner = `
    <h1>SERVICE AGREEMENT</h1>
    <div class="sub">Effective ${a.effectiveFrom}</div>

    <div class="parties">
      <p>This Service Agreement (the &ldquo;Agreement&rdquo;) is made effective as of <b>${a.effectiveFrom}</b> (the &ldquo;Effective Date&rdquo;) and is executed by and between:</p>
      <p><b>${SARVA.name}</b>, an entity incorporated under the laws of India, holding GSTIN <b>${SARVA.gstin}</b> and having its office at ${SARVA.address} (hereinafter referred to as &ldquo;SARVA&rdquo;, which expression shall include its successors and assigns) of the <b>FIRST PART</b>;</p>
      <p style="text-align:center"><b>AND</b></p>
      <p><b>${vendor.name}</b>, holding GSTIN / PAN <b>${vendor.gstin || '__________'}</b> and having its office at ${vendor.place || '__________'} (hereinafter referred to as the &ldquo;Service Provider&rdquo;, which expression shall include its successors and permitted assigns) of the <b>OTHER PART</b>.</p>
      <p>SARVA and the Service Provider are hereinafter referred to individually as a &ldquo;Party&rdquo; and jointly as the &ldquo;Parties&rdquo;.</p>
    </div>

    <p><b>WHEREAS</b> SARVA is engaged in the business of sourcing and supplying various goods under the brand &ldquo;SARVA EXPRESS&rdquo;; the Service Provider is engaged in the business of providing logistics services; and SARVA has agreed to engage the Service Provider for transportation of goods on the terms below. <b>NOW THEREFORE</b> the Parties agree as follows:</p>

    <h2>1. Engagement</h2>
    <p class="clause"><span class="num">1.1</span> The Service Provider shall provide logistics services for transportation of goods from SARVA's / clients' warehouse(s) to delivery location(s) communicated by SARVA from time to time (&ldquo;Services&rdquo;).</p>
    <p class="clause"><span class="num">1.2</span> Any additional services shall be agreed in writing (email sufficient) and governed by this Agreement.</p>
    <p class="clause"><span class="num">1.3</span> The Service Provider shall adhere to the service levels (SLAs) communicated by SARVA.</p>

    <h2>2. Term and Termination</h2>
    <p class="clause"><span class="num">2.1</span> This Agreement commences on the Effective Date and continues for a period of <b>${term}</b>, renewable on mutually agreed terms in writing.</p>
    <p class="clause"><span class="num">2.2</span> Either Party may terminate, with or without cause, on 15 (fifteen) days' prior written notice.</p>
    <p class="clause"><span class="num">2.3</span> Either Party may terminate forthwith on the other's uncured breach (15 days), incurable breach, insolvency, or receivership.</p>
    <p class="clause"><span class="num">2.4</span> On termination/expiry, accrued obligations survive; each Party ceases using the other's IP and returns/destroys Confidential Information.</p>

    <h2>3. Obligations of the Service Provider</h2>
    <p class="clause"><span class="num">3.1&ndash;3.2</span> The Service Provider shall comply with all applicable laws, including the Motor Vehicles Act 1988 (and 2019 Amendment), Food Safety and Standards Act 2006, and Child Labour (Prohibition and Regulation) Act 1986, and hold all required documents, registrations and permits. SARVA is not liable for the Service Provider's non-compliance.</p>
    <p class="clause"><span class="num">3.3</span> The Service Provider shall complete Services in a timely manner and provide real-time updates on the whereabouts of goods in transit using SARVA's platform.</p>
    <p class="clause"><span class="num">3.4</span> On failure/delay, SARVA may arrange alternate transport; the Service Provider shall reimburse SARVA the actual cost plus any SLA penalties, and indemnify SARVA for losses suffered.</p>
    <p class="clause"><span class="num">3.5</span> The Service Provider is solely responsible for damage or loss to goods in transit (as estimated by SARVA) and shall maintain appropriate temperature and hygiene in vehicles.</p>
    <p class="clause"><span class="num">3.6</span> The Service Provider shall bear all challans, licence/permit fees, maintenance, fines and penalties under applicable laws.</p>
    <p class="clause"><span class="num">3.7&ndash;3.16</span> The Service Provider shall ensure its personnel are competent, fit, professional and well-behaved; provide replacements within 3 days on SARVA's request; solely handle personnel grievances, disputes and disciplinary matters; follow prescribed delivery locations and routes (bearing costs of any deviation); obtain vehicle entry passes/permits; and observe SARVA's site security and access rules.</p>
    <p class="clause"><span class="num">3.17</span> Any cash collected on SARVA's behalf shall be kept safely, logged in a register, and deposited with an authorised SARVA representative within 2 days; the Service Provider is solely liable for any loss, theft or delay.</p>

    <h2>4. Representations and Warranties</h2>
    <p class="clause">The Service Provider represents that it is duly incorporated with authority to enter this Agreement; holds and will maintain all licences and permits; is under no restriction preventing performance; will comply with all applicable laws; and will comply with data-protection laws, accepting full liability for misuse of data (surviving termination).</p>

    <h2>5. Compensation and Expenses</h2>
    <p class="clause"><span class="num">5.1</span> The Service Provider shall be paid <b>${feeLine}</b>, exclusive of applicable taxes.</p>
    <p class="clause"><span class="num">5.2</span> Additional expenses require prior written agreement and are reimbursed on actuals only.</p>
    <p class="clause"><span class="num">5.3&ndash;5.4</span> The Service Provider shall submit a valid monthly tax invoice; SARVA pays the first undisputed invoice within 45 days and subsequent undisputed invoices within 14 days.</p>
    <p class="clause"><span class="num">5.5&ndash;5.8</span> Invoices must comply with GST law and be uploaded to the GST portal; the Service Provider indemnifies SARVA for any tax-credit loss (plus 18% p.a.); reverse-charge and TDS handled as per law.</p>
    <p class="clause"><span class="num">5.9&ndash;5.10</span> The Service Provider shall pay its personnel by the 30th of each month and provide proof before invoicing; on default causing disruption, SARVA may withhold payment and/or pay personnel directly (treated as liquidated damages).</p>
    <p class="clause"><span class="num">5.11</span> The fees are the sole compensation; no other claims shall be made without SARVA's written authorisation.</p>

    <h2>6. Confidentiality</h2>
    <p class="clause">Each Party shall keep the other's Confidential Information (including the terms of this Agreement) confidential, disclose it only on a need-to-know basis, and comply with applicable laws including SEBI (Prohibition of Insider Trading) Regulations, 2015. These obligations survive for two (2) years after termination/expiry.</p>

    <h2>7. Relationship</h2>
    <p class="clause">The Parties are independent contractors. This is not an employment relationship, partnership or joint venture; neither may act as agent for or bind the other; each is responsible for its own personnel and actions.</p>

    <h2>8. Sub-contracting</h2>
    <p class="clause">The Service Provider shall not subcontract any part of the Services without SARVA's prior written approval.</p>

    <h2>9. Assignment</h2>
    <p class="clause">Neither Party shall assign this Agreement or its rights/obligations without the other's prior written consent; the non-assigning Party may terminate rather than permit assignment.</p>

    <h2>10. Limitation of Liability</h2>
    <p class="clause">Except for indemnification obligations, neither Party is liable for incidental, special or consequential damages. SARVA's maximum aggregate liability shall not exceed the Fee payable for the month in which the claim arose.</p>

    <h2>11. Governing Law and Jurisdiction</h2>
    <p class="clause">This Agreement is governed by the laws of India; the courts/tribunals at Bangalore have exclusive jurisdiction.</p>

    <h2>12&ndash;17. General</h2>
    <p class="clause"><b>Severability, Entire Agreement, Waiver, IP Rights, Anti-Bribery, Notices:</b> Invalid provisions are severed without affecting the rest; this Agreement (with annexures) is the entire agreement; amendments/waivers must be in writing and signed; neither Party uses the other's IP without consent; the Service Provider shall not give or receive bribes and shall comply with anti-corruption laws; notices are given to the addresses herein (SARVA: ${SARVA.email}).</p>

    <h2>18. Right to Audit</h2>
    <p class="clause">The Service Provider shall maintain detailed records; SARVA may audit on 7 days' notice during and after the term and recover unaccounted fees and audit costs on adverse findings.</p>

    <h2>19. Miscellaneous</h2>
    <p class="clause">This Agreement may be executed in counterparts and by electronic copy; remedies are cumulative; each Party bears its own costs and stamp duty; the Parties act in good faith; and SARVA may set off amounts paid to personnel against sums payable to the Service Provider.</p>

    <p style="margin-top:18px"><b>IN WITNESS WHEREOF</b>, the Parties have executed this Agreement as of the Effective Date.</p>
    <div class="sign">
      <div>For <b>${SARVA.name}</b><div class="line">Name: ________________________<br>Authorised Signatory</div></div>
      <div>For <b>${vendor.name}</b><div class="line">Name: ________________________<br>Authorised Signatory</div></div>
    </div>
    <div class="foot">Generated by ${partner.company} · based on the SARVA EXPRESS Service Agreement template. Have your legal team review before signing.</div>`;

  open(`Service Agreement — ${vendor.name}`, inner);
}
