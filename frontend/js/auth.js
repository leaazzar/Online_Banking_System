// Frontend/js/auth.js

// ---------- LOGIN ----------
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");

  errorEl.textContent = "";

  const { status, data } = await apiPost("/login", { email, password });

  console.log("LOGIN RESPONSE:", status, data); // Debugging

  if (status === 200) {
    setAuthData({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });

    // Redirect based on role
    if (data.user.role === "admin") {
      window.location.href = "admin_dashboard.html";
    } else {
      alert(`Welcome ${data.user.full_name} (${data.user.role})`);
      // Later: redirect customer to customer dashboard
      // window.location.href = "customer_dashboard.html";
    }

  } else if (status === 403 && data.requires_password_change) {
    localStorage.setItem("first_login_token", data.first_login_token);
    localStorage.setItem("current_user", JSON.stringify(data.user));
    window.location.href = "first_login.html";

  } else {
    errorEl.textContent = data.error || "Login failed.";
  }
}


// ---------- REGISTER ----------
async function handleRegister(event) {
  event.preventDefault();

  const full_name = document.getElementById("reg-full-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;

  const errorEl = document.getElementById("register-error");
  const successEl = document.getElementById("register-success");

  errorEl.textContent = "";
  successEl.textContent = "";

  const { status, data } = await apiPost("/register", {
    full_name,
    email,
    phone,
    password,
  });

  if (status === 201) {
    successEl.textContent = "Account created successfully. You can now log in.";
    // Optional: auto-redirect after a bit
    // setTimeout(() => window.location.href = "index.html", 1500);
  } else {
    errorEl.textContent = data.error || "Registration failed.";
  }
}

// ---------- FIRST LOGIN (ADMIN) ----------
async function handleFirstLogin(event) {
  event.preventDefault();

  const newEmail = document.getElementById("fl-email").value.trim();
  const newPassword = document.getElementById("fl-password").value;
  const confirmPassword = document.getElementById("fl-confirm-password").value;

  const errorEl = document.getElementById("fl-error");
  const successEl = document.getElementById("fl-success");

  errorEl.textContent = "";
  successEl.textContent = "";

  const token = localStorage.getItem("first_login_token");
  if (!token) {
    errorEl.textContent = "Missing first login token. Please log in again.";
    return;
  }

  const { status, data } = await apiPost(
    "/first-login/setup",
    {
      email: newEmail,
      password: newPassword,
      confirm_password: confirmPassword,
    },
    token
  );

  if (status === 200) {
    successEl.textContent = data.message ||
      "Credentials updated successfully. Please log in again.";

    // Clean up and send them to login
    localStorage.removeItem("first_login_token");
    clearAuthData();

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } else {
    errorEl.textContent = data.error || "Failed to update admin credentials.";
  }
}

// ---------- WIRE FORMS ----------
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const regForm = document.getElementById("register-form");
  if (regForm) {
    regForm.addEventListener("submit", handleRegister);
  }

  const flForm = document.getElementById("first-login-form");
  if (flForm) {
    flForm.addEventListener("submit", handleFirstLogin);
  }
});

