export type Role = "CLIENT" | "OPERATOR" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "QUALITY_CHECK"
  | "COMPLETED"
  | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  company_name: string;
  first_name: string;
  last_name: string;
}

export interface Material {
  id: number;
  name: string;
  unit: string;
  lead_time_days: number;
}

export interface Order {
  id: number;
  client: number;
  client_username: string;
  assigned_operator: number | null;
  assigned_operator_username: string | null;
  material: number;
  material_name: string;
  quantity: number;
  deadline: string;
  priority: Priority;
  status: OrderStatus;
  spec_file_name: string;
  spec_file_size_kb: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface StatusLogEntry {
  id: number;
  order: number;
  changed_by: number | null;
  changed_by_username: string | null;
  previous_status: OrderStatus;
  new_status: OrderStatus;
  note: string;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardData {
  orders_by_status: Partial<Record<OrderStatus, number>>;
  orders_by_priority: Partial<Record<Priority, number>>;
  throughput_last_7_days: number;
  average_completion_hours: number | null;
  total_open_orders: number;
  total_orders: number;
}

export interface OrderStatusEvent {
  orderId: number;
  status: OrderStatus;
  previousStatus: OrderStatus;
  note: string;
  updatedAt: string;
}

export const STATUS_SEQUENCE: OrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "COMPLETED",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  QUALITY_CHECK: "Quality Check",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
