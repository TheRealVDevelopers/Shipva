/**
 * The vendor paperwork loop — shared by transporters and truck owners.
 *
 * Three documents go out, in this order (the client's page 25: the agreement is
 * shared "after the rate card and joining letter has been submitted"):
 *
 *   1. Rate card      — the Annexure B figures, with a From/To signature block
 *   2. Joining letter — the 7-day Letter of Intent
 *   3. Service Agreement
 *
 * Each is generated filled-in, sent to the vendor, signed, and then re-uploaded
 * by the employee. The client's rule: "In next 7 days the employee has to
 * receive the signed document back from the vendor and reupload the document or
 * fail to do so will be shown as KYC pending." That clock is tied to the JOINING
 * LETTER specifically — that's where the PDF states it — so a rate card sitting
 * unsigned doesn't itself flag KYC.
 *
 * Dates are stored twice on purpose: a readable label for people, and an epoch
 * for arithmetic. The labels ("17 Jul 2026") do parse, but the app already had
 * one date-parsing bug and the clock here decides whether a vendor looks
 * compliant — not somewhere to rely on Date() guessing a format.
 */

export type VendorDocKind = 'rateCard' | 'loi' | 'agreement';

/** How long the vendor has to return a signed joining letter. */
export const SIGN_BACK_DAYS = 7;

/** The paperwork fields. Both Customer and AttachedTruck carry these. */
export interface VendorDocState {
  rateCardSentOn?: string | undefined;
  rateCardSentAtMs?: number | undefined;
  rateCardSignedImg?: string | undefined;

  /** The joining letter's send date — `loiIssuedOn` predates this module. */
  loiIssuedOn?: string | undefined;
  loiIssuedAtMs?: number | undefined;
  loiSignedImg?: string | undefined;

  agreementSentOn?: string | undefined;
  agreementSentAtMs?: number | undefined;
  agreementSignedImg?: string | undefined;
}

export const DOC_LABEL: Record<VendorDocKind, string> = {
  rateCard: 'Rate card',
  loi: 'Joining letter (7-day LOI)',
  agreement: 'Service Agreement',
};

export interface DocStatus {
  kind: VendorDocKind;
  label: string;
  /** Readable date it went out, if it has. */
  sentOn?: string | undefined;
  sent: boolean;
  /** The signed copy that came back. */
  signedImg?: string | undefined;
  signed: boolean;
  /** Only the joining letter runs a clock. */
  dueAtMs?: number | undefined;
  daysLeft?: number | undefined;
  overdue: boolean;
}

/** When a document was sent, preferring the epoch and falling back to the label
 *  for records written before the epoch was stored. */
function sentAt(ms?: number, label?: string): number | undefined {
  if (typeof ms === 'number' && Number.isFinite(ms)) return ms;
  if (!label) return undefined;
  const t = new Date(label).getTime();
  return Number.isNaN(t) ? undefined : t;
}

const DAY = 864e5;

export function docStatuses(v: VendorDocState, now = Date.now()): DocStatus[] {
  const loiAt = sentAt(v.loiIssuedAtMs, v.loiIssuedOn);
  const loiDue = loiAt === undefined ? undefined : loiAt + SIGN_BACK_DAYS * DAY;
  const loiSigned = !!v.loiSignedImg;

  return [
    {
      kind: 'rateCard', label: DOC_LABEL.rateCard,
      sentOn: v.rateCardSentOn, sent: !!v.rateCardSentOn,
      signedImg: v.rateCardSignedImg, signed: !!v.rateCardSignedImg,
      overdue: false,
    },
    {
      kind: 'loi', label: DOC_LABEL.loi,
      sentOn: v.loiIssuedOn, sent: !!v.loiIssuedOn,
      signedImg: v.loiSignedImg, signed: loiSigned,
      dueAtMs: loiDue,
      daysLeft: loiDue === undefined || loiSigned ? undefined : Math.ceil((loiDue - now) / DAY),
      overdue: !loiSigned && loiDue !== undefined && now > loiDue,
    },
    {
      kind: 'agreement', label: DOC_LABEL.agreement,
      sentOn: v.agreementSentOn, sent: !!v.agreementSentOn,
      signedImg: v.agreementSignedImg, signed: !!v.agreementSignedImg,
      overdue: false,
    },
  ];
}

/**
 * "KYC pending" — the joining letter went out, 7 days have passed, and no signed
 * copy has been re-uploaded. A vendor who was never sent one isn't pending; they
 * simply haven't started.
 */
export function kycPending(v: VendorDocState, now = Date.now()): boolean {
  return docStatuses(v, now).some((d) => d.kind === 'loi' && d.overdue);
}

/**
 * The agreement only goes out once the rate card and joining letter have —
 * page 25: shared "after the rate card and joining letter has been submitted".
 *
 * `hide` lists documents this vendor kind doesn't have, and they can't gate what
 * they don't have: a truck owner carries no rate card, so requiring one would
 * lock their agreement forever.
 */
export function agreementReady(v: VendorDocState, hide: VendorDocKind[] = []): boolean {
  const rateCardDone = hide.includes('rateCard') || !!v.rateCardSentOn;
  return rateCardDone && !!v.loiIssuedOn;
}
