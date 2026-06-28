/**
 * Ground Network illustration set — inline SVG in brand colors (blue/white/orange).
 * No external assets. Colors pull from CSS vars so they track the theme.
 */
import type { VehicleType } from '@ground/shared-types';

const BLUE = 'var(--sx-primary-500)';
const BLUE_D = 'var(--sx-primary-700)';
const BLUE_L = 'var(--sx-primary-100)';
const WIN = 'var(--sx-primary-200)';
const ORANGE = 'var(--sx-accent-500)';
const ORANGE_L = 'var(--sx-accent-300)';
const TYRE = '#1E2632';
const HUB = '#C4CEDC';

function Wheels({ x1, x2, y, r = 7 }: { x1: number; x2: number; y: number; r?: number }) {
  return (
    <>
      <circle cx={x1} cy={y} r={r} fill={TYRE} />
      <circle cx={x1} cy={y} r={r / 2.6} fill={HUB} />
      <circle cx={x2} cy={y} r={r} fill={TYRE} />
      <circle cx={x2} cy={y} r={r / 2.6} fill={HUB} />
    </>
  );
}

/** Friendly vehicle illustration, recognisably different per category. */
export function VehicleArt({ type, className }: { type: VehicleType; className?: string }) {
  const common = { className, viewBox: '0 0 84 56', xmlns: 'http://www.w3.org/2000/svg' as const };
  switch (type) {
    case 'bike':
      return (
        <svg {...common}>
          <rect x="46" y="20" width="16" height="14" rx="2" fill={ORANGE} />
          <path d="M20 40 L34 40 L40 30 L30 30 Z" fill={BLUE} />
          <rect x="30" y="22" width="6" height="12" rx="2" fill={BLUE_D} />
          <path d="M34 24 h12" stroke={BLUE_D} strokeWidth="3" strokeLinecap="round" />
          <Wheels x1={22} x2={56} y={44} r={9} />
        </svg>
      );
    case 'auto':
      return (
        <svg {...common}>
          <path d="M20 44 V30 Q20 16 38 16 H50 Q62 16 64 30 V44 Z" fill={ORANGE} />
          <path d="M26 30 Q28 22 38 22 H48 Q56 22 58 30 Z" fill={WIN} />
          <rect x="20" y="40" width="44" height="6" fill={BLUE_D} />
          <Wheels x1={26} x2={56} y={48} r={7} />
          <circle cx="42" cy="50" r="5" fill={TYRE} />
        </svg>
      );
    case 'reefer':
      return (
        <svg {...common}>
          <rect x="10" y="14" width="44" height="28" rx="3" fill={BLUE_L} stroke={BLUE} strokeWidth="2" />
          <path d="M54 24 h10 l8 10 v8 H54 Z" fill={BLUE} />
          <rect x="58" y="26" width="9" height="7" rx="1.5" fill={WIN} />
          <g stroke={BLUE} strokeWidth="2" strokeLinecap="round">
            <path d="M30 20 v18 M22 24 l16 10 M38 24 l-16 10" />
          </g>
          <Wheels x1={26} x2={60} y={46} r={7} />
        </svg>
      );
    default: {
      // box-truck family — scale the cargo box up with capacity
      const w = { mini_truck: 34, tempo: 40, pickup: 30, truck: 48 }[type] ?? 40;
      const isPickup = type === 'pickup';
      return (
        <svg {...common}>
          {isPickup ? (
            <path d={`M10 42 V30 h${w} v-8 h10 l8 8 v12 Z`} fill={BLUE} />
          ) : (
            <>
              <rect x="8" y="14" width={w} height="28" rx="3" fill={BLUE} />
              <rect x="12" y="18" width={w - 8} height="9" rx="1.5" fill={BLUE_D} opacity="0.5" />
            </>
          )}
          <path d={`M${8 + w} 24 h10 l8 8 v10 H${8 + w} Z`} fill={BLUE_D} />
          <rect x={12 + w} y="26" width="9" height="7" rx="1.5" fill={WIN} />
          <rect x="8" y="40" width={w + 18} height="4" fill={ORANGE} />
          <Wheels x1={20} x2={8 + w + 10} y={46} r={7} />
        </svg>
      );
    }
  }
}

/** Big hero scene for welcome/login screens. */
export function HeroDelivery({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 190" xmlns="http://www.w3.org/2000/svg" fill="none">
      <ellipse cx="160" cy="170" rx="135" ry="14" fill={BLUE} opacity="0.12" />
      {/* route */}
      <path d="M20 150 Q110 110 200 150 T300 140" stroke={ORANGE} strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" opacity="0.7" />
      {/* buildings */}
      <g opacity="0.25" fill={BLUE}>
        <rect x="30" y="60" width="34" height="80" rx="4" />
        <rect x="250" y="48" width="40" height="92" rx="4" />
      </g>
      <g opacity="0.5" fill={WIN}>
        <rect x="38" y="70" width="8" height="8" rx="1.5" /><rect x="50" y="70" width="8" height="8" rx="1.5" />
        <rect x="258" y="60" width="9" height="9" rx="1.5" /><rect x="273" y="60" width="9" height="9" rx="1.5" />
      </g>
      {/* boxes */}
      <rect x="92" y="116" width="26" height="24" rx="3" fill={ORANGE_L} />
      <rect x="92" y="116" width="26" height="8" rx="3" fill={ORANGE} />
      {/* truck */}
      <g>
        <rect x="150" y="86" width="72" height="46" rx="6" fill={BLUE} />
        <rect x="158" y="94" width="56" height="14" rx="3" fill={BLUE_D} opacity="0.5" />
        <path d="M222 100 h22 l16 16 v16 h-38 Z" fill={BLUE_D} />
        <rect x="230" y="104" width="18" height="13" rx="2" fill={WIN} />
        <rect x="150" y="128" width="110" height="7" rx="2" fill={ORANGE} />
        <circle cx="176" cy="138" r="13" fill={TYRE} /><circle cx="176" cy="138" r="5" fill={HUB} />
        <circle cx="238" cy="138" r="13" fill={TYRE} /><circle cx="238" cy="138" r="5" fill={HUB} />
      </g>
      {/* pin */}
      <g>
        <path d="M280 70 c0 12 -12 18 -12 18 s-12 -6 -12 -18 a12 12 0 0 1 24 0Z" fill={ORANGE} />
        <circle cx="268" cy="70" r="5" fill="#fff" />
      </g>
    </svg>
  );
}

/** Generic empty-state graphic — an open box. */
export function EmptyArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg" fill="none">
      <ellipse cx="60" cy="98" rx="44" ry="8" fill={BLUE} opacity="0.1" />
      <path d="M30 50 L60 62 L90 50 L60 38 Z" fill={BLUE_L} />
      <path d="M30 50 V82 L60 96 V62 Z" fill={BLUE} opacity="0.85" />
      <path d="M90 50 V82 L60 96 V62 Z" fill={BLUE_D} opacity="0.85" />
      <path d="M44 32 l8 8 M76 32 l-8 8 M60 26 v10" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Animated "searching" pulse with a pin at the centre. */
export function SearchingArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" fill="none">
      <circle cx="60" cy="60" r="52" fill={BLUE} opacity="0.06" />
      <circle cx="60" cy="60" r="36" fill={BLUE} opacity="0.10" />
      <circle cx="60" cy="60" r="22" fill={BLUE} opacity="0.14" />
      <path d="M60 40 c10 0 18 8 18 18 c0 13 -18 26 -18 26 s-18 -13 -18 -26 c0 -10 8 -18 18 -18Z" fill={ORANGE} />
      <circle cx="60" cy="58" r="7" fill="#fff" />
    </svg>
  );
}

/** Stylised map with a pickup→drop route, for the booking & tracking screens. */
export function MapArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 380 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect width="380" height="200" fill="var(--sx-primary-50)" />
      {/* blocks */}
      <g fill="#fff" opacity="0.7">
        <rect x="20" y="20" width="90" height="60" rx="6" />
        <rect x="140" y="14" width="110" height="48" rx="6" />
        <rect x="280" y="26" width="80" height="70" rx="6" />
        <rect x="30" y="110" width="120" height="70" rx="6" />
        <rect x="190" y="100" width="70" height="84" rx="6" />
        <rect x="290" y="120" width="74" height="64" rx="6" />
      </g>
      {/* roads */}
      <g stroke="var(--sx-neutral-200)" strokeWidth="6">
        <path d="M0 95 H380 M170 0 V200 M270 0 V200" />
      </g>
      {/* route */}
      <path d="M55 150 C130 150 150 60 200 60 S300 80 330 64" stroke="var(--sx-primary-500)" strokeWidth="5" strokeLinecap="round" />
      {/* pins */}
      <g>
        <circle cx="55" cy="150" r="9" fill="#fff" stroke="var(--sx-success)" strokeWidth="4" />
        <path d="M330 40 c0 11 -11 17 -11 17 s-11 -6 -11 -17 a11 11 0 0 1 22 0Z" fill="var(--sx-accent-500)" />
        <circle cx="319" cy="40" r="4.5" fill="#fff" />
      </g>
    </svg>
  );
}

/** Round brand mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect width="40" height="40" rx="11" fill={BLUE} />
      <path d="M9 24 h13 l5 -6 h4 l4 5 v3 h-3" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="27" r="3" fill={ORANGE} />
      <circle cx="28" cy="27" r="3" fill={ORANGE} />
    </svg>
  );
}
