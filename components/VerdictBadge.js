// VerdictBadge — the three words the agent economy runs on
const STYLES = {
  COMPLIANT: { bg: "bg-vet/15 text-vet border-vet/40", dot: "bg-vet" },
  DEVIATED: { bg: "bg-warn/15 text-warn border-warn/40", dot: "bg-warn" },
  DANGEROUS: { bg: "bg-danger/15 text-danger border-danger/40", dot: "bg-danger" },
  UNVERIFIABLE: { bg: "bg-line text-muted border-line", dot: "bg-muted" },
};

export default function VerdictBadge({ verdict, size = "md", icon = false }) {
  const s = STYLES[verdict] || STYLES.UNVERIFIABLE;
  const pad = size === "lg" ? "px-4 py-1.5 text-xs" : "px-2.5 py-1 text-[10px]";
  return (
    <span className={`mono inline-flex items-center gap-1.5 rounded-full border font-bold tracking-widest ${s.bg} ${pad}`}>
      {icon && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} pulse-dot`} />}
      {verdict}
    </span>
  );
}
