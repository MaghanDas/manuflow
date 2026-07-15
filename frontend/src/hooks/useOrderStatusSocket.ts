import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

import { useAppDispatch } from "../app/hooks";
import { applyLiveStatusUpdate } from "../features/orders/ordersSlice";
import type { OrderStatusEvent, Role } from "../types";

const NOTIFICATIONS_URL =
  import.meta.env.VITE_NOTIFICATIONS_URL || "http://localhost:4000";

let socket: Socket | null = null;

/**
 * Opens (or reuses) a Socket.io connection to the Node notifications
 * service and joins the right room for this user: their own user id if
 * they're a client, or their role if they're an operator/admin watching
 * the whole queue. Live "order:status" events are dispatched straight
 * into the orders slice so the UI updates without a refetch.
 */
export function useOrderStatusSocket(userId: number | undefined, role: Role | undefined) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!userId || !role) return undefined;

    if (!socket) {
      socket = io(NOTIFICATIONS_URL, { transports: ["websocket", "polling"] });
    }

    const room = role === "CLIENT" ? `user:${userId}` : `role:${role}`;

    const handleConnect = () => {
      socket?.emit("subscribe", { room });
    };

    const handleStatusEvent = (event: OrderStatusEvent) => {
      dispatch(applyLiveStatusUpdate({ orderId: event.orderId, status: event.status }));
    };

    socket.on("connect", handleConnect);
    socket.on("order:status", handleStatusEvent);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket?.off("connect", handleConnect);
      socket?.off("order:status", handleStatusEvent);
    };
  }, [userId, role, dispatch]);
}
