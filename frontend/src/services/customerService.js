import { apiRequest } from "./api";

export const getAdminCustomers = (params = {}) => {
    const query = new URLSearchParams();

    if (params.search) {
        query.append("search", params.search);
    }

    if (params.page) {
        query.append("page", params.page);
    }

    const queryString = query.toString();

    return apiRequest(
        `/accounts/admin/customers/${queryString ? `?${queryString}` : ""}`
    );
};

export const getAdminCustomerById = (customerId) => {
    return apiRequest(`/accounts/admin/customers/${customerId}/`);
};