import { useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { OrderCard } from "../components/OrderCard";
import { fetchOrders, setFilters, transitionOrderStatus } from "../features/orders/ordersSlice";
import { useOrderStatusSocket } from "../hooks/useOrderStatusSocket";
import type { OrderStatus, Priority } from "../types";

const PRIORITY_ORDER: Record<Priority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function OperatorQueuePage() {
  const dispatch = useAppDispatch();
  const { items, status, filters } = useAppSelector((state) => state.orders);
  const user = useAppSelector((state) => state.auth.user);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useOrderStatusSocket(user?.id, user?.role);

  useEffect(() => {
    dispatch(fetchOrders());
    const interval = setInterval(() => dispatch(fetchOrders()), 20000);
    return () => clearInterval(interval);
  }, [dispatch, filters]);

  const sorted = [...items]
    .filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")
    .sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.deadline.localeCompare(b.deadline);
    });

  const onAdvance = async (orderId: number, nextStatus: OrderStatus, note: string) => {
    setUpdatingId(orderId);
    try {
      await dispatch(
        transitionOrderStatus({ orderId, status: nextStatus, note, assigned_operator: user?.id })
      ).unwrap();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="main-canvas">
      <div className="eyebrow">PRODUCTION QUEUE</div>
      <h1 style={{ marginBottom: 20 }}>{sorted.length} job{sorted.length === 1 ? "" : "s"} on the line</h1>

      <div style={{ marginBottom: 18, display: "flex", gap: 10 }}>
        <select
          value={filters.priority}
          onChange={(e) => dispatch(setFilters({ priority: e.target.value as Priority | "ALL" }))}
          style={{ width: 180 }}
        >
          <option value="ALL">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <input
          placeholder="Search material, client, notes..."
          value={filters.search}
          onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
          style={{ width: 280 }}
        />
      </div>

      {status === "loading" && <p>Loading queue...</p>}
      {status === "succeeded" && sorted.length === 0 && (
        <div className="card">
          <p>Line's clear — no open jobs matching these filters.</p>
        </div>
      )}

      <div className="orders-grid">
        {sorted.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            canOperate
            onAdvance={onAdvance}
            isUpdating={updatingId === order.id}
          />
        ))}
      </div>
    </div>
  );
}
