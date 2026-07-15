import type { OrderStatus } from "../types";
import { STATUS_LABELS } from "../types";

const COLORS: Record<OrderStatus, string> = {
  PENDING: "var(--color-status-pending)",
  IN_PROGRESS: "var(--color-status-progress)",
  QUALITY_CHECK: "var(--color-status-qc)",
  COMPLETED: "var(--color-status-completed)",
  CANCELLED: "var(--color-status-cancelled)",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 500,
        padding: "3px 9px",
        borderRadius: 999,
        color: COLORS[status],
        background: `${COLORS[status]}1a`,
        border: `1px solid ${COLORS[status]}55`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: COLORS[status],
          display: "inline-block",
        }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
