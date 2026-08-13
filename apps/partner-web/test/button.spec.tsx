import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../src/components/ui/Button.js';

/**
 * Regression guard for the "Add rate card" fault.
 *
 * Every Modal wraps its body in a <form>. A <button> with no type attribute
 * defaults to type="submit", so a plain <Button> inside a Modal submitted that
 * form and closed the dialog — clicking "Add rate card" threw the user back to
 * the main page instead of opening the new-card form.
 *
 * Button must therefore default to type="button", while still letting the two
 * genuine submitters (Modal's own Save, Settings) opt in explicitly.
 */
describe('Button type', () => {
  it('defaults to type="button" so it never submits a surrounding form', () => {
    const html = renderToStaticMarkup(<Button>Add rate card</Button>);
    expect(html).toContain('type="button"');
    expect(html).not.toContain('type="submit"');
  });

  it('still honours an explicit type="submit"', () => {
    const html = renderToStaticMarkup(<Button type="submit">Save</Button>);
    expect(html).toContain('type="submit"');
  });

  it('keeps working for every variant and size', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'danger'] as const) {
      const html = renderToStaticMarkup(<Button variant={variant} size="sm">x</Button>);
      expect(html).toContain('type="button"');
    }
  });

  it('does not swallow onClick-bearing props', () => {
    const html = renderToStaticMarkup(<Button disabled title="Add rate card">x</Button>);
    expect(html).toContain('disabled');
    expect(html).toContain('title="Add rate card"');
  });
});
