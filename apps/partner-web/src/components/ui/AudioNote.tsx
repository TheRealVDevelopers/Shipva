/**
 * A short voice note — the client's "audio log if needed" on a delay report.
 *
 * Records from the mic via MediaRecorder, uploads the clip to Firebase Storage
 * and hands back its URL. If the mic isn't available or upload fails, it keeps a
 * local object-URL so the note still plays back in this session, the same
 * graceful-degradation ImageUpload uses.
 */
import { useRef, useState } from 'react';
import { Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { uploadDocImage } from '../../lib/storage.js';

export function AudioNote({ value, onChange, path }: {
  value?: string | undefined;
  onChange: (url: string | undefined) => void;
  path: string;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setErr('');
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErr('Recording is not supported on this device.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setBusy(true);
        try {
          const url = await uploadDocImage(blob, `${path}-${Date.now()}.webm`);
          onChange(url);
        } catch {
          onChange(URL.createObjectURL(blob)); // local fallback for this session
        }
        setBusy(false);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      setErr('Microphone permission was denied.');
    }
  }

  function stop() {
    recRef.current?.stop();
    setRecording(false);
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <audio src={value} controls className="h-8 max-w-[220px]" />
        <button type="button" onClick={() => onChange(undefined)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-500" title="Remove voice note"><Trash2 size={14} /></button>
      </div>
    );
  }

  return (
    <div>
      {busy ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500"><Loader2 size={13} className="animate-spin" /> Saving…</span>
      ) : recording ? (
        <button type="button" onClick={stop} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white">
          <Square size={12} /> Stop recording
        </button>
      ) : (
        <button type="button" onClick={() => void start()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50">
          <Mic size={13} /> Record voice note
        </button>
      )}
      {err && <p className="mt-1 text-[11px] text-rose-500">{err}</p>}
    </div>
  );
}
