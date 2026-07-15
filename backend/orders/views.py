import logging
from datetime import timedelta

import requests
from django.conf import settings
from django.db.models import Avg, Count, F
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import OrderFilter
from .models import Material, Order, StatusLog, User
from .permissions import IsOperatorOrAdmin, IsOwnerOperatorOrAdmin
from .serializers import (
    DashboardSerializer,
    LoginSerializer,
    MaterialSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    RegisterSerializer,
    StatusLogSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


def notify_status_change(order: Order, log_entry: StatusLog):
    """
    Fire-and-forget POST to the Node notification microservice so it can
    broadcast the change over Socket.io. Never lets a notification outage
    break the API response.
    """
    payload = {
        "orderId": order.id,
        "clientId": order.client_id,
        "status": order.status,
        "previousStatus": log_entry.previous_status,
        "note": log_entry.note,
        "updatedAt": order.updated_at.isoformat(),
    }
    try:
        requests.post(
            f"{settings.NOTIFICATIONS_SERVICE_URL}/broadcast/order-status",
            json=payload,
            timeout=1.5,
        )
    except requests.RequestException as exc:
        logger.warning("Notification service unreachable: %s", exc)


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = Token.objects.get(user=user)
        return Response(
            {"token": token.key, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    filter_backends = []
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsOperatorOrAdmin()]
        return [permissions.IsAuthenticated()]


class OrderViewSet(viewsets.ModelViewSet):
    """
    /api/orders/            list + create
    /api/orders/{id}/       retrieve + update
    /api/orders/{id}/status/  transition status (operator/admin only)
    /api/orders/{id}/logs/  status history
    """

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOperatorOrAdmin]
    filterset_class = OrderFilter
    search_fields = ["material__name", "notes", "client__username"]
    ordering_fields = ["deadline", "priority", "created_at", "status"]
    ordering = ["-priority", "deadline"]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.select_related("client", "material", "assigned_operator")
        if user.role == User.Role.CLIENT:
            return qs.filter(client=user)
        return qs

    @action(detail=True, methods=["post"], permission_classes=[IsOperatorOrAdmin])
    def status_transition(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data, context={"order": order})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data.get("assigned_operator"):
            order.assigned_operator = data["assigned_operator"]
            order.save(update_fields=["assigned_operator"])

        log_entry = order.mark_status(data["status"], actor=request.user, note=data.get("note", ""))
        notify_status_change(order, log_entry)

        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["get"])
    def logs(self, request, pk=None):
        order = self.get_object()
        logs = order.status_logs.all()
        return Response(StatusLogSerializer(logs, many=True).data)


class DashboardView(APIView):
    """Aggregate analytics for the admin dashboard."""

    permission_classes = [IsOperatorOrAdmin]

    def get(self, request):
        orders = Order.objects.all()

        by_status = {
            row["status"]: row["count"]
            for row in orders.values("status").annotate(count=Count("id"))
        }
        by_priority = {
            row["priority"]: row["count"]
            for row in orders.values("priority").annotate(count=Count("id"))
        }

        week_ago = timezone.now() - timedelta(days=7)
        throughput = orders.filter(
            status=Order.Status.COMPLETED, completed_at__gte=week_ago
        ).count()

        completed = orders.filter(status=Order.Status.COMPLETED, completed_at__isnull=False)
        avg_seconds = completed.annotate(
            duration=F("completed_at") - F("created_at")
        ).aggregate(avg=Avg("duration"))["avg"]
        avg_hours = round(avg_seconds.total_seconds() / 3600, 2) if avg_seconds else None

        open_statuses = [Order.Status.PENDING, Order.Status.IN_PROGRESS, Order.Status.QUALITY_CHECK]

        payload = {
            "orders_by_status": by_status,
            "orders_by_priority": by_priority,
            "throughput_last_7_days": throughput,
            "average_completion_hours": avg_hours,
            "total_open_orders": orders.filter(status__in=open_statuses).count(),
            "total_orders": orders.count(),
        }
        return Response(DashboardSerializer(payload).data)
