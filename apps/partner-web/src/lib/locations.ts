/**
 * Location Master — org-wide location shortcuts, so nobody pastes the same
 * Google Maps link twice. Each record is a short code (HK2, BHK3…), the full
 * location name and the maps link. Backed by the shared `orgLocations`
 * collection (lib/common): every member reads the same list, anything one
 * member adds is instantly available to everyone, wherever a location is
 * typed (Trips points, Amazon Tour stops).
 */
import { useEffect, useState } from 'react';
import { sharedCollection } from './common.js';

export interface SavedLocation {
  id?: string;
  /** Short shortcut the user types — stored UPPERCASE, unique across the org. */
  code: string;
  /** Full location name, filled in wherever the code is picked. */
  name: string;
  /** Google Maps link, filled in alongside the name. */
  mapUrl: string;
  createdByName?: string;
  createdAtMs?: number;
}

export const locationsCol = sharedCollection<SavedLocation>('orgLocations');

/** Live list of the org's saved locations (newest first). */
export function useLocations(): SavedLocation[] {
  const [list, setList] = useState<SavedLocation[]>([]);
  useEffect(() => locationsCol.watch(setList), []);
  return list;
}

export const normCode = (code: string): string => code.trim().toUpperCase();

/**
 * Rank locations against what the user typed: exact/prefix code matches first
 * (the promised "type the code" flow), then code-contains, then name-contains
 * so a half-remembered name still finds it.
 */
export function matchLocations(list: SavedLocation[], q: string, limit = 6): SavedLocation[] {
  const s = normCode(q);
  if (!s) return [];
  const score = (l: SavedLocation): number => {
    const code = normCode(l.code);
    if (code.startsWith(s)) return 0;
    if (code.includes(s)) return 1;
    if (l.name.toUpperCase().includes(s)) return 2;
    return -1;
  };
  return list
    .map((l) => ({ l, sc: score(l) }))
    .filter((x) => x.sc >= 0)
    .sort((a, b) => a.sc - b.sc || a.l.code.localeCompare(b.l.code))
    .slice(0, limit)
    .map((x) => x.l);
}
