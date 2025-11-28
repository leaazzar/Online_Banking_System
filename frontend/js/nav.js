document.addEventListener("DOMContentLoaded", () => {
  const navContainer = document.getElementById("navbar-container");
  if (!navContainer) return;

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  let buttons = "";

  if (!user.role) {
    // Not logged in
    buttons = `
      <a href="index.html" class="nav-btn">Login</a>
      <a href="register.html" class="nav-btn-outline">Register</a>
    `;
  } else {
    // Logged in
    buttons = `
      <button class="logout-btn" onclick="logout()">Logout</button>
    `;
  }

  navContainer.innerHTML = `
    <div class="navbar">
      <div class="nav-right">
        ${buttons}
      </div>
    </div>
  `;

  injectNavbarCSS();
});

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function injectNavbarCSS() {
  const style = document.createElement("style");
  style.innerHTML = `
    .navbar {
      height: 60px;
      display: flex;
      justify-content: flex-end;     /* EVERYTHING TO THE RIGHT */
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
      gap: 12px;                     /* space between buttons */
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
