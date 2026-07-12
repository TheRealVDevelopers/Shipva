import { useEffect, useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

/** Full-screen image preview with a download option. Works for both remote
 *  (Firebase Storage) URLs and local data-URLs. */
export function Lightbox({ src, title = 'Document', onClose }: { src: string; title?: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function download() {
    const name = `${title.replace(/[^\w.-]+/g, '_').toLowerCase() || 'document'}.jpg`;
    setBusy(true);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank', 'noopener'); // CORS/other — fall back to opening it
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-neutral-950/85 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6" onClick={(e) => e.stopPropagation()}>
        <span className="truncate text-sm font-bold">{title}</span>
        <div className="flex items-center gap-2">
          <button onClick={download} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-50">
            <Download size={14} /> {busy ? 'Downloading…' : 'Download'}
          </button>
          <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20" title="Open in new tab">
            <ExternalLink size={14} />
          </a>
          <button onClick={onClose} className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20" aria-label="Close"><X size={16} /></button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8" onClick={onClose}>
        <img src={src} alt={title} className="max-h-full max-w-full rounded-lg object-contain shadow-lift" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
