from django import forms
from django.core.exceptions import ValidationError
from django.db import IntegrityError

import cloudinary.uploader

from .models import ProductImage


class ProductImageAdminForm(forms.ModelForm):

    image_file = forms.ImageField(
        required=False,
        label="Upload Product Image",
        help_text="Select a high-quality product image."
    )

    class Meta:
        model = ProductImage
        fields = [
            "product",
            "alt_text",
            "sort_order",
            "is_primary",
        ]

    def clean(self):
        cleaned_data = super().clean()

        image_file = cleaned_data.get("image_file")

        if not image_file and not self.instance.image_url:
            raise ValidationError(
                "Please upload a product image."
            )

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)

        image_file = self.cleaned_data.get("image_file")

        if image_file:
            try:
                result = cloudinary.uploader.upload(
                    image_file,
                    folder="royal-agate/products",
                    resource_type="image",
                    quality="auto",
                    fetch_format="auto",
                )

                instance.image_url = result["secure_url"]

            except Exception as exc:
                raise ValidationError(
                    f"Cloudinary upload failed: {exc}"
                )

        if commit:
            instance.save()
            self.save_m2m()

        return instance