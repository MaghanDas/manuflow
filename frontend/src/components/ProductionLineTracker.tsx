import type { OrderStatus } from "../types";
import { STATUS_LABELS, STATUS_SEQUENCE } from "../types";

/**
 * The production line tracker is ManuFlow's signature element: a job order
 * literally rides a conveyor from Pending to Completed. Each station is a
 * fixed post; the belt segment behind the current station is "moving"
 * (an animated dashed line) to suggest the job is actively being worked,
 * while completed segments are solid and future segments are flat gray.
 * A cancelled order is rendered as a stalled puck off the line.
 */
export function ProductionLineTracker({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--color-status-cancelled)",
          }}
        />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-status-cancelled)" }}>
          Line stopped — order cancelled
        </span>
      </div>
    );
  }

  const currentIndex = STATUS_SEQUENCE.indexOf(status);

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {STATUS_SEQUENCE.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: i === 0 ? "0 0 auto" : 1 }}>
            {i > 0 && (
              <div
                aria-hidden
                style={{
                  flex: 1,
                  height: 3,
                  margin: "0 2px",
                  background: isFuture
                    ? "var(--color-border)"
                    : isCurrent
                    ? "repeating-linear-gradient(90deg, var(--color-status-progress) 0 6px, transparent 6px 12px)"
                    : "var(--color-status-completed)",
                  backgroundSize: isCurrent ? "16px 3px" : undefined,
                  animation: isCurrent ? "belt-move 0.6s linear infinite" : undefined,
                  borderRadius: 2,
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                title={STATUS_LABELS[step]}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: `2px solid ${
                    isDone
                      ? "var(--color-status-completed)"
                      : isCurrent
                      ? "var(--color-status-progress)"
                      : "var(--color-border)"
                  }`,
                  background: isDone
                    ? "var(--color-status-completed)"
                    : isCurrent
                    ? "var(--color-status-progress)"
                    : "#fff",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: isFuture ? "var(--color-ink-muted)" : "var(--color-ink)",
                  whiteSpace: "nowrap",
                }}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes belt-move {
          from { background-position: 0 0; }
          to { background-position: 12px 0; }
        }
      `}</style>
    </div>
  );
}
