import type { Priority } from "../types";

const PRIORITY_COLOR: Record<Priority, string> = {
  LOW: "var(--color-ink-muted)",
  MEDIUM: "var(--color-accent-blue)",
  HIGH: "var(--color-accent-amber)",
  URGENT: "var(--color-status-cancelled)",
};

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: PRIORITY_COLOR[priority],
        border: `1px solid ${PRIORITY_COLOR[priority]}`,
        borderRadius: 3,
        padding: "2px 7px",
      }}
    >
      {priority}
    </span>
  );
}
