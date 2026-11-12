from decimal import Decimal
from django.db import transaction

import cloudinary.uploader

from rest_framework import serializers

from .models import Category, Product, ProductImage, ProductVideo


# ==========================================
# CATEGORY SERIALIZER
# ==========================================

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image_url",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Category name cannot be empty."
            )

        return value


# ==========================================
# PRODUCT IMAGE SERIALIZER
# ==========================================

class ProductImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image_url",
            "alt_text",
            "sort_order",
            "is_primary",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]
        
class AdminProductImageSerializer(serializers.ModelSerializer):

    image_file = serializers.ImageField(
        write_only=True,
        required=False
    )

    image_url = serializers.URLField(read_only=True)

    class Meta:
        model = ProductImage

        fields = [
            "id",
            "product",
            "image_file",
            "image_url",
            "alt_text",
            "sort_order",
            "is_primary",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "image_url",
            "created_at",
        ]


    def create(self, validated_data):
        image_file = validated_data.pop("image_file")
        product = validated_data["product"]
        is_primary = validated_data.get("is_primary", False)

        try:
            result = cloudinary.uploader.upload(
                image_file,
                folder="royal-agate/products",
                resource_type="image",
                quality="auto",
                fetch_format="auto",
            )

            validated_data["image_url"] = result["secure_url"]
            validated_data["cloudinary_public_id"] = result["public_id"]

        except Exception as exc:
            raise serializers.ValidationError({
                "image_file": f"Cloudinary upload failed: {exc}"
            })

        with transaction.atomic():
            if is_primary:
                ProductImage.objects.filter(
                    product=product,
                    is_primary=True
                ).update(is_primary=False)

            return super().create(validated_data)


    def update(self, instance, validated_data):
        image_file = validated_data.pop("image_file", None)

        if image_file:
            try:
                result = cloudinary.uploader.upload(
                    image_file,
                    folder="royal-agate/products",
                    resource_type="image",
                    quality="auto",
                    fetch_format="auto",
                )

                validated_data["image_url"] = result["secure_url"]
                validated_data["cloudinary_public_id"] = result["public_id"]

            except Exception as exc:
                raise serializers.ValidationError({
                    "image_file": f"Cloudinary upload failed: {exc}"
                })

        product = validated_data.get("product", instance.product)
        is_primary = validated_data.get(
            "is_primary",
            instance.is_primary
        )

        with transaction.atomic():
            if is_primary:
                ProductImage.objects.filter(
                    product=product,
                    is_primary=True
                ).exclude(pk=instance.pk).update(is_primary=False)

            return super().update(instance, validated_data)

# ==========================================
# PRODUCT SERIALIZER
# ==========================================

class ProductSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )

    selling_modes = serializers.ListField(
        child=serializers.ChoiceField(
            choices=Product.SellingMode.choices
        ),
        allow_empty=False
    )

    retail_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
        required=False,
        allow_null=True
    )

    wholesale_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
        required=False,
        allow_null=True
    )

    retail_moq = serializers.IntegerField(
        min_value=1,
        required=False,
        allow_null=True
    )

    wholesale_moq = serializers.IntegerField(
        min_value=1,
        required=False,
        allow_null=True
    )
    
    primary_image_url = serializers.SerializerMethodField()

    def get_primary_image_url(self, obj):
        images = list(obj.images.all())

        if not images:
            return None

        primary_image = next(
            (image for image in images if image.is_primary),
            None
        )

        image = primary_image or images[0]

        return image.image_url
    

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "primary_image_url",
            "category",
            "category_name",
            "short_description",
            "description",
            "retail_price",
            "weight",
            "weight_unit",
            "length",
            "length_unit",
            "width",
            "width_unit",
            "height",
            "height_unit",
            "wholesale_price",
            "selling_modes",
            "retail_moq",
            "wholesale_moq",
            "is_active",
            "is_featured",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Product name cannot be empty."
            )

        return value

    def validate_sku(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "SKU cannot be empty."
            )

        return value

    def validate_category(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "Cannot assign product to an inactive category."
            )

        return value

    def validate(self, attrs):

        def get_value(field):
            if field in attrs:
                return attrs[field]

            if self.instance:
                return getattr(self.instance, field)

            return None

        selling_modes = get_value("selling_modes") or []

        if not selling_modes:
            raise serializers.ValidationError({
                "selling_modes": "Select at least one selling mode."
            })

        if len(selling_modes) != len(set(selling_modes)):
            raise serializers.ValidationError({
                "selling_modes": "Duplicate selling modes are not allowed."
            })

        retail_price = get_value("retail_price")
        wholesale_price = get_value("wholesale_price")

        retail_moq = get_value("retail_moq")
        wholesale_moq = get_value("wholesale_moq")

        # RETAIL VALIDATION
        if Product.SellingMode.RETAIL in selling_modes:

            if retail_price is None:
                raise serializers.ValidationError({
                    "retail_price": "Retail price is required."
                })

            if retail_moq is None:
                raise serializers.ValidationError({
                    "retail_moq": "Retail MOQ is required."
                })

        else:

            if retail_price is not None or retail_moq is not None:
                raise serializers.ValidationError({
                    "retail_price": (
                        "Retail price and MOQ must be null "
                        "when retail mode is not selected."
                    )
                })

        # WHOLESALE VALIDATION
        if Product.SellingMode.WHOLESALE in selling_modes:

            if wholesale_price is None:
                raise serializers.ValidationError({
                    "wholesale_price": "Wholesale price is required."
                })

            if wholesale_moq is None:
                raise serializers.ValidationError({
                    "wholesale_moq": "Wholesale MOQ is required."
                })

        else:

            if wholesale_price is not None or wholesale_moq is not None:
                raise serializers.ValidationError({
                    "wholesale_price": (
                        "Wholesale price and MOQ must be null "
                        "when wholesale mode is not selected."
                    )
                })

        return attrs
    
    
class AdminProductVideoSerializer(serializers.ModelSerializer):

    video_file = serializers.FileField(
        write_only=True,
        required=False
    )

    video_url = serializers.URLField(read_only=True)

    class Meta:
        model = ProductVideo

        fields = [
            "id",
            "product",
            "video_file",
            "video_url",
            "title",
            "sort_order",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "video_url",
            "created_at",
        ]

    def validate_video_file(self, value):
        allowed_types = [
            "video/mp4",
            "video/webm",
            "video/quicktime",
        ]

        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Only MP4, WebM and MOV videos are allowed."
            )

        max_size = 100 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Video size cannot exceed 100 MB."
            )

        return value

    def create(self, validated_data):
        video_file = validated_data.pop("video_file", None)

        if not video_file:
            raise serializers.ValidationError({
                "video_file": "Video file is required."
            })

        try:
            result = cloudinary.uploader.upload(
                video_file,
                folder="royal-agate/products/videos",
                resource_type="video",
            )

            validated_data["video_url"] = result["secure_url"]
            validated_data["cloudinary_public_id"] = result["public_id"]

        except Exception as exc:
            raise serializers.ValidationError({
                "video_file": f"Cloudinary upload failed: {exc}"
            })

        return super().create(validated_data)

    def update(self, instance, validated_data):
        video_file = validated_data.pop("video_file", None)

        if video_file:
            try:
                result = cloudinary.uploader.upload(
                    video_file,
                    folder="royal-agate/products/videos",
                    resource_type="video",
                )

                validated_data["video_url"] = result["secure_url"]
                validated_data["cloudinary_public_id"] = result["public_id"]

            except Exception as exc:
                raise serializers.ValidationError({
                    "video_file": f"Cloudinary upload failed: {exc}"
                })

        return super().update(instance, validated_data)




# ==========================================
# PRODUCT DETAIL SERIALIZER
# ==========================================

class ProductDetailSerializer(ProductSerializer):


    images = ProductImageSerializer(
        many=True,
        read_only=True
    )
    
    videos = AdminProductVideoSerializer(
        many=True,
        read_only=True
    )

    stock_quantity = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()

    retail_available = serializers.SerializerMethodField()
    wholesale_available = serializers.SerializerMethodField()

    def get_inventory(self, obj):
        return getattr(obj, "inventory", None)

    def get_stock_quantity(self, obj):
        inventory = self.get_inventory(obj)
        return inventory.quantity if inventory else 0

    def get_is_in_stock(self, obj):
        inventory = self.get_inventory(obj)
        return inventory.is_in_stock if inventory else False

    def get_is_low_stock(self, obj):
        inventory = self.get_inventory(obj)
        return inventory.is_low_stock if inventory else False

    def get_retail_available(self, obj):
        inventory = self.get_inventory(obj)

        if not inventory:
            return False

        if Product.SellingMode.RETAIL not in obj.selling_modes:
            return False

        return inventory.quantity >= (obj.retail_moq or 1)

    def get_wholesale_available(self, obj):
        inventory = self.get_inventory(obj)

        if not inventory:
            return False

        if Product.SellingMode.WHOLESALE not in obj.selling_modes:
            return False

        return inventory.quantity >= (obj.wholesale_moq or 1)

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + [
            "images",
            "videos",
            "stock_quantity",
            "is_in_stock",
            "is_low_stock",
            "retail_available",
            "wholesale_available",
        ]
        


