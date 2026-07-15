import ordersReducer, {
  applyLiveStatusUpdate,
  clearFilters,
  createOrder,
  fetchOrders,
  setFilters,
  transitionOrderStatus,
} from "./ordersSlice";
import type { Order } from "../../types";

const baseOrder: Order = {
  id: 1,
  client: 10,
  client_username: "client1",
  assigned_operator: null,
  assigned_operator_username: null,
  material: 1,
  material_name: "Aluminum 6061 Sheet",
  quantity: 50,
  deadline: "2026-08-01",
  priority: "HIGH",
  status: "PENDING",
  spec_file_name: "",
  spec_file_size_kb: null,
  notes: "",
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
  completed_at: null,
};

const initialState = {
  items: [],
  count: 0,
  filters: { status: "ALL" as const, priority: "ALL" as const, search: "" },
  status: "idle" as const,
  error: null,
  activeOrder: null,
};

describe("ordersSlice", () => {
  it("merges partial filters via setFilters", () => {
    const state = ordersReducer(initialState, setFilters({ status: "IN_PROGRESS" }));
    expect(state.filters.status).toBe("IN_PROGRESS");
    expect(state.filters.priority).toBe("ALL");
  });

  it("resets filters via clearFilters", () => {
    const dirty = { ...initialState, filters: { status: "COMPLETED" as const, priority: "HIGH" as const, search: "abc" } };
    const state = ordersReducer(dirty, clearFilters());
    expect(state.filters).toEqual(initialState.filters);
  });

  it("populates items and count on fetchOrders.fulfilled", () => {
    const action = {
      type: fetchOrders.fulfilled.type,
      payload: { count: 1, next: null, previous: null, results: [baseOrder] },
    };
    const state = ordersReducer(initialState, action);
    expect(state.items).toHaveLength(1);
    expect(state.count).toBe(1);
    expect(state.status).toBe("succeeded");
  });

  it("prepends a new order on createOrder.fulfilled", () => {
    const seeded = { ...initialState, items: [baseOrder], count: 1 };
    const newOrder = { ...baseOrder, id: 2 };
    const action = { type: createOrder.fulfilled.type, payload: newOrder };
    const state = ordersReducer(seeded, action);
    expect(state.items[0].id).toBe(2);
    expect(state.count).toBe(2);
  });

  it("replaces the matching order on transitionOrderStatus.fulfilled", () => {
    const seeded = { ...initialState, items: [baseOrder] };
    const updated = { ...baseOrder, status: "IN_PROGRESS" as const };
    const action = { type: transitionOrderStatus.fulfilled.type, payload: updated };
    const state = ordersReducer(seeded, action);
    expect(state.items[0].status).toBe("IN_PROGRESS");
  });

  it("applies a live socket status update without touching other fields", () => {
    const seeded = { ...initialState, items: [baseOrder] };
    const state = ordersReducer(
      seeded,
      applyLiveStatusUpdate({ orderId: 1, status: "QUALITY_CHECK" })
    );
    expect(state.items[0].status).toBe("QUALITY_CHECK");
    expect(state.items[0].material_name).toBe(baseOrder.material_name);
  });
});
