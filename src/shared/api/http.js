import axios from "axios";

export const API_BASE_URL = "https://platinum-back-end.onrender.com/api/v1";

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});