

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

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(base + path, options);
  const data = await response.json().catch(() => ({}));

  return { status: response.status, data };
}

// =========================
// AUTH HELPERS
// =========================

const authPost = (path, body, token = null) =>
  apiFetch(AUTH_BASE_URL, path, "POST", body, token);

const authPatch = (path, body, token = null) =>
  apiFetch(AUTH_BASE_URL, path, "PATCH", body, token);

// =========================
// CUSTOMER HELPERS (raw)
// =========================

const customerGet = (path, token = null) =>
  apiFetch(CUSTOMER_BASE_URL, path, "GET", null, token);

const customerPost = (path, body, token = null) =>
  apiFetch(CUSTOMER_BASE_URL, path, "POST", body, token);

// =========================
// STAFF HELPERS
// =========================

const staffGet = (path, token = null) =>
  apiFetch(STAFF_BASE_URL, path, "GET", null, token);

const staffPatch = (path, body, token = null) =>
  apiFetch(STAFF_BASE_URL, path, "PATCH", body, token);

const staffPost = (path, body, token = null) =>
  apiFetch(STAFF_BASE_URL, path, "POST", body, token);

// =========================
// AUTH STORAGE
// =========================

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
  localStorage.removeItem("first_login_token");
  localStorage.removeItem("user");
}

// =========================
// CONVENIENCE HELPERS FOR CUSTOMER API
// (used by accounts.html, etc.)
// =========================

async function apiGet(path) {
  const token = getAccessToken();
  const { status, data } = await customerGet(path, token);

  if (status < 200 || status >= 300) {
    throw new Error(`GET ${path} failed: ${status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function apiPost(path, body) {
  const token = getAccessToken();
  const { status, data } = await customerPost(path, body, token);

  if (status < 200 || status >= 300) {
    throw new Error(`POST ${path} failed: ${status} ${JSON.stringify(data)}`);
  }

  return data;
}
async function staffApiGet(path) {
  const token = getAccessToken();
  const { status, data } = await staffGet(path, token);

  if (status < 200 || status >= 300) {
    throw new Error(`STAFF GET ${path} failed: ${status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function staffApiPost(path, body) {
  const token = getAccessToken();
  const { status, data } = await staffPost(path, body, token);

  if (status < 200 || status >= 300) {
    throw new Error(`STAFF POST ${path} failed: ${status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function staffApiPatch(path, body) {
  const token = getAccessToken();
  const { status, data } = await staffPatch(path, body, token);

  if (status < 200 || status >= 300) {
    throw new Error(`STAFF PATCH ${path} failed: ${status} ${JSON.stringify(data)}`);
  }
  return data;
}
async function staffApiDelete(path) {
  const token = getAccessToken();

  const { status, data } = await apiFetch(STAFF_BASE_URL, path, "DELETE", null, token);

  if (status < 200 || status >= 300) {
    throw new Error(`STAFF DELETE ${path} failed: ${status} ${JSON.stringify(data)}`);
  }

  return data;
}
function setStaffAuthData({ access_token, user }) {
  if (access_token) localStorage.setItem("staff_access_token", access_token);
  if (user) localStorage.setItem("staff_user", JSON.stringify(user));
}

function getStaffToken() {
  return localStorage.getItem("staff_access_token");
}

function getStaffUser() {
  const raw = localStorage.getItem("staff_user");
  return raw ? JSON.parse(raw) : null;
}

function clearStaffAuth() {
  localStorage.removeItem("staff_access_token");
  localStorage.removeItem("staff_user");
}
