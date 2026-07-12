import { useRef, useState } from 'react';
import { Upload, X, Eye } from 'lucide-react';

/** Read + downscale an image to a small JPEG data-URL so it fits in localStorage.
 *  Real file storage (full-res) arrives with the backend (Firebase Storage). */
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 720;
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
        resolve(canvas.toDataURL('image/jpeg', 0.55));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ value, onChange, label = 'Upload image' }: {
  value?: string | undefined; onChange: (v: string | undefined) => void; label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { onChange(await compress(file)); } catch { alert("Couldn't read that image."); }
    setBusy(false);
    if (ref.current) ref.current.value = '';
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
      {value ? (
        <>
          <img src={value} alt="document" className="h-11 w-11 rounded-md object-cover ring-1 ring-neutral-200" />
          <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700"><Eye size={12} /> View</a>
          <button type="button" onClick={() => ref.current?.click()} className="text-[11px] font-bold text-neutral-500 hover:text-primary-600">Replace</button>
          <button type="button" onClick={() => onChange(undefined)} className="rounded-full p-0.5 text-neutral-400 hover:text-rose-500"><X size={13} /></button>
        </>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-500 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50">
          <Upload size={13} /> {busy ? 'Reading…' : label}
        </button>
      )}
    </div>
  );
}
