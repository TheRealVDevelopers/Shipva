/**
 * The vendor paperwork panel — one per transporter / truck owner.
 *
 * Three documents, in the order the client sends them: rate card, joining
 * letter, then the Service Agreement (which only unlocks once the first two have
 * gone out — page 25: shared "after the rate card and joining letter has been
 * submitted"). Each row does the same three things: generate the filled PDF,
 * mark it sent, and take back the signed copy the vendor returns.
 *
 * The joining letter carries a 7-day clock; miss it and the vendor reads "KYC
 * pending" (see lib/vendorDocs). Everything here is the same for both vendor
 * kinds — the caller supplies the download handlers, since a transporter's rate
 * card and a truck owner's aren't built from the same record.
 */
import { FileText, Upload, Check, AlertTriangle, Clock } from 'lucide-react';
import { ImageUpload } from './ui/ImageUpload.js';
import { Badge } from './ui/Badge.js';
import { docStatuses, agreementReady, type VendorDocState, type VendorDocKind } from '../lib/vendorDocs.js';

export interface VendorDocsProps {
  /** The record's paperwork fields. */
  state: VendorDocState;
  /** Storage path prefix, e.g. `documents/transporters/<id>`. */
  path: string;
  /** Build + open the document, and stamp that it went out. */
  onSend: (kind: VendorDocKind) => void;
  /** The signed copy came back (or was removed). */
  onSigned: (kind: VendorDocKind, img: string | undefined) => void;
  /** Truck owners have no rate card of their own. */
  hide?: VendorDocKind[];
}

export function VendorDocs({ state, path, onSend, onSigned, hide = [] }: VendorDocsProps) {
  const all = docStatuses(state).filter((d) => !hide.includes(d.kind));
  const canAgreement = agreementReady(state, hide);

  return (
    <div className="space-y-2.5">
      {all.map((d) => {
        const locked = d.kind === 'agreement' && !canAgreement;
        return (
          <div key={d.kind} className="rounded-xl p-3 ring-1 ring-inset ring-neutral-200" style={{ background: '#F7F8F8' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-neutral-800">{d.label}</span>
                  {d.signed
                    ? <Badge tone="success"><Check size={10} /> Signed copy on file</Badge>
                    : d.overdue
                      ? <Badge tone="danger"><AlertTriangle size={10} /> KYC pending</Badge>
                      : d.sent
                        ? <Badge tone="warning"><Clock size={10} /> Awaiting signed copy{d.daysLeft !== undefined ? ` · ${d.daysLeft}d left` : ''}</Badge>
                        : <Badge tone="neutral">Not sent</Badge>}
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-500">
                  {d.sent ? `Sent ${d.sentOn}`
                    : locked ? `Send the ${hide.includes('rateCard') ? 'joining letter' : 'rate card and joining letter'} first`
                      : 'Not sent yet'}
                </div>
              </div>
              <button type="button" onClick={() => onSend(d.kind)} disabled={locked}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-primary-600 ring-1 ring-inset ring-primary-200 hover:bg-primary-50 disabled:opacity-40">
                <FileText size={12} /> {d.sent ? 'Download again' : 'Generate & send'}
              </button>
            </div>

            {/* The signed copy the vendor returns — the client's "re-upload the
                pdf after the vendor has shared back with the digital signature". */}
            {d.sent && (
              <div className="mt-2.5 border-t border-neutral-200 pt-2.5">
                <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-neutral-600">
                  <Upload size={11} /> Signed copy from the vendor
                </div>
                <ImageUpload
                  value={d.signedImg || undefined}
                  onChange={(v) => onSigned(d.kind, v)}
                  label="Upload signed document"
                  path={`${path}/${d.kind}-signed`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
