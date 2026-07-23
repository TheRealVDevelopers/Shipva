/**
 * Location code typeahead — the Location Master's front end. Drop-in text
 * input: the user types a location code (HK2, BHK3…) or part of a name,
 * matching shortcuts appear underneath, and picking one hands the full record
 * to the caller so it can fill the name + Google Maps link in one go. Typing
 * free text still works exactly like a plain input — the master is a shortcut,
 * never a constraint.
 */
import { useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { TextInput } from './ui/Modal.js';
import { matchLocations, useLocations, type SavedLocation } from '../lib/locations.js';

export function LocationSuggest({ value, onChange, onPick, placeholder, className, upper }: {
  value: string;
  onChange: (text: string) => void;
  /** Called with the full saved location when a suggestion is chosen. */
  onPick: (loc: SavedLocation) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  /** Uppercase what the user types (Amazon Tour stop names are stored UPPERCASE). */
  upper?: boolean | undefined;
}) {
  const locations = useLocations();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Suggestions must survive the input's blur long enough for a click on one
  // to land — mousedown fires before blur, so picking happens on mousedown.
  const boxRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => matchLocations(locations, value), [locations, value]);
  const showing = open && matches.length > 0;

  const pick = (loc: SavedLocation) => { onPick(loc); setOpen(false); };

  return (
    <div ref={boxRef} className="relative">
      <TextInput
        value={value}
        onChange={(e) => { onChange(upper ? e.target.value.toUpperCase() : e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!showing) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          // Enter picks instead of submitting the surrounding modal form.
          else if (e.key === 'Enter') { e.preventDefault(); const m = matches[active]; if (m) pick(m); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showing && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg bg-white shadow-lift ring-1 ring-neutral-200">
          {matches.map((m, i) => (
            <button
              key={m.id ?? m.code}
              type="button"
              // mousedown, not click — click would fire after the input's blur
              // has already closed the list.
              onMouseDown={(e) => { e.preventDefault(); pick(m); }}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${i === active ? 'bg-primary-50' : 'bg-white'}`}
            >
              <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-neutral-700">{m.code}</span>
              <span className="min-w-0 flex-1 truncate font-bold text-neutral-800">{m.name}</span>
              {m.mapUrl && <MapPin size={12} className="shrink-0 text-emerald-500" aria-label="Has map link" />}
            </button>
          ))}
          <div className="border-t border-neutral-100 px-3 py-1.5 text-[10px] font-semibold text-neutral-400">
            Location Master — picking one fills the name &amp; map link
          </div>
        </div>
      )}
    </div>
  );
}
