import pytest
from django.urls import reverse
from rest_framework import status

pytestmark = pytest.mark.django_db


def test_register_client(api_client):
    url = reverse("register")
    response = api_client.post(url, {
        "username": "newclient",
        "email": "newclient@example.com",
        "password": "supersecret1",
        "role": "CLIENT",
        "company_name": "Acme Co",
    })
    assert response.status_code == status.HTTP_201_CREATED
    assert "token" in response.data
    assert response.data["user"]["role"] == "CLIENT"


def test_cannot_self_register_as_admin(api_client):
    url = reverse("register")
    response = api_client.post(url, {
        "username": "sneaky",
        "email": "sneaky@example.com",
        "password": "supersecret1",
        "role": "ADMIN",
    })
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_login_success(api_client, client_user):
    url = reverse("login")
    response = api_client.post(url, {"username": "test_client", "password": "password123"})
    assert response.status_code == status.HTTP_200_OK
    assert "token" in response.data


def test_login_invalid_credentials(api_client, client_user):
    url = reverse("login")
    response = api_client.post(url, {"username": "test_client", "password": "wrong"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_me_requires_auth(api_client):
    url = reverse("me")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
