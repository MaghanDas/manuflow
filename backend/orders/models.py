from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Extends Django's built-in user with a manufacturing role."""

    class Role(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        OPERATOR = "OPERATOR", "Operator"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT)
    company_name = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Material(models.Model):
    """A raw material clients can select when submitting a job order."""

    name = models.CharField(max_length=100, unique=True)
    unit = models.CharField(max_length=20, default="unit", help_text="e.g. kg, sheet, meter")
    lead_time_days = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Order(models.Model):
    """A single manufacturing job request submitted by a client."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        QUALITY_CHECK = "QUALITY_CHECK", "Quality Check"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    client = models.ForeignKey(
        "orders.User", on_delete=models.CASCADE, related_name="orders_submitted",
        limit_choices_to={"role": User.Role.CLIENT},
    )
    assigned_operator = models.ForeignKey(
        "orders.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="orders_assigned", limit_choices_to={"role": User.Role.OPERATOR},
    )
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name="orders")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    deadline = models.DateField()
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    spec_file_name = models.CharField(
        max_length=255, blank=True,
        help_text="Metadata only - name of the spec file the client says they have on hand.",
    )
    spec_file_size_kb = models.PositiveIntegerField(null=True, blank=True)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-priority", "deadline"]

    def __str__(self):
        return f"Order #{self.pk} - {self.material.name} x{self.quantity} ({self.status})"

    def mark_status(self, new_status: str, actor: "User", note: str = ""):
        """Update status, stamp completed_at when relevant, and record a StatusLog entry."""
        previous_status = self.status
        self.status = new_status
        if new_status == Order.Status.COMPLETED and not self.completed_at:
            self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at", "updated_at"])
        return StatusLog.objects.create(
            order=self,
            changed_by=actor,
            previous_status=previous_status,
            new_status=new_status,
            note=note,
        )


class StatusLog(models.Model):
    """Immutable audit trail of every status transition on an order."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_logs")
    changed_by = models.ForeignKey("orders.User", on_delete=models.SET_NULL, null=True)
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.order_id}: {self.previous_status} -> {self.new_status}"
