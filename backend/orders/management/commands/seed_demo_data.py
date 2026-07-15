import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from orders.models import Material, Order, User


class Command(BaseCommand):
    help = "Seed the database with demo users, materials, and orders for local development."

    def handle(self, *args, **options):
        self.stdout.write("Seeding ManuFlow demo data...")

        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@manuflow.dev", "role": User.Role.ADMIN, "is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password("admin12345")
            admin.save()

        operator, created = User.objects.get_or_create(
            username="operator1",
            defaults={"email": "operator1@manuflow.dev", "role": User.Role.OPERATOR},
        )
        if created:
            operator.set_password("operator12345")
            operator.save()

        client, created = User.objects.get_or_create(
            username="client1",
            defaults={
                "email": "client1@manuflow.dev",
                "role": User.Role.CLIENT,
                "company_name": "Northwind Fabrication",
            },
        )
        if created:
            client.set_password("client12345")
            client.save()

        materials = []
        for name, unit, lead in [
            ("Aluminum 6061 Sheet", "sheet", 3),
            ("Stainless Steel 304 Bar", "meter", 5),
            ("ABS Plastic Pellets", "kg", 2),
            ("Carbon Fiber Panel", "sheet", 7),
            ("Copper Wire Spool", "kg", 1),
        ]:
            material, _ = Material.objects.get_or_create(
                name=name, defaults={"unit": unit, "lead_time_days": lead}
            )
            materials.append(material)

        statuses = [Order.Status.PENDING, Order.Status.IN_PROGRESS, Order.Status.QUALITY_CHECK, Order.Status.COMPLETED]
        priorities = [Order.Priority.LOW, Order.Priority.MEDIUM, Order.Priority.HIGH, Order.Priority.URGENT]

        if Order.objects.count() == 0:
            for i in range(18):
                status = random.choice(statuses)
                order = Order.objects.create(
                    client=client,
                    assigned_operator=operator if status != Order.Status.PENDING else None,
                    material=random.choice(materials),
                    quantity=random.randint(5, 500),
                    deadline=timezone.now().date() + timedelta(days=random.randint(1, 30)),
                    priority=random.choice(priorities),
                    status=status,
                    spec_file_name=f"spec_sheet_{i+1}.pdf",
                    spec_file_size_kb=random.randint(80, 4000),
                )
                if status == Order.Status.COMPLETED:
                    order.completed_at = timezone.now() - timedelta(days=random.randint(0, 6))
                    order.save(update_fields=["completed_at"])

        self.stdout.write(self.style.SUCCESS("Demo data ready: admin/admin12345, operator1/operator12345, client1/client12345"))
