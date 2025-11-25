// Frontend/js/api.js

// Adjust if your auth_service runs on a different host/port or prefix
const AUTH_BASE_URL = "http://localhost:5000/auth";

async function apiPost(path, body, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(AUTH_BASE_URL + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// So login can store tokens for later (for accounts, transfers…)
function setAuthData({ access_token, refresh_token, user }) {
  if (access_token) localStorage.setItem("access_token", access_token);
  if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
  if (user) localStorage.setItem("current_user", JSON.stringify(user));
}

function clearAuthData() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_user");
}

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getCurrentUser() {
  const raw = localStorage.getItem("current_user");
  return raw ? JSON.parse(raw) : null;
}

async function apiPatch(path, body, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(AUTH_BASE_URL + path, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  const { status, data } = await apiPost("/refresh", {}, refresh);

  if (status === 200 && data.access_token) {
    localStorage.setItem("access_token", data.access_token);
    return data.access_token;
  }

  return null;
}
