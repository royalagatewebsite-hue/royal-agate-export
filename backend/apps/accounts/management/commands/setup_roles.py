from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction


User = get_user_model()


class Command(BaseCommand):
    help = "Create Customer and Admin groups and assign existing users."

    @transaction.atomic
    def handle(self, *args, **options):

        customer_group, _ = Group.objects.get_or_create(
            name="Customer"
        )

        admin_group, _ = Group.objects.get_or_create(
            name="Admin"
        )

        users = User.objects.all()

        admin_count = 0
        customer_count = 0

        for user in users:

            if user.is_superuser:
                user.groups.remove(customer_group)
                user.groups.add(admin_group)
                admin_count += 1

            else:
                user.groups.remove(admin_group)
                user.groups.add(customer_group)
                customer_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Role setup completed successfully!"
            )
        )

        self.stdout.write(
            f"Admin accounts: {admin_count}"
        )

        self.stdout.write(
            f"Customer accounts: {customer_count}"
        )