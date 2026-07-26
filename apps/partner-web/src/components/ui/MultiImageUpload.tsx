/**
 * Multiple photos for one slot (KM / invoice / GPS / POD) — the client asked to
 * be able to attach more than one shot per kind.
 *
 * Deliberately cloud-only. The single-image uploader falls back to an inline
 * data URL when Storage is unreachable, which is fine for one small document
 * thumbnail but not here: several full-size photos as base64 on the same tour
 * document blow past Firestore's 1 MiB limit, and the write fails — which is
 * exactly how POD photos were going missing. If the upload can't happen we say
 * so instead of storing something that will silently fail to save.
 */
import { useRef, useState } from 'react';
import { Upload, X, Eye, AlertTriangle } from 'lucide-react';
import { uploadDocImage } from '../../lib/storage.js';
import { Lightbox } from './Lightbox.js';

/** Downscale to a reasonable JPEG so a phone photo isn't a 6 MB upload. */
function compress(file: File): Promise<Blob> {
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
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no blob'))), 'image/jpeg', 0.72);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MultiImageUpload({ label, value, onChange, path, max = 6 }: {
  label: string;
  value: string[] | undefined;
  onChange: (urls: string[]) => void;
  /** Storage folder prefix, e.g. `tours/<id>/<vrid>/pod`. */
  path: string;
  max?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const list = value ?? [];
  const room = Math.max(0, max - list.length);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, room);
    if (ref.current) ref.current.value = '';
    if (!files.length) return;
    setErr(''); setBusy(files.length);
    const added: string[] = [];
    for (const file of files) {
      try {
        const blob = await compress(file);
        added.push(await uploadDocImage(blob, `${path}-${Date.now()}-${added.length}.jpg`));
      } catch {
        setErr("Couldn't upload — check your connection and try again.");
      }
      setBusy((n) => n - 1);
    }
    if (added.length) onChange([...list, ...added]);
    setBusy(0);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-bold text-neutral-500">{label}</span>
        {list.length > 0 && <span className="text-[10px] font-bold text-neutral-400">{list.length}/{max}</span>}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={pick} />
      <div className="flex flex-wrap items-center gap-1.5">
        {list.map((url, i) => (
          <span key={url} className="group relative">
            <button type="button" onClick={() => setPreview(url)} title="Preview">
              <img src={url} alt={`${label} ${i + 1}`} className="h-11 w-11 rounded-md object-cover ring-1 ring-neutral-200 transition group-hover:ring-primary-300" />
            </button>
            <button type="button" onClick={() => onChange(list.filter((u) => u !== url))}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 text-neutral-400 shadow ring-1 ring-neutral-200 hover:text-rose-500" title="Remove">
              <X size={11} />
            </button>
          </span>
        ))}
        {room > 0 && (
          <button type="button" onClick={() => ref.current?.click()} disabled={busy > 0}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-2.5 text-[11px] font-bold text-neutral-500 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50">
            {busy > 0 ? <>Uploading {busy}…</> : <><Upload size={13} /> Add</>}
          </button>
        )}
      </div>
      {err && <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600"><AlertTriangle size={11} /> {err}</p>}
      {preview && <Lightbox src={preview} title={label} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** Small read-only strip of photos, for the review/summary views. */
export function PhotoStrip({ urls, label }: { urls: string[] | undefined; label: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  if (!urls?.length) return <span className="text-[11px] text-neutral-300">—</span>;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {urls.map((u, i) => (
        <button key={u} type="button" onClick={() => setPreview(u)} title={`${label} ${i + 1}`}>
          <img src={u} alt={`${label} ${i + 1}`} className="h-8 w-8 rounded object-cover ring-1 ring-neutral-200 hover:ring-primary-300" />
        </button>
      ))}
      <Eye size={11} className="text-neutral-300" />
      {preview && <Lightbox src={preview} title={label} onClose={() => setPreview(null)} />}
    </div>
  );
}
