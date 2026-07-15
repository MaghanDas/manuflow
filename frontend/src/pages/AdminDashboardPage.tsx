import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchDashboard } from "../api/dashboardApi";
import type { DashboardData } from "../types";
import { STATUS_LABELS } from "../types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#8a93a3",
  IN_PROGRESS: "#2f6690",
  QUALITY_CHECK: "#e8a33d",
  COMPLETED: "#2e9e6d",
  CANCELLED: "#c1473a",
};

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchDashboard()
      .then((d) => mounted && setData(d))
      .catch(() => mounted && setError("Couldn't load dashboard analytics."));

    const interval = setInterval(() => {
      fetchDashboard().then((d) => mounted && setData(d)).catch(() => {});
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (error) return <div className="main-canvas"><p className="error-text">{error}</p></div>;
  if (!data) return <div className="main-canvas"><p>Loading analytics...</p></div>;

  const statusData = Object.entries(data.orders_by_status).map(([status, value]) => ({
    status,
    label: STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status,
    value,
  }));

  const priorityData = Object.entries(data.orders_by_priority).map(([priority, value]) => ({
    priority,
    value,
  }));

  return (
    <div className="main-canvas">
      <div className="eyebrow">SHOP ANALYTICS</div>
      <h1 style={{ marginBottom: 20 }}>Production dashboard</h1>

      <div className="line-status-strip">
        <div className="stat">
          <div className="eyebrow">Open orders</div>
          <div className="value">{data.total_open_orders}</div>
        </div>
        <div className="stat">
          <div className="eyebrow">Total orders</div>
          <div className="value">{data.total_orders}</div>
        </div>
        <div className="stat">
          <div className="eyebrow">Completed, last 7 days</div>
          <div className="value">{data.throughput_last_7_days}</div>
        </div>
        <div className="stat">
          <div className="eyebrow">Avg. completion time</div>
          <div className="value">
            {data.average_completion_hours != null ? `${data.average_completion_hours}h` : "—"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Orders by status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="label" outerRadius={95} label>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#999"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Orders by priority</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--color-accent-blue)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
