import { useState } from "react";

import type { Order, OrderStatus } from "../types";
import { PriorityPill } from "./PriorityPill";
import { ProductionLineTracker } from "./ProductionLineTracker";
import { StatusBadge } from "./StatusBadge";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "QUALITY_CHECK",
  QUALITY_CHECK: "COMPLETED",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Start job",
  IN_PROGRESS: "Send to QC",
  QUALITY_CHECK: "Mark completed",
};

interface OrderCardProps {
  order: Order;
  canOperate?: boolean;
  onAdvance?: (orderId: number, nextStatus: OrderStatus, note: string) => void;
  isUpdating?: boolean;
}

export function OrderCard({ order, canOperate = false, onAdvance, isUpdating = false }: OrderCardProps) {
  const [note, setNote] = useState("");
  const next = NEXT_STATUS[order.status];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="eyebrow">ORDER #{String(order.id).padStart(5, "0")}</div>
          <h3 style={{ fontSize: 17 }}>
            {order.material_name} × {order.quantity}
          </h3>
          <div style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
            {order.client_username} · due {order.deadline}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <PriorityPill priority={order.priority} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <ProductionLineTracker status={order.status} />

      {order.notes && (
        <p style={{ marginTop: 14, fontSize: 13, color: "var(--color-ink-muted)" }}>{order.notes}</p>
      )}

      {canOperate && next && (
        <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="Optional note for this step..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            disabled={isUpdating}
            onClick={() => onAdvance?.(order.id, next, note)}
          >
            {isUpdating ? "Updating..." : NEXT_LABEL[order.status]}
          </button>
        </div>
      )}
    </div>
  );
}
