import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { apiClient } from "../../api/client";
import type { Order, OrderStatus, Paginated, Priority } from "../../types";

export interface OrderFilters {
  status: OrderStatus | "ALL";
  priority: Priority | "ALL";
  search: string;
}

interface OrdersState {
  items: Order[];
  count: number;
  filters: OrderFilters;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  activeOrder: Order | null;
}

const initialState: OrdersState = {
  items: [],
  count: 0,
  filters: { status: "ALL", priority: "ALL", search: "" },
  status: "idle",
  error: null,
  activeOrder: null,
};

interface FetchOrdersArgs {
  filters?: Partial<OrderFilters>;
}

function buildParams(filters: OrderFilters) {
  const params: Record<string, string> = {};
  if (filters.status !== "ALL") params.status = filters.status;
  if (filters.priority !== "ALL") params.priority = filters.priority;
  if (filters.search) params.search = filters.search;
  return params;
}

export const fetchOrders = createAsyncThunk<Paginated<Order>, FetchOrdersArgs | undefined>(
  "orders/fetchOrders",
  async (args, { getState }) => {
    const state = getState() as { orders: OrdersState };
    const filters = { ...state.orders.filters, ...(args?.filters || {}) };
    const { data } = await apiClient.get<Paginated<Order>>("/orders/", {
      params: buildParams(filters),
    });
    return data;
  }
);

export interface CreateOrderPayload {
  material: number;
  quantity: number;
  deadline: string;
  priority: Priority;
  notes?: string;
  spec_file_name?: string;
  spec_file_size_kb?: number;
}

export const createOrder = createAsyncThunk<Order, CreateOrderPayload>(
  "orders/createOrder",
  async (payload) => {
    const { data } = await apiClient.post<Order>("/orders/", payload);
    return data;
  }
);

export interface TransitionStatusPayload {
  orderId: number;
  status: OrderStatus;
  note?: string;
  assigned_operator?: number;
}

export const transitionOrderStatus = createAsyncThunk<Order, TransitionStatusPayload>(
  "orders/transitionStatus",
  async ({ orderId, ...body }) => {
    const { data } = await apiClient.post<Order>(`/orders/${orderId}/status_transition/`, body);
    return data;
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<OrderFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = initialState.filters;
    },
    setActiveOrder(state, action: PayloadAction<Order | null>) {
      state.activeOrder = action.payload;
    },
    /** Applied when a Socket.io "order:status" event arrives, for live updates. */
    applyLiveStatusUpdate(
      state,
      action: PayloadAction<{ orderId: number; status: OrderStatus }>
    ) {
      const order = state.items.find((o) => o.id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<Paginated<Order>>) => {
        state.status = "succeeded";
        state.items = action.payload.results;
        state.count = action.payload.count;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load orders";
      })
      .addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.items.unshift(action.payload);
        state.count += 1;
      })
      .addCase(transitionOrderStatus.fulfilled, (state, action: PayloadAction<Order>) => {
        const index = state.items.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { setFilters, clearFilters, setActiveOrder, applyLiveStatusUpdate } =
  ordersSlice.actions;
export default ordersSlice.reducer;
