import pytest
from django.urls import reverse
from rest_framework import status

from orders.models import Order

pytestmark = pytest.mark.django_db


def _order_payload(material):
    return {
        "material": material.id,
        "quantity": 100,
        "deadline": "2026-12-31",
        "priority": "HIGH",
        "notes": "Please anodize black.",
    }


def test_client_can_create_order(client_api, material):
    url = reverse("order-list")
    response = client_api.post(url, _order_payload(material))
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["status"] == "PENDING"
    assert Order.objects.count() == 1


def test_client_cannot_set_own_status_on_create(client_api, material):
    url = reverse("order-list")
    payload = _order_payload(material)
    payload["status"] = "COMPLETED"
    response = client_api.post(url, payload)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["status"] == "PENDING"


def test_client_only_sees_own_orders(client_api, operator_user, material, django_user_model):
    other_client = django_user_model.objects.create_user(
        username="other_client", password="password123", role="CLIENT"
    )
    Order.objects.create(client=other_client, material=material, quantity=5, deadline="2026-01-01")

    url = reverse("order-list")
    response = client_api.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 0


def test_operator_sees_all_orders(operator_api, client_user, material):
    Order.objects.create(client=client_user, material=material, quantity=5, deadline="2026-01-01")
    Order.objects.create(client=client_user, material=material, quantity=8, deadline="2026-02-01")

    url = reverse("order-list")
    response = operator_api.get(url)
    assert response.data["count"] == 2


def test_filter_orders_by_status(operator_api, client_user, material):
    Order.objects.create(client=client_user, material=material, quantity=5, deadline="2026-01-01", status="PENDING")
    Order.objects.create(client=client_user, material=material, quantity=5, deadline="2026-01-01", status="COMPLETED")

    url = reverse("order-list") + "?status=COMPLETED"
    response = operator_api.get(url)
    assert response.data["count"] == 1
    assert response.data["results"][0]["status"] == "COMPLETED"


def test_operator_transitions_status_valid(operator_api, client_user, operator_user, material):
    order = Order.objects.create(client=client_user, material=material, quantity=5, deadline="2026-01-01")
    url = reverse("order-status-transition", args=[order.id])
    response = operator_api.post(url, {"status": "IN_PROGRESS", "note": "Started machining", "assigned_operator": operator_user.id})
    assert response.status_code == status.HTTP_200_OK
    order.refresh_from_db()
    assert order.status == "IN_PROGRESS"
    assert order.assigned_operator_id == operator_user.id
    assert order.status_logs.count() == 1


def test_operator_transition_rejects_invalid_jump(operator_api, client_user, material):
    order = Order.objects.create(client=client_user, material=material, quantity=5, deadline="2026-01-01")
    url = reverse("order-status-transition", args=[order.id])
    response = operator_api.post(url, {"status": "COMPLETED"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_client_cannot_transition_status(client_api, client_user, material):
    order = Order.objects.create(client=client_user, material=material, quantity=5, deadline="2026-01-01")
    url = reverse("order-status-transition", args=[order.id])
    response = client_api.post(url, {"status": "IN_PROGRESS"})
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_status_log_created_on_transition(operator_api, client_user, material):
    order = Order.objects.create(client=client_user, material=material, quantity=5, deadline="2026-01-01")
    transition_url = reverse("order-status-transition", args=[order.id])
    operator_api.post(transition_url, {"status": "IN_PROGRESS"})

    logs_url = reverse("order-logs", args=[order.id])
    response = operator_api.get(logs_url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["new_status"] == "IN_PROGRESS"
