from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from django.contrib.sitemaps.views import sitemap

from apps.catalogue.seo import (
    StaticViewSitemap,
    CategorySitemap,
    ProductSitemap,
)

sitemaps = {
    "static": StaticViewSitemap,
    "categories": CategorySitemap,
    "products": ProductSitemap,
}

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django.contrib.sitemaps.views.sitemap",
    ),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/v1/catalogue/", include("apps.catalogue.urls")),
    path("api/v1/inventory/", include("apps.inventory.urls")),
    path("api/v1/accounts/", include("apps.accounts.urls")),
    path("api/v1/cart/", include("apps.cart.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/shipping/", include("apps.shipping.urls")),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
    path("api/v1/reviews/", include("apps.reviews.urls")),
    path("api/v1/contact/", include("apps.contact.urls")),
    path("api/v1/content/", include("apps.content.urls")),
    path("api/v1/currency/", include("apps.currency.urls")),
]
