/**
 * White-label brand config. The whole app reads its product name, tagline and
 * operating-company chrome from here, so one codebase ships under multiple
 * brands. Pick the brand at build time with VITE_BRAND (defaults to ShipVa):
 *
 *   VITE_BRAND=sarva-express npm run build -w @shipva/partner-web
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
}

const BRANDS: Record<string, Brand> = {
  shipva: { name: 'ShipVa', tagline: 'Transporter OS', company: 'Karnataka Roadlines' },
  'sarva-express': { name: 'Sarva Express', tagline: 'Transport OS', company: 'Sarva Express', logoSrc: sarvaIcon, lockupSrc: sarvaLogo },
};

const key = ((import.meta.env.VITE_BRAND as string | undefined) ?? 'shipva').toLowerCase();

export const BRAND: Brand = BRANDS[key] ?? BRANDS.shipva!;

/** Two-letter initials for the avatar, derived from the operating company. */
export const companyInitials = BRAND.company
  .split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
