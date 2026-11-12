from django.urls import path

from .views import (
    CustomerRegistrationView,
    CustomerLoginView,
    CustomerTokenRefreshView,
    CustomerLogoutView,
    CustomerProfileView,
    AdminCustomerListView,
    AdminCustomerDetailView,
)


urlpatterns = [
    path(
        "register/",
        CustomerRegistrationView.as_view(),
        name="customer-register"
    ),

    path(
        "login/",
        CustomerLoginView.as_view(),
        name="customer-login"
    ),
    
    path(
        "token/refresh/",
        CustomerTokenRefreshView.as_view(),
        name="token-refresh"
    ),
    
    path(
        "logout/",
        CustomerLogoutView.as_view(),
        name="customer-logout"
    ),
    
    path(
        "profile/",
        CustomerProfileView.as_view(),
        name="customer-profile"
    ),
    
    path(
        "admin/customers/",
        AdminCustomerListView.as_view(),
        name="admin-customer-list",
    ),

    path(
        "admin/customers/<int:pk>/",
        AdminCustomerDetailView.as_view(),
        name="admin-customer-detail",
    ),
]