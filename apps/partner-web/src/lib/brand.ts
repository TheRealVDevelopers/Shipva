/**
 * White-label brand config. The whole app reads its product name, tagline and
 * operating-company chrome from here, so one codebase ships under multiple
 * brands. Pick the brand at build time with VITE_BRAND. This deployment ships as
 * Sarva Express, so that is the DEFAULT — a plain `npm run build` (no env file,
 * as in this repo) must not fall back to the ShipVa demo brand. Override for
 * another brand with VITE_BRAND, e.g.:
 *
 *   VITE_BRAND=shipva npm run build -w @shipva/partner-web
 */
import sarvaIcon from '../assets/sarva-icon.png';
import sarvaLogo from '../assets/sarva-logo.png';

export interface Brand {
  /** Product / app name shown in the sidebar, login, titles, print. */
  name: string;
  /** Short descriptor under the wordmark. */
  tagline: string;
  /** The operating transporter company shown in the header & documents. */
  company: string;
  /** Square logo mark (sidebar / small chrome). Falls back to the built-in SVG. */
  logoSrc?: string;
  /** Full logo lockup (login hero / documents). */
  lockupSrc?: string;
  /** Real legal details printed on outward documents — the Lorry Receipt, the
   *  tax invoice and the agreements. These leave the building and go to
   *  drivers, customers and vendors, so they must never come from mocks.ts
   *  (that file's `partner` is demo fixture data with a made-up GSTIN). */
  gstin?: string;
  address?: string;
  email?: string;
  phone?: string;
}

const BRANDS: Record<string, Brand> = {
  shipva: { name: 'ShipVa', tagline: 'Transporter OS', company: 'Karnataka Roadlines' },
  'sarva-express': {
    name: 'Sarva Express', tagline: 'Transport OS', company: 'Sarva Express',
    logoSrc: sarvaIcon, lockupSrc: sarvaLogo,
    // Source: the client's executed Service Agreement (18 May 2024).
    gstin: '29CDVPV2440P1ZE',
    address: 'No. 46, Ground Floor, 12th Main Rd, 9th Cross, Shakambari Nagar, 1st Phase, J. P. Nagar, Bengaluru, Karnataka 560078',
    email: 'legal@sarvaexpress.com',
    // phone: intentionally absent — no verified number yet, and a wrong one on a
    // Lorry Receipt is worse than none. Add it here once confirmed.
  },
};

const key = ((import.meta.env.VITE_BRAND as string | undefined) ?? 'sarva-express').toLowerCase();

export const BRAND: Brand = BRANDS[key] ?? BRANDS['sarva-express']!;

/** Two-letter initials for the avatar, derived from the operating company. */
export const companyInitials = BRAND.company
  .split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/** File-name-safe slug of the product name, for exported downloads — so a Sarva
 *  Express export is "sarva-express-trips.csv", not "shipva-trips.csv". */
export const brandSlug = BRAND.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
