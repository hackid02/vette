// VerdictBadge — the words the agent economy runs on.
// `stamp` renders the badge like a rubber stamp slamming onto paper —
// the audit-document identity. It is the visual, not an ornament.
const STYLES = {
  COMPLIANT: { bg: "bg-vet/15 text-vet border-vet/40", dot: "bg-vet" },
  DEVIATED: { bg: "bg-warn/15 text-warn border-warn/40", dot: "bg-warn" },
  DANGEROUS: { bg: "bg-danger/15 text-danger border-danger/40", dot: "bg-danger" },
  UNVERIFIABLE: { bg: "bg-line text-muted border-line", dot: "bg-muted" },
};

export default function VerdictBadge({ verdict, size = "md", icon = false, stamp = false }) {
  const s = STYLES[verdict] || STYLES.UNVERIFIABLE;
  const pad = size === "lg" ? "px-5 py-2 text-xs" : "px-2.5 py-1 text-[10px]";
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 rounded-full border font-bold tracking-widest ${s.bg} ${pad} ${
        stamp ? "stamp-in border-2" : ""
      }`}
    >
      {icon && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} pulse-dot`} />}
      {verdict}
    </span>
  );
}
