const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});
 
export function Money({ value, className = "" }) {
  return <span className={`font-mono tabular ${className}`}>{eur.format(value)}</span>;
}
 
export function StatusChip({ status }) {
  const map = {
    open:      "bg-chip-openBg   text-chip-openText",
    paid:      "bg-chip-paidBg   text-chip-paidText",
    cancelled: "bg-chip-cancelBg text-chip-cancelText",
  };
  const label = { open: "Open", paid: "Paid", cancelled: "Cancelled" }[status] || status;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${map[status]}`}>
      {label}
    </span>
  );
}
 
export function ReviewChip() {
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-medium uppercase tracking-wider bg-chip-reviewBg text-chip-reviewText">
      Needs review
    </span>
  );
}
 
// The "memorable detail": a confidence bar that reads at a glance.
// Low confidence = amber, high = forest green. Tabular figures so percentages
// in adjacent rows line up.
export function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  // Linear interpolation between amber (#c47d00) and forest (#2c5e3f) by confidence
  const t = Math.max(0, Math.min(1, (value - 0.7) / 0.3)); // 0.70..1.00 → 0..1
  const r = Math.round(196 + (44 - 196) * t);
  const g = Math.round(125 + (94 - 125) * t);
  const b = Math.round(0   + (63 - 0)   * t);
  const color = `rgb(${r}, ${g}, ${b})`;
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono tabular text-xs text-graphite w-9 text-right">{pct}%</span>
      <div className="h-1.5 w-24 bg-rule">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
 
export function Button({ children, variant = "primary", className = "", ...rest }) {
  const styles = {
    primary:   "bg-ink text-paper hover:bg-graphite",
    secondary: "bg-paper text-ink border border-rule hover:bg-rule/30",
    danger:    "bg-paper text-chip-cancelText border border-chip-cancelText/40 hover:bg-chip-cancelBg",
  };
  return (
    <button
      className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}