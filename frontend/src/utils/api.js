import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Attach JWT from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// Convert a datetime-local value (local time, no tz) to a proper ISO string with timezone offset
export const localDatetimeToISO = (datetimeLocal) => {
  if (!datetimeLocal) return datetimeLocal;
  const date = new Date(datetimeLocal);
  if (isNaN(date.getTime())) return datetimeLocal;
  return date.toISOString();
};

// Convert a server UTC datetime string to a datetime-local value
export const serverDatetimeToLocal = (serverDate) => {
  if (!serverDate) return "";
  const date = new Date(serverDate);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default api;
