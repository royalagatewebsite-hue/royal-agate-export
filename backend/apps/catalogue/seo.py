from types import SimpleNamespace

from django.contrib.sitemaps import Sitemap

from .models import Product, Category


class CanonicalSitemap(Sitemap):
    protocol = "https"

    def get_urls(self, page=1, site=None, protocol=None):
        if site is None:
            site = SimpleNamespace(
                domain="www.royalagateexport.com"
            )

        return super().get_urls(
            page=page,
            site=site,
            protocol=protocol,
        )


class StaticViewSitemap(CanonicalSitemap):
    priority = 0.7
    changefreq = "monthly"

    def items(self):
        return [
            "/",
            "/about",
            "/contact",
            "/faqs",
            "/export",
            "/collections",
            "/collections/agate",
            "/collections/jewellery",
            "/privacy-policy",
            "/terms",
            "/refund-policy",
        ]

    def location(self, item):
        return item


class CategorySitemap(CanonicalSitemap):
    priority = 0.7
    changefreq = "weekly"

    def items(self):
        return Category.objects.filter(
            is_active=True
        ).order_by("sort_order")

    def location(self, item):
        return f"/category/{item.slug}"

    def lastmod(self, item):
        return item.updated_at


class ProductSitemap(CanonicalSitemap):
    priority = 0.8
    changefreq = "weekly"

    def items(self):
        return Product.objects.filter(
            is_active=True
        ).select_related("category").order_by("slug")

    def location(self, item):
        return f"/collections/{item.slug}"

    def lastmod(self, item):
        return item.updated_at