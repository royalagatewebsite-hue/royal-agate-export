from django.contrib import admin

from .models import Category, Product, ProductImage
from .forms import ProductImageAdminForm


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("sort_order", "name")


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    form = ProductImageAdminForm
    extra = 1
    fields = (
        "image_file",
        "alt_text",
        "sort_order",
        "is_primary",
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "sku",
        "category",
        "retail_price",
        "wholesale_price",
        "is_active",
        "is_featured",
    )

    list_filter = ("category", "is_active", "is_featured")

    search_fields = ("name", "sku")

    ordering = ("-created_at",)

    inlines = [ProductImageInline]

    fieldsets = (
        ("Basic Information", {
            "fields": (
                "name",
                "sku",
                "category",
                "short_description",
                "description",
            )
        }),

        ("Physical Specifications", {
            "fields": (
                ("weight", "weight_unit"),
                ("length", "length_unit"),
                ("width", "width_unit"),
                ("height", "height_unit"),
            )
        }),

        ("Pricing & Selling", {
            "fields": (
                "selling_modes",
                "retail_price",
                "retail_moq",
                "wholesale_price",
                "wholesale_moq",
            )
        }),

        ("Product Status", {
            "fields": (
                "is_active",
                "is_featured",
            )
        }),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    form = ProductImageAdminForm

    list_display = (
        "product",
        "is_primary",
        "sort_order",
        "created_at",
    )

    list_filter = ("is_primary",)
    search_fields = ("product__name", "alt_text")