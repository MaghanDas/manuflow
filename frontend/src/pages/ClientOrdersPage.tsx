import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { OrderCard } from "../components/OrderCard";
import { fetchOrders, setFilters } from "../features/orders/ordersSlice";
import { useOrderStatusSocket } from "../hooks/useOrderStatusSocket";
import type { OrderStatus } from "../types";
import { STATUS_LABELS } from "../types";

export function ClientOrdersPage() {
  const dispatch = useAppDispatch();
  const { items, status, filters, count } = useAppSelector((state) => state.orders);
  const user = useAppSelector((state) => state.auth.user);

  useOrderStatusSocket(user?.id, user?.role);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch, filters]);

  return (
    <div className="main-canvas">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div className="eyebrow">MY JOB ORDERS</div>
          <h1>{count} order{count === 1 ? "" : "s"} on file</h1>
        </div>
        <Link to="/orders/new" className="btn-primary" style={{ textDecoration: "none" }}>
          + New job
        </Link>
      </div>

      <div style={{ marginBottom: 18 }}>
        <select
          value={filters.status}
          onChange={(e) => dispatch(setFilters({ status: e.target.value as OrderStatus | "ALL" }))}
          style={{ width: 220 }}
        >
          <option value="ALL">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {status === "loading" && <p>Loading orders...</p>}
      {status === "succeeded" && items.length === 0 && (
        <div className="card">
          <p>No job orders yet. Submit your first one to get it into the queue.</p>
        </div>
      )}

      <div className="orders-grid">
        {items.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
