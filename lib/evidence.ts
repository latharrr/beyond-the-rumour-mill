import { EVIDENCE_TYPES, type EvidenceType } from "@/lib/schemas";

// The browser-supplied MIME type is only a claim. Check the file's leading
// bytes so a renamed executable can't be stored as "application/pdf".
const SIGNATURES: Record<EvidenceType, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d], // "%PDF-"
};

export function sniffMatches(type: EvidenceType, head: Uint8Array): boolean {
  const sig = SIGNATURES[type];
  return head.length >= sig.length && sig.every((b, i) => head[i] === b);
}

export async function fileMatchesType(file: File): Promise<boolean> {
  if (!(file.type in EVIDENCE_TYPES)) return false;
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return sniffMatches(file.type as EvidenceType, head);
}

/** {uid}/{uuid}.{ext}: uuid generated server-side, no client filename (§1.6). */
export const evidenceObjectPath = (uid: string, type: EvidenceType, id: string = crypto.randomUUID()) =>
  `${uid}/${id}.${EVIDENCE_TYPES[type]}`;
