import { apiRequest } from "./api";

const AUTH_ENDPOINT = "/accounts/";

export const registerCustomer = (userData) => {
  return apiRequest(`${AUTH_ENDPOINT}register/`, {
    method: "POST",
    body: userData,
  });
};

export const loginCustomer = (credentials) => {
  return apiRequest(`${AUTH_ENDPOINT}login/`, {
    method: "POST",
    body: credentials,
  });
};

export const refreshAccessToken = (refreshToken) => {
  return apiRequest(`${AUTH_ENDPOINT}token/refresh/`, {
    method: "POST",
    body: {
      refresh: refreshToken,
    },
  });
};

export const logoutCustomer = (refreshToken, accessToken) => {
  return apiRequest(`${AUTH_ENDPOINT}logout/`, {
    method: "POST",
    body: {
      refresh: refreshToken,
    },
    token: accessToken,
  });
};

export const getCustomerProfile = (accessToken) => {
  return apiRequest(`${AUTH_ENDPOINT}profile/`, {
    token: accessToken,
  });
};

export const updateCustomerProfile = (profileData, accessToken) => {
  return apiRequest(`${AUTH_ENDPOINT}profile/`, {
    method: "PATCH",
    body: profileData,
    token: accessToken,
  });
};