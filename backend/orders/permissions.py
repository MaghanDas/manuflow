from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")


class IsOperatorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("OPERATOR", "ADMIN")
        )


class IsOwnerOperatorOrAdmin(permissions.BasePermission):
    """
    Clients may only read/write their own orders.
    Operators and admins may access any order.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in ("OPERATOR", "ADMIN"):
            return True
        return obj.client_id == user.id
