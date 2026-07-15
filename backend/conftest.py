import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from orders.models import Material, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def material(db):
    return Material.objects.create(name="Aluminum 6061 Sheet", unit="sheet", lead_time_days=3)


def _make_user(role, username):
    user = User.objects.create_user(username=username, password="password123", role=role)
    Token.objects.create(user=user)
    return user


@pytest.fixture
def client_user(db):
    return _make_user(User.Role.CLIENT, "test_client")


@pytest.fixture
def operator_user(db):
    return _make_user(User.Role.OPERATOR, "test_operator")


@pytest.fixture
def admin_user(db):
    return _make_user(User.Role.ADMIN, "test_admin")


def auth(api_client, user):
    token = Token.objects.get(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return api_client


@pytest.fixture
def client_api(api_client, client_user):
    return auth(api_client, client_user)


@pytest.fixture
def operator_api(api_client, operator_user):
    return auth(api_client, operator_user)


@pytest.fixture
def admin_api(api_client, admin_user):
    return auth(api_client, admin_user)
