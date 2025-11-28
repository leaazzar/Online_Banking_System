
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const error = document.getElementById("login-error");

  const { status, data } = await authPost("/login", { email, password });

  if (status === 200) {
    // Normal login
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
    // First-login forced password change
    localStorage.setItem("first_login_token", data.first_login_token);
    localStorage.setItem("current_user", JSON.stringify(data.user));
    window.location.href = "first_login.html";  // keep your current filename
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
    error.textContent = "";
  } else {
    error.textContent = data.error || "Registration failed.";
    success.textContent = "";
  }
}

// =========================
// FIRST LOGIN (ADMIN)
// =========================
async function handleFirstLogin(event) {
  event.preventDefault();

  // 🔹 Match your first-login HTML IDs
  const email = document.getElementById("new-email").value;
  const password = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;

  const errorEl = document.getElementById("first-login-error");

  const token = localStorage.getItem("first_login_token");
  if (!token) {
    errorEl.textContent = "Session expired. Please log in again.";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  const { status, data } = await authPost(
    "/first-login/setup",
    { email, password, confirm_password: confirm },
    token
  );

  if (status === 200) {
    // Clean auth + temp token
    clearAuth && clearAuth();
    localStorage.removeItem("first_login_token");

    // 🔹 Redirect to LOGIN PAGE after saving
    alert("Credentials updated. Please log in with your new email and password.");
    window.location.href = "login.html";
  } else {
    errorEl.textContent = data.error || "Could not update credentials.";
  }
}

// =========================
// Attach listeners
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  const firstLoginForm = document.getElementById("first-login-form");
  if (firstLoginForm) {
    firstLoginForm.addEventListener("submit", handleFirstLogin);
  }
});

function handleLogout() {
  console.log("handleLogout called"); 
  if (typeof clearAuth === "function") {
    clearAuth();
  } else {
    console.warn("clearAuth is not defined!");
  }

  // go back to login page
  window.location.href = "login.html";
}
