import { apiRequest } from "./api";

// ==========================================
// CUSTOMER: SUBMIT CONTACT INQUIRY
// ==========================================

export const submitContactInquiry = async (payload) => {
  return apiRequest("/contact/submit/", {
    method: "POST",
    body: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "",
      subject: payload.subject,
      message: payload.message,
    },
  });
};

// ==========================================
// ADMIN: GET ALL INQUIRIES
// ==========================================

export const getAdminEnquiries = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return apiRequest(
    `/contact/admin/inquiries/${queryString ? `?${queryString}` : ""}`
  );
};

// ==========================================
// ADMIN: GET ENQUIRY DETAILS
// ==========================================

export const getAdminEnquiryById = (id) => {
  return apiRequest(`/contact/admin/inquiries/${id}/`);
};

// ==========================================
// ADMIN: UPDATE ENQUIRY
// ==========================================

export const updateAdminEnquiry = (id, payload) => {
  return apiRequest(`/contact/admin/inquiries/${id}/`, {
    method: "PATCH",
    body: payload,
  });
};