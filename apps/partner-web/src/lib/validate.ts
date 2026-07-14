/**
 * Shared field validation — the client's rules, in one place:
 *   names          alphabets only
 *   phone          exactly 10 digits
 *   Aadhaar        exactly 12 digits
 *   PAN / GSTIN / vehicle registration   uppercase + format-checked
 *
 * Every validator returns an error message, or '' when the value is acceptable,
 * so a form can do `const err = phoneError(v)` and feed it straight to
 * <Field error={...}>. Pass `{ required: false }` for the optional fields
 * (only Address Line 2 and the secondary phone).
 */

interface Opts { required?: boolean; label?: string }

/** Keep only digits — tolerates "+91 98450 10001" style input. */
export const digitsOnly = (s: string): string => s.replace(/\D/g, '');

/** Reduce any Indian mobile input to its bare 10 digits ('' if not 10). */
export function normalizePhone(v: string): string {
  let d = digitsOnly(v);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.length === 10 ? d : '';
}

/** Names: letters only (spaces, dot, apostrophe and hyphen allowed within). */
export function nameError(v: string, { required = true, label = 'Name' }: Opts = {}): string {
  const s = v.trim();
  if (!s) return required ? `${label} is required` : '';
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(s)) return `${label} must contain letters only`;
  return '';
}

/** Phone: exactly 10 digits, starting 6–9 (a +91 / leading 0 is tolerated). */
export function phoneError(v: string, { required = true, label = 'Phone' }: Opts = {}): string {
  const s = v.trim();
  if (!s) return required ? `${label} is required` : '';
  let d = digitsOnly(s);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length !== 10) return `${label} must be 10 digits`;
  if (!/^[6-9]/.test(d)) return `${label} must start with 6–9`;
  return '';
}

/** Aadhaar: exactly 12 digits (spaces allowed while typing). */
export function aadhaarError(v: string, { required = true }: Opts = {}): string {
  const s = v.trim();
  if (!s) return required ? 'Aadhaar is required' : '';
  const d = digitsOnly(s);
  if (d.length !== 12) return 'Aadhaar must be 12 digits';
  if (d.startsWith('0') || d.startsWith('1')) return "Aadhaar can't start with 0 or 1";
  return '';
}

/** PAN: ABCDE1234F. */
export function panError(v: string, { required = true }: Opts = {}): string {
  const s = v.trim().toUpperCase();
  if (!s) return required ? 'PAN is required' : '';
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(s)) return 'PAN must look like ABCDE1234F';
  return '';
}

/** GSTIN: 29ABCDE1234F1Z5 (state code + PAN + entity + Z + checksum). */
export function gstError(v: string, { required = true }: Opts = {}): string {
  const s = v.trim().toUpperCase();
  if (!s) return required ? 'GSTIN is required' : '';
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(s)) return 'GSTIN must look like 29ABCDE1234F1Z5';
  return '';
}

/** Vehicle registration: KA01AB1234 / KA01C5521, or a BH series (22BH1234AA). */
export function vehicleRegError(v: string, { required = true }: Opts = {}): string {
  const s = v.trim().toUpperCase().replace(/[\s-]/g, '');
  if (!s) return required ? 'Vehicle number is required' : '';
  const standard = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
  const bharat = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
  if (!standard.test(s) && !bharat.test(s)) return 'Vehicle number must look like KA01AB1234';
  return '';
}

/** Driving licence: formats vary by state, so just check it's plausible. */
export function licenceError(v: string, { required = true }: Opts = {}): string {
  const s = v.trim().toUpperCase().replace(/[\s-]/g, '');
  if (!s) return required ? 'Driving licence is required' : '';
  if (!/^[A-Z0-9]{8,20}$/.test(s)) return 'Licence number looks incomplete';
  return '';
}

/** A value that just has to be present. */
export function requiredError(v: string, label: string): string {
  return v.trim() ? '' : `${label} is required`;
}

/** A positive number (freight, weight…). */
export function positiveError(v: string, label: string): string {
  const s = v.trim();
  if (!s) return `${label} is required`;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return `${label} must be more than 0`;
  return '';
}

/** Uppercase as the user types — for PAN, GSTIN and vehicle numbers. */
export const toUpper = (s: string): string => s.toUpperCase();

/** True when every error string in the map is empty. */
export const allClear = (errors: Record<string, string>): boolean =>
  Object.values(errors).every((e) => !e);
