// Helper: get user object from localStorage (supports both keys)
function getStoredUser() {
  try {
    const raw =
      localStorage.getItem("current_user") ||
      localStorage.getItem("user");

    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to parse stored user:", e);
    return {};
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar-container");
  if (!sidebar) return;

  const user = getStoredUser();
  const role = user.role || "";

  let menu = "";

  if (role === "customer") {
    menu = `
      <a href="customer_dashboard.html" class="sidebar-link">Dashboard</a>
      <a href="accounts.html" class="sidebar-link">Accounts</a>
      <a href="transfers.html" class="sidebar-link">Transfer Money</a>
      <a href="transactions.html" class="sidebar-link">Transactions</a>
      <a href="tickets.html" class="sidebar-link">Support Tickets</a>
    `;
  }

  if (role === "support") {
    menu = `
      <a href="support_dashboard.html" class="sidebar-link">Support Dashboard</a>
      <a href="support_tickets.html" class="sidebar-link">All Tickets</a>
    `;
  }

  if (role === "auditor") {
    menu = `
      <a href="audit_dashboard.html" class="sidebar-link">Audit Dashboard</a>
      <a href="suspicious.html" class="sidebar-link">Suspicious Transactions</a>
    `;
  }

  if (role === "admin") {
    menu = `
      <a href="admin_dashboard.html" class="sidebar-link">Dashboard</a>
      <a href="manage_users.html" class="sidebar-link">Manage Users</a>
      <a href="manage_roles.html" class="sidebar-link">Roles</a>
      <a href="audit_logs.html" class="sidebar-link">Audit Logs</a>
      <a href="support_tickets.html" class="sidebar-link">Support Tickets</a>
    `;
  }

  sidebar.innerHTML = `
    <aside class="sidebar">
      <h2 class="sidebar-title" onclick="goHome()" style="cursor: pointer;">BestBank</h2>
      <nav class="sidebar-menu">${menu}</nav>
    </aside>
  `;

  // Inject modern CSS
  const style = document.createElement("style");
  style.innerHTML = `
    .sidebar {
      width: 230px;
      background: #ffffff;
      height: 100vh;
      padding: 25px 20px;
      box-shadow: 2px 0 10px rgba(0,0,0,0.06);
      position: fixed;
      top: 0;
      left: 0;
      overflow-y: auto;
    }

    .sidebar-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 30px;
      color: #3b5bff;
    }

    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sidebar-link {
      text-decoration: none;
      padding: 12px 10px;
      border-radius: 8px;
      color: #333;
      font-size: 15px;
      font-weight: 500;
      transition: 0.2s ease;
    }

    .sidebar-link:hover {
      background: #edf0ff;
      color: #3b5bff;
    }

    /* Main content shifts right when sidebar exists */
    .main-content {
      margin-left: 230px !important;
    }
  `;
  document.head.appendChild(style);
});

function goHome() {
  const user = getStoredUser();
  const role = user.role;

  if (role === "customer") {
    window.location.href = "customer_dashboard.html";
  } else if (role === "support") {
    window.location.href = "support_dashboard.html";
  } else if (role === "auditor") {
    window.location.href = "audit_dashboard.html";
  } else if (role === "admin") {
    window.location.href = "admin_dashboard.html";
  } else {
    window.location.href = "index.html"; 
  }
}
