/**
 * A signed document may now come back as a PDF. The stored value is a Firebase
 * download URL, and the UI has to tell a PDF from a photo to decide whether to
 * open it in a tab or show it in the lightbox — get this wrong and a signed
 * agreement renders as a broken image.
 */
import { describe, it, expect } from 'vitest';
import { isPdfUrl } from '../src/components/ui/DocumentUpload.js';

const fb = (name: string) =>
  `https://firebasestorage.googleapis.com/v0/b/sarvaexpressos.firebasestorage.app/o/`
  + `documents%2Ftransporters%2Fabc123%2F${encodeURIComponent(name)}?alt=media&token=9f8e-7d6c`;

describe('isPdfUrl', () => {
  it('recognises a signed PDF behind the query string', () => {
    expect(isPdfUrl(fb('agreement-signed-1753280000000.pdf'))).toBe(true);
    expect(isPdfUrl(fb('rateCard-signed-1753280000000.pdf'))).toBe(true);
    expect(isPdfUrl(fb('loi-signed-1753280000000.pdf'))).toBe(true);
  });

  it('does not mistake a photo for a PDF', () => {
    expect(isPdfUrl(fb('agreement-signed-1753280000000.jpg'))).toBe(false);
    expect(isPdfUrl(fb('agreement-signed-1753280000000.png'))).toBe(false);
  });

  it('is not fooled by "pdf" appearing elsewhere in the URL', () => {
    // A vendor whose folder happens to contain the word, and a token that does.
    expect(isPdfUrl(fb('pdf-scan-of-agreement.jpg'))).toBe(false);
    expect(isPdfUrl(`${fb('agreement.jpg')}&x=file.pdf`)).toBe(false);
  });

  it('handles a plain path and an empty value', () => {
    expect(isPdfUrl('/documents/agreement.pdf')).toBe(true);
    expect(isPdfUrl('/documents/agreement.PDF')).toBe(true);
    expect(isPdfUrl(undefined)).toBe(false);
    expect(isPdfUrl('')).toBe(false);
  });
});
