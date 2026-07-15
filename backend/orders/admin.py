from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Material, Order, StatusLog, User


@admin.register(User)
class ManuFlowUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("ManuFlow role", {"fields": ("role", "company_name")}),
    )
    list_display = ("username", "email", "role", "is_staff")
    list_filter = ("role", "is_staff")


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("name", "unit", "lead_time_days")


class StatusLogInline(admin.TabularInline):
    model = StatusLog
    extra = 0
    readonly_fields = ("changed_by", "previous_status", "new_status", "note", "created_at")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "material", "quantity", "client", "priority", "status", "deadline")
    list_filter = ("status", "priority", "material")
    search_fields = ("client__username", "material__name", "notes")
    inlines = [StatusLogInline]


@admin.register(StatusLog)
class StatusLogAdmin(admin.ModelAdmin):
    list_display = ("order", "previous_status", "new_status", "changed_by", "created_at")
