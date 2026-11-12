from django.contrib import admin
from apps.inventory.services import InventoryService
from apps.inventory.models import Inventory, StockMovement


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "product",
        "quantity",
        "low_stock_threshold",
        "is_in_stock",
        "is_low_stock",
        "updated_at",
    )

    list_filter = (
        "quantity",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "product__name",
        "product__sku",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = ("product__name",)

    def save_model(self, request, obj, form, change):

        target_quantity = obj.quantity

        if change:
            old_quantity = Inventory.objects.get(
                pk=obj.pk
            ).quantity

            obj.quantity = old_quantity

            super().save_model(request, obj, form, change)

        else:
            old_quantity = 0
            obj.quantity = 0

            super().save_model(request, obj, form, change)

        difference = target_quantity - old_quantity

        if difference > 0:
            InventoryService.increase_stock(
                product=obj.product,
                quantity=difference,
                reason="Admin stock adjustment",
                created_by=request.user,
            )

        elif difference < 0:
            InventoryService.decrease_stock(
                product=obj.product,
                quantity=abs(difference),
                reason="Admin stock adjustment",
                created_by=request.user,
            )


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "inventory",
        "movement_type",
        "quantity",
        "stock_before",
        "stock_after",
        "created_by",
        "created_at",
    )

    list_filter = (
        "movement_type",
        "created_at",
    )

    search_fields = (
        "inventory__product__name",
        "inventory__product__sku",
        "reason",
    )

    readonly_fields = (
        "inventory",
        "movement_type",
        "quantity",
        "stock_before",
        "stock_after",
        "reason",
        "created_by",
        "created_at",
    )

    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

