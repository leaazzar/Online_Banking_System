// =========================
// GLOBAL API CONFIG
// =========================

// AUTH SERVICE
const AUTH_BASE_URL = "http://localhost:5000/auth";

// CUSTOMER SERVICE
const CUSTOMER_BASE_URL = "http://localhost:5001";

// STAFF SERVICE
const STAFF_BASE_URL = "http://localhost:5003/staff";

// =========================
// HELPER FUNCTIONS
// =========================

function buildHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiFetch(base, path, method, body = null, token = null) {
  const options = {
    method,
    headers: buildHeaders(token),
  };

  if (body !== null) options.body = JSON.stringify(body);

  const response = await fetch(base + path, options);
  const data = await response.json().catch(() => ({}));

  return { status: response.status, data };
}

// AUTH
const authPost = (path, body, token = null) =>
  apiFetch(AUTH_BASE_URL, path, "POST", body, token);

const authPatch = (path, body, token = null) =>
  apiFetch(AUTH_BASE_URL, path, "PATCH", body, token);

// CUSTOMER
const customerGet = (path, token = null) =>
  apiFetch(CUSTOMER_BASE_URL, path, "GET", null, token);

const customerPost = (path, body, token = null) =>
  apiFetch(CUSTOMER_BASE_URL, path, "POST", body, token);

// STAFF
const staffGet = (path, token = null) =>
  apiFetch(STAFF_BASE_URL, path, "GET", null, token);

const staffPatch = (path, body, token = null) =>
  apiFetch(STAFF_BASE_URL, path, "PATCH", body, token);

const staffPost = (path, body, token = null) =>
  apiFetch(STAFF_BASE_URL, path, "POST", body, token);

// AUTH STORAGE
function setAuthData({ access_token, refresh_token, user }) {
  if (access_token) localStorage.setItem("access_token", access_token);
  if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
  if (user) localStorage.setItem("current_user", JSON.stringify(user));
}

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getCurrentUser() {
  const raw = localStorage.getItem("current_user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_user");
}
