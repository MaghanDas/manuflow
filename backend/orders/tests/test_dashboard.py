import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from orders.models import Order

pytestmark = pytest.mark.django_db


def test_dashboard_requires_operator_or_admin(client_api):
    url = reverse("dashboard")
    response = client_api.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_dashboard_counts(operator_api, client_user, material):
    Order.objects.create(client=client_user, material=material, quantity=5, deadline="2026-01-01", status="PENDING")
    completed = Order.objects.create(
        client=client_user, material=material, quantity=5, deadline="2026-01-01", status="COMPLETED"
    )
    completed.completed_at = timezone.now()
    completed.save(update_fields=["completed_at"])

    url = reverse("dashboard")
    response = operator_api.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["orders_by_status"]["PENDING"] == 1
    assert response.data["orders_by_status"]["COMPLETED"] == 1
    assert response.data["total_orders"] == 2
    assert response.data["total_open_orders"] == 1
