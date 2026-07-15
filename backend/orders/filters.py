import django_filters

from .models import Order


class OrderFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    priority = django_filters.CharFilter(field_name="priority", lookup_expr="iexact")
    material = django_filters.CharFilter(field_name="material__name", lookup_expr="icontains")
    deadline_before = django_filters.DateFilter(field_name="deadline", lookup_expr="lte")
    deadline_after = django_filters.DateFilter(field_name="deadline", lookup_expr="gte")
    client = django_filters.NumberFilter(field_name="client__id")
    assigned_operator = django_filters.NumberFilter(field_name="assigned_operator__id")

    class Meta:
        model = Order
        fields = ["status", "priority", "material", "client", "assigned_operator"]
