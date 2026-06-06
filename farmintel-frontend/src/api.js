import axios from "axios";
import { API_BASE_URL } from "./config";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  FARMER: import.meta.env.VITE_FARMER_API_URL,
  CUSTOMER: import.meta.env.VITE_CUSTOMER_API_URL,
  STAFF: import.meta.env.VITE_STAFF_API_URL,
  ADMIN: import.meta.env.VITE_ADMIN_API_URL,
});

export const getBestMarket = (crop, location) => {
  return API.get(`/analytics/best-market`, {
    params: { crop, location }
  });
};
