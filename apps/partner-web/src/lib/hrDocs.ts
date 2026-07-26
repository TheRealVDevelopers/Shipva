/**
 * Employee HR documents — the joining letter and the monthly payslip.
 *
 * The client's point 16: "Automatically generate joining letters after
 * employee registration. Generate downloadable payslips for employees."
 * Both open a print window (Save as PDF), the same pattern as the vendor
 * letters in lib/joiningLetter and lib/rateCard. Distinct from those: this is
 * an employment letter to a member of staff, not a vendor trial agreement.
 */
import { BRAND } from './brand.js';
import { roleLabel } from './roles.js';
import type { Member } from './members.js';

const CSS = `
  * { box-sizing:border-box; }
  body { font-family:"Times New Roman", Georgia, serif; color:#111; margin:0; padding:48px 56px; font-size:13px; line-height:1.6; }
  h1 { text-align:center; font-size:17px; margin:0 0 2px; letter-spacing:.3px; }
  .co { text-align:center; font-size:12px; color:#444; margin-bottom:18px; }
  .date { color:#555; font-size:12px; margin-bottom:14px; }
  .to p { margin:2px 0; }
  h2 { font-size:13px; margin:16px 0 5px; }
  p { margin:9px 0; text-align:justify; }
  ul { margin:6px 0 6px 18px; } li { margin:5px 0; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  td, th { border:1px solid #333; padding:6px 9px; font-size:12px; }
  th { background:#f0f0f0; text-align:left; }
  td.n { text-align:right; }
  .tot td { font-weight:bold; background:#f7f7f7; }
  .sign { display:flex; justify-content:space-between; gap:40px; margin-top:46px; }
  .sign div { flex:1; font-size:12px; }
  .line { border-top:1px solid #000; margin-top:30px; padding-top:4px; }
  .foot { margin-top:26px; font-size:10px; color:#888; text-align:center; }
  @media print { body { padding:26px 30px; } }
`;

const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Open a print-preview window with the document. */
function present(title: string, inner: string): void {
  const bar = `<div class="__bar" style="position:sticky;top:0;z-index:9;display:flex;gap:10px;justify-content:center;align-items:center;background:#0F3D72;color:#fff;padding:9px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600">Preview<button onclick="window.print()" style="padding:6px 16px;border:0;border-radius:6px;background:#fff;color:#0F3D72;font-weight:700;cursor:pointer">Print / Save as PDF</button></div>`;
  const w = window.open('', '_blank', 'width=880,height=1000');
  if (!w) { alert('Please allow pop-ups to preview this document.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${CSS}@media print{.__bar{display:none!important}}</style></head><body>${bar}${inner}</body></html>`);
  w.document.close();
}

/** Employment joining letter, generated once an employee is activated. */
export function printEmployeeJoiningLetter(m: Member, issuedBy?: string): void {
  const joined = m.joinedOn || fmtDate(new Date());
  const salaryLine = m.monthlySalaryPaise
    ? `<p>Your consolidated remuneration is <b>${inr(m.monthlySalaryPaise)} per month</b>, payable in arrears by bank transfer to the account registered in your profile, subject to statutory deductions.</p>`
    // Never invent a figure — an unset salary prints a blank to be filled by hand.
    : `<p>Your consolidated remuneration is <b>₹____________ per month</b>, payable in arrears by bank transfer to the account registered in your profile, subject to statutory deductions.</p>`;

  const inner = `
    <h1>Letter of Appointment</h1>
    <div class="co">${BRAND.company}</div>
    <div class="date">Date: ${fmtDate(new Date())}</div>

    <div class="to">
      <p><b>To,</b></p>
      <p>${m.name}</p>
      ${m.address ? `<p>${m.address}</p>` : ''}
      ${m.phone ? `<p>Phone: ${m.phone}</p>` : ''}
      <p>Email: ${m.email}</p>
    </div>

    <h2>Subject: Appointment as ${m.designation || roleLabel(m.role)}</h2>

    <p>Dear ${m.name.split(' ')[0] || m.name},</p>

    <p>We are pleased to confirm your appointment with <b>${BRAND.company}</b> as
    <b>${m.designation || roleLabel(m.role)}</b> with effect from <b>${joined}</b>. This letter records the
    principal terms of your employment.</p>

    <h2>Terms of employment</h2>
    <ul>
      <li><b>Designation:</b> ${m.designation || roleLabel(m.role)}</li>
      <li><b>Date of joining:</b> ${joined}</li>
      <li><b>Place of work:</b> ${BRAND.address || 'as assigned by the company'}</li>
      <li><b>Reporting:</b> to the management of ${BRAND.company} or such person as may be nominated.</li>
    </ul>

    ${salaryLine}

    <p>You are expected to devote your working time to the duties assigned to you, to keep the company's
    commercial and customer information confidential both during and after your employment, and to comply
    with the company's policies as amended from time to time.</p>

    <p>Either party may terminate this employment by giving one month's written notice, or salary in lieu
    of notice. The company may terminate without notice in the event of misconduct or breach of these terms.</p>

    <p>Please sign and return a copy of this letter in acknowledgement of your acceptance.</p>

    <div class="sign">
      <div>For <b>${BRAND.company}</b><div class="line">${issuedBy || 'Authorised signatory'}</div></div>
      <div>Accepted by<div class="line">${m.name}<br>Date:</div></div>
    </div>
    <div class="foot">Generated by ${BRAND.company} · appointment letter</div>`;

  present(`Joining letter — ${m.name}`, inner);
}

export interface PayslipInput {
  period: string;
  basePaise: number;
  /** Incentive / bhatta — the client's "salary and incentives". */
  incentivePaise: number;
  deductionsPaise: number;
  netPaise: number;
  paidOn?: string;
  note?: string;
}

/** Monthly payslip for one employee. */
export function printPayslip(m: Member, s: PayslipInput): void {
  const rows: [string, number][] = [
    ['Basic salary', s.basePaise],
    ['Incentive / allowance', s.incentivePaise],
  ];
  const gross = s.basePaise + s.incentivePaise;

  const inner = `
    <h1>Payslip</h1>
    <div class="co">${BRAND.company}</div>
    <div class="date">Pay period: <b>${s.period}</b>${s.paidOn ? ` &nbsp;·&nbsp; Paid on: ${s.paidOn}` : ''}</div>

    <table>
      <tr><th style="width:50%">Employee</th><th>Details</th></tr>
      <tr><td>Name</td><td><b>${m.name}</b></td></tr>
      <tr><td>Designation</td><td>${m.designation || roleLabel(m.role)}</td></tr>
      ${m.joinedOn ? `<tr><td>Date of joining</td><td>${m.joinedOn}</td></tr>` : ''}
      ${m.pan ? `<tr><td>PAN</td><td>${m.pan}</td></tr>` : ''}
      ${m.bankAccountNo ? `<tr><td>Bank account</td><td>${m.bankName ? `${m.bankName} · ` : ''}${m.bankAccountNo}${m.bankIfsc ? ` · ${m.bankIfsc}` : ''}</td></tr>` : ''}
    </table>

    <h2>Earnings &amp; deductions</h2>
    <table>
      <tr><th style="width:60%">Description</th><th style="text-align:right">Amount</th></tr>
      ${rows.map(([k, v]) => `<tr><td>${k}</td><td class="n">${inr(v)}</td></tr>`).join('')}
      <tr><td><b>Gross</b></td><td class="n"><b>${inr(gross)}</b></td></tr>
      <tr><td>Deductions</td><td class="n">− ${inr(s.deductionsPaise)}</td></tr>
      <tr class="tot"><td>Net pay</td><td class="n">${inr(s.netPaise)}</td></tr>
    </table>

    ${s.note ? `<p>${s.note}</p>` : ''}

    <p style="font-size:11px;color:#555;margin-top:18px">This is a computer-generated payslip and does not require a signature.</p>
    <div class="foot">Generated by ${BRAND.company} · payslip · ${s.period}</div>`;

  present(`Payslip — ${m.name} — ${s.period}`, inner);
}
