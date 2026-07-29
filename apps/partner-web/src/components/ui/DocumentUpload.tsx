/**
 * Upload a signed document — PDF first, images accepted too.
 *
 * The vendor paperwork (rate card, joining letter, Service Agreement) goes out
 * as a PDF and comes back signed as a PDF, which is what the code comment in
 * VendorDocs asked for all along. It was wired to the image uploader, so a
 * vendor returning a signed PDF hit a file-format error and staff had to
 * photograph a screen to get it in. Storage rules have always allowed
 * `application/pdf` here; this is what actually sends one.
 *
 * PDFs upload untouched — re-encoding a signed document would be wrong. Images
 * are still downscaled, since a phone photo of a signed page is usually far
 * larger than it needs to be.
 *
 * Deliberately cloud-only, no inline-copy fallback: a signed agreement is a
 * legal record, and a multi-megabyte PDF stuffed into the database as text
 * would exceed the per-record limit and fail the save silently. If the upload
 * can't happen we say so.
 */
import { useRef, useState } from 'react';
import { Upload, X, Eye, FileText, AlertTriangle, ExternalLink } from 'lucide-react';
import { uploadDocFile } from '../../lib/storage.js';
import { Lightbox } from './Lightbox.js';

/** Storage rules cap `documents/` at 8 MB — fail early with a real message
 *  rather than letting the upload be rejected server-side. */
const MAX_BYTES = 8 * 1024 * 1024;

/** PDF first, then the image types, so the picker offers PDF by default. */
const ACCEPT = 'application/pdf,image/png,image/jpeg';

/**
 * Is this stored document a PDF? A Firebase download URL keeps the filename —
 * "…%2Fagreement-signed-1753.pdf?alt=media&token=…" — so the extension before
 * the query string is the answer.
 */
export const isPdfUrl = (url?: string): boolean => {
  if (!url) return false;
  const [pathPart = ''] = url.split('?');
  return /\.pdf$/i.test(pathPart);
};

/**
 * Read-only view of a stored document — a thumbnail for a photo, a link for a
 * PDF. Anywhere that shows an uploaded document must use this: a bare <img>
 * pointed at a PDF renders as a broken image with no way to open it.
 */
export function DocPreview({ url, label, size = 'h-16 w-16' }: {
  url?: string | undefined; label: string; size?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!url) {
    return (
      <div className={`flex ${size} items-center justify-center rounded-lg bg-neutral-50 text-[10px] font-bold text-neutral-300 ring-1 ring-inset ring-neutral-200`}>
        Missing
      </div>
    );
  }
  if (isPdfUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" title={`${label} (PDF)`}
        className={`flex ${size} flex-col items-center justify-center gap-0.5 rounded-lg bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-100`}>
        <FileText size={18} />
        <span className="text-[9px] font-extrabold">PDF</span>
      </a>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title={label}>
        <img src={url} alt={label} className={`${size} rounded-lg object-cover ring-1 ring-neutral-200 hover:ring-primary-300`} />
      </button>
      {open && <Lightbox src={url} title={label} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Downscale an image; PDFs are never touched. */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        let { width, height } = img;
        if (width > max || height > max) {
          const r = Math.min(max / width, max / height);
          width = Math.round(width * r); height = Math.round(height * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no blob'))), 'image/jpeg', 0.8);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentUpload({ value, onChange, label = 'Upload document', path }: {
  value?: string | undefined;
  onChange: (url: string | undefined) => void;
  label?: string;
  /** Storage path prefix, e.g. `documents/transporters/<id>/agreement-signed`. */
  path: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(false);

  const pdf = isPdfUrl(value);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (ref.current) ref.current.value = '';
    if (!file) return;
    setErr('');

    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setErr('Please choose a PDF, PNG or JPG file.');
      return;
    }
    if (isPdf && file.size > MAX_BYTES) {
      setErr(`That PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 8 MB. Try scanning at a lower quality.`);
      return;
    }

    setBusy(true);
    try {
      // A signed PDF goes up byte-for-byte; only photos are re-encoded.
      const body: Blob = isPdf ? file : await compressImage(file);
      const ext = isPdf ? 'pdf' : 'jpg';
      onChange(await uploadDocFile(body, `${path}-${Date.now()}.${ext}`));
    } catch {
      setErr("Couldn't upload that file — check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <input ref={ref} type="file" accept={ACCEPT} className="hidden" onChange={pick} />

      {value ? (
        <div className="flex flex-wrap items-center gap-2">
          {pdf ? (
            <a href={value} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50">
              <FileText size={13} /> Signed PDF <ExternalLink size={11} />
            </a>
          ) : (
            <button type="button" onClick={() => setPreview(true)} title="Preview" className="group relative">
              <img src={value} alt={label} className="h-11 w-11 rounded-md object-cover ring-1 ring-neutral-200 transition group-hover:ring-primary-300" />
              <span className="absolute inset-0 flex items-center justify-center rounded-md bg-neutral-900/0 text-white opacity-0 transition group-hover:bg-neutral-900/40 group-hover:opacity-100"><Eye size={16} /></span>
            </button>
          )}
          <button type="button" onClick={() => ref.current?.click()} className="text-[11px] font-bold text-neutral-500 hover:text-primary-600">Replace</button>
          <button type="button" onClick={() => { onChange(undefined); setErr(''); }} className="rounded-full p-0.5 text-neutral-400 hover:text-rose-500" title="Remove"><X size={13} /></button>
          {!pdf && preview && <Lightbox src={value} title={label} onClose={() => setPreview(false)} />}
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-500 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50">
          <Upload size={13} /> {busy ? 'Uploading…' : label}
        </button>
      )}

      <p className="mt-1 text-[10px] text-neutral-400">PDF, PNG or JPG · up to 8 MB</p>
      {err && <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600"><AlertTriangle size={11} /> {err}</p>}
    </div>
  );
}
