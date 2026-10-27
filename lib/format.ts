// Presentation helpers shared by pages (no data access).

const ROLE_LABEL: Record<string, string> = {
  alumni: "Placed senior",
  student: "Student",
  admin: "Placement cell",
};

/** "Placed senior · Batch of 2025". Anonymised (deleted) authors → "Former student". */
export function authorLabel(authorRole: string | null, gradYear: number | null): string {
  if (!authorRole) return "Former student";
  const who = ROLE_LABEL[authorRole] ?? "Student";
  return gradYear ? `${who} · Batch of ${gradYear}` : who;
}
