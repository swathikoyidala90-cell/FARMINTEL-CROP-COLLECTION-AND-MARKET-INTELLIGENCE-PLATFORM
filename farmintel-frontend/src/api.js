import axios from "axios";
import { API_BASE_URL } from "./config";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

export const getBestMarket = (crop, location) => {
  return API.get(`/analytics/best-market`, {
    params: { crop, location }
  });
};
