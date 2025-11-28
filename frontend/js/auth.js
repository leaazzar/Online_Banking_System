// =========================
// LOGIN
// =========================
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const error = document.getElementById("login-error");

  const { status, data } = await authPost("/login", { email, password });

  if (status === 200) {
    setAuthData(data);

    if (data.user.role === "admin") {
      window.location.href = "admin_dashboard.html";
    } else if (data.user.role === "support") {
      window.location.href = "support_dashboard.html";
    } else if (data.user.role === "auditor") {
      window.location.href = "auditor_dashboard.html";
    } else {
      window.location.href = "customer_dashboard.html";
    }
  } else if (status === 403 && data.requires_password_change) {
    localStorage.setItem("first_login_token", data.first_login_token);
    localStorage.setItem("current_user", JSON.stringify(data.user));
    window.location.href = "first_login.html";
  } else {
    error.textContent = data.error || "Login failed.";
  }
}

// =========================
// REGISTER
// =========================
async function handleRegister(event) {
  event.preventDefault();

  const full_name = document.getElementById("reg-full-name").value;
  const email = document.getElementById("reg-email").value;
  const phone = document.getElementById("reg-phone").value;
  const password = document.getElementById("reg-password").value;

  const error = document.getElementById("register-error");
  const success = document.getElementById("register-success");

  const { status, data } = await authPost("/register", {
    full_name,
    email,
    phone,
    password,
  });

  if (status === 201) {
    success.textContent = "Account created. You can now log in.";
  } else {
    error.textContent = data.error || "Registration failed.";
  }
}

// =========================
// FIRST LOGIN (ADMIN)
// =========================
async function handleFirstLogin(event) {
  event.preventDefault();

  const email = document.getElementById("fl-email").value;
  const password = document.getElementById("fl-password").value;
  const confirm = document.getElementById("fl-confirm-password").value;

  const token = localStorage.getItem("first_login_token");

  const { status, data } = await authPost(
    "/first-login/setup",
    { email, password, confirm_password: confirm },
    token
  );

  if (status === 200) {
    clearAuth();
    alert("Credentials updated. Please log in.");
    window.location.href = "index.html";
  } else {
    document.getElementById("fl-error").textContent = data.error;
  }
}

// Attach listeners
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("login-form"))
    document.getElementById("login-form").addEventListener("submit", handleLogin);

  if (document.getElementById("register-form"))
    document.getElementById("register-form").addEventListener("submit", handleRegister);

  if (document.getElementById("first-login-form"))
    document.getElementById("first-login-form").addEventListener("submit", handleFirstLogin);
});
