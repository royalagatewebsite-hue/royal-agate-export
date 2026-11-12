from django.db import models
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone


from rest_framework import generics, filters
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsCustomer, IsAdmin
from apps.catalogue.models import Product
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer


# ==========================================
# PUBLIC: PRODUCT REVIEWS
# ==========================================

class ProductReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        product_id = self.request.query_params.get("product")
        
        if product_id and not product_id.isdigit():
            
            raise ValidationError({
                "product": "Product ID must be a valid number."
            })

        queryset = Review.objects.filter(
            status=Review.ReviewStatus.APPROVED,
            product__is_active=True
        ).select_related("user", "product")

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        return queryset


# ==========================================
# PUBLIC: PRODUCT RATING SUMMARY
# ==========================================

class ProductRatingSummaryView(APIView):

    permission_classes = [AllowAny]

    def get(self, request, product_id):

        product = get_object_or_404(
            Product,
            pk=product_id,
            is_active=True
        )

        reviews = Review.objects.filter(
            product=product,
            status=Review.ReviewStatus.APPROVED
        )

        summary = reviews.aggregate(
            average_rating=Avg("rating"),
            total_reviews=Count("id")
        )

        distribution = {
            str(rating): 0
            for rating in range(1, 6)
        }

        rating_counts = reviews.values("rating").annotate(
            total=Count("id")
        )

        for item in rating_counts:
            distribution[str(item["rating"])] = item["total"]

        return Response({
            "product_id": product.id,
            "average_rating": round(
                summary["average_rating"] or 0,
                2
            ),
            "total_reviews": summary["total_reviews"],
            "rating_distribution": distribution
        })


# ==========================================
# CUSTOMER: CREATE REVIEW
# ==========================================

class CustomerReviewCreateView(generics.CreateAPIView):

    serializer_class = ReviewSerializer

    permission_classes = [
        IsAuthenticated,
        IsCustomer
    ]


# ==========================================
# CUSTOMER: MY REVIEWS
# ==========================================

class CustomerReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer

    permission_classes = [
        IsAuthenticated,
        IsCustomer
    ]

    def get_queryset(self):
        return Review.objects.filter(
            user=self.request.user
        ).select_related("product", "user")


# ==========================================
# CUSTOMER: UPDATE / DELETE REVIEW
# ==========================================

class CustomerReviewDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = ReviewSerializer

    permission_classes = [
        IsAuthenticated,
        IsCustomer
    ]

    def get_queryset(self):
        return Review.objects.filter(
            user=self.request.user
        ).select_related("product", "user")


# ==========================================
# ADMIN: REVIEW MODERATION
# ==========================================

class AdminReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    filter_backends = [filters.SearchFilter]

    search_fields = [
        "user__first_name",
        "user__last_name",
        "user__email",
        "product__name",
        "title",
        "comment",
    ]

    def get_queryset(self):

        queryset = Review.objects.all().select_related(
            "user",
            "product",
            "moderated_by"
        )

        # Status filter
        review_status = self.request.query_params.get("status")

        if review_status:
            valid_statuses = [
                choice[0]
                for choice in Review.ReviewStatus.choices
            ]

            if review_status not in valid_statuses:
                raise ValidationError({
                    "status": "Invalid review status."
                })

            queryset = queryset.filter(status=review_status)

        # Rating filter
        rating = self.request.query_params.get("rating")

        if rating:
            if not rating.isdigit() or int(rating) not in range(1, 6):
                raise ValidationError({
                    "rating": "Rating must be between 1 and 5."
                })

            queryset = queryset.filter(rating=int(rating))

        return queryset
    
class AdminReviewStatsView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def get(self, request):

        stats = Review.objects.aggregate(
            total_reviews=Count("id"),
            average_rating=Avg("rating"),
            unread_reviews=Count(
                "id",
                filter=models.Q(read_at__isnull=True)
            )
        )

        return Response({
            "total_reviews": stats["total_reviews"],
            "average_rating": round(
                stats["average_rating"] or 0,
                2
            ),
            "unread_reviews": stats["unread_reviews"],
        })
        
class AdminMarkReviewsReadView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def post(self, request):

        updated_count = Review.objects.filter(
            read_at__isnull=True
        ).update(
            read_at=timezone.now()
        )

        return Response({
            "message": "Reviews marked as read.",
            "updated_count": updated_count
        })


# ==========================================
# ADMIN: PERMANENTLY DELETE REVIEW
# ==========================================

class AdminReviewDeleteView(generics.DestroyAPIView):

    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]