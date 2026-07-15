from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardView,
    HealthCheckView,
    LoginView,
    MaterialViewSet,
    MeView,
    OrderViewSet,
    RegisterView,
)

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
router.register("materials", MaterialViewSet, basename="material")

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("", include(router.urls)),
]
