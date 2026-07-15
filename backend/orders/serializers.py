from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import Material, Order, StatusLog, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "company_name", "first_name", "last_name"]
        read_only_fields = ["id", "role"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "company_name"]

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Cannot self-register as an admin.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Token.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        attrs["user"] = user
        return attrs


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ["id", "name", "unit", "lead_time_days"]


class StatusLogSerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source="changed_by.username", read_only=True)

    class Meta:
        model = StatusLog
        fields = [
            "id", "order", "changed_by", "changed_by_username",
            "previous_status", "new_status", "note", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    client_username = serializers.CharField(source="client.username", read_only=True)
    material_name = serializers.CharField(source="material.name", read_only=True)
    assigned_operator_username = serializers.CharField(
        source="assigned_operator.username", read_only=True, default=None
    )

    class Meta:
        model = Order
        fields = [
            "id", "client", "client_username", "assigned_operator",
            "assigned_operator_username", "material", "material_name",
            "quantity", "deadline", "priority", "status",
            "spec_file_name", "spec_file_size_kb", "notes",
            "created_at", "updated_at", "completed_at",
        ]
        read_only_fields = ["id", "client", "status", "created_at", "updated_at", "completed_at"]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["client"] = request.user
        return super().create(validated_data)


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Used by operators/admins to transition a job's status."""

    status = serializers.ChoiceField(choices=Order.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")
    assigned_operator = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.OPERATOR), required=False
    )

    VALID_TRANSITIONS = {
        Order.Status.PENDING: {Order.Status.IN_PROGRESS, Order.Status.CANCELLED},
        Order.Status.IN_PROGRESS: {Order.Status.QUALITY_CHECK, Order.Status.CANCELLED},
        Order.Status.QUALITY_CHECK: {Order.Status.COMPLETED, Order.Status.IN_PROGRESS},
        Order.Status.COMPLETED: set(),
        Order.Status.CANCELLED: set(),
    }

    def validate(self, attrs):
        order = self.context["order"]
        new_status = attrs["status"]
        allowed = self.VALID_TRANSITIONS.get(order.status, set())
        if new_status != order.status and new_status not in allowed:
            raise serializers.ValidationError(
                f"Cannot move an order from {order.status} to {new_status}."
            )
        return attrs


class DashboardSerializer(serializers.Serializer):
    """Read-only shape for the analytics dashboard endpoint."""

    orders_by_status = serializers.DictField()
    orders_by_priority = serializers.DictField()
    throughput_last_7_days = serializers.IntegerField()
    average_completion_hours = serializers.FloatField(allow_null=True)
    total_open_orders = serializers.IntegerField()
    total_orders = serializers.IntegerField()
