import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { odometerSpan } from '../src/lib/km.js';

/**
 * "The updated changes in a Completed trip are not being saved."
 *
 * Cause: the "Correct figures" grant was never handed from TourOperate down to
 * each VRID's form, so a submitted VRID showed live inputs with no Save button
 * and anything typed was silently lost. The prop is optional, so the compiler
 * could not see it was missing -- hence a guard on the wiring itself.
 */
describe('completed-trip correction wiring', () => {
  const src = readFileSync(new URL('../src/routes/partner/Tours.tsx', import.meta.url), 'utf8');

  it('passes canEditDone from TourOperate into every LegUpdate', () => {
    const start = src.indexOf('<LegUpdate');
    expect(start).toBeGreaterThan(-1);
    const tag = src.slice(start, src.indexOf('/>', start));
    expect(tag).toContain('canEditDone={canEditDone}');
  });

  it('locks the figures of a submitted VRID until it is deliberately re-opened', () => {
    expect(src).toContain('<fieldset disabled={submitted && !reopened}');
  });

  it('reports a rejected save instead of swallowing it', () => {
    expect(src).toContain("Couldn't save your changes");
  });
});

describe('odometerSpan', () => {
  it('does not leak floating-point noise (39.3 - 10)', () => {
    expect(odometerSpan('10', '39.3')).toBe(29.3);
  });
  it('handles the plain case', () => {
    expect(odometerSpan('0', '39.3')).toBe(39.3);
  });
  it('goes negative for backwards readings so the form can flag them', () => {
    expect(odometerSpan('50', '40')).toBe(-10);
  });
  it('is null while either reading is blank or not a number', () => {
    expect(odometerSpan('', '40')).toBeNull();
    expect(odometerSpan('10', '  ')).toBeNull();
    expect(odometerSpan('abc', '40')).toBeNull();
  });
});
