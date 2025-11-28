document.addEventListener("DOMContentLoaded", () => {
  const navContainer = document.getElementById("navbar-container");
  if (!navContainer) return;

  const token = getAccessToken && getAccessToken();
  const user = (getCurrentUser && getCurrentUser()) || {};

  const isLoggedIn = !!token;

  let buttons = "";

  if (!isLoggedIn) {
    // Not logged in
    buttons = `
      <a href="login.html" class="nav-btn">Login</a>
      <a href="register.html" class="nav-btn-outline">Register</a>
    `;
  } else {
    // Logged in
    const displayName = user.full_name || user.email || "Customer";

    buttons = `
      <span style="margin-right: 8px;">${displayName}</span>
      <button class="logout-btn" onclick="logout()">Logout</button>
    `;
  }

  navContainer.innerHTML = `
    <div class="navbar">
    <div class="logo" onclick="goHome()" style="cursor:pointer; margin-right:auto;">BestBank</div>

      <div class="nav-right">
        ${buttons}
      </div>
    </div>
  `;

  injectNavbarCSS();
});

document.addEventListener("DOMContentLoaded", () => {
  const userNameSpan = document.getElementById("user-name");
  if (!userNameSpan) return;

  try {
    const raw = localStorage.getItem("current_user");
    const user = raw ? JSON.parse(raw) : null;

    if (user && user.full_name) {
      userNameSpan.textContent = user.full_name;
    } else {
      userNameSpan.textContent = "User";
    }
  } catch (err) {
    console.error("Failed to load user:", err);
    userNameSpan.textContent = "User";
  }
});

function logout() {
  if (typeof clearAuth === "function") {
    clearAuth();
  } else {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("current_user");
    localStorage.removeItem("user");
    localStorage.removeItem("first_login_token");
  }

  window.location.href = "index.html";
}

function injectNavbarCSS() {
  const style = document.createElement("style");
  style.innerHTML = `
    .navbar {
      height: 60px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      background: #ffffff;
      border-bottom: 1px solid #e6e6e6;
      padding: 0 25px;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-btn, .nav-btn-outline {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 500;
      text-decoration: none;
      transition: 0.2s;
    }

    .nav-btn {
      background: #3b5bff;
      color: white;
    }

    .nav-btn-outline {
      border: 1px solid #3b5bff;
      color: #3b5bff;
      background: transparent;
    }

    .nav-btn-outline:hover {
      background: #3b5bff;
      color: white;
    }

    .logout-btn {
      background: #ff4d4d;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      color: white;
      font-size: 15px;
      cursor: pointer;
      transition: 0.2s;
    }

    .logout-btn:hover {
      background: #d93636;
    }
  `;
  document.head.appendChild(style);
}
