from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from apps.common.permissions import IsAdmin
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Category, Product, ProductImage, ProductVideo
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductDetailSerializer,
    AdminProductImageSerializer,
    AdminProductVideoSerializer,
)
from .pagination import CataloguePagination
from .filters import ProductFilter


class CategoryViewSet(viewsets.ModelViewSet):

    serializer_class = CategorySerializer

    def get_queryset(self):
        is_admin = (
            self.request.user.is_authenticated
            and self.request.user.groups.filter(name="Admin").exists()
        )

        if is_admin:
            return Category.objects.all().order_by("sort_order", "name")

        return Category.objects.filter(is_active=True).order_by(
            "sort_order", "name"
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        return [IsAdmin()]


class ProductViewSet(viewsets.ModelViewSet):

    serializer_class = ProductSerializer
    lookup_field = "slug"
    pagination_class = CataloguePagination

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_class = ProductFilter

    search_fields = [
        "name",
        "sku",
        "description",
    ]

    ordering_fields = [
        "name",
        "retail_price",
        "created_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Product.objects.select_related(
            "category",
            "inventory"
        ).prefetch_related(
            "images",
            "videos"
        )

        is_admin = (
            self.request.user.is_authenticated
            and self.request.user.groups.filter(name="Admin").exists()
        )

        if is_admin:
            return queryset

        return queryset.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer

        return ProductSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        return [IsAdmin()]
    
class ProductImageViewSet(viewsets.ModelViewSet):

    serializer_class = AdminProductImageSerializer
    permission_classes = [IsAdmin]

    queryset = ProductImage.objects.select_related(
        "product"
    ).all()
    
class ProductVideoViewSet(viewsets.ModelViewSet):

    serializer_class = AdminProductVideoSerializer
    permission_classes = [IsAdmin]
    
    parser_classes = [MultiPartParser, FormParser]

    queryset = ProductVideo.objects.select_related(
        "product"
    ).all()

    def perform_destroy(self, instance):
        import cloudinary.uploader

        public_id = instance.cloudinary_public_id

        instance.delete()

        if public_id:
            try:
                cloudinary.uploader.destroy(
                    public_id,
                    resource_type="video"
                )
            except Exception:
                pass