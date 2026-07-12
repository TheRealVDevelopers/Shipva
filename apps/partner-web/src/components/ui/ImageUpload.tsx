import { useRef, useState } from 'react';
import { Upload, X, Eye, Cloud, HardDrive } from 'lucide-react';
import { uploadDocImage } from '../../lib/storage.js';
import { Lightbox } from './Lightbox.js';

/** Read + downscale an image to a small JPEG blob. */
function compress(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1280;
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
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no blob'))), 'image/jpeg', 0.7);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const blobToDataUrl = (b: Blob): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(b);
});

export function ImageUpload({ value, onChange, label = 'Upload image', path }: {
  value?: string | undefined; onChange: (v: string | undefined) => void; label?: string; path?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mode, setMode] = useState<'cloud' | 'local' | null>(value ? (value.startsWith('http') ? 'cloud' : 'local') : null);
  const title = label.replace(/^upload /i, '').trim() || 'Document';

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (ref.current) ref.current.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compress(file);
      // Try Firebase Storage first; fall back to a local copy if it fails.
      if (path) {
        try {
          const url = await uploadDocImage(blob, `${path}-${Date.now()}.jpg`);
          onChange(url); setMode('cloud'); setBusy(false); return;
        } catch { /* not signed in / storage unavailable — fall back */ }
      }
      onChange(await blobToDataUrl(blob)); setMode('local');
    } catch { alert("Couldn't read that image."); }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
      {value ? (
        <>
          <button type="button" onClick={() => setPreview(true)} title="Preview" className="group relative">
            <img src={value} alt={title} className="h-11 w-11 rounded-md object-cover ring-1 ring-neutral-200 transition group-hover:ring-primary-300" />
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-neutral-900/0 text-white opacity-0 transition group-hover:bg-neutral-900/40 group-hover:opacity-100"><Eye size={16} /></span>
          </button>
          {mode === 'cloud'
            ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600"><Cloud size={11} /> Cloud</span>
            : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400"><HardDrive size={11} /> Local</span>}
          <button type="button" onClick={() => setPreview(true)} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700"><Eye size={12} /> Preview</button>
          <button type="button" onClick={() => ref.current?.click()} className="text-[11px] font-bold text-neutral-500 hover:text-primary-600">Replace</button>
          <button type="button" onClick={() => { onChange(undefined); setMode(null); }} className="rounded-full p-0.5 text-neutral-400 hover:text-rose-500"><X size={13} /></button>
          {preview && <Lightbox src={value} title={title} onClose={() => setPreview(false)} />}
        </>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-500 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50">
          <Upload size={13} /> {busy ? 'Uploading…' : label}
        </button>
      )}
    </div>
  );
}
